<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rLLRnE1S_N6jHy3zo2t2WrjU1we-qlUe

## Run Locally

**Prerequisites:** Node.js 18+, running MongoDB instance (Atlas or local)

1. Install frontend deps: `npm install`
2. Install backend deps: `cd backend && npm install`
3. Configure environment:
   - Root `.env` → set `VITE_API_BASE_URL` (defaults to `http://localhost:5001`)
   - `backend/.env` → set `MONGODB_URI`, `MONGODB_DB_NAME`, and `ALLOWED_ORIGINS`
4. Start the backend: `cd backend && npm run dev`
5. In another terminal, start the frontend: `npm run dev`

The React SPA now persists tenant/catalog data through the MongoDB API instead of Firebase. Local sessions are stored in `localStorage`, so you can register/login without external auth providers.
