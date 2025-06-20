# MemeHustle Backend

Backend server for the MemeHustle Cyberpunk AI Meme Marketplace. Built with Node.js, Express, Socket.IO, Supabase, and Google's Gemini AI.

## Features

- Real-time meme bidding with Socket.IO
- AI-powered meme captions and vibe analysis using Google Gemini 2.5 Pro
  - Advanced reasoning capabilities for creative and contextual responses
  - Multimodal support for future image analysis features
  - Built-in "thinking" for enhanced accuracy
- Supabase integration for data persistence
- In-memory caching for AI responses and leaderboard
- RESTful API endpoints for meme management
- Real-time voting system

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

3. Set up Supabase:
   - Create a new project at [Supabase](https://supabase.com)
   - Create the following tables:
     ```sql
     -- Memes table
     create table memes (
       id uuid default uuid_generate_v4() primary key,
       title text not null,
       image_url text not null,
       tags text[] default '{}',
       caption text,
       vibe text,
       upvotes integer default 0,
       created_at timestamp with time zone default timezone('utc'::text, now())
     );

     -- Bids table
     create table bids (
       id uuid default uuid_generate_v4() primary key,
       meme_id uuid references memes(id),
       user_id text not null,
       credits integer not null,
       created_at timestamp with time zone default timezone('utc'::text, now())
     );
     ```

4. Get your Google Gemini API key:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - The app uses Gemini 2.5 Pro, which is Google's latest stable model for advanced reasoning and creative tasks

## Development

Run the server in development mode with hot reload:
```bash
npm run dev
```

## Production

Start the server in production mode:
```bash
npm start
```

## API Endpoints

- `GET /api/memes` - Get all memes
- `POST /api/memes` - Create a new meme
- `GET /api/leaderboard` - Get top 10 memes by upvotes

## WebSocket Events

### Client -> Server
- `place_bid` - Place a bid on a meme
- `vote` - Upvote or downvote a meme

### Server -> Client
- `new_bid` - Broadcast when a new bid is placed
- `vote_update` - Broadcast when a meme's votes change
- `new_meme` - Broadcast when a new meme is created
- `error` - Send error messages to clients

## Error Handling

The server includes robust error handling for:
- Failed database operations
- AI generation failures (with fallback responses)
- Invalid requests
- WebSocket connection issues

## Caching

- AI responses are cached in-memory to reduce API calls
- Leaderboard is cached and updated on vote changes
- Cache is cleared on server restart 