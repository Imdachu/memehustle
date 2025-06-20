import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";
import '../App.css'; // Ensure custom CSS is loaded

// Debug logging function
const debug = (area, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [FRONTEND:${area}] ${message}`);
  if (data) {
    console.log('Data:', data);
  }
};

export default function Gallery() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biddingMeme, setBiddingMeme] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [remixingId, setRemixingId] = useState(null);

  // Fetch memes on component mount
  useEffect(() => {
    fetchMemes();
    
    // Subscribe to real-time updates
    api.onVoteUpdate(({ memeId, upvotes }) => {
      debug('SOCKET.IO', 'Received vote_update event', { memeId, upvotes });
      debug('SOCKET.IO', 'Memes state before update', memes);
      setMemes(prevMemes => {
        const updated = prevMemes.map(meme =>
          meme.id === memeId ? { ...meme, upvotes } : meme
        );
        debug('SOCKET.IO', 'Memes state after update', updated);
        return updated;
      });
    });

    api.onNewBid(({ memeId, userId, credits }) => {
      debug('SOCKET.IO', 'Received new bid', { memeId, userId, credits });
      setMemes(prevMemes => {
        const updated = prevMemes.map(meme =>
          meme.id === memeId ? { ...meme, highest_bid: credits, highest_bidder: userId } : meme
        );
        debug('UI', 'Updated meme with new bid', { memeId, userId, credits, updated });
        return updated;
      });
    });

    // Listen for bid errors from Socket.IO
    api.socket?.on && api.socket.on('error', (err) => {
      if (err && err.message === 'Bid must be higher than the current highest bid.') {
        alert('Bid must be higher than the current highest bid!');
      }
    });

    // Cleanup subscriptions
    return () => api.cleanup();
  }, []);

  const fetchMemes = async () => {
    try {
      const data = await api.getAllMemes();
      debug('API', 'Fetched memes', { count: data.length });
      setMemes(data);
    } catch (err) {
      debug('ERROR', 'Failed to fetch memes', err);
      setError('Failed to load memes');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (memeId, voteType) => {
    debug('VOTE', `Voting ${voteType} for meme`, { memeId });

    // Optimistic UI update for immediate feedback
    setMemes(prevMemes =>
      prevMemes.map(meme => {
        if (meme.id === memeId) {
          const currentVotes = meme.upvotes || 0;
          const newVotes = voteType === 'up' ? currentVotes + 1 : currentVotes - 1;
          return { ...meme, upvotes: newVotes };
        }
        return meme;
      })
    );

    // Use WebSocket if connected, otherwise use REST API fallback
    if (api.isConnected()) {
      debug('VOTE', 'Using WebSocket for vote');
      api.vote(memeId, voteType);
    } else {
      debug('VOTE', 'WebSocket not connected, using REST fallback');
      try {
        await api.voteViaRest(memeId, voteType);
      } catch (error) {
        debug('VOTE:ERROR', 'REST vote failed, reverting optimistic update', error);
        // Revert optimistic update on error
        setMemes(prevMemes =>
          prevMemes.map(meme => {
            if (meme.id === memeId) {
              const currentVotes = meme.upvotes || 0;
              const revertedVotes = voteType === 'up' ? currentVotes - 1 : currentVotes + 1;
              return { ...meme, upvotes: revertedVotes };
            }
            return meme;
          })
        );
      }
    }
  };

  const openBidModal = (meme) => {
    setBiddingMeme(meme);
    setBidAmount('');
  };

  const closeBidModal = () => {
    setBiddingMeme(null);
    setBidAmount('');
  };

  const handleBid = async () => {
    if (!bidAmount || isNaN(bidAmount) || parseInt(bidAmount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    try {
      const userId = 'user_' + Math.random().toString(36).substr(2, 9);
      debug('BID', 'Placing bid', { memeId: biddingMeme.id, credits: bidAmount, userId });
      await api.placeBid(biddingMeme.id, userId, parseInt(bidAmount));
      debug('BID', 'Bid placed, closing modal', { memeId: biddingMeme.id });
      closeBidModal();
    } catch (error) {
      // Check for REST error message
      if (error && error.message && error.message.includes('higher')) {
        alert('Bid must be higher than the current highest bid!');
      } else {
        console.error('Bid failed:', error);
        alert('Failed to place bid. Please try again.');
      }
    }
  };

  const handleRemixCaption = async (memeId) => {
    setRemixingId(memeId);
    try {
      const updatedMeme = await api.remixCaption(memeId);
      setMemes(prevMemes => prevMemes.map(meme => meme.id === memeId ? { ...meme, ...updatedMeme } : meme));
    } catch (err) {
      alert('Failed to remix caption: ' + err.message);
    } finally {
      setRemixingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-cyan-500 text-2xl font-mono animate-pulse">Loading memes...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-500 text-xl font-mono">{error}</div>
    </div>
  );

  return (
    <div className="p-8">
      <motion.h2 
        className="glitch typewriter text-4xl text-center mb-8 font-mono"
        data-text="🔥 Meme Gallery 🔥"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🔥 Meme Gallery 🔥
      </motion.h2>
      
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {memes.map((meme) => (
          <motion.div
            key={meme.id}
            className="mb-6 break-inside-avoid bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col items-center p-4 border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300 neon-glow glitch"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
          >
            <div className="relative w-full mb-4">
              <img 
                src={meme.image_url} 
                alt={meme.title} 
                className="w-full h-auto object-cover rounded neon-glow" 
              />
              <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold neon-text">
                💰 {meme.highest_bid || 0}
              </div>
              <div className="absolute top-10 right-2 bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs font-mono neon-text">
                Bidder: {meme.highest_bidder || "None yet"}
              </div>
            </div>
            
            <h3 className="text-lg text-gray-100 font-mono mb-2 text-center neon-text">{meme.title}</h3>
            
            {meme.caption && (
              <p className="text-cyan-400 font-mono text-sm mb-2 text-center italic neon-text">"{meme.caption}"</p>
            )}
            
            {meme.vibe && (
              <p className="text-pink-400 font-mono text-xs mb-2 neon-text">🎭 {meme.vibe}</p>
            )}
            
            <div className="flex flex-wrap gap-1 mb-3 justify-center">
              {meme.tags && meme.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded neon-text">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="flex items-center gap-3 mt-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="px-3 py-2 bg-green-600 text-white rounded font-mono text-sm hover:bg-green-700 transition neon-btn"
                onClick={() => handleVote(meme.id, 'up')}
              >
                ⬆️ {meme.upvotes || 0}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="px-3 py-2 bg-red-600 text-white rounded font-mono text-sm hover:bg-red-700 transition neon-btn"
                onClick={() => handleVote(meme.id, 'down')}
              >
                ⬇️ {meme.downvotes || 0}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="px-3 py-2 bg-yellow-600 text-black rounded font-mono text-sm hover:bg-yellow-500 transition font-bold neon-btn"
                onClick={() => openBidModal(meme)}
              >
                💰 Bid
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`px-3 py-2 bg-cyan-600 text-white rounded font-mono text-sm hover:bg-cyan-500 transition font-bold neon-btn ${remixingId === meme.id ? 'opacity-50 cursor-wait' : ''}`}
                onClick={() => handleRemixCaption(meme.id)}
                disabled={remixingId === meme.id}
              >
                {remixingId === meme.id ? 'Remixing...' : 'Remix Caption'}
              </motion.button>
            </div>
            
            {meme.highest_bid && (
              <motion.p 
                className="text-green-400 font-mono text-xs mt-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Last bid: {meme.highest_bid || 0} credits
                <span className="ml-2 text-yellow-300">
                  by {meme.highest_bidder || "None yet"}
                </span>
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bidding Modal */}
      {biddingMeme && (
        <motion.div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className="bg-gray-900 p-8 rounded-lg border-2 border-yellow-400 max-w-md w-full mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-2xl text-yellow-400 font-mono mb-4 text-center">
              💰 Place Your Bid
            </h3>
            
            <div className="mb-4">
              <img 
                src={biddingMeme.image_url} 
                alt={biddingMeme.title} 
                className="w-full h-48 object-cover rounded mb-3" 
              />
              <p className="text-gray-300 font-mono text-center">{biddingMeme.title}</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 font-mono mb-2">Bid Amount (credits):</label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-yellow-400 focus:outline-none"
                placeholder="Enter amount..."
                min="1"
              />
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBid}
                className="flex-1 bg-yellow-400 text-black py-3 rounded font-mono font-bold hover:bg-yellow-300 transition"
              >
                Place Bid
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeBidModal}
                className="flex-1 bg-gray-600 text-white py-3 rounded font-mono hover:bg-gray-500 transition"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 