import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const socket = io(API_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Debug logging
const debug = (area, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [FRONTEND:${area}] ${message}`);
  if (data) {
    console.log('Data:', data);
  }
};

// Socket event listeners
socket.on('connect', () => {
  debug('SOCKET.IO', 'Connected to server');
});

socket.on('error', (error) => {
  debug('SOCKET.IO:ERROR', 'Socket error', error);
});

// API functions
export const api = {
  // Meme operations
  async createMeme(memeData) {
    debug('API', 'Creating meme', memeData);
    const response = await fetch(`${API_URL}/api/memes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memeData),
    });
    if (!response.ok) throw new Error('Failed to create meme');
    return response.json();
  },

  async getAllMemes() {
    debug('API', 'Fetching all memes');
    const response = await fetch(`${API_URL}/api/memes`);
    if (!response.ok) throw new Error('Failed to fetch memes');
    return response.json();
  },

  // Check socket connection status
  isConnected() {
    return socket.connected;
  },

  // Alias for getAllMemes to match component usage
  async getMemes() {
    return this.getAllMemes();
  },

  // Bidding operations
  placeBid(memeId, userId, credits) {
    debug('SOCKET.IO', 'Placing bid', { memeId, userId, credits });
    if (socket.connected) {
      socket.emit('place_bid', { memeId, userId, credits });
    } else {
      debug('BID', 'Socket not connected, using REST fallback immediately for bid');
      // No return here, placeBidViaRest doesn't return a promise to the caller in this path
      this.placeBidViaRest(memeId, userId, credits)
        .catch(error => console.error("REST bid fallback failed:", error));
    }
  },

  // REST API fallback for placing bids when WebSocket fails
  async placeBidViaRest(memeId, userId, credits) {
    debug('API', 'Placing bid via REST API', { memeId, userId, credits });
    const response = await fetch(`${API_URL}/api/memes/${memeId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, credits }),
    });
    if (!response.ok) throw new Error('Failed to place bid');
    return response.json();
  },

  async remixCaption(memeId) {
    debug('API', 'Remixing caption via REST API', { memeId });
    const response = await fetch(`${API_URL}/api/memes/${memeId}/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to remix caption');
    return response.json();
  },

  // Voting operations
  vote(memeId, voteType) {
    debug('SOCKET.IO', 'Voting', { memeId, voteType });
    socket.emit('vote', { memeId, voteType });
  },

  // Alias for vote to match component usage
  voteMeme(memeId, voteType) {
    return this.vote(memeId, voteType);
  },

  // REST API fallback for voting when WebSocket fails
  async voteViaRest(memeId, voteType) {
    debug('API', 'Voting via REST API', { memeId, voteType });
    const response = await fetch(`${API_URL}/api/memes/${memeId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType }),
    });
    if (!response.ok) throw new Error('Failed to vote');
    return response.json();
  },

  // Socket event subscriptions
  onNewBid(callback) {
    socket.on('new_bid', callback);
  },

  onVoteUpdate(callback) {
    socket.on('vote_update', callback);
  },

  // Cleanup function
  cleanup() {
    debug('SOCKET.IO', 'Removing event listeners');
    socket.off('new_bid');
    socket.off('vote_update');
    socket.off('error'); // Also remove the error listener
    // Do not disconnect the socket here, as it's a shared instance
    // socket.disconnect(); 
  },

  socket // Export the socket instance for direct event listening
};

// Default export
export default api; 