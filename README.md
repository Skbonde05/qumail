# 🎨 QuMail Frontend (UI)

The high-performance React dashboard for the QuMail ecosystem. Built with a focus on 'Glassmorphism' aesthetics and responsive controls.

---

## 🛠️ Features

- **🚀 Real-time Sync**: Global settings listeners via custom JS events.
- **🛡️ End-to-End Encryption UI**: Integrated OTP and AES-256-GCM decryption controls.
- **🎨 Custom Theming**: Support for dynamic background images, dark mode, and responsive layouts.
- **📁 Advanced Organization**: Custom label management and server-side regex search integration.

---

## 🚀 Getting Started

Ensure the `qumail-backend` and `qumail-km` services are running before starting the UI.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file or ensure your configuration points to the correct backend ports (`localhost:5000` by default).

### 3. Run Development Server
```bash
npm start
```

---

## 🏗️ Core Stack

- **React 18**: Main framework.
- **Material UI (MUI)**: Theming and component library.
- **Framer Motion**: Premium animations (page transitions and interactive elements).
- **Axios**: HTTP client for API communication.
- **React Router Dom**: For navigation.

---

## 📂 Project Structure

- `src/components`: Reusable UI components (Inbox, Sidebar, Settings).
- `src/pages`: Main view layouts (Dashboard, Login, Register).
- `src/hooks`: Global state hooks (useDashboardActions).
- `src/services`: API bridge layers.

---

## 📄 License

MIT. See root `LICENSE` file.
