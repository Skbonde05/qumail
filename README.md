# 🛡️ QuMail: Quantum-Secure Email Platform

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Material UI](https://img.shields.io/badge/UI-Material%20UI-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**QuMail** is a state-of-the-art, zero-knowledge email platform designed for the quantum age. Built with a focus on privacy, security, and premium user experience, it leverages a distributed architecture to provide truly confidential communication.

---

## ✨ Key Features

- **🔐 Quantum-Secure Encryption**: Support for both **One-Time Pad (OTP)** and **AES-256-GCM** encryption.
- **🛡️ High-End Security**: Integrated Multi-Factor Authentication (TOTP), real-time security logs, and a dedicated **Key Manager (KM)**.
- **💎 Premium UI/UX**: A polished, glassmorphic dashboard with smooth animations, customizable themes, and responsive design.
- **📂 Smart Organization**: Advanced labeling system, server-side regex search, and automated storage cleanup.
- **🚀 Performance Optimized**: Local caching engine for offline resilience and hardware-accelerated transitions.

---

## 🏗️ Architecture

The QuMail ecosystem is split into three core services:

1.  **`qumail-ui`**: The React-based frontend dashboard.
2.  **`qumail-backend`**: The primary API service handling mail, users, and storage.
3.  **`qumail-km`**: An isolated **Quantum Key Manager** that handles sensitive encryption keys and secure handshakes.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or on Atlas)

### 2. Installation & Setup

#### **Clone the Project**
```bash
git clone https://github.com/Skbonde05/qumail.git
cd qumail
```

#### **Phase 1: Key Manager (KM)**
```bash
cd qumail-km
npm install
npm run dev
```

#### **Phase 2: Primary Backend**
```bash
cd ../qumail-backend
npm install
# Ensure your .env is configured for MongoDB
npm run dev
```

#### **Phase 3: Frontend Dashboard**
```bash
cd ../qumail-ui
npm install
npm start
```

Your dashboard will be available at `http://localhost:3000`.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Material UI, Framer Motion, Axios |
| **Backend** | Node.js, Express, Mongoose |
| **Security** | JSON Web Tokens (JWT), Speakeasy (TOTP), Crypto-JS |
| **Storage** | MongoDB, LocalStorage Caching |
| **Development** | Git, NPM, ESLint |

---

## 🔐 Zero-Knowledge Infrastructure

Unlike traditional email providers, QuMail ensures that the server never sees your raw communication:
- **E2E Encryption**: Emails are encrypted on the client side before hitting the wire.
- **Isolated Key Management**: Key generation and storage are handled by the separate `qumail-km` service, ensuring a breach in the primary backend doesn't compromise your encryption.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by the QuMail Team.
