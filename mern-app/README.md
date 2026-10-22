# DevVerse — Unified Developer Ecosystem (MERN Rebuild)

> A full-stack developer ecosystem connecting builders, projects, hackathons, engineering logs (The Codex), squad collaboration, and developer portfolios with genuine database persistence, JWT authentication, and dark-mode first design.

---

## 1. Overview & Architecture

DevVerse has been completely rebuilt as an enterprise-grade MERN (MongoDB, Express, React, Node.js) single-page application. All client interactions communicate via RESTful APIs under `/api/v1` to an Express server backed by Mongoose ODM and MongoDB.

### Architecture Highlights

```
                                      +------------------------------------+
                                      |            Browser Client          |
                                      |     React 18 + Vite + Plain CSS    |
                                      +-----------------+------------------+
                                                        |
                                                 REST / JSON
                                            (Credentials: include)
                                                        |
                                                        v
+--------------------------------------------------------------------------------------------------+
|                                    Express.js API Gateway (:5000)                                |
|  +--------------------+---------------------+--------------------+----------------------------+  |
|  | Helmet / Security  |   CORS Allowlist    |  Express RateLim   | MongoSanitize / Validators |  |
|  +--------------------+---------------------+--------------------+----------------------------+  |
|                                                        |                                         |
|                       +--------------------------------+--------------------------------+        |
|                       |                                                                 |        |
|                       v                                                                 v        |
|         +---------------------------+                                     +--------------------+ |
|         |    Auth Middleware (JWT)  |                                     | Public / Open APIs | |
|         |  (HttpOnly Cookie Verify) |                                     | (Explore, Codex...) | |
|         +-------------+-------------+                                     +---------+----------+ |
|                       |                                                             |            |
|                       +--------------------------------+----------------------------+            |
|                                                        |                                         |
|                                                        v                                         |
|                                          +---------------------------+                           |
|                                          |   Controllers & Routers   |                           |
|                                          | (Auth, Project, Codex...) |                           |
|                                          +-------------+-------------+                           |
+--------------------------------------------------------|-----------------------------------------+
                                                         |
                                                 Mongoose ODM
                                                         |
                                                         v
                                           +---------------------------+
                                           |      MongoDB Database     |
                                           |  (Local / MongoDB Atlas)  |
                                           +---------------------------+
```

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 (Functional Components, Hooks, Context API)
- **Tooling**: Vite 5 for fast modern builds
- **Routing**: React Router DOM v6
- **Styling**: Pure CSS with Custom Properties design system (`index.css`), responsive grids, CSS variables, dark/light theme switching, and glassmorphism
- **API Client**: Modular Fetch API wrapper with automatic JSON serialization, credentials handling, and centralized error normalization
- **Icons**: Custom inline SVGs for zero-dependency consistency

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4 (CommonJS modules)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) issued in HttpOnly, secure cookies with strict expiration
- **Password Security**: `bcryptjs` with salt work factor of 12
- **File Uploads**: `multer` with file signature validation, 5MB file-size caps, and randomized storage keys
- **Security Middlewares**: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `validator`

### Database
- **Database**: MongoDB (Local standalone or MongoDB Atlas cloud cluster)
- **ODM**: Mongoose 8 with strict schemas, indexes, hooks, and relational references

---

## 3. Project Directory Structure

```
mern-app/
├── package.json                   # Root orchestrator scripts (dev, build, seed, test)
├── .gitignore                     # Git ignore rules for builds and node_modules
├── README.md                      # Comprehensive project documentation
├── server/
│   ├── package.json               # Backend dependencies and scripts
│   ├── .env.example               # Environment variables template
│   ├── .env                       # Local environment variables
│   ├── .gitignore
│   ├── src/
│   │   ├── app.js                 # Express application configuration
│   │   ├── server.js              # Server lifecycle & graceful shutdown
│   │   ├── seed.js                # Database demo seeder script
│   │   ├── config/
│   │   │   └── database.js        # MongoDB Mongoose connection manager
│   │   ├── controllers/           # Business logic & request orchestrators
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── community.controller.js
│   │   │   ├── discussion.controller.js
│   │   │   ├── codex.controller.js
│   │   │   ├── portfolio.controller.js
│   │   │   ├── hackathon.controller.js
│   │   │   ├── squad.controller.js
│   │   │   ├── conversation.controller.js
│   │   │   ├── message.controller.js
│   │   │   ├── leaderboard.controller.js
│   │   │   └── upload.controller.js
│   │   ├── middleware/            # Security, auth, error & validation middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── models/                # Mongoose models & schemas
│   │   │   ├── User.model.js
│   │   │   ├── Project.model.js
│   │   │   ├── Community.model.js
│   │   │   ├── Discussion.model.js
│   │   │   ├── CodexEntry.model.js
│   │   │   ├── Portfolio.model.js
│   │   │   ├── Hackathon.model.js
│   │   │   ├── SquadRequest.model.js
│   │   │   ├── Conversation.model.js
│   │   │   ├── Message.model.js
│   │   │   ├── Activity.model.js
│   │   │   └── Bookmark.model.js
│   │   ├── routes/                # Express REST endpoint declarations
│   │   ├── utils/                 # Token generator, slugifier, async handler
│   │   └── tests/                 # Automated unit tests
│   └── uploads/                   # Local file upload directory
└── client/
    ├── package.json               # Frontend dependencies & scripts
    ├── vite.config.js             # Vite configuration with proxy to :5000
    ├── index.html                 # HTML entry point with metadata
    ├── src/
    │   ├── main.jsx               # React bootstrap with providers
    │   ├── App.jsx                # Main route definitions
    │   ├── context/               # Auth, Toast, and Theme contexts
    │   ├── services/api.js        # Normalized Fetch API client
    │   ├── styles/index.css       # DevVerse design system stylesheet
    │   ├── components/
    │   │   ├── layout/            # Navbar, Sidebar, Footer, AppLayout
    │   │   └── common/            # ProtectedRoute, Spinner, Modal, Pagination, SearchBar
    │   └── pages/                 # Full-feature page views
    │       ├── auth/              # Login & Registration
    │       ├── projects/          # Explore, Detail, Create, Edit
    │       ├── communities/       # Communities, CommunityDetail, Discussions
    │       ├── codex/             # Codex List, Article, Write, Edit
    │       ├── portfolio/         # Portfolio Builder & Public Portfolio
    │       ├── hackathons/        # Hackathons Hub, Detail, Create
    │       ├── squads/            # Squad Finder & Teammate Requests
    │       ├── messages/          # Inbox & Conversation Room
    │       ├── leaderboard/       # Developer XP Leaderboard
    │       ├── profile/           # Developer Profile & Activity
    │       ├── settings/          # Profile, Password, Appearance
    │       ├── bookmarks/         # Saved Projects & Codex Entries
    │       ├── DashboardPage.jsx  # Authenticated builder overview
    │       ├── LandingPage.jsx    # Public showcase landing page
    │       └── NotFoundPage.jsx   # 404 terminal fallback
```

---

## 4. Environment Variables

### Backend Configuration (`mern-app/server/.env`)

```ini
# Environment
NODE_ENV=development
PORT=5000

# MongoDB URI (Supports Local MongoDB or Atlas Connection String)
MONGODB_URI=mongodb://localhost:27017/devverse

# Authentication
JWT_SECRET=devverse-super-secure-jwt-secret-key-replace-in-production
JWT_EXPIRE=7d

# Allowed Frontend URL for CORS
CLIENT_URL=http://localhost:5173

# Uploads directory
UPLOAD_DIR=uploads
```

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** running locally on port 27017 or a valid MongoDB Atlas connection URI

### Step 1: Install Dependencies

From the `mern-app/` root directory:
```bash
npm run install-all
```
*(Alternatively, run `npm install` inside `server/` and `client/` individually).*

### Step 2: Seed the Database (Optional but Recommended)

To populate sample developers, projects, communities, discussions, codex articles, and hackathons:
```bash
npm run seed
```

**Seeded Demo Accounts**:
| Role | Email | Password | Username |
|------|-------|----------|----------|
| Senior Fullstack | `alex@devverse.local` | `password123` | `alexrivers` |
| Systems Engineer | `sarah@devverse.local` | `password123` | `sarahchen` |
| AI / ML Builder | `marcus@devverse.local` | `password123` | `marcusvance` |

### Step 3: Run the Application

To start both Backend and Frontend concurrently:
```bash
npm run dev
```

Or run them in separate terminals:
- **Backend API**: `cd server && npm run dev` (Available on `http://localhost:5000`)
- **Frontend SPA**: `cd client && npm run dev` (Available on `http://localhost:5173`)

### Step 4: Run Tests

Run the built-in Node.js test runner suite:
```bash
npm test
```

---

## 6. API Route Organization

All endpoints are versioned under `/api/v1`:

| Route Prefix | Description | Auth Required |
|--------------|-------------|---------------|
| `/api/v1/auth` | Register, login, logout, getMe, password update | Public / Cookie Session |
| `/api/v1/users` | Public profile, search, user activity, builder statistics | Public / Protected |
| `/api/v1/projects` | Project discovery, creation, update, delete, like, bookmark | Public / Owner / Protected |
| `/api/v1/communities` | Communities listing, detail, creation, join, leave, members | Public / Member / Owner |
| `/api/v1/discussions` | Community discussions and thread replies | Community Member / Author |
| `/api/v1/codex` | Engineering experiences, debugging logs, technical lessons | Public / Author |
| `/api/v1/portfolios` | Portfolio builder, experience, achievements, public view | Owner / Public |
| `/api/v1/hackathons` | Hackathon hub, registrations, participants, event details | Public / Participant / Organizer |
| `/api/v1/squads` | Squad requests, matchmaking by skills, accepted connections | Protected |
| `/api/v1/conversations` | User direct chat rooms | Conversation Participant |
| `/api/v1/messages` | Messages inside conversations | Conversation Participant |
| `/api/v1/leaderboard` | Top builders ranked by deterministic activity scoring | Public / Admin |
| `/api/v1/uploads` | Profile avatars & project images | Protected |
| `/api/health` | Server and database health check | Public |

---

## 7. Security Design & Hardening

1. **HttpOnly Cookie Authentication**:
   - Authentication tokens are never stored in `localStorage` to eliminate XSS token theft.
   - Set with `httpOnly: true`, `sameSite: lax` (or `none` in HTTPS production), and `secure` in production.
2. **Authoritative Backend Authorization**:
   - Client UI states (e.g., hiding edit/delete buttons) are strictly user conveniences.
   - Every mutation checks server-side resource ownership (`req.user._id === resource.owner`).
3. **NoSQL Injection & Sanitization**:
   - `express-mongo-sanitize` strips `$` and `.` operators from client query parameters and request bodies.
   - IDs are strictly validated with `validateObjectId` before reaching queries.
4. **Rate Limiting & DoS Protection**:
   - Global rate limiter on `/api`: 200 requests / 15 minutes.
   - Stricter rate limiter on `/api/v1/auth`: 20 attempts / 15 minutes.
   - Request body limit capped at 10MB.
5. **Content Security & Defense**:
   - `helmet` sets HTTP security headers (X-Frame-Options, DNS prefetch, HSTS, X-Content-Type-Options).
   - Passwords hashed using bcrypt with salt rounds = 12.
   - Passwords and internal versions (`__v`) stripped from user projections.

---

## 8. Deployment Requirements & Production Notes

- **Static Frontend Hosting**: The React frontend can be built via `npm run build` and hosted on Vercel, Netlify, or any CDN static host.
- **Backend Service**: Requires a Node.js runtime environment (e.g. Render, Railway, AWS ECS, DigitalOcean App Platform).
- **Database**: Production deployment requires a managed MongoDB Atlas database cluster with IP access allowlisting.
- **Environment Flags**: In production, ensure `NODE_ENV=production` is set so that cookies enforce `Secure: true`.
- **CORS Configuration**: Set `CLIENT_URL` to the exact production domain of the React frontend.
