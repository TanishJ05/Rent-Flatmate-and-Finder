# Rent Flatmate Finder

A room rental / flatmate-matching platform.

## Architecture
- Frontend: React (Vite + TypeScript) with TailwindCSS
- Backend: Node.js (Express + Mongoose)
- Real-time: Socket.io
- Monorepo structured with `npm workspaces`.

## Running the project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `server/.env` based on `server/.env.example`.

3. Run the development servers concurrently:
   ```bash
   npm run dev
   ```