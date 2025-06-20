import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [credits, setCredits] = useState(1000);
  const [userMemes, setUserMemes] = useState([]);
  const [userBids, setUserBids] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Check if user is logged in (localStorage for now)
    const savedUser = localStorage.getItem('memehustle_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsLoggedIn(true);
      fetchUserData(userData.id);
    }
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch user's memes and bids (mock data for now)
      const memes = await api.getMemes();
      const userMemes = memes.filter(meme => meme.user_id === userId);
      setUserMemes(userMemes);
      
      // Mock user bids
      setUserBids([
        { id: 1, meme_id: 1, amount: 50, meme_title: "Doge HODL" },
        { id: 2, meme_id: 2, amount: 75, meme_title: "Success Kid" }
      ]);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleLogin = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    const userData = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      username: username,
      credits: credits,
      created_at: new Date().toISOString()
    };

    localStorage.setItem('memehustle_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    fetchUserData(userData.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('memehustle_user');
    setUser(null);
    setIsLoggedIn(false);
    setUserMemes([]);
    setUserBids([]);
  };

  const addCredits = (amount) => {
    const newCredits = credits + amount;
    setCredits(newCredits);
    if (user) {
      const updatedUser = { ...user, credits: newCredits };
      setUser(updatedUser);
      localStorage.setItem('memehustle_user', JSON.stringify(updatedUser));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-gray-900 p-8 rounded-lg border-2 border-cyan-400"
        >
          <h2 className="text-3xl text-center text-cyan-400 font-mono mb-6">
            🔐 Login to MemeHustle
          </h2>
          
          <div className="mb-6">
            <label className="block text-gray-300 font-mono mb-2">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyan-400 focus:outline-none"
              placeholder="Enter your username..."
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 font-mono mb-2">Starting Credits:</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 1000)}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyan-400 focus:outline-none"
              min="100"
              max="10000"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            className="w-full bg-cyan-400 text-black py-3 rounded font-mono font-bold hover:bg-cyan-300 transition"
          >
            🚀 Start Hustling
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gray-900 p-6 rounded-lg border-2 border-purple-400 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl text-purple-400 font-mono mb-2">
                👤 {user.username}
              </h2>
              <p className="text-gray-400 font-mono">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl text-yellow-400 font-mono mb-2">
                💰 {user.credits} Credits
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addCredits(100)}
                className="bg-green-600 text-white px-4 py-2 rounded font-mono text-sm hover:bg-green-700 transition"
              >
                +100 Credits
              </motion.button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {['profile', 'memes', 'bids', 'stats'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded font-mono transition ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900 p-6 rounded-lg border-2 border-purple-400">
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-2xl text-purple-400 font-mono mb-4">Profile Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-4 rounded text-center">
                  <div className="text-3xl text-green-400 font-mono mb-2">{userMemes.length}</div>
                  <div className="text-gray-300 font-mono">Memes Created</div>
                </div>
                <div className="bg-gray-800 p-4 rounded text-center">
                  <div className="text-3xl text-yellow-400 font-mono mb-2">{userBids.length}</div>
                  <div className="text-gray-300 font-mono">Bids Placed</div>
                </div>
                <div className="bg-gray-800 p-4 rounded text-center">
                  <div className="text-3xl text-cyan-400 font-mono mb-2">{user.credits}</div>
                  <div className="text-gray-300 font-mono">Total Credits</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memes' && (
            <div>
              <h3 className="text-2xl text-purple-400 font-mono mb-4">Your Memes</h3>
              {userMemes.length === 0 ? (
                <p className="text-gray-400 font-mono text-center">No memes created yet. Start creating!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userMemes.map((meme) => (
                    <div key={meme.id} className="bg-gray-800 p-4 rounded">
                      <img src={meme.image_url} alt={meme.title} className="w-full h-32 object-cover rounded mb-2" />
                      <h4 className="text-gray-200 font-mono mb-1">{meme.title}</h4>
                      <div className="text-sm text-gray-400">
                        👍 {meme.upvotes || 0} | 👎 {meme.downvotes || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bids' && (
            <div>
              <h3 className="text-2xl text-purple-400 font-mono mb-4">Your Bids</h3>
              {userBids.length === 0 ? (
                <p className="text-gray-400 font-mono text-center">No bids placed yet. Start bidding!</p>
              ) : (
                <div className="space-y-4">
                  {userBids.map((bid) => (
                    <div key={bid.id} className="bg-gray-800 p-4 rounded flex items-center justify-between">
                      <div>
                        <h4 className="text-gray-200 font-mono">{bid.meme_title}</h4>
                        <p className="text-gray-400 text-sm">Bid: {bid.amount} credits</p>
                      </div>
                      <div className="text-yellow-400 font-mono">💰 {bid.amount}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h3 className="text-2xl text-purple-400 font-mono mb-4">Achievement Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-green-400 font-mono mb-2">🏆 Achievements</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>✅ First Meme Created</li>
                    <li>✅ First Bid Placed</li>
                    <li>🔄 10 Memes Created (5/10)</li>
                    <li>🔄 1000 Credits Earned (750/1000)</li>
                  </ul>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-cyan-400 font-mono mb-2">📊 Activity</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>Days Active: 3</li>
                    <li>Total Votes Received: 42</li>
                    <li>Average Meme Rating: 4.2/5</li>
                    <li>Bid Success Rate: 75%</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="bg-red-600 text-white px-6 py-3 rounded font-mono hover:bg-red-700 transition"
          >
            🚪 Logout
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
} 