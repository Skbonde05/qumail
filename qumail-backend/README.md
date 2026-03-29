# 🔗 QuMail Backend Server

The primary application server for QuMail, handling mailbox storage, user profiles, and storage policies.

---

## 🛠️ Features

- **📂 MongoDB / Mongoose**: Advanced schema design for encrypted email storage.
- **🛡️ Multi-Factor Auth (MFA/2FA)**: Full Speakeasy (TOTP) integration.
- **🔐 User Management**: Secure JWT auth with refresh tokens and OTP-based password recovery.
- **📦 Storage Engine**: Automated storage calculation (15GB standard) and cleanup logic.
- **⚙️ Secure Routing**: Grouped routes for authentication, mailbox actions, and security logs.

---

## 🚀 Getting Started

### 1. Prerequisites
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [Node.js](https://nodejs.org/en/) (v16+)

### 2. Configure Environment
Create a `.env` file in the root of this folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
KM_SERVER_URL=http://localhost:6000
REFRESH_TOKEN_SECRET=your_refresh_secret
NODE_ENV=development
```

### 3. Setup Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🏗️ Core Architecture

- **`server.js`**: Core Express setup and middleware registration.
- **`routes/authRoutes.js`**: MFA, login, registration, and profiles.
- **`routes/mailRoutes.js`**: Send, receive, search, and label logic.
- **`models/Mail.js`**: Encrypted mail schema with lifecycle management.
- **`middleware/authMiddleware.js`**: JWT verification and role enforcement.

---

## 📄 License

MIT. See root `LICENSE` file.
