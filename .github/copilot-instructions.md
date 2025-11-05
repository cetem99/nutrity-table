## Quick orientation for AI contributors

This project is a small Node.js/Express backend (ES modules) with a static `public/` frontend. The goal of this file is to help AI coding agents make safe, useful edits quickly.

- Entry point: `src/server.js` — config, middleware, static file serving, route registration.
- DB connection: `src/config/db.js` — uses `process.env.MONGO_URI` and mongoose.
- Routes: `src/routes/*.js` map HTTP paths to controller functions in `src/controllers`.
- Controllers: `src/controllers/*Controller.js` contain request handlers and are the main place to modify API behavior.
- Models: `src/models/*.js` define mongoose schemas. Note: `User.js` contains password hashing and `toJSON()` that strips the password.

Important conventions and patterns (follow these exactly):

- Authentication: JWT tokens created in `src/controllers/userController.js` (see `generateToken`). Protected routes use `src/middleware/authMiddleware.js` which sets `req.userId` from the token. Use the `Authorization: Bearer <token>` header for protected endpoints.
- Passwords: `User` schema hashes passwords in a `pre('save')` hook. When updating a password, assign `user.password = newPassword` and call `user.save()` so the hook runs.
- Responses: controllers return compact JSON messages (e.g. `{ message: '...' }`) and user objects always use `user.toJSON()` to remove sensitive fields.
- Route registration: Add new routes in `src/routes/*`, import the route in `src/server.js`, and mount under `/api/...`.

Project-specific quirks & gotchas:

- Inconsistency: `src/controllers/profileController.js` expects `userId` via query/body (e.g. `req.query.userId` or `req.body.userId`), while protected user routes rely on `req.userId` from the auth middleware. Prefer `req.userId` for protected endpoints. If you change `profileController`, update clients accordingly.
- Empty placeholders: `src/controllers/tableController.js` and `src/models/NutritionTable.js` are empty — treat them as TODOs; don't assume they exist when adding features.
- Static frontend: `src/public/` contains HTML/JS/CSS served by Express. The server's root (`/`) serves `public/login.html`.

Environment variables used (set these in dev/test):

- `MONGO_URI` — MongoDB connection string (required)
- `JWT_SECRET` — JWT signing secret (required)
- `JWT_EXPIRES` — optional token expiry (defaults to `7d` in code)
- `PORT` — optional server port (defaults to 3000)

Dev and run commands (from `package.json`):

- `npm run dev` — start with `nodemon` (recommended for development)
- `npm start` — run once with `node` (production/test simple runs)

When changing code, keep these tests/manual checks in mind:

- Start server and exercise these endpoints: `/api/users/register`, `/api/users/login`, `/api/users/profile` (protected). Ensure tokens are accepted via `Authorization` header.
- If you modify model schemas, remember to handle existing data migrations or make changes backward-compatible.

Example snippets for agents (copy/paste-ready):

1) Read current user from token in a controller:

```js
// req.userId was set by src/middleware/authMiddleware.js
const user = await User.findById(req.userId).select('-password');
```

2) Create a protected route in `src/routes` and wire it in `src/server.js`:

```js
// src/routes/exampleRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { exampleHandler } from '../controllers/exampleController.js';
const router = express.Router();
router.get('/example', protect, exampleHandler);
export default router;
```

Where to look for more context:

- `src/server.js` — overall wiring and static file serving
- `src/controllers/userController.js` — registration/login/token generation
- `src/middleware/authMiddleware.js` — token parsing/verification
- `src/models/User.js` — schema, hashing, and toJSON()

If anything here is unclear or you want different conventions (e.g., always use `req.userId` or change response shapes), ask the repo owner. After edits, run `npm run dev` and exercise the affected endpoints.

— End of file
