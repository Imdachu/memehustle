import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

export default function Duel() {
  const [duelMemes, setDuelMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchDuelMemes();
  }, []);

  const fetchDuelMemes = async () => {
    try {
      setLoading(true);
      const memes = await api.getMemes();
      // Get 2 random memes for the duel
      const shuffled = memes.sort(() => 0.5 - Math.random());
      setDuelMemes(shuffled.slice(0, 2));
    } catch (error) {
      console.error('Failed to fetch duel memes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (memeId) => {
    if (voting) return;
    
    try {
      setVoting(true);
      setSelectedMeme(memeId);
      
      // Send vote to backend
      await api.voteMeme(memeId, 'up');
      
      // Wait a moment to show the selection
      setTimeout(() => {
        setSelectedMeme(null);
        setVoting(false);
        // Refresh memes for next duel
        fetchDuelMemes();
      }, 2000);
    } catch (error) {
      console.error('Vote failed:', error);
      setVoting(false);
      setSelectedMeme(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cyan-400 text-2xl font-mono animate-pulse">Loading Duel...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl text-center text-yellow-300 mb-8 font-mono"
      >
        ⚔ Meme Duel ⚔
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {duelMemes.map((meme, index) => (
          <motion.div
            key={meme.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.2 }}
            className={`relative bg-gray-900 p-6 rounded-lg border-4 flex flex-col items-center shadow-2xl transition-all duration-300 ${
              selectedMeme === meme.id 
                ? 'border-green-400 bg-green-900/20 scale-105' 
                : 'border-yellow-300 hover:border-yellow-400'
            }`}
          >
            <div className="relative w-full h-80 mb-4 overflow-hidden rounded">
              <img 
                src={meme.image_url} 
                alt={meme.title} 
                className="w-full h-full object-cover"
              />
              {meme.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3">
                  <p className="text-sm text-cyan-300 font-mono">{meme.caption}</p>
                </div>
              )}
            </div>
            
            <h3 className="text-xl text-gray-100 font-mono mb-2 text-center">{meme.title}</h3>
            
            {meme.vibe && (
              <div className="mb-4 text-center">
                <span className="text-xs text-purple-400 font-mono">Vibe: {meme.vibe}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-green-400 font-mono">👍 {meme.upvotes || 0}</span>
              <span className="text-red-400 font-mono">👎 {meme.downvotes || 0}</span>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote(meme.id)}
              disabled={voting}
              className={`mt-4 px-8 py-3 rounded font-mono font-bold transition-all ${
                selectedMeme === meme.id
                  ? 'bg-green-400 text-black'
                  : 'bg-yellow-300 text-black hover:bg-yellow-400'
              } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedMeme === meme.id ? 'VOTED! 🎉' : 'VOTE'}
            </motion.button>
          </motion.div>
        ))}
      </div>
      
      {voting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <p className="text-cyan-400 font-mono">Preparing next duel...</p>
        </motion.div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={fetchDuelMemes}
        disabled={voting}
        className="mt-8 mx-auto block bg-purple-600 text-white px-6 py-3 rounded font-mono hover:bg-purple-700 transition"
      >
        🔄 New Duel
      </motion.button>
    </div>
  );
} 