# Digital Roommate

A smart project management platform for shared living spaces. This tool helps roommates stay organized by managing membership, rent, and common tasks through a secure, permission-based interface.

## 🚀 Tech Stack

### Frontend
- **React 19** & **Vite** for a fast, modern UI.
- **Tailwind CSS 4** for styling and responsiveness.
- **Framer Motion** for smooth animations.
- **Lucide React** for consistent iconography.
- **Chart.js** for visual data representation.

### Backend
- **Node.js** & **Express** for a robust RESTful API.
- **MongoDB** with **Mongoose** for flexible data modeling.
- **JWT (JSON Web Tokens)** for secure, stateless authentication.
- **Bcrypt.js** for advanced password hashing.

## ✨ Core Modules

### 🔐 User Module
- **Secure Auth**: Custom JWT-based Email/Password authentication.
- **Session Management**: Secure token persistence in browser local storage.
- **Role-Based Access**: Automatic Admin elevation for room creators.

### 🏠 Room Module
- **Create Room**: Generate a new shared living space instantly.
- **Join Room**: Connect with roommates using a short **6-character Join Code** or a direct **24-character MongoDB ID**.
- **Admin Controls**: Dedicated settings for managing monthly rent, city location, and roommate membership.

## 🛠️ Run Locally

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
