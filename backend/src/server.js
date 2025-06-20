const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Debug logging function
const debug = (area, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${area}] ${message}`);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
};

// Load environment variables
dotenv.config();
debug('ENV', 'Environment variables loaded', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
  SUPABASE_KEY: process.env.SUPABASE_KEY ? 'Set' : 'Not set',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
});

// Initialize Express app
const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
});
debug('SOCKET.IO', 'Socket.IO server initialized');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
debug('SUPABASE', 'Supabase client initialized');

// Initialize Google Generative AI with version configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
debug('GEMINI', 'Google Generative AI client initialized', {
  apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
});

// Test Gemini API connection
const testGeminiConnection = async () => {
  try {
    debug('GEMINI', 'Testing API connection');
    // Use the latest stable model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Test connection: Generate a short funny phrase.");
    debug('GEMINI', 'API connection successful', {
      modelName: "gemini-1.5-flash",
      responseLength: result.response.text().length,
      response: result.response.text()
    });
  } catch (error) {
    debug('GEMINI:ERROR', 'API connection test failed', {
      error: error.message,
      status: error.status,
      details: error
    });
  }
};

// In-memory cache for AI responses and leaderboard
const aiCache = new Map();
const leaderboardCache = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('[SOCKET.IO] Client connected:', socket.id);

  socket.on('place_bid', async (data) => {
    debug('SOCKET.IO:BID', 'Received bid request', data);
    try {
      const { memeId, userId, credits } = data;
      debug('SOCKET.IO:BID', 'Checking current highest bid', { memeId });
      // Fetch current highest bid
      const { data: memeData, error: fetchError } = await supabase
        .from('memes')
        .select('highest_bid')
        .eq('id', memeId)
        .single();
      if (fetchError) {
        debug('SUPABASE:ERROR', 'Failed to fetch current highest bid', fetchError);
        throw fetchError;
      }
      if (parseInt(credits) <= (memeData?.highest_bid || 0)) {
        debug('SOCKET.IO:BID', 'Rejected bid: not higher than current highest', { memeId, credits, highest_bid: memeData?.highest_bid });
        socket.emit('error', { message: 'Bid must be higher than the current highest bid.' });
        return;
      }
      debug('SOCKET.IO:BID', 'About to insert bid into bids table', { memeId, userId, credits });
      // Store bid in Supabase
      const { data: bid, error } = await supabase
        .from('bids')
        .insert([{ meme_id: memeId, user_id: userId, credits }])
        .select();
      debug('SOCKET.IO:BID', 'Bid insert response', { bid, error });
      if (error) {
        debug('SUPABASE:ERROR', 'Failed to store bid', error);
        throw error;
      }
      // Update meme with new highest bid and bidder
      debug('SOCKET.IO:BID', 'About to update meme with new highest bid and bidder', { memeId, credits, userId });
      const { data: memeUpdateData, error: memeUpdateError } = await supabase
        .from('memes')
        .update({ highest_bid: credits, highest_bidder: userId })
        .eq('id', memeId)
        .select();
      debug('SOCKET.IO:BID', 'Meme update response', { memeUpdateData, memeUpdateError });
      if (memeUpdateError) {
        debug('SUPABASE:ERROR', 'Failed to update meme with new bid', memeUpdateError);
      } else {
        debug('SUPABASE', 'Updated meme with new highest bid and bidder', { memeId, credits, userId });
      }
      debug('SOCKET.IO:BID', 'Bid stored and meme updated successfully', { bid, memeUpdateData });
      // Broadcast bid to all connected clients
      io.emit('new_bid', { memeId, userId, credits });
    } catch (error) {
      debug('SOCKET.IO:ERROR', 'Bid error', error);
      socket.emit('error', { message: 'Failed to place bid' });
    }
  });

  socket.on('vote', async (data) => {
    debug('SOCKET.IO:VOTE', 'Received vote request', data);
    try {
      const { memeId, voteType } = data;
      const increment = voteType === 'up' ? 1 : -1;

      // 1. Fetch current upvotes
      const { data: currentMeme, error: fetchError } = await supabase
        .from('memes')
        .select('upvotes')
        .eq('id', memeId)
        .single();

      if (fetchError) {
        debug('SUPABASE:ERROR', 'Failed to fetch current upvotes', fetchError);
        throw fetchError;
      }

      const newUpvotes = (currentMeme?.upvotes || 0) + increment;

      // 2. Update with new upvotes
      const { data: meme, error } = await supabase
        .from('memes')
        .update({ upvotes: newUpvotes })
        .eq('id', memeId)
        .select();

      if (error) {
        debug('SUPABASE:ERROR', 'Failed to update votes', error);
        throw error;
      }

      debug('SOCKET.IO:VOTE', 'Vote updated successfully', meme);
      // Broadcast vote update
      io.emit('vote_update', { memeId, upvotes: meme[0].upvotes });
      
      // Update leaderboard cache
      updateLeaderboardCache();
    } catch (error) {
      debug('SOCKET.IO:ERROR', 'Vote error', {
        message: error.message,
        stack: error.stack,
        full: error
      });
      socket.emit('error', { message: 'Failed to register vote', details: error });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET.IO] Client disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (err) => {
    console.log('[SOCKET.IO] Error:', err);
  });
});

// Helper function to update leaderboard cache
async function updateLeaderboardCache() {
  debug('CACHE', 'Updating leaderboard cache');
  try {
    const { data: memes, error } = await supabase
      .from('memes')
      .select('*')
      .order('upvotes', { ascending: false })
      .limit(10);

    if (error) {
      debug('SUPABASE:ERROR', 'Failed to fetch leaderboard', error);
      throw error;
    }

    leaderboardCache.clear();
    memes.forEach(meme => leaderboardCache.set(meme.id, meme));
    debug('CACHE', 'Leaderboard cache updated', { memeCount: memes.length });
  } catch (error) {
    debug('CACHE:ERROR', 'Leaderboard cache update error', error);
  }
}

// API Routes
app.get('/api/memes', async (req, res) => {
  debug('API:GET', 'Fetching all memes');
  try {
    const { data: memes, error } = await supabase
      .from('memes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      debug('SUPABASE:ERROR', 'Failed to fetch memes', error);
      throw error;
    }

    debug('API:GET', 'Memes fetched successfully', { count: memes.length });
    res.json(memes);
  } catch (error) {
    debug('API:ERROR', 'Failed to fetch memes', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memes', async (req, res) => {
  debug('API:POST', 'Creating new meme', req.body);
  try {
    const { title, imageUrl, tags } = req.body;
    
    // Generate AI caption and vibe
    let caption = aiCache.get(title + tags.join());
    let vibe = aiCache.get('vibe_' + tags.join());

    debug('CACHE', 'AI cache status', {
      hasCachedCaption: !!caption,
      hasCachedVibe: !!vibe,
      cacheSize: aiCache.size
    });

    if (!caption || !vibe) {
      try {
        debug('GEMINI', 'Initializing AI model');
        // Use the latest stable model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Generate caption
        debug('GEMINI', 'Generating caption', { title, tags });
        const captionPrompt = `You are a witty meme caption generator. Create a funny, short caption for a meme with title "${title}" and tags: ${tags.join(', ')}. Keep it under 100 characters.`;
        const captionResult = await model.generateContent(captionPrompt);
        caption = captionResult.response.text() || "YOLO to the moon! 🚀";
        debug('GEMINI', 'Caption generated', { caption });
        
        // Generate vibe
        debug('GEMINI', 'Generating vibe', { tags });
        const vibePrompt = `You are a cyberpunk vibe analyst. Describe the vibe of a meme with tags: ${tags.join(', ')} in 3-4 words, cyberpunk style. Example: "Neon Crypto Chaos" or "Digital Dystopia Dreams"`;
        const vibeResult = await model.generateContent(vibePrompt);
        vibe = vibeResult.response.text() || "Neon Crypto Chaos";
        debug('GEMINI', 'Vibe generated', { vibe });

        // Cache the results
        aiCache.set(title + tags.join(), caption);
        aiCache.set('vibe_' + tags.join(), vibe);
        debug('CACHE', 'AI results cached');
      } catch (error) {
        debug('GEMINI:ERROR', 'AI generation error', {
          error: error.message,
          status: error.status,
          details: error
        });
        caption = "YOLO to the moon! 🚀";
        vibe = "Neon Crypto Chaos";
      }
    }

    // Store meme in Supabase with a default user
    debug('SUPABASE', 'Storing meme', { title, imageUrl, tags, caption, vibe });
    const { data: meme, error } = await supabase
      .from('memes')
      .insert([{
        title,
        image_url: imageUrl,
        tags,
        caption,
        vibe,
        upvotes: 0,
        uploaded_by: 'anonymous_user',
        highest_bid: 0,
        highest_bidder: null
      }])
      .select();

    if (error) {
      debug('SUPABASE:ERROR', 'Failed to store meme', error);
      throw error;
    }

    debug('API:POST', 'Meme created successfully', meme[0]);
    // Broadcast new meme to all connected clients
    io.emit('new_meme', meme[0]);
    res.status(201).json(meme[0]);
  } catch (error) {
    debug('API:ERROR', 'Failed to create meme', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard', (req, res) => {
  debug('API:GET', 'Fetching leaderboard');
  try {
    const leaderboard = Array.from(leaderboardCache.values());
    debug('API:GET', 'Leaderboard fetched', { count: leaderboard.length });
    res.json(leaderboard);
  } catch (error) {
    debug('API:ERROR', 'Failed to fetch leaderboard', error);
    res.status(500).json({ error: error.message });
  }
});

// REST API endpoint for voting (fallback when WebSocket fails)
app.post('/api/memes/:id/vote', async (req, res) => {
  const memeId = req.params.id;
  const { voteType } = req.body;
  debug('API:POST', 'Voting via REST API', { memeId, voteType });
  try {
    const increment = voteType === 'up' ? 1 : -1;
    debug('API:POST', 'About to fetch current upvotes', { memeId });

    // 1. Fetch current upvotes
    const { data: currentMeme, error: fetchError } = await supabase
      .from('memes')
      .select('upvotes')
      .eq('id', memeId)
      .single();

    if (fetchError) {
      debug('SUPABASE:ERROR', 'Failed to fetch current upvotes', fetchError);
      throw fetchError;
    }

    const newUpvotes = (currentMeme?.upvotes || 0) + increment;
    debug('API:POST', 'Updating upvotes', { memeId, newUpvotes });

    // 2. Update with new upvotes
    const { data: meme, error } = await supabase
      .from('memes')
      .update({ upvotes: newUpvotes })
      .eq('id', memeId)
      .select();

    debug('API:POST', 'Supabase update result', { meme, error });

    if (error) {
      debug('SUPABASE:ERROR', 'Failed to update votes via REST', error);
      throw error;
    }
    if (!meme || meme.length === 0) {
      debug('API:POST', 'No meme found for given id', { memeId });
      return res.status(404).json({ error: 'Meme not found' });
    }

    debug('API:POST', 'Vote updated successfully via REST', meme[0]);
    // Update leaderboard cache
    updateLeaderboardCache();
    res.json({ success: true, upvotes: meme[0].upvotes });
  } catch (error) {
    debug('API:ERROR', 'Failed to vote via REST', { message: error.message, stack: error.stack });
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// REST API endpoint for placing a bid (fallback when WebSocket fails)
app.post('/api/memes/:id/bid', async (req, res) => {
  const memeId = req.params.id;
  const { userId, credits } = req.body;
  debug('API:POST', 'Placing bid via REST API', { memeId, userId, credits });
  try {
    // Fetch current highest bid
    const { data: memeData, error: fetchError } = await supabase
      .from('memes')
      .select('highest_bid')
      .eq('id', memeId)
      .single();
    if (fetchError) {
      debug('SUPABASE:ERROR', 'Failed to fetch current highest bid via REST', fetchError);
      throw fetchError;
    }
    if (parseInt(credits) <= (memeData?.highest_bid || 0)) {
      debug('API:POST', 'Rejected bid via REST: not higher than current highest', { memeId, credits, highest_bid: memeData?.highest_bid });
      return res.status(400).json({ error: 'Bid must be higher than the current highest bid.' });
    }
    // Insert bid into bids table
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert([{ meme_id: memeId, user_id: userId, credits }])
      .select();
    debug('API:POST', 'Bid insert response', { bid, bidError });
    if (bidError) {
      debug('SUPABASE:ERROR', 'Failed to store bid via REST', bidError);
      throw bidError;
    }
    // Update meme with new highest bid and bidder
    const { data: memeUpdateData, error: memeUpdateError } = await supabase
      .from('memes')
      .update({ highest_bid: credits, highest_bidder: userId })
      .eq('id', memeId)
      .select();
    debug('API:POST', 'Meme update response', { memeUpdateData, memeUpdateError });
    if (memeUpdateError) {
      debug('SUPABASE:ERROR', 'Failed to update meme with new bid via REST', memeUpdateError);
      throw memeUpdateError;
    }
    debug('API:POST', 'Bid placed and meme updated via REST', { memeId, userId, credits });
    res.status(200).json({ success: true, meme: memeUpdateData[0] });
  } catch (error) {
    debug('API:ERROR', 'Failed to place bid via REST', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual endpoint to regenerate caption and vibe for a meme
app.post('/api/memes/:id/caption', async (req, res) => {
  const memeId = req.params.id;
  debug('API:POST', 'Regenerating caption and vibe for meme', { memeId });
  try {
    // Fetch meme from Supabase
    const { data: meme, error: fetchError } = await supabase
      .from('memes')
      .select('title, tags')
      .eq('id', memeId)
      .single();
    if (fetchError || !meme) {
      debug('SUPABASE:ERROR', 'Failed to fetch meme for caption regen', fetchError);
      return res.status(404).json({ error: 'Meme not found' });
    }
    const { title, tags } = meme;
    let caption, vibe;
    try {
      debug('GEMINI', 'Regenerating caption and vibe (manual endpoint)', { title, tags });
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // Caption
      const captionPrompt = `You are a witty meme caption generator. Create a funny, short caption for a meme with title "${title}" and tags: ${tags.join(', ')}. Keep it under 100 characters.`;
      const captionResult = await model.generateContent(captionPrompt);
      caption = captionResult.response.text() || "YOLO to the moon! 🚀";
      // Vibe
      const vibePrompt = `You are a cyberpunk vibe analyst. Describe the vibe of a meme with tags: ${tags.join(', ')} in 3-4 words, cyberpunk style. Example: "Neon Crypto Chaos" or "Digital Dystopia Dreams"`;
      const vibeResult = await model.generateContent(vibePrompt);
      vibe = vibeResult.response.text() || "Neon Crypto Chaos";
      // Cache
      aiCache.set(title + tags.join(), caption);
      aiCache.set('vibe_' + tags.join(), vibe);
      debug('CACHE', 'AI results cached (manual endpoint)');
    } catch (error) {
      debug('GEMINI:ERROR', 'AI generation error (manual endpoint)', error);
      caption = "YOLO to the moon! 🚀";
      vibe = "Neon Crypto Chaos";
    }
    // Update meme in Supabase
    const { data: updated, error: updateError } = await supabase
      .from('memes')
      .update({ caption, vibe })
      .eq('id', memeId)
      .select();
    if (updateError) {
      debug('SUPABASE:ERROR', 'Failed to update meme with new caption/vibe', updateError);
      return res.status(500).json({ error: updateError.message });
    }
    debug('API:POST', 'Caption and vibe regenerated', updated[0]);
    res.json(updated[0]);
  } catch (error) {
    debug('API:ERROR', 'Failed to regenerate caption/vibe', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  debug('SERVER', `Server running on port ${PORT}`);
  // Test Gemini API connection on startup
  testGeminiConnection();
  // Initialize leaderboard cache
  updateLeaderboardCache();
}); 