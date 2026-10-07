# Inscription

A full-stack web application built with React, TypeScript, Express, and MongoDB.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas connection string

## Setup

1. **Clone the repo and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   MONGO_URI=mongodb://localhost:27017/inscriptions
   PORT=6000
   NODE_ENV=development
   JWT_SECRET=your_long_random_secret_here
   ```

   `JWT_SECRET` is required — the server will refuse to start without it.

## Running the App

The app has two parts that need to run concurrently: the Express API server and the Vite dev server.

**Terminal 1 — API server:**

```bash
npm run server:dev
```

Starts the Express server on [http://localhost:6000](http://localhost:6000) with auto-reload via nodemon.

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Starts the Vite dev server. Open [http://localhost:5173](http://localhost:5173) in your browser. API requests are proxied to `localhost:6000` automatically.

## Other Scripts

| Command | Description |
|---|---|
| `npm run build` | Type-check and build the frontend for production |
| `npm run preview` | Preview the production build locally |
| `npm run server` | Start the API server without auto-reload |
| `npm run lint` | Run ESLint |
