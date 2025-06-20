import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

export default function Leaderboard() {
  const [topMemes, setTopMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, day

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const memes = await api.getMemes();
      
      // Sort by upvotes and take top 10
      const sorted = memes
        .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
        .slice(0, 10);
      
      setTopMemes(sorted);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const badges = [
    { color: "bg-yellow-400", label: "🥇" },
    { color: "bg-gray-400", label: "🥈" },
    { color: "bg-orange-400", label: "🥉" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-green-400 text-2xl font-mono animate-pulse">Loading Leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl text-center text-green-400 mb-8 font-mono"
      >
        🏆 Top Memes 🏆
      </motion.h2>

      {/* Time Filter */}
      <div className="flex justify-center mb-8 gap-4">
        {['all', 'week', 'day'].map((filter) => (
          <motion.button
            key={filter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTimeFilter(filter)}
            className={`px-4 py-2 rounded font-mono transition ${
              timeFilter === filter
                ? 'bg-green-400 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </motion.button>
        ))}
      </div>

      <ul className="max-w-4xl mx-auto">
        {topMemes.map((meme, idx) => (
          <motion.li
            key={meme.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-center p-6 rounded-lg shadow-lg border-l-8 mb-4 transition-all hover:scale-105 ${
              idx === 0
                ? 'border-yellow-400 bg-yellow-900/20 scale-105'
                : idx === 1
                ? 'border-gray-400 bg-gray-800'
                : idx === 2
                ? 'border-orange-400 bg-orange-900/20'
                : idx % 2 === 0
                ? 'border-green-400 bg-gray-900'
                : 'border-green-400 bg-gray-800'
            }`}
          >
            {/* Rank */}
            <div className="mr-6 text-center">
              <span className={`text-3xl font-bold ${
                idx === 0 ? 'text-yellow-400' : 
                idx === 1 ? 'text-gray-400' : 
                idx === 2 ? 'text-orange-400' : 'text-green-400'
              }`}>
                #{idx + 1}
              </span>
            </div>

            {/* Meme Image */}
            <div className="relative mr-6">
              <img
                src={meme.image_url || 'https://via.placeholder.com/60'}
                alt={meme.title}
                className={`w-16 h-16 rounded object-cover border-2 ${
                  idx === 0 ? 'border-yellow-400' : 
                  idx === 1 ? 'border-gray-400' : 
                  idx === 2 ? 'border-orange-400' : 'border-gray-700'
                }`}
              />
              {idx < 3 && (
                <span className={`absolute -top-2 -right-2 px-2 py-1 rounded text-sm font-bold text-black ${badges[idx].color}`}>
                  {badges[idx].label}
                </span>
              )}
            </div>

            {/* Meme Info */}
            <div className="flex-1">
              <h3 className="text-xl text-gray-100 font-mono mb-1">
                {meme.title}
              </h3>
              {meme.ai_caption && (
                <p className="text-sm text-cyan-300 font-mono mb-1">
                  "{meme.ai_caption}"
                </p>
              )}
              {meme.ai_vibe && (
                <span className="text-xs text-purple-400 font-mono">
                  Vibe: {meme.ai_vibe}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="text-green-300 font-mono text-lg mb-1">
                👍 {meme.upvotes || 0}
              </div>
              <div className="text-red-300 font-mono text-sm">
                👎 {meme.downvotes || 0}
              </div>
              {meme.bid_count > 0 && (
                <div className="text-yellow-300 font-mono text-sm">
                  💰 {meme.bid_count} bids
                </div>
              )}
            </div>

            {/* Crown for #1 */}
            {idx === 0 && (
              <motion.span 
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="ml-4 text-yellow-400 text-3xl"
              >
                👑
              </motion.span>
            )}
          </motion.li>
        ))}
      </ul>

      {topMemes.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 font-mono">No memes yet. Be the first to create one!</p>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={fetchLeaderboard}
        className="mt-8 mx-auto block bg-green-600 text-white px-6 py-3 rounded font-mono hover:bg-green-700 transition"
      >
        🔄 Refresh Leaderboard
      </motion.button>
    </div>
  );
} 