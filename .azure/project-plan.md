# Blog Platform with Comments

## Approval

The user approved this plan in chat before implementation.

## Goal

Build a complete, responsive MERN blog application where visitors can discover published posts and authenticated users can manage their own posts and comments.

## Technology

- Frontend: JavaScript, React, Vite, React Router DOM, Axios, responsive CSS.
- Backend: Node.js, JavaScript, Express, REST APIs.
- Persistence: MongoDB Atlas through Mongoose.
- Authentication: bcryptjs password hashing, JWT bearer authentication, protected frontend routes.

## Application features

- Register, log in, log out, and retrieve the authenticated user's profile.
- Browse published blog posts, search by text, and filter posts.
- View a post, its author, dates, and comments.
- Authenticated users can create posts and edit or delete only their own posts.
- Authenticated users can comment; only a comment's author can delete it.
- Dashboard showing user information and the current user's posts, with create/edit/delete actions.
- Responsive editorial-style UI with reusable navigation, cards, forms, loading/empty/error states.
- Validate request data and return consistent API errors.

## Data models

- User: username, normalized unique email, password hash, createdAt.
- Post: title, content, author reference, createdAt, updatedAt.
- Comment: post reference, user reference, commentText, createdAt.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`
- `GET /api/comments/:postId`, `POST /api/comments/:postId`, `DELETE /api/comments/:id`

Private endpoints require a valid JWT. Post and comment mutations enforce ownership on the server.

## Project layout and configuration

- `client/` contains the Vite application and reusable components, pages, auth context, and Axios service.
- `server/` contains Express configuration, controllers, middleware, Mongoose models, routes, and `server.js`.
- Provide a root README with prerequisites, environment setup, install/run/build/test instructions.
- Provide `server/.env.example` with placeholder values only. Read database URI, JWT secret, and ports from environment variables; never commit populated credentials.
- Support local development with separate frontend/backend processes and a configured API base URL.

## Acceptance checks

- Install dependencies and run the frontend production build and backend tests/lint checks available in the project.
- Verify API input validation, authentication, and ownership checks through focused tests.
- Confirm setup instructions and environment placeholders are complete; no secrets are present.
