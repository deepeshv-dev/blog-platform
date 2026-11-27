# Integration hand-off

- Backend: `server/`; run `npm run dev -w server` from root; default port `5000`; build/start `npm start -w server`; health `GET /api/health`; requires `server/.env` (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `PORT`).
- Frontend: `client/`; dev `npm run dev -w client`; build `npm run build`; API seam `client/src/api/index.js`; base URL `VITE_API_URL` or `http://localhost:5000/api`. No mock data or duplicate mock types to remove.
- API inventory: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`; `GET /api/comments/:postId`, `POST /api/comments/:postId`, `DELETE /api/comments/:id`; `GET /api/health`.
- Database: MongoDB via Mongoose models in `server/src/models`; no SQL migration tool or migration directory; collections are created by Mongoose. **Do not add seed data.**
- Shared types: none (JavaScript-only client/server).
- Services: Essential — React/Vite web client and Express/Mongoose API with MongoDB. Enhancement — none.
