import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MemeForm from "./components/MemeForm";
import Gallery from "./components/Gallery";
import Leaderboard from "./components/Leaderboard";
import Duel from "./components/Duel";
import Profile from "./components/Profile";
import './App.css'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black w-screen">
        <nav className="fixed top-0 left-0 w-full bg-gray-900 text-white py-6 px-8 flex space-x-8 z-10">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/create" className="hover:underline">Create Meme</Link>
          <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
          <Link to="/duel" className="hover:underline">Duel</Link>
          <Link to="/profile" className="hover:underline">Profile</Link>
        </nav>
        <div className="pt-24 px-4 md:px-16">
          <Routes>
            <Route path="/create" element={<MemeForm />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/duel" element={<Duel />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Gallery />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
