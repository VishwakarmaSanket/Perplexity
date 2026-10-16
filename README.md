# 🔍 Perplexity Clone — Full-Stack AI Chat Application

> A production-grade, full-stack AI chat application inspired by Perplexity AI — featuring real-time conversations, web-augmented responses (RAG), AI image generation, JWT-based authentication, and a clean light-mode UI.

---

## Project overview

Perplexity Clone is a full-stack AI chat application built to explore conversational UX, persistence, authentication, search-augmented generation, and image generation in one project. It combines a React dashboard with an Express API, MongoDB models, Google's Gemini API, Tavily search, and a browser-based chat history experience.

**Developer documentation:** [Open the Technical Reference](docs/TECHNICAL_REFERENCE.md) for the source-level architecture, all registered API routes, request/response behavior, model fields, failure paths, frontend state flows, deployment configuration, and known implementation risks.

### At a glance

| Area | Implementation |
|---|---|
| Frontend | React, Vite, React Router, Redux Toolkit, Axios, SCSS and Tailwind CSS |
| Backend | Node.js ES modules, Express 5, Mongoose/MongoDB |
| Authentication | bcryptjs password hashing, JWT in an httpOnly cookie, email-verification path |
| Text generation | Google GenAI SDK; active text model constant is gemini-3.8-flash |
| Search augmentation | Tavily advanced search; up to five results inserted into the AI system instruction |
| Image generation | Gemini image model first, then LoremFlickr/Picsum fallback |
| Client state | Redux Toolkit; selected chat ID is also stored in Local Storage |
| Realtime transport | Socket.IO connection lifecycle only; AI responses currently use REST |
| Hosting assumptions | Frontend and backend are separately runnable/deployable |

> **Implementation scope:** “RAG” here means fetching search results and adding them to the Gemini prompt. The current repository does not implement embeddings, a vector database, a document-ingestion pipeline, or structured source citations. Socket.IO is connected but is not used to stream generated tokens.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [How the main flows work](#how-the-main-flows-work)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Build and deployment](#build-and-deployment)
- [Current implementation notes](#current-implementation-notes)
- [Detailed documentation](#detailed-documentation)

## Features

### Authentication and account lifecycle

- Register with username, email and password.
- Validate registration and login fields with express-validator.
- Hash passwords with bcryptjs before save.
- Log in using an httpOnly JWT cookie.
- Restore the logged-in user when the frontend starts.
- Production registration sends a verification link through Nodemailer/Gmail OAuth2.
- Non-production registration marks accounts verified automatically.
- Logout clears the cookie and resets client auth/chat state.

### Conversational chat

- Start a new conversation; Gemini generates a short title.
- Continue a conversation using stored message history.
- Save user prompts and AI answers in MongoDB.
- List the authenticated user's conversations.
- Load message history for a selected conversation.
- Search chat titles locally in the sidebar.
- Delete conversations and individual messages.

### Web-search mode

- Toggle search mode from the composer.
- The backend queries Tavily for up to five advanced search results.
- Search results are serialized and injected into Gemini's system instruction.
- If Tavily fails, the service continues to Gemini with a note that search was unavailable.

This is a search-augmented generation flow; the schema does not persist citations as structured source records.

### Image generation

- Switch the composer into image-prompt mode.
- The backend attempts Gemini image generation first.
- If Gemini fails or returns no image bytes, the service tries LoremFlickr and then Picsum Photos.
- The resulting file is written under the backend public/images directory and represented in chat as a Markdown image link.

The fallback providers return remote images and cannot guarantee that an image matches the prompt.

### Interface and productivity

- Light/dark dashboard theme.
- Collapsible sidebar with chat history.
- Markdown rendering for AI responses, including GitHub-Flavored Markdown.
- Syntax highlighting for fenced code blocks.
- Password visibility toggles on the authentication forms.
- Redux loading/error state and visible error messages.
- Responsive styling for smaller screens.

## Architecture

```mermaid
flowchart LR
    Browser[React + Redux UI] -->|Axios REST with cookies| Express[Express backend]
    Browser <-->|Connection/disconnection only| Socket[Socket.IO]
    Express --> Auth[Auth routes/controllers]
    Express --> Chat[Chat routes/controllers]
    Auth --> Users[(MongoDB Users)]
    Chat --> Chats[(MongoDB Chats)]
    Chat --> Messages[(MongoDB Messages)]
    Chat --> AI[AI service]
    AI --> Gemini[Google Gemini]
    AI --> Tavily[Tavily search]
    Chat --> Images[Image service]
    Images --> ImageModel[Gemini image model]
    Images --> Fallback[LoremFlickr / Picsum]
    Images --> Disk[Backend public/images]
    Express --> Static[/public static mount]
    Disk --> Static
    Auth --> Email[Nodemailer / Gmail OAuth2]
```

### Text prompt lifecycle

1. Dashboard calls the useChat hook.
2. Axios posts to /api/chats/message with the prompt, optional chat ID and webSearch flag.
3. authUser validates the token cookie.
4. For a new conversation, the backend asks Gemini to create a short title and inserts a Chat document.
5. It saves the user Message, reads conversation messages, optionally requests Tavily results, and calls Gemini.
6. The AI Message is saved with parentMessage pointing to the user prompt.
7. The controller returns title, chat and aiMessage.
8. The frontend updates Redux and renders the response.

There is no transaction around the multi-step write sequence, so a later failure can leave a partially persisted conversation.

## Technology stack

### Backend

| Technology | Role |
|---|---|
| Node.js ES modules | Runtime/module system |
| Express 5 | Middleware and REST routing |
| MongoDB + Mongoose | User, chat and message persistence |
| JWT + bcryptjs | Authentication token and password hashing |
| cookie-parser | Read the token cookie |
| express-validator | Registration/login validation |
| Google GenAI SDK | Gemini text/title/image requests |
| Tavily SDK | Search results |
| Nodemailer | Email-verification transport |
| Socket.IO | Connection lifecycle |
| Morgan | HTTP request logs |
| dotenv | Environment configuration |

### Frontend

| Technology | Role |
|---|---|
| React | UI components |
| Vite | Development server and production build |
| React Router | Login/register/protected dashboard routes |
| Redux Toolkit + React Redux | Auth and chat state |
| Axios | REST client with credentials |
| Socket.IO Client | Connection lifecycle logging |
| React Markdown + remark-gfm | AI response rendering |
| react-syntax-highlighter | Code blocks |
| Lucide React | UI icons |
| Sass/SCSS + Tailwind CSS | Styling |

Exact version ranges are declared in the package manifests.

## Project structure

```text
Perplexity/
├── Backend/
│   ├── server.js
│   ├── package.json
│   ├── seed.js
│   ├── public/images/                 # Existing/generated images
│   └── src/
│       ├── app.js                      # Express setup and route mounts
│       ├── config/database.js           # Mongoose connection
│       ├── routes/
│       │   ├── auth.route.js
│       │   └── chats.route.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   └── chat.controller.js
│       ├── middlewares/auth.middleware.js
│       ├── validators/auth.validator.js
│       ├── models/
│       │   ├── user.model.js
│       │   ├── chat.model.js
│       │   └── message.model.js
│       ├── services/
│       │   ├── ai.service.js
│       │   ├── internet.service.js
│       │   ├── image.service.js
│       │   └── mail.service.js
│       └── sockets/server.socket.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/assets/
│   └── src/
│       ├── main.jsx
│       ├── api.js
│       ├── app/
│       │   ├── App.jsx
│       │   ├── app.routes.jsx
│       │   ├── app.store.js
│       │   └── index.css
│       └── features/
│           ├── auth/
│           └── chats/
└── docs/
    └── TECHNICAL_REFERENCE.md
```

## Getting started

### Prerequisites

- Node.js compatible with the Vite version declared in frontend/package.json.
- npm.
- A reachable MongoDB database.
- Google GenAI API key for text and image generation.
- Tavily API key for search mode.
- Gmail OAuth2 credentials to test production-mode email verification.

### 1. Install backend dependencies

```bash
cd Backend
npm install
```

### 2. Configure the backend

Create Backend/.env locally. Do not commit it. Fill the variables listed in Environment configuration below.

For the checked-in Vite proxy setup, set PORT=3000. The backend defaults to 8000 when PORT is omitted, but the frontend proxy targets localhost:3000.

### 3. Start the backend

```bash
cd Backend
npm run dev
```

This runs npx nodemon server.js. Nodemon is invoked by the script but is not declared as a direct dependency in the current backend package manifest.

### 4. Install and start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite server is configured for port 5173 and proxies /api, /public and /socket.io requests to localhost:3000.

### 5. Verify the frontend build

```bash
cd frontend
npm run lint
npm run build
npm run preview
```

The backend package's test script is currently a placeholder that exits with an error.

## Environment configuration

Use placeholder values in documentation and real values only in local environment/provider settings.

| Variable | Purpose | Required when |
|---|---|---|
| PORT | Backend HTTP port; defaults to 8000 | Optional; use 3000 for the checked-in local proxy |
| NODE_ENV | Selects auto-verification or email verification | Set to production to exercise email verification |
| MONGODB_URI | MongoDB connection string | Persistent backend operation |
| JWT_SECRET | Signs/verifies session and verification JWTs | Auth endpoints |
| GEMINI_API_KEY | Google GenAI access | AI features |
| TAVILY_API_KEY | Tavily access | Search mode |
| PUBLIC_API_URL | Public backend origin used in verification links | Production email verification |
| GOOGLE_USER | Gmail account/sender identity | Email delivery |
| GOOGLE_CLIENT_ID | Gmail OAuth2 client ID | Email delivery |
| GOOGLE_CLIENT_SECRET | Gmail OAuth2 client secret | Email delivery |
| GOOGLE_REFRESH_TOKEN | Gmail OAuth2 refresh token | Email delivery |
| VITE_API_URL | Backend origin for browser API/socket calls | Optional locally with Vite proxy; used when frontend calls a separately hosted API |

The tracked frontend/.env includes VITE_API_URL; its value is intentionally not reproduced. Variables prefixed with VITE_ are exposed to frontend code and must not contain secrets.

## How the main flows work

### Authentication

Registration is backend-validated. The User model hashes passwords before save. Non-production accounts are auto-verified; production accounts require the verification link. Login issues an httpOnly cookie. App calls get-me during startup to restore the session, while Protected waits until the lookup completes before rendering the dashboard or redirecting to login.

### Chat

A new prompt starts a Chat when the client does not have a valid selected chat ID. Gemini generates a title. User and AI messages are stored separately, and each AI message references its source prompt through parentMessage. The frontend loads full message history when a chat is selected. No pagination or context-window truncation is implemented.

### Search-augmented responses

The last user prompt is sent to Tavily for up to five advanced results. The result object is serialized and placed into Gemini's system instruction. Search failures are caught; Gemini can still answer with a search-failed note. Source URLs are not stored as structured citations in the Message schema.

### Image generation

Gemini image generation is attempted first. If it fails or returns no image bytes, the service tries LoremFlickr and then Picsum. Bytes are written under the backend public directory and the message stores a Markdown image URL. Fallback images may not match the prompt.

### Socket.IO

The client opens a socket and logs connection/disconnection; the server logs socket IDs. No AI chunk events are registered. Chat responses arrive through REST after generation completes.

## API overview

Complete contracts—including inputs, status codes, response examples, side effects and error paths—are in the [Technical Reference](docs/TECHNICAL_REFERENCE.md#4-http-api-reference).

| Method | Route | Purpose |
|---|---|---|
| GET | / | Server-running JSON |
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Authenticate and set cookie |
| GET | /api/auth/get-me | Read current user; cookie required |
| GET | /api/auth/verify-email?token=... | Verify account |
| POST | /api/auth/logout | Clear cookie |
| POST | /api/chats/message | Generate/persist a text response; cookie required |
| POST | /api/chats/generate-image | Generate/persist image response; cookie required |
| GET | /api/chats | List chats owned by current user |
| GET | /api/chats/:chatID/messages | Get messages from an owned chat |
| DELETE | /api/chats/:chatID | Delete chat and associated messages |
| DELETE | /api/chats/:chatID/messages/:messageID | Delete message and relevant child AI response |

Static files are served under /public. No application message events are currently implemented over Socket.IO.

## Data model

| Model | Core fields | Relationship |
|---|---|---|
| User | username, email, password hash, verified, timestamps | Owns Chats |
| Chat | user, title, timestamps | Contains Messages |
| Message | chat, content, role, parentMessage, timestamps | AI reply can reference its user prompt |

The User schema declares unique username and email. Message role is restricted to user and ai. Detailed field types, required flags, defaults and lifecycle behavior are in [Data models and relationships](docs/TECHNICAL_REFERENCE.md#8-data-models-and-relationships).

## Build and deployment

The frontend and backend are separate applications and require separate configuration and deployment.

- Frontend build: run npm run build under frontend.
- Backend development: run npm run dev under Backend.
- Align PORT with the Vite proxy target before local testing.
- Image storage is local filesystem output. Platforms with ephemeral filesystems may not retain generated files after restart or redeploy.
- For hosted frontend/backend pairs, align VITE_API_URL, Express CORS, Socket.IO CORS, HTTPS cookie attributes and PUBLIC_API_URL.

This README does not claim a successful production deployment or end-to-end test.

## Current implementation notes

These are source-based observations, not confirmed production incidents:

- Existing chat IDs supplied to text/image generation are not verified against the current user before new messages are inserted.
- Chat deletion removes messages before checking whether the requested chat belongs to the user.
- JWT signing does not set explicit expiry, although the cookie's max age is seven days.
- MongoDB connection is not awaited before the HTTP listener starts.
- Logout's cookie-clearing options do not mirror the HTTPS login branch.
- Socket.IO is not used for AI streaming; the current getIO helper also has a module-variable shadowing defect.
- Full message history is loaded without pagination or explicit sorting and is sent on every generation call.
- No backend rate limiter or automated integration test suite is configured.
- Backend/seed.js deletes the known test account test@example.com before recreating it; run that script only intentionally.

## Detailed documentation

- **[Technical Reference](docs/TECHNICAL_REFERENCE.md)** — source-level architecture, all endpoint contracts, middleware, authentication, chat/image flows, database models, Redux behavior, Socket.IO, configuration, known risks and troubleshooting.
- [Backend startup](Backend/server.js)
- [Express configuration](Backend/src/app.js)
- [Chat controller](Backend/src/controllers/chat.controller.js)
- [AI service](Backend/src/services/ai.service.js)
- [Frontend dashboard](frontend/src/features/chats/pages/Dashboard.jsx)
- [Chat Redux slice](frontend/src/features/chats/chat.slice.js)

## License

The previous README mentions MIT, but no LICENSE file was present in the inspected repository tree. Add a LICENSE file if you want the repository to formally grant reuse and redistribution permissions.
