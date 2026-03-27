# 🔐 QuMail Key Manager (KM)

The core security component of the QuMail ecosystem. An isolated microservice specifically for generating and storing sensitive OTP and AES encryption keys.

---

## 🛠️ Features

- **🛡️ Distributed Encryption Layer**: Key generation is decoupled from the primary backend server.
- **🔐 OTP Engine**: High-fidelity One-Time Pad generation for quantum-secure communication.
- **🛡️ AES-256-GCM Handshakes**: Secure generation of IVs and symmetric keys for efficient data storage.
- **🔒 Secure Retrieval**: Only authorized backend servers can fetch keys via the isolated KM API.

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/en/) (v16+)

### 2. Configure Environment
Create a `.env` file in this folder:
```env
PORT=5001
KM_API_KEY=your_secure_km_key
KM_ADMIN_SECRET=your_admin_secret
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

- **`server.js`**: Core KM API setup and key rotation logic.
- **`utils/cryptoUtils.js`**: Low-level cryptographic primitives (OTP/AES).
- **`models/Key.js`**: Encrypted key storage schema.

---

## 🛡️ Security Best Practices

For production, the `qumail-km` should be:
- Run on an isolated virtual network or container.
- Restricted to backend-only IP addresses.
- Instrumented with independent audit logs.

---

## 📄 License

MIT. See root `LICENSE` file.
