DeploymentLink - https://rent-flatmate-and-finder-client.vercel.app/
# Rent-Flatmate-and-Finder
## Overview
A comprehensive MERN stack application designed to intelligently match tenants with available room listings. It leverages an AI-powered compatibility scoring engine, real-time communication capabilities, and role-based workflows to streamline the process of finding the perfect flatmate or tenant.

### Core Features
*   **Role-based Auth:** Distinct and secure workflows for `tenant`, `owner`, and `admin` roles, secured by JWT in `httpOnly` cookies.
*   **AI Compatibility Scoring (with Fallback):** Intelligently scores the match between a tenant profile and a listing using a Groq LLM (llama-3.3-70b-versatile). Includes a deterministic rule-based fallback and intelligent 7-day caching.
*   **Real-time Chat:** Bi-directional messaging between tenants and owners using Socket.io (featuring a custom in-memory token fix for Safari ITP).
*   **Email & In-App Notifications:** Asynchronous event-driven notifications for new interests, high matches, and status updates via Nodemailer/SMTP.
*   **Admin Moderation:** Dedicated admin dashboard for platform moderation, listing status management, user deactivation, and statistical overview.

---

## Tech Stack
*   **Frontend:** React (Vite + TypeScript), TailwindCSS, React Context API.
*   **Backend:** Node.js, Express, Socket.io.
*   **Database:** MongoDB, Mongoose ODM.
*   **AI & Integrations:** Groq (LLM API), Nodemailer (SMTP).

---

## Setup Guide

### Prerequisites
*   Node.js (v18+) and npm
*   A MongoDB Atlas account (or a local MongoDB instance)
*   A Groq API key
*   An SMTP service account (e.g., Gmail with an App Password, Resend)

### Clone & Install
The project is structured as an npm workspace monorepo. You can install all dependencies from the root directory.

```bash
git clone <repository-url>
cd Rent-Flatmate-and-Finder
npm install
```

### Environment Setup
Create a `.env` file in the `server/` directory by copying the provided example:
```bash
cp server/.env.example server/.env
```
*(Also create a `client/.env` if required by your frontend build, setting `VITE_API_URL` to `http://localhost:5001` or `/api` depending on your proxy config.)*

### Running Locally
To boot both the frontend and backend concurrently, run the following command from the root directory:

```bash
npm run dev
```
*   **Client:** Boots on `http://localhost:5173`
*   **Server:** Boots on `http://localhost:5001`

### Admin Seeding
To access the admin dashboard, you can register a new user and then manually change their `role` field to `"admin"` directly in your MongoDB database, or you can use the `seedAdmin` script. When using the script, provide the `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables to configure the initial admin credentials.

---

## Environment Variables (`server/.env.example`)

Below is the actual `.env.example` file content from the server directory. 

```env
PORT=5001
MONGO_URI="mongodb_url"
JWT_SECRET='your_jwt_secret_key_here'
JWT_EXPIRES_IN=7d
SOCKET_TOKEN_SECRET='your_socket_token_secret_here' # For short-lived websocket handshake
LLM_API_KEY='your_llm_api_key_here'
LLM_PROVIDER=openai # or anthropic, gemini, etc.
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
CLIENT_URL=http://localhost:5173
```

**Brief explanation of key variables:**
*   `MONGO_URI`: The connection string for your MongoDB database.
*   `JWT_SECRET` / `JWT_EXPIRES_IN`: Used to sign and verify the primary authentication JWT stored in the `httpOnly` cookie.
*   `SOCKET_TOKEN_SECRET`: Used specifically to sign short-lived (e.g., 15-minute) tokens that bypass Safari's strict cookie restrictions during cross-origin WebSocket handshakes.
*   `LLM_API_KEY`: Your Groq API key.
*   `SMTP_*`: Credentials for your preferred SMTP email provider.

---

## API Documentation

### Auth (`/api/auth`)
| Method | Path | Auth Requirement | Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/register` | Public | `{name, email, password, role, phone}` | Registers a new user |
| POST | `/login` | Public | `{email, password}` | Authenticates user, sets `httpOnly` cookie |
| POST | `/logout` | Public | None | Clears authentication cookie |
| GET | `/me` | `protect` | None | Retrieves current user (and socket token) |

### Listings (`/api/listings`)
| Method | Path | Auth Requirement | Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | `optionalProtect` | None | Returns paginated listings (adds score if tenant) |
| POST | `/` | `protect`, `authorize('owner')` | `IListing` fields | Creates a new listing |
| GET | `/mine` | `protect`, `authorize('owner')` | None | Retrieves listings owned by current user |
| GET | `/:id` | Public | None | Retrieves a single listing by ID |
| PUT | `/:id` | `protect`, `authorize('owner')` | Updatable fields | Updates listing details |
| PATCH | `/:id/status`| `protect`, `authorize('owner')` | `{ status }` | Updates listing status (active/filled) |
| POST | `/:id/compatibility` | `protect`, `authorize('tenant')` | None | Forces AI score recomputation |
| DELETE | `/:id` | `protect`, `authorize('owner')` | None | Deletes a listing |

### Tenant Profile (`/api/tenant-profile`)
| Method | Path | Auth Requirement | Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST/PUT| `/` | `protect`, `authorize('tenant')` | `ITenantProfile` fields | Creates or updates profile |
| GET | `/me` | `protect`, `authorize('tenant')` | None | Retrieves current tenant's profile |

### Interests & Chat (`/api/interests`)
| Method | Path | Auth Requirement | Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/` | `protect`, `authorize('tenant')` | `{ listingId }` | Expresses interest in a listing |
| GET | `/sent` | `protect`, `authorize('tenant')` | None | Views interests sent by the tenant |
| GET | `/received` | `protect`, `authorize('owner')` | None | Views interests received by the owner |
| PATCH | `/:id/accept` | `protect`, `authorize('owner')` | None | Accepts an interest request |
| PATCH | `/:id/decline`| `protect`, `authorize('owner')` | None | Declines an interest request |
| GET | `/:id/messages`| `protect` | None | Retrieves message history for the interest |
| PATCH | `/:id/messages/read`| `protect` | None | Marks conversation messages as read |

### Notifications (`/api/notifications`)
| Method | Path | Auth Requirement | Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/mine` | `protect` | None | Retrieves user notifications |
| PATCH | `/:id/read` | `protect` | None | Marks notification as read |

### Admin (`/api/admin`)
| Method | Path | Auth Requirement | Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/users` | `protect`, `authorize('admin')` | None | Lists all users |
| PATCH | `/users/:id/status`| `protect`, `authorize('admin')` | `{ active }` | Activates/Deactivates a user |
| GET | `/listings` | `protect`, `authorize('admin')` | None | Lists all platform listings |
| PATCH | `/listings/:id/status`| `protect`, `authorize('admin')`| `{ status }` | Updates any listing status |
| GET | `/stats` | `protect`, `authorize('admin')` | None | Retrieves platform statistics |

---

## Database Schema

*   **User:**
    *   `name`, `email`, `password` (bcrypt), `role` (`'tenant'`, `'owner'`, `'admin'`), `phone`, `active` (boolean).
*   **Listing:**
    *   `owner` (Ref User), `location` (`{city, area, address}`), `rent`, `availableFrom`, `roomType`, `furnishingStatus`, `photos`, `description`, `status` (`'active'`, `'filled'`, `'removed'`).
    *   *Indexes:* `status`, `location.city`, `rent`.
*   **TenantProfile:**
    *   `user` (Ref User), `preferredLocation` (`{city, area}`), `budgetRange` (`{min, max}`), `moveInDate`, `preferences`.
*   **CompatibilityScore:**
    *   `tenant` (Ref User), `listing` (Ref Listing), `score` (0-100), `explanation`, `method` (`'llm'`, `'rule-based'`), `computedAt`.
    *   *Indexes:* Compound unique index on `(tenant, listing)`.
*   **Interest:**
    *   `tenant` (Ref User), `listing` (Ref Listing), `owner` (Ref User), `status` (`'pending'`, `'accepted'`, `'declined'`), `compatibilityScoreAtRequest`.
    *   *Indexes:* Compound unique index on `(tenant, listing)`.
*   **Message:**
    *   `interest` (Ref Interest), `sender` (Ref User), `content`, `readAt`.
    *   *Indexes:* `interest`, `createdAt`.
*   **Notification:**
    *   `user` (Ref User), `type`, `relatedInterest` (Ref Interest), `message`, `read`.
    *   *Indexes:* `user`, `read`, `createdAt`.

---

## AI Compatibility Scoring

The application uses Groq's LLM API (`llama-3.3-70b-versatile`) to generate a compatibility score (0-100) and a brief explanation based on the tenant's profile and listing details. 

**LLM Prompt Template**
```text
You are an expert real estate AI assistant matching a tenant profile with a room listing.
Evaluate the compatibility between the tenant and the listing and provide a compatibility score between 0 and 100.

Tenant Profile:
- Preferred Location: ${tenantProfile.preferredLocation?.city || 'N/A'}, Area: ${tenantProfile.preferredLocation?.area || 'N/A'}
- Budget Range: ${tenantProfile.budgetRange?.min || 'N/A'} to ${tenantProfile.budgetRange?.max || 'N/A'}
- Move-in Date: ${tenantProfile.moveInDate ? new Date(tenantProfile.moveInDate).toDateString() : 'N/A'}
- Preferences: ${tenantProfile.preferences || 'N/A'}

Listing Details:
- Location: ${listing.location?.city || 'N/A'}, Area: ${listing.location?.area || 'N/A'}
- Rent: ${listing.rent || 'N/A'}
- Available From: ${listing.availableFrom ? new Date(listing.availableFrom).toDateString() : 'N/A'}
- Room Type: ${listing.roomType || 'N/A'}
- Furnishing Status: ${listing.furnishingStatus || 'N/A'}
- Description: ${listing.description || 'N/A'}

INSTRUCTIONS:
Return STRICTLY valid JSON, with exactly two keys: "score" (an integer from 0 to 100) and "explanation" (a one or two sentence string explaining the score). 
Do NOT wrap the output in markdown code blocks. Do not add any extra commentary or text outside the JSON object.
Example: {"score": 85, "explanation": "The listing is within the budget and matches the preferred city, though the area differs slightly."}
```

**Example Input/Output Pair**
*   **Input Context:** Tenant wants Seattle, Area: Downtown, Budget: 1000-1500. Listing is in Seattle, Downtown, Rent: 1200.
*   **Output JSON:** `{"score": 95, "explanation": "The listing is a perfect match for the preferred city, area, and falls comfortably within the budget range."}`

**Rule-Based Fallback**
If the LLM fails, times out (8s limit), or returns unparseable JSON, a deterministic algorithm kicks in:
*   Starts at a base score of 100.
*   **Location Penalty:** -40 points for mismatched cities, -20 points for same city but mismatched areas.
*   **Budget Penalty:** If rent exceeds the maximum budget, penalty = `((rent - max) / max) * 100`, capped at 50 points. Over/under limits apply respectively.
*   Returns bounded score (0-100) with string-appended explanation.

**Cache Invalidation**
Scores are aggressively cached in the database. A score is recomputed dynamically if:
1.  The score is older than 7 days.
2.  The `tenantProfile` or `listing` was updated *after* the score was computed.
3.  The tenant explicitly requests a recomputation via the UI.

---

## Real-Time Chat Architecture

Real-time chat is powered by Socket.io and implements a strict room-based model.
*   **Room Architecture:** Rooms are strictly scoped to accepted interests. A user joins `interest:${interestId}`.
*   **Authorization Check:** When joining or emitting a message, the server validates that the user is either the `tenant` or `owner` of the interest document, and that the interest `status` is exactly `'accepted'`.
*   **Safari ITP Workaround (In-Memory Socket Token):** 
    Safari's Intelligent Tracking Prevention (ITP) drops third-party/cross-origin cookies during the `wss://` handshake, breaking `httpOnly` cookie auth. To fix this, the client requests a short-lived (15 min) JWT `socketToken` via standard REST (`/api/auth/me`), which *does* support cookies through Vercel proxy rewrites. The client holds this token in memory and injects it into the `socket.handshake.auth` payload, ensuring consistent, secure WebSocket authentication across all browsers.

---

## Deployment Strategy

*   **Frontend (Client):** Deployed on **Vercel**
*   **Backend (Server):** Deployed on **Render**
*   **CORS & Cookie Proxy:** The Vercel `vercel.json` utilizes a proxy rewrite rule (`/api/(.*)` -> `https://api.render.com/...`). By routing API traffic through the same domain as the frontend, requests are treated as first-party. This completely circumvents CORS preflight delays and ensures `httpOnly` session cookies work flawlessly on mobile and ITP-compliant browsers.

---

## Known Limitations
*   **Email Deliverability:** Without a warmed-up sender reputation, notifications sent via fresh SMTP accounts might land in spam folders. For testing, check your spam or configure a testing service like Ethereal Email.
*   **Photo Uploads:** Photo uploads are handled via URL strings instead of true multipart file uploads (e.g., S3 or Cloudinary) to adhere strictly to the assignment scope and reduce overhead. You must provide a valid public image URL when creating a listing.
