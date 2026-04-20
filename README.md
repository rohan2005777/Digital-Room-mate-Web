<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/54bdee82-9bda-443a-b5c5-706b34b5cbdf

## Core Modules

### 🔐 User Module
- **Secure Auth**: Custom JWT-based Email/Password authentication.
- **Session Management**: Secure token persistence in browser local storage.
- **Role-Based Access**: Automatic Admin elevation for room creators.

### 🏠 Room Module
- **Create Room**: Generate a new shared living space instantly.
- **Join Room**: Connect with roommates using a short **6-character Join Code** or a direct **24-character MongoDB ID**.
- **Admin Controls**: Dedicated settings for managing monthly rent, city location, and roommate membership.

## Run Locally

**Prerequisites:** Node.js, MongoDB (Atlas or Local)

1. **Setup Backend**:
   - `cd server`
   - Create a `.env` file with `MONGODB_URI`, `JWT_SECRET`, and `PORT=5005`.
   - `npm install`
   - `node index.js`

2. **Setup Frontend**:
   - `npm install`
   - Set `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
   - `npm run dev` (Runs on port 3000)

3. **Visit App**:
   - [http://localhost:3000](http://localhost:3000)
   - Or via Network: `http://192.168.29.165:3000` (on the same Wi-Fi)
