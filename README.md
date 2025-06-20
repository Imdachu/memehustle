# MemeHustle: A Real-Time Cyberpunk AI Meme Marketplace

MemeHustle is a full-stack web application that brings together generative AI, real-time auctions, and social voting in a visually-striking cyberpunk-themed marketplace. It's designed to be a fast, interactive, and engaging platform where users compete to create and own the most valuable memes.

This project demonstrates a modern, decoupled architecture using a React frontend and a Node.js backend, with real-time communication handled by WebSockets and data persistence managed by Supabase.

### 🚀 **[View the Live Demo](https://memehustle-tau.vercel.app/)** 🚀

---

## 🌟 Core Features

- **🤖 AI-Powered Meme Generation**: Users provide a title and tags, and the backend uses the **Google Gemini AI** to generate a witty, context-aware caption and a unique "cyberpunk vibe" description for the meme.

- **⚡ Real-Time Bidding & Voting**: Using **Socket.IO**, all user interactions like placing a bid or casting a vote are broadcast to all connected clients instantly without needing a page refresh.

- **📈 Dynamic Leaderboard**: A live-updating gallery showcases the top-10 memes, ranked by their total upvotes, providing a central point of competition.

- **🔒 Robust Decoupled Architecture**: The frontend (Vercel) and backend (Render) are deployed and scaled independently, communicating via a REST API and WebSocket channel. This separation of concerns improves performance and maintainability.

- **💾 Persistent Data Storage**: All user-generated content, bids, and votes are stored in a **Supabase** PostgreSQL database.

---

## 🛠️ Technology & Architecture

### Tech Stack

| Area      | Technology / Service | Purpose                                                                 |
|-----------|----------------------|-------------------------------------------------------------------------|
| **Frontend**  | React, Vite, Tailwind CSS | For a fast, modern, and responsive user interface.                      |
|           | Socket.IO Client     | To establish and manage the real-time WebSocket connection.             |
|           | Framer Motion        | For fluid and appealing UI animations.                                  |
| **Backend**   | Node.js, Express     | To build a fast and scalable server for the API and WebSocket logic.    |
|           | Socket.IO            | For managing the real-time, bidirectional communication channel.        |
| **Database**  | Supabase (PostgreSQL)| To provide a reliable, scalable, and easy-to-use database backend.      |
| **AI**        | Google Gemini AI     | For generating creative and unique meme captions and descriptions.      |
| **Deployment**| Vercel (Frontend)    | For continuous deployment, high performance, and a global CDN.          |
|           | Render (Backend)     | For hosting the Node.js service and managing environment variables.     |

### Architectural Decisions

- **Why WebSockets?** A core requirement was instant feedback for users. When someone bids or votes, everyone should see it immediately. WebSockets provide a persistent, low-latency, bidirectional channel that is far more efficient for this use case than traditional HTTP polling.

- **Why a Decoupled Frontend/Backend?** Separating the frontend and backend allows for independent development, scaling, and deployment. Vercel is highly optimized for serving static React sites, while Render provides a robust environment for a stateful backend service. This separation makes the system more resilient and easier to maintain.

- **Why Supabase?** Supabase offers the power of a PostgreSQL database with the convenience of an auto-generated API, authentication, and real-time database events (though we use our own WebSocket server for more control). It significantly simplifies backend development.

---

## 🔄 Application Flow

1.  **Meme Creation**: A user submits a form with a title, image URL, and tags.
2.  **AI Enrichment**: The backend receives this data and sends a prompt to the Google Gemini AI to generate a `caption` and `vibe`.
3.  **Database Storage**: The complete meme data (including the AI-generated content) is saved to the `memes` table in Supabase.
4.  **Real-time Broadcast**: The new meme is broadcast via Socket.IO to all connected clients, which then dynamically add it to the UI.
5.  **Bidding and Voting**: When a user places a bid or votes, a WebSocket event is sent to the server. The server validates the action, updates the database, and then broadcasts the change to all clients, ensuring every user's UI reflects the new state instantly.

---

## 🔌 API & WebSocket Overview

### REST Endpoints

- `GET /api/memes`: Fetches all memes from the database.
- `POST /api/memes`: Creates a new meme.
- `POST /api/memes/:id/vote`: Fallback endpoint for voting.
- `POST /api/memes/:id/bid`: Fallback endpoint for bidding.

### WebSocket Events

- **Client Emits:**
  - `place_bid`: Sent when a user places a bid on a meme.
  - `vote`: Sent when a user upvotes a meme.
- **Server Emits:**
  - `new_meme`: Broadcasts a new meme to all clients.
  - `new_bid`: Broadcasts a new bid to all clients for a specific meme.
  - `vote_update`: Broadcasts the new vote count for a specific meme.
  - `error`: Sends an error message to a specific client if an action fails.

---

## 🚀 Local Development Guide

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)

### 1. Clone & Install

```sh
# Clone the repository
git clone https://github.com/Imdachu/memehustle.git
cd memehustle

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend/FRONTEND
npm install
```

### 2. Configure Environment Variables

- **Backend (`/backend/.env`):**
  ```env
  SUPABASE_URL=your_supabase_project_url
  SUPABASE_KEY=your_supabase_anon_key
  GEMINI_API_KEY=your_google_gemini_api_key
  FRONTEND_URL=http://localhost:5173
  ```

- **Frontend (`/frontend/FRONTEND/.env.local`):**
  ```env
  VITE_API_URL=http://localhost:3001
  ```

### 3. Run the Application

- **Terminal 1: Start Backend** (from `/backend`):
  ```sh
  npm run dev
  ```
- **Terminal 2: Start Frontend** (from `/frontend/FRONTEND`):
  ```sh
  npm run dev
  ```
The app will be available at `http://localhost:5173`.

---

## 💡 Future Improvements

- **User Authentication**: Implement a full user authentication system so bids and creations are tied to specific users.
- **Credit System**: Build out the backend logic for user credit balances, allowing for real transactions.
- **Meme Image Uploads**: Allow users to upload images directly instead of providing a URL.
- **Persistent Caching**: Use a service like Redis to cache AI responses and leaderboard data to reduce database load and improve performance.

---

## 👨‍💻 Development Notes

This project was built with the assistance of **Cursor**, an AI-powered code editor. It was instrumental in:
- Generating boilerplate code for React components and Express server routes.
- Debugging complex deployment and CORS issues between the frontend and backend.
- Assisting in the creation of a robust, real-time WebSocket layer for bidding and voting (even when it felt like WebSocket chaos!).
- Writing and refining comprehensive documentation and README files.
