import React, { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../services/api";

// Debug logging function
const debug = (area, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [FRONTEND:${area}] ${message}`);
  if (data) {
    console.log('Data:', data);
  }
};

export default function MemeForm() {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    debug('FORM', 'Form submission started');

    const payload = {
      title,
      imageUrl: imageUrl || "https://picsum.photos/seed/" + Math.random() + "/800/600",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    debug('FORM', 'Prepared payload', payload);

    try {
      const meme = await api.createMeme(payload);
      const successMessage = `Meme created: ${meme.title} | Vibe: ${meme.vibe || 'Neon Crypto Chaos'}`;
      debug('SUCCESS', successMessage, meme);
      setMessage(successMessage);
      setTitle("");
      setImageUrl("");
      setTags("");
    } catch (err) {
      const errorMessage = "Failed to create meme: " + err.message;
      debug('ERROR', errorMessage, err);
      setMessage(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
      debug('FORM', 'Form submission completed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[600px] w-full max-w-2xl mx-auto p-8 bg-black/80 backdrop-blur-lg rounded-lg border border-pink-500/30 shadow-lg shadow-pink-500/20"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Create Cyberpunk Meme
          </motion.h1>
          <p className="text-pink-400/60 mt-2 font-mono text-sm">Unleash your digital chaos</p>
        </div>

        <div className="space-y-2">
          <label className="block text-pink-400 font-mono text-sm" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-black/50 text-cyan-300 border border-pink-500/30 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono placeholder-pink-300/20"
            placeholder="Enter meme title..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-pink-400 font-mono text-sm" htmlFor="imageUrl">
            Image URL
          </label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-3 bg-black/50 text-cyan-300 border border-pink-500/30 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono placeholder-pink-300/20"
            placeholder="Leave empty for random cyberpunk image..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-pink-400 font-mono text-sm" htmlFor="tags">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-3 bg-black/50 text-cyan-300 border border-pink-500/30 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono placeholder-pink-300/20"
            placeholder="crypto, funny, cyberpunk (comma-separated)"
          />
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-8 py-3 px-6 rounded-lg font-mono text-lg relative overflow-hidden
            ${isLoading ? 'bg-pink-500/30 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'}
            text-white shadow-lg shadow-pink-500/30 transition-all duration-300
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
            before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : "Generate Meme"}
        </motion.button>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-lg font-mono text-sm ${
              message.includes("Failed") 
                ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}
          >
            {message}
          </motion.div>
        )}
      </form>
    </motion.div>
  );
} 