# Admin Backend (MongoDB)

Node/Express service that replaces direct Firestore access with a MongoDB-backed API. It exposes REST endpoints for tenants, catalog data, and configuration objects that the React app can call via `fetch`.

## Prerequisites

- Node 18+
- MongoDB Atlas cluster (or self-hosted) with a database created

## Environment Variables

Create a `.env` file by copying `.env.example` and filling in values:

```
PORT=5001
MONGODB_URI=mongodb+srv://user:password@cluster-url
MONGODB_DB_NAME=seven_days
ALLOWED_ORIGINS=http://localhost:5173,https://admin.yourdomain.com
```

## Scripts

- `npm install` — install dependencies
- `npm run dev` — start the API with hot reload (ts-node-dev)
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run the compiled server

## Project Layout

```
backend/
  src/
    config/        # env loading + shared constants
    db/            # Mongo connection helpers
    middleware/    # auth + error handlers
    routes/        # Express routers (health, tenants, etc.)
    services/      # Database logic
    types/         # Shared TypeScript contracts
```

## Next Steps

1. Update the frontend `DataService` to call this API instead of Firestore.
2. Extend the placeholder services/routes to cover products, orders, and configs.
3. Add integration tests or Thunder Client collections to document endpoints.
4. Deploy the backend somewhere close to your MongoDB cluster for best latency.
