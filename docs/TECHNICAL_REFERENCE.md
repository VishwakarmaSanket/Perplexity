# Perplexity Clone — Technical Reference

This reference describes the implementation present in the repository's main branch. It traces requests from the React UI through Express controllers, MongoDB models, Gemini/Tavily integrations, static image serving, and Socket.IO. It distinguishes verified source behavior from implementation risks and externally controlled behavior.

## Contents

1. [Scope and architecture](#1-scope-and-architecture)
2. [Repository and execution entry points](#2-repository-and-execution-entry-points)
3. [Configuration and startup](#3-configuration-and-startup)
4. [HTTP API reference](#4-http-api-reference)
5. [Authentication and account lifecycle](#5-authentication-and-account-lifecycle)
6. [Chat and AI request lifecycle](#6-chat-and-ai-request-lifecycle)
7. [Image generation lifecycle](#7-image-generation-lifecycle)
8. [Data models and relationships](#8-data-models-and-relationships)
9. [Frontend state and UI flows](#9-frontend-state-and-ui-flows)
10. [Socket.IO behavior](#10-socketio-behavior)
11. [External services and dependencies](#11-external-services-and-dependencies)
12. [Security and failure observations](#12-security-and-failure-observations)
13. [Operations and troubleshooting](#13-operations-and-troubleshooting)
14. [File-level traceability](#14-file-level-traceability)

## 1. Scope and architecture

### 1.1 Application capabilities

Perplexity is a full-stack conversational AI application. The current code implements registration/login, cookie-based JWT authentication, user-owned chat history, text conversations with Gemini, an optional Tavily-backed web-search context path, image generation with fallback image providers, chat/message deletion, and a React UI with light/dark themes.

The system has two application processes:

- **Backend:** Node.js ES modules, Express 5, Mongoose/MongoDB, provider service modules, and a Socket.IO server attached to the HTTP server.
- **Frontend:** React, Vite, Redux Toolkit, React Router, Axios, SCSS/Tailwind tooling, Markdown rendering, syntax highlighting, and a Socket.IO client.

The repository does **not** currently implement AI token streaming over Socket.IO. The Socket.IO server logs client connection/disconnection only; chat and image operations use REST. The web-search path retrieves Tavily results and inserts serialized results into the Gemini system instruction. It does not use vector embeddings or a vector database.

### 1.2 System architecture

```mermaid
flowchart LR
    Browser[React frontend] -->|REST + cookie| API[Express app]
    Browser <-->|Socket.IO lifecycle| Socket[Socket.IO server]
    API --> Auth[Auth routes/controllers]
    API --> Chat[Chat routes/controllers]
    Auth --> Users[(MongoDB User)]
    Chat --> Chats[(MongoDB Chat)]
    Chat --> Messages[(MongoDB Message)]
    Chat --> AI[AI service]
    AI --> Gemini[Google GenAI]
    AI --> Search[Tavily search]
    Chat --> Image[Image service]
    Image --> GeminiImage[Gemini image model]
    Image --> Fallback[LoremFlickr / Picsum]
    Image --> Disk[public/images]
    API --> Static[Express /public mount]
    Disk --> Static
    Auth --> Mail[Nodemailer Gmail OAuth2]
```

### 1.3 Request classes

| Class | Transport | Authentication | Behavior |
|---|---|---|---|
| Auth REST | HTTP JSON | Register/login/verify/logout are public; get-me requires cookie | Account creation, login, session lookup, verification, logout |
| Chat REST | HTTP JSON | All chat routes use authUser | Text prompt, image generation, chat/message retrieval and deletion |
| Static files | HTTP static mount | No auth middleware | Serves files under backend public directory, including generated images |
| Socket.IO | Socket.IO polling/WebSocket | No socket authentication middleware configured | Connection/disconnection logging only |

### 1.4 Architecture boundaries

- MongoDB stores users, chats and messages.
- Redux holds the current client-side chat map. Only the selected chat ID is persisted in browser Local Storage.
- Axios sends cookies because the shared client enables withCredentials.
- No queue, background worker, cron task, distributed cache, object-storage provider, message pagination, or transaction framework is implemented.
- Provider APIs, email delivery, static file access and browser cookie policies may fail independently.

## 2. Repository and execution entry points

### 2.1 Backend

| Path | Responsibility |
|---|---|
| `Backend/server.js` | Loads dotenv configuration, creates an HTTP server, initializes Socket.IO, starts MongoDB connection and listens |
| `Backend/src/app.js` | Express middleware, CORS, root response, static files and route mounts |
| `Backend/src/config/database.js` | Mongoose connection using MONGODB_URI |
| `Backend/src/routes/auth.route.js` | Auth endpoint registrations |
| `Backend/src/routes/chats.route.js` | Chat endpoint registrations |
| `Backend/src/controllers/auth.controller.js` | Registration, login, profile lookup, verification and logout |
| `Backend/src/controllers/chat.controller.js` | Text/image workflows, chat/message retrieval and deletion |
| `Backend/src/middlewares/auth.middleware.js` | Reads and verifies the token cookie |
| `Backend/src/validators/auth.validator.js` | Registration/login validation |
| `Backend/src/models/user.model.js` | User schema, password hash hook and compare method |
| `Backend/src/models/chat.model.js` | Chat schema |
| `Backend/src/models/message.model.js` | Message schema and parent-message link |
| `Backend/src/services/ai.service.js` | Gemini title/response generation, optional search context and transient retry logic |
| `Backend/src/services/internet.service.js` | Tavily search wrapper |
| `Backend/src/services/image.service.js` | Gemini image generation and remote-image fallbacks |
| `Backend/src/services/mail.service.js` | Nodemailer Gmail OAuth2 transport |
| `Backend/src/sockets/server.socket.js` | Socket.IO setup and connection/disconnection handlers |
| `Backend/seed.js` | Test-user seed/reseed script |
| `Backend/test-oauth.js` | Manual Google refresh-token probe |
| `Backend/test_gemini.js` | Manual Gemini text-generation probe |
| `Backend/test_gemini_history.js` | Manual Gemini history probe |
| `Backend/test_langchain.js` | Manual LangChain Google model probe |
| `Backend/package.json` | Backend dependencies and scripts |
| `Backend/public/images/` | Checked-in image files; generated images are also written here relative to the process working directory |

The test files are utility scripts, not an automated integration suite. Backend's current npm test script prints that no test is specified and exits with status 1.

### 2.2 Frontend

| Path | Responsibility |
|---|---|
| `frontend/src/main.jsx` | Creates React root and Redux Provider |
| `frontend/src/api.js` | Shared Axios client, API base URL, credentials and timeout |
| `frontend/src/app/App.jsx` | Calls get-me on app mount and provides the route tree |
| `frontend/src/app/app.routes.jsx` | Login/register routes and protected dashboard |
| `frontend/src/app/app.store.js` | Combines auth and chat reducers |
| `frontend/src/app/index.css` | Global styling, Tailwind import, focus and animation styles |
| `frontend/src/features/auth/auth.slice.js` | Auth Redux state |
| `frontend/src/features/auth/hooks/useAuth.js` | Registration, login, session restore and logout |
| `frontend/src/features/auth/components/Protected.jsx` | Loading guard and unauthenticated redirect |
| `frontend/src/features/auth/pages/Login.jsx` | Login form |
| `frontend/src/features/auth/pages/Register.jsx` | Registration form |
| `frontend/src/features/auth/services/auth.api.js` | Auth API wrappers |
| `frontend/src/features/auth/styles/` | Authentication SCSS |
| `frontend/src/features/chats/chat.slice.js` | Chat map, selection, messages, loading/error state, selected-chat persistence |
| `frontend/src/features/chats/hooks/useChat.jsx` | Chat API calls and Redux updates |
| `frontend/src/features/chats/pages/Dashboard.jsx` | Main chat UI, sidebar, renderers, theme and request-mode controls |
| `frontend/src/features/chats/services/chat.api.js` | Chat API wrappers |
| `frontend/src/features/chats/services/chat.socket.js` | Socket.IO connection setup and logging |
| `frontend/src/features/chats/styles/dashboard.scss` | Dashboard and responsive styling |
| `frontend/vite.config.js` | Vite port and local proxy configuration |
| `frontend/package.json` | Frontend dependencies and commands |
| `frontend/.env` | Contains VITE_API_URL configuration; the configured value is not reproduced here |

### 2.3 Active versus auxiliary files

The active frontend entry is `frontend/src/main.jsx` → `frontend/src/app/App.jsx`. Test scripts and `Backend/seed.js` are utilities and are not registered as routes. No Backend .env.example file appears in the inspected tree. Configure local environment values without committing secrets.

## 3. Configuration and startup

### 3.1 Backend startup sequence

**Entry point:** `Backend/server.js`.

1. `import "dotenv/config"` loads dotenv configuration.
2. The module imports the Express app, database connector and Socket.IO initializer.
3. `http.createServer(app)` creates one Node HTTP server around Express.
4. `initSocket(httpServer)` attaches Socket.IO.
5. `connectDB()` starts the Mongoose connection attempt using `process.env.MONGODB_URI`. Rejection is caught and logged.
6. The HTTP server immediately calls `listen(process.env.PORT || 8000)`.
7. A successful listener start logs the port.

**Startup observation:** the database connection is not awaited before listening. The HTTP server can accept requests before MongoDB has connected; a failed connection is logged but does not stop the HTTP listener.

### 3.2 Express middleware order

In `Backend/src/app.js`, middleware is registered in this order:

1. `express.json()`
2. `express.urlencoded({ extended: true })`
3. `cookieParser()`
4. `morgan("dev")`
5. CORS middleware with a hard-coded origin allowlist, credentials enabled and explicit methods
6. `GET /` fixed JSON response
7. Static file mount at `/public`
8. Router mount at `/api/auth`
9. Router mount at `/api/chats`

No custom not-found or terminal error middleware is registered after the routers. Controllers with local try/catch return their own error bodies. Uncaught async failures are forwarded by Express 5 to default error handling, which may not return the JSON shape used by controllers.

`app.set("trust proxy", 1)` is configured so Express can interpret the first reverse proxy's protocol headers.

### 3.3 Frontend startup and API client

1. `frontend/src/main.jsx` creates the React root and wraps App in the Redux Provider.
2. The store combines the auth and chat reducers.
3. App mounts and invokes `useAuth().handleGetMe()` in an effect.
4. Protected displays a loading state while auth is loading, then redirects to `/login` if no user exists.
5. After authentication, route `/` renders Dashboard.
6. Dashboard mount starts the Socket.IO client and fetches the user's chat list.
7. The shared Axios client uses `withCredentials: true` and a 60-second timeout.

`frontend/src/api.js` builds the base URL:
- If `VITE_API_URL` is set, one trailing slash is removed and `/api` is appended.
- Otherwise, the relative base `/api` is used and Vite's local proxy handles it.

`frontend/vite.config.js` fixes Vite to port 5173 with `strictPort: true` and proxies `/api`, `/public` and `/socket.io` to `http://localhost:3000`. The socket proxy enables WebSocket forwarding.

**Local port mismatch:** Backend `server.js` defaults to port 8000 while the Vite proxy targets port 3000. Local development therefore needs `PORT=3000` for the backend or a matching proxy change.

### 3.4 Environment variables

The table lists names and purposes only; secret values must not be committed or copied into documentation.

| Variable | Read by | Purpose | Behavior |
|---|---|---|---|
| `PORT` | `Backend/server.js` | HTTP listening port | Optional; defaults to 8000 |
| `NODE_ENV` | `auth.controller.js` | Selects development auto-verification versus production email verification | Any value other than exactly `production` selects auto-verification |
| `MONGODB_URI` | `database.js`, `seed.js` | MongoDB connection string | Required for persistence |
| `JWT_SECRET` | Auth controller and middleware | Signs/verifies auth and verification JWTs | Required for auth routes |
| `GEMINI_API_KEY` | AI/image services and manual probes | Google GenAI access | Required for Gemini generation |
| `TAVILY_API_KEY` | Internet service | Tavily search | Required for actual web-search results |
| `PUBLIC_API_URL` | Registration controller | Public API base used in verification-email link | Optional; falls back to request protocol and host |
| `GOOGLE_CLIENT_ID` | Mail service/test script | Gmail OAuth2 client ID | Required for production mail |
| `GOOGLE_CLIENT_SECRET` | Mail service/test script | Gmail OAuth2 client secret | Required for production mail |
| `GOOGLE_REFRESH_TOKEN` | Mail service/test script | Gmail OAuth2 refresh token | Required for production mail |
| `GOOGLE_USER` | Mail service | Gmail sender/account identity | Required for mail delivery |
| `VITE_API_URL` | Frontend API client and Socket.IO client | Backend origin used outside the relative fallback | Optional in local proxy setup; browser-visible, not a secret |

The tree includes a tracked `frontend/.env` with `VITE_API_URL`; its value is intentionally omitted. Vite-prefixed variables are exposed in frontend code and must never contain private credentials.

### 3.5 Scripts and runtime requirements

Backend:
- `npm run dev` invokes `npx nodemon server.js`.
- There is no dedicated `start` script.
- `npm test` is a placeholder that exits non-zero.

Frontend:
- `npm run dev` starts Vite.
- `npm run build` creates `dist/`.
- `npm run preview` serves the build locally.
- `npm run lint` runs ESLint.

Direct package version ranges are declared separately in Backend/package.json and frontend/package.json; lockfiles contain the resolved dependency trees.



## 4. HTTP API reference

### 4.1 Conventions and route inventory

JSON and URL-encoded bodies are parsed in the Express app. Authenticated routes use `authUser`, which reads a cookie named `token`. There is no shared response-envelope contract: error bodies vary by controller, and default Express errors may not be JSON.

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| GET | `/` | Public | Fixed server-running response |
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Check password, issue JWT cookie |
| GET | `/api/auth/get-me` | Cookie | Fetch current account |
| GET | `/api/auth/verify-email?token=...` | Query token | Verify email and return HTML |
| POST | `/api/auth/logout` | Public | Clear cookie |
| POST | `/api/chats/message` | Cookie | Persist prompt and AI answer |
| POST | `/api/chats/generate-image` | Cookie | Generate/fetch image and persist Markdown image response |
| GET | `/api/chats` | Cookie | List current user's chats |
| GET | `/api/chats/:chatID/messages` | Cookie | Read messages from an owned chat |
| DELETE | `/api/chats/:chatID` | Cookie | Delete a chat and its messages |
| DELETE | `/api/chats/:chatID/messages/:messageID` | Cookie | Delete a message and possibly its child AI response |

`GET /public/*` is also served by Express static middleware and is not an application JSON endpoint.

### 4.2 GET /

**Source:** route in `Backend/src/app.js`.

- Input: no route/query/body input.
- Success: HTTP 200 with `{ "message": "Server is running" }`.
- Errors and side effects: no application-specific failure handling; request logging is the only usual middleware side effect.

### 4.3 POST /api/auth/register

**Source chain:** `auth.route.js` → `registerValidator` → `validate` → `register()` → User model → optional `sendEmail()`.

Request body:

```json
{
  "username": "sanket_dev",
  "email": "sanket@example.com",
  "password": "example-password"
}
```

| Field | Type | Required | Actual rules |
|---|---|---|---|
| username | String | Yes | Trimmed, 3–30 chars, letters/digits/underscore; schema requires, trims and declares unique |
| email | String | Yes | Trimmed, valid email; schema requires, trims, lowercases and declares unique |
| password | String | Yes | Non-empty, at least 6 chars; schema requires/minlength 6; pre-save hook hashes it |

Success:
- HTTP 201 outside production: `{ message, success: true, user: { id, username, email, verified: true } }`. Email is skipped.
- HTTP 201 in production: `{ message: "Account created! Please verify your email to log in.", success: true, user: { id, username, email, verified: false } }` after mail delivery.

Explicit errors:
- 400 validation: `{ message: firstError.msg, success: false, errors: [...] }`.
- 400 existing username/email: message says account already exists, `error: "User already exists"`.
- 400 Mongo duplicate key: message names the duplicate field, `error: "Duplicate key"`.
- 400 Mongoose validation: first schema message, `error: "Validation error"`.
- 500 production email failure: controller deletes the new user and returns a rollback message; error may contain provider detail.
- 500 other caught failure: generic registration message and error text.

Execution:
1. Express parses the body.
2. Validator trims/checks username and email, checks the password, and returns 400 with the first message plus all validation errors when invalid.
3. Controller queries for a matching username or email.
4. Only `NODE_ENV === "production"` activates production verification.
5. The controller creates a User. In non-production the account is auto-verified; in production it is unverified.
6. The User model hashes a modified password with bcryptjs at 10 salt rounds.
7. Non-production returns 201 without email.
8. Production signs a verification JWT with user ID, builds a link from `PUBLIC_API_URL` or request origin, and calls Nodemailer.
9. Mail failure triggers deletion of the created User; success returns 201.

Side effects: User insert; production email attempt. Registration does not set the auth cookie. The email token has no explicit expiration configured in the signing call.

### 4.4 POST /api/auth/login

Body:

```json
{
  "email": "sanket@example.com",
  "password": "example-password"
}
```

Email is required, trimmed and checked with `isEmail()`; password is required and non-empty.

- HTTP 200: `{ message: "Login successful", success: true, user: { id, username, email, verified } }` and a `token` Set-Cookie header.
- 400: validator envelope, account not found, wrong password, or unverified account.
- 500: `{ message: "Login failed. Please try again.", success: false, error: ... }`.

Execution:
1. Validation middleware checks body.
2. Controller finds User by email.
3. `comparePassword()` runs `bcrypt.compare`; wrong password and unverified account are rejected.
4. Controller signs `{ id, username }` with `JWT_SECRET`.
5. Cookie is `httpOnly` with 7-day max age. For HTTPS, code sets `SameSite=None; Secure`; otherwise `SameSite=Lax`.
6. Safe user summary is returned in JSON; JWT is not returned in the body.

Important: the cookie is configured for seven days, but `jwt.sign()` does not set `expiresIn`. The JWT has no explicit expiry claim in this implementation.

### 4.5 GET /api/auth/get-me

Requires cookie `token`; no request body.

- 200: `{ message: "User fetched successfully", success: true, user: <User document without password> }`.
- 401: missing cookie returns `error: "No token provided"`; verification failure returns `error: "Invalid token"`.
- 404: user no longer exists.
- 500: profile lookup failure.

Execution: `authUser` reads `req.cookies.token`, verifies it using `JWT_SECRET`, assigns decoded claims to `req.user`, then `getMe()` queries User by ID and excludes password.

### 4.6 GET /api/auth/verify-email

Input: query parameter `token` from the verification email.

- Success: HTTP 200 HTML verification page.
- 404: token decoded but the user record is missing.
- 400: `{ message: "Invalid or expired token", success: false, error: "Invalid token" }` for exceptions inside the controller's try block.

Flow: verify token, load User by decoded ID, set `verified = true`, save, then send HTML. Observations: the token has no explicit expiry; the success page hard-codes `http://localhost:5173/login`; the catch also maps database/save errors to the invalid-token response.

### 4.7 POST /api/auth/logout

Public route; body is not needed.

- 200: `{ message: "Logout successful", success: true }`.
- 500: logout failure envelope.

It calls `res.clearCookie("token", { httpOnly: true, sameSite: "lax" })`. These clear attributes do not mirror login's HTTPS branch, which may use `SameSite=None; Secure`. Confirm deployed cookie deletion in browser.

### 4.8 POST /api/chats/message

Body:

```json
{
  "message": "Explain how React state updates work.",
  "chatID": "OPTIONAL_EXISTING_CHAT_ID",
  "webSearch": false
}
```

| Field | Type expected | Required | Actual validation |
|---|---|---|---|
| message | String | Yes | Controller only checks truthiness; no length/type schema |
| chatID | ObjectId string | No | Missing/falsy creates a new chat; existing ID is not owner-checked |
| webSearch | Boolean | No | Passed through; any truthy value activates search |

- Success: HTTP 201 `{ title, chat, aiMessage }`. New chat returns title/document; existing-chat path returns null for both; aiMessage is the saved AI Message document.
- 400: `{ error: "Message is required" }`.
- 401: auth middleware.
- 500: `{ error: error.message || "Failed to send message" }` for caught failures.

Execution:
1. Verify cookie and set `req.user`.
2. Read message, chatID and webSearch; log a prompt prefix.
3. Reject a falsy message.
4. If chatID is absent, generate a title, create a Chat owned by `req.user.id`.
5. Insert User Message with `parentMessage: null`.
6. Query messages for the target chat; there is no explicit sort.
7. Call `generateResponse(messages, webSearch)`.
8. Insert AI Message with `parentMessage` set to the new user-message ID.
9. Return title, chat and aiMessage.

Persistence/failure details: chat and user prompt are stored before provider generation. Gemini failure leaves those writes in place; failure inserting the AI response can leave an unanswered user message. No transaction wraps this workflow. A supplied chatID is neither verified as existing nor checked against the logged-in owner before the message writes. This is a significant authorization/data-integrity risk in current code.

### 4.9 POST /api/chats/generate-image

Body:

```json
{
  "prompt": "A blue glass city floating above the ocean",
  "chatID": "OPTIONAL_EXISTING_CHAT_ID"
}
```

- `prompt` is required only by a truthiness check.
- `chatID` is optional; absent ID triggers title generation and new Chat creation.
- Success: HTTP 201 `{ title, chat, aiMessage }`. AI message content is Markdown image syntax linking to an absolute URL.
- 400: `{ error: "Prompt is required" }`.
- 401: auth middleware.
- 500: caught provider, filesystem or DB error.

Execution:
1. Verify token and check prompt.
2. For a new chat, generate a title for the text “Generate image: prompt” and create the Chat.
3. Insert the prompt as a User Message.
4. Call `generateGrokImage(prompt)`. The name is misleading: the implementation uses Google GenAI and a Gemini image model.
5. The image service writes to `process.cwd()/public/images` and returns a `/public/images/...` path.
6. The controller builds an absolute URL from request protocol and host.
7. Insert the AI Message with Markdown image syntax and the user's message ID as parent.
8. Return HTTP 201.

Side effects and failures: chat, messages and local image files can be partially created. Generation failure after prompt insertion leaves an unanswered prompt. Image-file writes before a later DB failure can leave orphaned files. Existing chat IDs are not owner-checked.

### 4.10 GET /api/chats

Requires auth cookie. No body or params.

- 200: `{ message: "Chats retrieved successfully", chats: [ChatDocument, ...] }`.
- 401: auth middleware.
- 500: `{ error: "Failed to fetch chats" }`.

Queries `Chat.find({ user: req.user.id })`. There is no explicit sort or pagination.

### 4.11 GET /api/chats/:chatID/messages

Requires auth cookie. `chatID` is the path parameter.

- 200: `{ message: "Messages retrieved successfully", messages: [MessageDocument, ...] }`.
- 401: auth middleware.
- 404: `{ error: "Chat not found" }` for missing/unowned chat.
- Invalid ObjectId/database errors are not caught locally and may use Express's default error handling.

Flow: verify token, check Chat by ID and user ID, then query Messages by chat ID and return them without explicit sorting.

### 4.12 DELETE /api/chats/:chatID

Requires auth cookie.

- 200: `{ message: "Chat deleted successfully" }`.
- 404: `{ error: "Chat not found" }` if the owner-scoped Chat deletion finds nothing.
- 401: auth middleware.
- Other DB/cast errors propagate to default Express handling.

Flow:
1. Call `findOneAndDelete({ _id: chatID, user: req.user.id })`.
2. Regardless of result, call `messageModel.deleteMany({ chat: chatID })`.
3. Return 404 if no owned Chat was deleted; otherwise 200.

**Critical authorization observation:** messages are deleted even when the Chat does not belong to the caller. A caller who supplies another user's chat ID can cause its messages to be deleted and receive 404. The two deletions are not transactional.

### 4.13 DELETE /api/chats/:chatID/messages/:messageID

Requires auth cookie.

- 200: `{ message: "Message deleted successfully" }`.
- 404: chat not found/unowned or message not found.
- 401: auth middleware.
- Other cast/DB errors propagate because the handler has no local try/catch.

Flow:
1. Verify Chat ownership with both chat ID and user ID.
2. Delete the Message matching message ID and chat ID.
3. If deleted message role is `user`, delete children with `parentMessage` equal to that user's message ID.
4. Return 200.

Deleting an AI message does not delete its user prompt. Prompt + child-response cleanup is not transactional.

### 4.14 Static assets and unknown routes

Static files are served from `path.join(process.cwd(), "public")` at URL prefix `/public`. Generated images are also written relative to `process.cwd()`; execution working directory therefore determines whether generated files land in the directory being served. Unknown application paths use Express's default 404 behavior; no catch-all JSON handler is registered.


## 5. Authentication and account lifecycle

### 5.1 Registration state machine

```mermaid
flowchart TD
    A[POST register] --> B{Validation passes?}
    B -- No --> C[400 validation envelope]
    B -- Yes --> D{Account exists?}
    D -- Yes --> E[400 duplicate account]
    D -- No --> F[Create User and hash password]
    F --> G{NODE_ENV is production?}
    G -- No --> H[verified=true; return 201]
    G -- Yes --> I[verified=false; sign verification token]
    I --> J[Send Gmail OAuth2 email]
    J -- Success --> K[Return 201; verification required]
    J -- Failure --> L[Delete new user; return 500]
```

NODE_ENV !== "production" selects non-production behavior, including when NODE_ENV is unset. In that mode newly created users are verified immediately and no email is sent.

### 5.2 Password handling

The User model pre-save hook hashes any modified password using bcryptjs with 10 salt rounds. The comparePassword method calls bcrypt.compare. A password-reset route and password-change endpoint are not registered. Registration validation checks the password before the pre-save hook stores its hash.

### 5.3 JWT cookie and middleware

The login controller signs the payload containing id and username using JWT_SECRET, then stores it in the httpOnly cookie named token. The cookie max age is seven days; Secure and SameSite depend on how the request protocol is detected.

The authUser middleware does not query MongoDB or check the current verified value. It verifies the JWT and assigns decoded claims to req.user. A deleted or unverified user whose token still verifies is not rejected by this middleware alone; protected controllers must still enforce resource ownership.

**Expiry distinction:** no expiresIn is passed to jwt.sign. Browser cookie expiration is not the same as a JWT exp claim. The current signed token has no explicit expiry configured.

### 5.4 Session restore and logout

- Frontend App calls handleGetMe on mount.
- Auth Redux state begins with user=null, loading=true and error=null.
- Protected renders a spinner while loading, then redirects to /login when user is missing.
- handleLogout calls the logout route and clears Redux user/chat state and currentChatId in a finally block, even if the request fails.
- Logout clears the token cookie with httpOnly and SameSite=Lax. These options do not mirror login's HTTPS branch, which can set SameSite=None and Secure. Deployed cross-origin cookie clearing should be verified.

### 5.5 Verification email

The mail service creates a Nodemailer Gmail transporter at module import using GOOGLE_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN. It invokes transporter.verify() and logs success/failure. sendEmail calls transporter.sendMail() and logs the returned details.

Production registration places the verification JWT in an email URL. The HTML response after verification contains a hard-coded localhost login URL. The current username validator restricts characters to alphanumeric and underscore, but HTML template values should still be escaped as a general security practice.

## 6. Chat and AI request lifecycle

### 6.1 Text response sequence

```mermaid
sequenceDiagram
    participant UI as Dashboard/useChat
    participant API as POST /api/chats/message
    participant DB as MongoDB
    participant AI as ai.service
    participant Tavily
    participant Gemini as Google GenAI
    UI->>API: message, chatID?, webSearch?
    API->>API: authUser validates cookie
    alt New chat
      API->>AI: generateChatTitle(message)
      AI->>Gemini: Generate title
      Gemini-->>AI: Title text
      API->>DB: Create Chat
    end
    API->>DB: Insert User Message
    API->>DB: Read chat Messages
    opt webSearch truthy
      API->>Tavily: Search last user prompt
      Tavily-->>AI: JSON results or handled failure text
    end
    API->>Gemini: Generate response from history and instruction
    Gemini-->>API: Response text
    API->>DB: Insert AI Message parented to prompt
    API-->>UI: title, chat, aiMessage
    UI->>UI: Update Redux messages
```

### 6.2 New chat title

When chatID is falsy, sendMessage calls generateChatTitle(message) before creating a Chat. The title service asks Gemini for a concise 2–3 word title and trims response.text. If the provider status belongs to the configured transient set, title generation returns "New chat"; other errors throw and abort before the Chat is created.

### 6.3 Conversation-history conversion

The controller retrieves messages using messageModel.find({ chat: targetChatId }), then generateResponse maps each document:
- role user becomes Gemini role user;
- every non-user role becomes Gemini role model;
- content becomes parts containing a text value.

No explicit sort order or history truncation is added. The complete returned history is sent on every text request. Long conversations therefore increase prompt size, latency and provider usage. Stored image responses are Markdown strings and are also passed to the text model as history text.

### 6.4 Standard response versus web-search mode

In standard mode, the system instruction asks Gemini to answer directly without external tools.

When webSearch is truthy:
1. The service reverses the in-memory message array and finds the last item whose role is user.
2. It calls searchInternet with that message's content.
3. The Tavily wrapper requests at most five results with searchDepth set to advanced.
4. The result object is serialized with JSON.stringify.
5. That JSON is inserted into the Gemini system instruction, which asks the model to use it and acknowledge absent or inconclusive evidence.
6. Gemini returns free-form response text.

If Tavily throws, generateResponse catches the search exception and substitutes "No search results available (search failed)." Gemini is still called with the instruction asking it to disclose failed/inconclusive search.

This is retrieval-augmented prompt context, not vector search. The Message schema does not store structured source/citation records; the frontend receives generated text.

### 6.5 Gemini client and retry policy

ai.service.js initializes GoogleGenAI only if GEMINI_API_KEY exists and logs a warning if it does not. The active text model constant is gemini-3.8-flash in the checked-in code.

generateContentWithRetry(request, retries=3) retries only errors whose status is 429, 500, 502, 503 or 504. The initial attempt plus up to three retries are possible. Wait durations are 750ms, 1500ms and 3000ms before retry attempts.

- generateChatTitle returns "New chat" for transient status codes recognized by its catch branch; non-transient errors are wrapped and thrown.
- generateResponse wraps model failures as "Failed to generate response: ..." and does not generate a fallback answer when Gemini itself fails.
- No server-side AI streaming, request cancellation, or provider call timeout is implemented in this service.

## 7. Image generation lifecycle

### 7.1 Actual provider

The controller imports a function named generateGrokImage, but that function is not a Grok API integration. Backend/src/services/image.service.js uses Google's GoogleGenAI client with model gemini-3.1-flash-image and requests image response modality.

### 7.2 Image generation and fallback

```mermaid
flowchart TD
    A[Authenticated image request] --> B[Prompt truthiness check]
    B --> C{chatID supplied?}
    C -- No --> D[Generate title and create Chat]
    C -- Yes --> E[Use supplied ID without owner check]
    D --> F[Insert user prompt Message]
    E --> F
    F --> G[Call Gemini image model]
    G --> H{Inline image bytes found?}
    H -- Yes --> I[Decode base64]
    H -- No/API error --> J[Create keyword LoremFlickr URL]
    J --> K{Valid non-placeholder response?}
    K -- Yes --> L[Use fetched bytes]
    K -- No --> M[Fetch Picsum image]
    I --> N[Write random .png file under public/images]
    L --> N
    M --> N
    N --> O[Return /public/images path]
    O --> P[Persist Markdown AI Message]
    P --> Q[Return 201]
```

### 7.3 Fallback logic

1. The service checks GEMINI_API_KEY; if missing, it throws immediately and does not use the remote-image fallbacks.
2. It requests Gemini image generation.
3. Provider exceptions are logged and trigger fallback; a response with no image part also falls back.
4. It creates process.cwd()/public/images if absent.
5. It creates a random filename from 16 cryptographic bytes and appends .png.
6. It lowercases the prompt, strips punctuation and common generation words, selects up to three terms longer than two characters, and builds a LoremFlickr URL.
7. It fetches a LoremFlickr 800×600 URL with those keywords and a random query value.
8. It falls back to Picsum Photos at 800×600 when the request fails, is non-OK, redirects to defaultImage, has no buffer, or returns the known 126099-byte placeholder size.
9. It writes the chosen bytes to disk and returns a path under /public/images.

LoremFlickr and Picsum provide photographs/placeholders; they do not guarantee that the result matches the prompt and are not AI image generation. The code writes every returned byte sequence to a .png filename without transcoding, so the extension does not guarantee PNG encoding.

### 7.4 Filesystem and failure paths

Express serves files from process.cwd()/public; the generator also writes under process.cwd()/public/images. The process working directory therefore matters. If started from an unexpected directory, image writes may not land in the directory being served.

Gemini image failure is caught so fallbacks can be attempted. Errors from Picsum, filesystem operations, or the outer service are rethrown with the prefix "Gemini Image Generation failed:". The controller returns 500. If the prompt Message was saved before an image failure, it remains. If a file is written but subsequent Message insertion fails, it can be orphaned.
