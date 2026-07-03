# 🔍 Perplexity Clone — Full-Stack AI Chat Application

> A production-grade, full-stack AI chat application inspired by Perplexity AI — featuring real-time conversations, web-augmented responses (RAG), AI image generation, JWT-based authentication, and a clean light-mode UI.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Project Structure](#-project-structure)
5. [Features](#-features)
6. [Database Design](#-database-design)
7. [API Reference](#-api-reference)
8. [Authentication Flow](#-authentication-flow)
9. [AI & RAG Pipeline](#-ai--rag-pipeline)
10. [Real-time with Socket.io](#-real-time-with-socketio)
11. [State Management](#-state-management)
12. [Environment Variables](#-environment-variables)
13. [Getting Started](#-getting-started)
14. [Interview Q&A — Deep Dive](#-interview-qa--deep-dive)

---

## 🚀 Project Overview

**Perplexity Clone** is a full-stack AI chat application that mimics the core functionality of Perplexity AI. Users can:

- Register / log in securely with JWT cookie-based auth
- Start new conversations or continue existing ones
- Ask questions and receive Gemini 2.5 Flash AI responses
- Toggle **web search mode** to ground answers in real-time internet data (RAG)
- Request **AI-generated images** from text prompts
- Switch between **Light** and **Dark** themes
- View, search, and manage their full chat history from a sidebar

---

## 🛠 Tech Stack

### Backend

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | **Node.js** (ESM modules) | Server-side JavaScript |
| Framework | **Express.js v5** | REST API routing |
| Database | **MongoDB Atlas** + **Mongoose** | Persistent chat/user storage |
| Auth | **JWT** + **bcryptjs** + **cookie-parser** | Secure stateless auth |
| AI | **Google Gemini 2.5 Flash** | LLM chat + title generation |
| Image AI | **Imagen 3** + fallback CDN | AI image generation |
| Web Search | **Tavily API** | Real-time internet search |
| Real-time | **Socket.io** | WebSocket connections |
| Email | **Nodemailer** + **Gmail OAuth2** | Email verification (production) |
| Validation | **express-validator** | Input validation |
| Logging | **Morgan** | HTTP request logging |
| Dev | **Nodemon** | Auto-restart on file changes |

### Frontend

| Layer | Technology | Purpose |
|---|---|---|
| Framework | **React 18** + **Vite** | Component-based SPA |
| State | **Redux Toolkit** | Global app state |
| Routing | **React Router v6** | Client-side navigation |
| HTTP | **Axios** | API calls with credentials |
| Real-time | **Socket.io Client** | WebSocket communication |
| Styling | **SCSS** | Component-scoped styles |
| Markdown | **react-markdown** | Render AI responses |
| Icons | **Lucide React** | UI icons |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  React + Redux + React Router + Axios + Socket.io-client    │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTP (REST) + WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND  (Port 3000)                     │
│                                                             │
│   Express.js App                                            │
│   ├── /api/auth  ──► Auth Controller  ──► MongoDB (Users)   │
│   └── /api/chats ──► Chat Controller  ──► MongoDB (Chats,   │
│                                           Messages)         │
│                                                             │
│   Socket.io Server  ←──► Client WebSocket                  │
│                                                             │
│   Services:                                                 │
│   ├── ai.service.js       → Gemini 2.5 Flash (LLM)         │
│   ├── internet.service.js → Tavily (Web Search)             │
│   ├── image.service.js    → Imagen 3 + Fallback CDN         │
│   └── mail.service.js     → Gmail OAuth2 (Production)       │
└─────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        MongoDB Atlas    Gemini API    Tavily API
```

### Request Flow — Chat Message

```
User types message
       │
       ▼
React component (Dashboard.jsx)
       │  calls
       ▼
useChat hook → sendMessage() → POST /api/chats/message
       │
       ▼
Express → authUser middleware (validate JWT cookie)
       │
       ▼
Chat Controller:
  1. No chatID?  → generate title via Gemini
  2. Save user message to MongoDB
  3. Fetch ALL messages in conversation (history)
  4. webSearch ON? → Tavily search → inject into system prompt
  5. Call Gemini 2.5 Flash with full history
  6. Save AI response to MongoDB
  7. Return { title, chat, aiMessage } to client
       │
       ▼
Redux state updated → UI re-renders with new message
```

---

## 📁 Project Structure

```
Perplexity/
├── Backend/
│   ├── .env
│   ├── server.js                    # Entry — HTTP + Socket.io server
│   └── src/
│       ├── app.js                   # Express setup (CORS, middleware, routes)
│       ├── config/database.js       # Mongoose connection
│       ├── controllers/
│       │   ├── auth.controller.js   # register, login, getMe, verifyEmail
│       │   └── chat.controller.js   # sendMessage, generateImage, CRUD
│       ├── middlewares/
│       │   └── auth.middleware.js   # JWT cookie verification
│       ├── models/
│       │   ├── user.model.js        # User schema + bcrypt hooks
│       │   ├── chat.model.js        # Chat schema
│       │   └── message.model.js     # Message schema
│       ├── routes/
│       │   ├── auth.route.js        # Auth endpoints
│       │   └── chats.route.js       # Chat endpoints
│       ├── services/
│       │   ├── ai.service.js        # Gemini LLM + RAG logic
│       │   ├── image.service.js     # Imagen 3 + fallback CDN
│       │   ├── internet.service.js  # Tavily web search
│       │   └── mail.service.js      # Nodemailer Gmail OAuth2
│       ├── sockets/
│       │   └── server.socket.js     # Socket.io init + handlers
│       └── validators/
│           └── auth.validator.js    # express-validator rules
│
└── frontend/
    └── src/
        ├── main.jsx                 # Redux Provider + BrowserRouter
        ├── app/
        │   ├── App.jsx              # Root — calls getMe on mount
        │   ├── app.routes.jsx       # Routes + Protected guard
        │   ├── app.store.js         # Redux store config
        │   └── index.css            # Global styles
        └── features/
            ├── auth/
            │   ├── auth.slice.js          # Redux: user, loading, error
            │   ├── components/Protected.jsx
            │   ├── hooks/useAuth.js        # handleLogin/Register/GetMe
            │   ├── pages/Login.jsx
            │   ├── pages/Register.jsx
            │   ├── services/auth.api.js    # Axios auth calls
            │   └── styles/login.scss / register.scss
            └── chats/
                ├── chat.slice.js           # Redux: chats map, currentChatId
                ├── hooks/useChat.jsx        # All chat business logic
                ├── pages/Dashboard.jsx      # Main chat UI
                ├── services/chat.api.js     # Axios chat calls
                ├── services/chat.socket.js  # Socket.io client
                └── styles/dashboard.scss
```

---

## ✨ Features

### 🔐 Authentication

- **Register** — username + email + password; validated with `express-validator`
- **Login** — returns JWT stored in `httpOnly` cookie (7-day expiry)
- **Email Verification** — production only (Gmail OAuth2); dev mode auto-verifies
- **Protected Routes** — `Protected.jsx` redirects unauthenticated users to `/login`
- **Session Restore** — `App.jsx` calls `GET /api/auth/get-me` on startup to restore session

### 💬 Chat

- **New Chat** — auto-generates a 2-3 word title using Gemini
- **Conversation History** — full message history sent to Gemini (multi-turn context)
- **Web Search (RAG)** — toggle to ground AI answers in live Tavily search results
- **Image Generation** — Imagen 3 with multi-tier fallback (LoremFlickr → Picsum)
- **Delete Chat** — removes chat + all associated messages
- **Delete Message** — removes user message + AI response (cascade via parentMessage)
- **Search History** — filter sidebar chats by title in real time

### 🎨 UI/UX

- **Light / Dark theme** toggle (defaults to light)
- **Collapsible sidebar** with full chat history
- **Markdown rendering** — bold, code blocks, lists, headers in AI responses
- **Micro-animations** — fade-in cards, slide-in alerts, loading spinners

---

## 🗄 Database Design

### User

```js
{
  _id: ObjectId,
  username: String,   // unique, 3-30 chars, alphanumeric+underscore
  email:    String,   // unique, lowercase
  password: String,   // bcrypt hash (10 rounds)
  verified: Boolean,  // default: false  (dev: auto true)
  createdAt, updatedAt
}
// pre('save') hook: bcrypt.hash(password, 10)
// method: comparePassword(candidate) → bcrypt.compare
```

### Chat

```js
{
  _id:   ObjectId,
  user:  ObjectId,  // ref: 'User'
  title: String,    // AI-generated, default: 'New Chat'
  createdAt, updatedAt
}
```

### Message

```js
{
  _id:           ObjectId,
  chat:          ObjectId,  // ref: 'Chat'
  content:       String,    // text or markdown image
  role:          String,    // enum: ['user', 'ai']
  parentMessage: ObjectId,  // ref: 'Message' — AI points to its user message
  createdAt, updatedAt
}
```

**Relationships:**
```
User  ──(1:N)──►  Chat  ──(1:N)──►  Message
                                       └─ parentMessage ──► Message (AI → User msg)
```

---

## 📡 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | ❌ | `{username, email, password}` | Create account |
| POST | `/login` | ❌ | `{email, password}` | Login — sets cookie |
| GET | `/get-me` | ✅ | — | Get session user |
| GET | `/verify-email?token=` | ❌ | — | Email verification |

**POST /register — 201 Response:**
```json
{
  "message": "Account created successfully",
  "success": true,
  "user": { "id": "64abc...", "username": "sanket", "email": "...", "verified": true }
}
```

**POST /login — Sets cookie + 200 Response:**
```json
{ "message": "Login successful", "success": true, "user": { ... } }
```
> `Set-Cookie: token=<JWT>; HttpOnly; SameSite=Lax; Max-Age=604800`

### Chats — `/api/chats` *(all require auth cookie)*

| Method | Endpoint | Body / Params | Description |
|--------|----------|---------------|-------------|
| POST | `/message` | `{message, chatID?, webSearch?}` | Send message → AI response |
| POST | `/generate-image` | `{prompt, chatID?}` | Generate image |
| GET | `/` | — | Get all user chats |
| GET | `/:chatID/messages` | — | Get chat messages |
| DELETE | `/:chatID` | — | Delete chat + messages |
| DELETE | `/:chatID/messages/:messageID` | — | Delete single message |

**POST /message — 201 Response:**
```json
{
  "title": "React Hooks Guide",
  "chat": { "_id": "...", "title": "...", "user": "..." },
  "aiMessage": { "content": "Here is everything about hooks...", "role": "ai" }
}
```

---

## 🔑 Authentication Flow

```
REGISTER:
  Client ──POST /register──► Express ──create user──► MongoDB
                             ◄── 201 { user }  (dev: verified=true, no email)

LOGIN:
  Client ──POST /login──► Express ──findOne + comparePassword──► MongoDB
                          ◄── 200 + Set-Cookie: token=<JWT; httpOnly; SameSite=Lax>

PROTECTED REQUEST:
  Client ──GET /api/chats [Cookie: token]──► authUser middleware
             jwt.verify(token, JWT_SECRET) → req.user = { id, username }
             ──► Controller ──► MongoDB ──► 200 { data }
```

**Why httpOnly cookies over localStorage?**

| Concern | localStorage | httpOnly Cookie |
|---|---|---|
| XSS Attack | ❌ Vulnerable — JS can read it | ✅ Safe — JS cannot access it |
| CSRF Attack | ✅ Not auto-sent | ⚠️ Mitigated by `SameSite=Lax` |
| Manual header needed | ✅ Yes | ❌ Browser handles it |

---

## 🤖 AI & RAG Pipeline

### Standard Chat

```
User message
    │
    ▼
All messages → Gemini format: [{role:"user"|"model", parts:[{text}]}]
    │
    ▼
System: "You are a helpful and concise AI assistant."
    │
    ▼
gemini-2.5-flash.generateContent(contents, config)
    │
    ▼
response.text → saved to DB → returned to client
```

### Web Search Mode (RAG)

```
User message (webSearch=true)
    │
    ▼
Extract last user message as query
    │
    ▼
Tavily.search(query, { maxResults:5, searchDepth:"advanced" })
    │
    ▼
Inject into system prompt:
  "Here are real-time search results: <JSON>
   Answer factually using these results."
    │
    ▼
Gemini responds with grounded, up-to-date answer
```

> **What is RAG?** Retrieval-Augmented Generation retrieves external data *before* generating a response. This overcomes the LLM's training cutoff and prevents hallucination by grounding answers in real facts.

### Image Generation (3-tier Fallback)

```
Imagen 3 (imagen-3.0-generate-002)
    │ fails / quota
    ▼
LoremFlickr — keyword-matched CDN photos
    │ fails / returns placeholder (size=126099 or URL contains "defaultImage")
    ▼
Picsum Photos — random quality photos
    │
    ▼
Saved to /public/images/<uuid>.png → URL returned to client
```

---

## ⚡ Real-time with Socket.io

Express and Socket.io share **one HTTP server**:

```js
const httpServer = http.createServer(app);  // Same server
initSocket(httpServer);                      // Socket.io attaches here
httpServer.listen(3000);
```

Current use: connection tracking. Architected to extend with **streaming AI responses** — Gemini's streaming API returns an async iterable; each token chunk can be emitted via `socket.emit('chunk', token)` for a ChatGPT-style typing effect.

---

## 🗃 State Management — Redux Toolkit

### `auth` slice

```js
{ user: null, loading: true, error: null }
// loading starts true — prevents flash-redirect before getMe resolves
```

### `chat` slice

```js
{
  chats: { "<id>": { id, title, messages:[], lastUpdated } },
  currentChatId: null,
  isLoading: false,
  error: null
}
```

**Key design decision — normalized `chats` map (object keyed by ID) vs array:**
- O(1) lookup by chatID instead of O(n) `find()`
- Easy to update a single chat without spreading entire array
- Same pattern used by Redux best practices (entity adapters)

---

## 🌐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development        # anything != "production" enables dev mode

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/

# Auth
JWT_SECRET=<64-char-hex>

# AI
GEMINI_API_KEY=<from-aistudio.google.com>

# Web Search
TAVILY_API_KEY=<from-tavily.com>

# Email (production only)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_USER=you@gmail.com
```

> **Dev Mode:** `NODE_ENV !== "production"` → users auto-verified on register → no email needed.

---

## 🚦 Getting Started

```bash
# 1. Clone
git clone <repo-url>

# 2. Install backend
cd Backend && npm install

# 3. Install frontend
cd ../frontend && npm install

# 4. Configure env
# Copy .env.example to Backend/.env and fill in the values

# 5. Run both servers
# Terminal 1:
cd Backend && npm run dev     # http://localhost:3000

# Terminal 2:
cd frontend && npm run dev    # http://localhost:5173
```

---

## 🎯 Interview Q&A — Deep Dive

---

### 🔐 Authentication & Security

**Q1: Why cookie-based JWT instead of localStorage?**

`localStorage` is accessible by JavaScript, so any XSS attack can steal the token. `httpOnly` cookies are completely invisible to JS — even malicious scripts can't read them. I also use `SameSite=Lax` which blocks the cookie from being sent in cross-origin POST requests initiated by third-party sites (CSRF mitigation). This is the same approach used by production apps like GitHub and Stripe.

---

**Q2: How does the JWT auth middleware work?**

```js
export function authUser(req, res, next) {
  const token = req.cookies.token;          // Read from httpOnly cookie
  if (!token) return res.status(401).json({...});
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;                       // { id, username }
  next();
}
```
Every protected route has `authUser` as middleware. If the token is missing, expired, or tampered, it returns 401.

---

**Q3: How is password security implemented?**

Passwords are hashed with `bcrypt` (10 salt rounds) in a Mongoose `pre('save')` hook — this runs automatically before any user document is saved. For login, `bcrypt.compare()` does a **constant-time comparison** (prevents timing attacks where an attacker could deduce the password length by measuring response time).

---

**Q4: Explain the email verification system.**

**Production flow:**
1. User registers → JWT token signed with `user._id`
2. Token embedded in link → sent via Nodemailer (Gmail OAuth2)
3. User clicks link → `GET /verify-email?token=<JWT>`
4. Server decodes token, sets `user.verified = true`
5. Login now succeeds (checks `user.verified`)

**Dev mode:** `NODE_ENV !== "production"` → user is created with `verified: true` immediately. No email required — makes local development fast.

---

**Q5: What happens if someone tries to register with an existing email?**

1. `express-validator` runs first — validates format, length, etc.
2. Controller does `userModel.findOne({ $or: [{ username }, { email }] })`
3. If found → 400 "A user with that username or email already exists"
4. If MongoDB throws duplicate key error (code 11000) → caught in try-catch → 400 with field name

Two layers of protection: app-level check + DB-level unique index error handling.

---

### 🤖 AI & RAG

**Q6: What is RAG and why implement it?**

RAG = Retrieval-Augmented Generation. LLMs have a training cutoff — they hallucinate about recent events. The pattern:
1. **Retrieve** — Tavily searches the internet for the user's query (top 5 results)
2. **Augment** — inject results into the system prompt as context
3. **Generate** — Gemini produces a factually grounded response

It's like giving the AI a real-time "cheat sheet" from Google before it answers.

---

**Q7: How is conversation context maintained?**

Every `sendMessage` call fetches ALL previous messages for the chat from MongoDB:
```js
const messages = await messageModel.find({ chat: chatID });
```
These are converted to Gemini's multi-turn format:
```js
[{ role: "user", parts: [{ text: "Hello" }] },
 { role: "model", parts: [{ text: "Hi! How can I help?" }] },
 ...]
```
The **entire history** is sent on every request. This enables follow-up questions, pronoun resolution ("it", "that"), and contextual replies.

**Tradeoff:** Context grows with every message → more tokens → higher API cost + latency. Production apps implement sliding window (keep last N messages) or summarization.

---

**Q8: How does chat title generation work?**

When `chatID` is null (new conversation), I call `generateChatTitle(firstMessage)` before anything else:
```
System: "Generate a 2-3 word title. Return only the title."
Input: user's first message
Output: "React Hooks Guide" / "Paris Travel Tips" / "SQL JOIN Types"
```
The title is saved to the Chat document and shown in the sidebar immediately.

---

**Q9: Explain the 3-tier image generation fallback.**

1. **Imagen 3** — best quality, but has API quota limits
2. **LoremFlickr** — keyword-matched CDN photos (free, fast). I parse keywords from the prompt, strip stop words, build URL: `https://loremflickr.com/800/600/cats,space`
3. **Picsum Photos** — random quality images. Used when LoremFlickr fails or returns a default placeholder (detectable: `response.url.includes("defaultImage")` or `buffer.byteLength === 126099`)

The image is always saved locally to `/public/images/<uuid>.png` and served statically.

---

### 🏗 Architecture & Design

**Q10: Why Express v5?**

Express v5 auto-propagates async errors. In v4, an unhandled promise rejection inside a route handler would crash the server silently. In v5, rejected promises are automatically forwarded to the error middleware. This removes the need to wrap every handler in `try/catch` or use wrapAsync utilities.

---

**Q11: Walk me through your CORS setup.**

```js
cors({
  origin: /^http:\/\/localhost(:\d+)?$/,  // any localhost port
  credentials: true,                       // allow cookies
  methods: ["GET", "POST", "PUT", "DELETE"]
})
```

Without `credentials: true`, the browser strips cookies from cross-origin requests. The frontend also needs `withCredentials: true` on Axios. Without both set, login works but the cookie is never sent on subsequent requests → every API call returns 401.

---

**Q12: Why Redux Toolkit over Context API?**

| | Context API | Redux Toolkit |
|---|---|---|
| Re-renders | Full subtree re-renders | Granular with `useSelector` |
| DevTools | ❌ | ✅ Redux DevTools |
| Async logic | Manual | `createAsyncThunk` |
| Normalization | Manual | EntityAdapter |
| Scale | Small apps | Large, complex apps |

Two independent state domains (auth + chat) with cross-cutting concerns (loading, error) made Redux the right call. Context would cause excessive re-renders when the chat map updates.

---

**Q13: How does the parentMessage relationship enable cascade delete?**

Every AI message has:
```js
parentMessage: userMessageId  // ObjectId ref
```
When deleting a user message:
```js
const message = await messageModel.findOneAndDelete({ _id: messageID });
if (message.role === "user") {
  await messageModel.deleteMany({ parentMessage: message._id });
}
```
This finds and deletes the AI response that was generated for that user message. No orphaned AI messages remain in the DB.

---

### 🌐 Real-time & WebSockets

**Q14: Why Socket.io when chat uses REST?**

Architecture choice: `http.createServer(app)` wraps the Express app, and Socket.io attaches to that same server. The current use is connection tracking, but the design supports **streaming AI responses**.

Gemini supports streaming via async iterables. Instead of waiting 8-10 seconds for a full response:
```js
const stream = await ai.models.generateContentStream({...});
for await (const chunk of stream) {
  socket.emit('ai-chunk', chunk.text);  // Send each token in real time
}
socket.emit('ai-done');
```
Frontend renders tokens as they arrive — the ChatGPT typing effect.

---

**Q15: How is the "new chat has no ID" race condition handled?**

Timeline without fix:
1. User sends message — no chatID yet
2. Backend creates chat, returns `chat._id`
3. **Race:** what if user sends another message before Redux updates?

Solution:
1. Backend returns `{ title, chat, aiMessage }`
2. Frontend dispatches `createNewChat({ chatID: chat._id, title })`
3. Frontend dispatches `setCurrentChatId(chat._id)` immediately
4. All subsequent messages use the now-set `currentChatId`

State update is synchronous (Redux reducers are sync) — no race.

---

### 🎨 Frontend Patterns

**Q16: How did you prevent the "flash to login" problem?**

```js
// auth.slice.js
initialState: { user: null, loading: true }  // starts as LOADING
```

```jsx
// Protected.jsx
if (loading) return <Spinner />;    // Block until getMe resolves
if (!user)   return <Navigate />;   // Only redirect after certainty
return children;
```

`App.jsx` calls `handleGetMe()` on mount. Until it resolves, `loading` stays `true` and `Protected` shows a spinner. A logged-in user never sees the redirect flash.

---

**Q17: How does the theme system work without CSS variables?**

The parent `div` gets `className="main-dashboard theme-light"` or `theme-dark`. All child styles use the parent class as a **CSS scope**:

```scss
.theme-light .sidebar { background: #ececf1; }
.theme-dark  .sidebar { background: #171717; }
```

Toggling `isLightMode` state swaps the className → entire dashboard re-themes via cascade. No prop drilling, no CSS variables, no separate stylesheets needed.

---

## 🔧 Known Issues & Roadmap

| Issue | Planned Fix |
|---|---|
| No streaming responses | Gemini streaming + Socket.io `chunk` events |
| No message pagination | `limit/offset` on message queries |
| Images stored locally | S3 / Cloudinary for production |
| No rate limiting | `express-rate-limit` middleware |
| OAuth2 token expires | Service Account / App Password for email |
| No search across messages | Full-text search with MongoDB Atlas Search |

---

## 📄 License

MIT License — free to use for learning and portfolio projects.

---

*Built by Sanket Vishwakarma — Cohort 2.0 Full-Stack Project*
