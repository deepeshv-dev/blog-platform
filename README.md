# Margin — Blog Platform with Comments

Margin is a full-stack blogging application for discovering and writing stories. Users can register, publish and manage their own posts, browse by category, search, and join conversations with comments.

## Features

- Account registration, login, logout, and profile details.
- Password hashing with bcryptjs and seven-day JWT sessions in HttpOnly cookies.
- Protected post/comment actions and server-side owner authorization.
- Post categories, title/content search, newest/oldest sorting, and pagination.
- Post and comment author/date information.
- Dashboard with account information, published-post count, recent posts, edit/delete actions, and empty/loading/error states.
- Responsive layouts, inline validation, success/error notifications, and delete confirmations.
- MongoDB persistence through Mongoose, indexed fields, security headers, CORS allow-listing, and authentication rate limits.

## Technology

- React 18, Vite, React Router, Axios, responsive CSS
- Node.js 20+, Express 4, Mongoose 8
- MongoDB Atlas or local MongoDB
- bcryptjs, JSON Web Tokens, Helmet, express-rate-limit

## Project structure

```text
client/
  src/
    api/                 Axios client
    components/          Shared layout, forms, cards, protected route
    context/             Authentication and notifications
    pages/               Home, auth, editor, detail, dashboard
    App.jsx
    main.jsx
    styles.css
  .env.example
server/
  src/
    config/              MongoDB connection
    controllers/         Auth, post, and comment handlers
    middleware/          Authentication and error handling
    models/              User, post, and comment schemas
    routes/              REST API routes
    utils/               Validation, ownership, cookies, query parsing
    app.js
    server.js
  test/                  API, auth, CRUD, and validation tests
  .env.example
package.json             npm workspaces and root commands
vercel.json              SPA fallback for Vercel
```

## Prerequisites

- Node.js 20 or newer and npm 10 or newer
- MongoDB Atlas account/cluster, or a local MongoDB server

## Configure MongoDB and the API

1. Copy the server template:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

2. Set `MONGODB_URI` in `server/.env`:
   - Atlas: use the connection string from Atlas, set a database name, create a database user, and allow your development IP in Network Access.
   - Local MongoDB: `mongodb://127.0.0.1:27017/blogplatform`
   - URL-encode special characters in Atlas usernames/passwords.

3. Generate a private JWT signing key and set it as `JWT_SECRET`:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   The API requires at least 32 bytes. Never use the example file as the real configuration, commit `server/.env`, or share the secret.

4. Keep `CLIENT_URL` configured in `server/.env`. During development, the API accepts HTTP origins for `localhost` and `127.0.0.1` on any port, so Vite can switch ports without changing this value. In production, set `CLIENT_URL` to one or more exact frontend origins, separated by commas, such as `https://blog.example.com,https://www.example.com`.

5. The browser cookie defaults to `SameSite=Lax` for local development and is marked `Secure` in production. For production, CORS and cookie-authenticated writes allow only the exact origins listed in `CLIENT_URL`. For a cross-site production frontend/API pair, set `COOKIE_SAME_SITE=none` over HTTPS. Prefer frontend and API custom domains under the same site because browsers may block third-party cookies between unrelated hosting domains.

`server/.env.example` includes the local MongoDB URI and leaves `JWT_SECRET` blank for safety. The API intentionally refuses to start without a database URI and a strong JWT secret, and reports which required variable names are missing without printing their values.

## Install and run locally

From the project root:

```powershell
npm install
npm run dev
```

The client defaults to `http://127.0.0.1:5176` in this project; the API is at `http://127.0.0.1:5000`. Vite proxies local `/api` calls to the API. If the Express API is unavailable, the proxy responds with HTTP 503 and a setup hint. You can copy `client/.env.example` to `client/.env.local`; change `VITE_API_PROXY_TARGET` if your API listens on a different local address. To start both workspaces together, run `npm run dev` from the project root. Development CORS accepts both `localhost` and `127.0.0.1` on Vite's changing ports. You can start the workspaces separately:

```powershell
npm run dev -w server
npm run dev -w client
```

To override the frontend API URL, copy `client/.env.example` to `client/.env.local` and set `VITE_API_URL`, including the `/api` path. Do not put database credentials or JWT secrets in any `VITE_*` variable; Vite variables are public in the built client.

## API reference

All responses are JSON. Validation errors use HTTP `400` and include a `fields` object. Authentication uses the HttpOnly `margin_session` cookie; browser requests include credentials automatically. In development, cross-origin requests are restricted to HTTP loopback hosts (`localhost` and `127.0.0.1`). In production, they are restricted to the exact origins configured in `CLIENT_URL`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Liveness check |
| `GET` | `/api/ready` | Public | MongoDB readiness check |
| `POST` | `/api/auth/register` | Public, rate-limited | Create account and session |
| `POST` | `/api/auth/login` | Public, rate-limited | Sign in and create session |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `GET` | `/api/auth/me` | Session | Current user profile |
| `GET` | `/api/posts` | Public | List/search/filter/sort/page posts |
| `GET` | `/api/posts/:id` | Public | Read one post |
| `POST` | `/api/posts` | Session | Create a post |
| `PUT` | `/api/posts/:id` | Session, owner | Update a post |
| `DELETE` | `/api/posts/:id` | Session, owner | Delete a post and its comments |
| `GET` | `/api/comments/:postId` | Public | List comments |
| `POST` | `/api/comments/:postId` | Session | Add a comment |
| `DELETE` | `/api/comments/:id` | Session, comment owner | Delete a comment |

`GET /api/posts` accepts:

- `q`: search post title and content (up to 100 characters)
- `category`: `Arts`, `Culture`, `Lifestyle`, `Personal`, `Technology`, `Travel`, `Writing`, or `Other`
- `author`: MongoDB user ID (used by the dashboard)
- `sort`: `newest` (default) or `oldest`
- `page`: positive page number (default `1`)
- `limit`: page size from `1` to `50` (default `9`)

List responses contain `posts` and `pagination` (`page`, `limit`, `total`, `totalPages`). Posts are published when created; there is no separate draft state.

## Tests and production build

```powershell
npm test
npm run build
```

The backend tests cover registration/login cookie behavior, logout, authentication/expiry/origin checks, post/comment CRUD and ownership, query parsing, validation, and health/readiness responses. Tests run without Atlas credentials using focused model/controller stubs; they do not claim to verify a live MongoDB deployment.

To start only the production API after configuring its environment:

```powershell
npm run start -w server
```

The frontend production bundle is generated in `client/dist`. `npm run build` at the root builds the client; the API is a Node service and runs with the server `start` command.

## Deployment

Do not deploy until you explicitly choose a hosting project and configure its secrets.

### Frontend on Vercel

1. Import the repository and keep the repository root as the project root.
2. Use `npm run build` as the build command and `client/dist` as the output directory. `vercel.json` provides SPA route fallback.
3. Set `VITE_API_URL` to the deployed API origin ending in `/api`, for example `https://api.example.com/api`.
4. Set the API's `CLIENT_URL` to the exact deployed frontend origin or a comma-separated list of deployed frontend origins.

### Backend on Render

1. Create a Node web service from the repository root.
2. Build command: `npm ci && npm run build`
3. Start command: `npm run start -w server`
4. Configure `NODE_ENV=production`, `MONGODB_URI`, a generated `JWT_SECRET` (at least 32 bytes), and `CLIENT_URL` with the exact allowed frontend origin(s). Render supplies `PORT`.
5. Allow the service's network access in Atlas. Use HTTPS and configure cookie SameSite settings according to your domain arrangement.

Do not put `MONGODB_URI` or `JWT_SECRET` in the frontend or Vercel client build environment. Add them only to the backend host's secret environment settings.

## Troubleshooting

- **API exits with a database connection error:** verify `MONGODB_URI`, Atlas database user/password, URL-encoding, IP allow-list, and network access. The message intentionally omits connection details.
- **Local MongoDB is not running on Windows:** check with `Get-Service MongoDB`; if it is stopped, run `Start-Service MongoDB` from an elevated PowerShell window. If that service is not installed, install MongoDB Community Server or configure an Atlas `MONGODB_URI`.
- **API exits because `JWT_SECRET` is invalid:** configure a private value of at least 32 bytes.
- **Browser shows a CORS error:** in development, confirm the frontend uses `localhost` or `127.0.0.1` and the Vite proxy targets the API. In production, add the exact frontend origin to `CLIENT_URL` and restart the API.
- **Login works but refresh appears signed out:** use HTTPS in production, ensure the API returns `Set-Cookie`, enable credentialed CORS, include the exact frontend origin in `CLIENT_URL`, and avoid unrelated frontend/API domains that block third-party cookies.
- **Frontend cannot reach API locally:** start the API on port `5000`, or set `VITE_API_URL` in `client/.env.local` and restart Vite. Check whether an older Vite instance already occupies port `5176` (or the fallback port it selected); stop that instance from its original terminal with `Ctrl+C` before starting another copy.
- **Atlas search/index errors:** wait for Mongoose's schema indexes to finish building after first startup; the post model defines a text index for title/content.
