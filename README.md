<div align="center">

# 🛒 RetailPro

### Retail Management System for India's Small Businesses

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-black?style=flat-square&logo=expo)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?style=flat-square&logo=postgresql)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

> **Empowering India's 60M+ small retailers with enterprise-grade tools — in their palm.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-reference) • [Screenshots](#-screenshots) • [Team](#-team)

</div>

---

## 📖 Overview

**RetailPro** is a full-stack mobile application built for small retail shops across India. It replaces paper ledgers, manual billing, and informal credit tracking with a modern, fast, and intuitive mobile experience — running on both Android and iOS from a single React Native codebase.

Built as a Hackathon 2025 project at **RGUKT RK Valley**.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based stateless authentication
- Bcrypt password hashing (10 salt rounds)
- Forgot Password flow with email OTP (development-mode fallback included)
- Password visibility toggle on all input fields
- Complete data isolation — all records scoped to `userId`

### 📊 Business Intelligence Dashboard
- Today's Sales, Monthly Revenue, Customer Dues, Dealer Dues — live KPI cards
- Weekly sales area/bar chart (react-native-chart-kit)
- Low-stock alerts displayed prominently
- Pending customer payment summary

### 🧾 Smart Invoicing Engine
- Select items from inventory — subtotal + GST calculated automatically
- Link customer by name or phone, or create inline
- Payment modes: **Cash · Online · Credit (partial)**
- Prisma **atomic transaction** — Invoice + Customer balance + Inventory all update in one rollback-safe operation
- Unique invoice numbering (e.g. `INV-674757-66`)
- Download & share PDF invoice via `expo-print` + `expo-sharing`

### 📦 Inventory Management
- Full CRUD — Name, HSN Code, Category, Quantity, Unit, Price, Supplier
- Real-time **low-stock alerts** when `quantity ≤ threshold`
- Auto-deduction of stock on every invoice
- Search by item name + filter by category (Electrical · Hardware · Paint · Other)

### 👥 Customer Module
- Buyer profiles — GST, category, purchase history
- Tracks `totalBilled`, `totalPaid`, `pending`
- Auto payment status: **new → partial → paid**
- One-tap due settlement
- Invoice history per customer

### 🚚 Dealer Module
- Supplier profiles — contact, GST, category
- Tracks `totalOrdered`, `totalPaid`, `pending`
- Status: **Pending → Partial → Settled**
- PDF account statement export

### 🌐 Additional Features
- **Native Language Translator** — Telugu, Hindi, Tamil UI support
- **OAuth Authentication** — Google sign-in integration (expo-auth-session)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile App** | React Native 0.81.5 · Expo SDK 54 |
| **Navigation** | React Navigation 6 (Stack + Bottom Tabs) |
| **Charts** | react-native-chart-kit + react-native-svg |
| **HTTP Client** | Axios |
| **Local Storage** | @react-native-async-storage/async-storage |
| **PDF / Share** | expo-print · expo-sharing |
| **Auth (OAuth)** | expo-auth-session · expo-web-browser |
| **Backend** | Node.js 18+ · Express.js |
| **Auth** | JWT (jsonwebtoken) · Bcrypt |
| **ORM** | Prisma (atomic transactions) |
| **Database** | PostgreSQL (hosted on Supabase) |

---

## 📁 Project Structure

```
RetailPro/
├── frontend/                    # React Native (Expo) App
│   ├── app.json                 # Expo config
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Auth/            # Welcome, Login, Signup, ForgotPassword, ResetPassword
│   │   │   ├── Home/            # Dashboard (KPIs + Chart + Alerts)
│   │   │   ├── Inventory/       # Inventory list + Add/Edit item
│   │   │   ├── Invoice/         # Create invoice + Invoice list
│   │   │   ├── Customers/       # Customer list + detail
│   │   │   └── Dealers/         # Dealer list + detail
│   │   ├── components/          # Reusable UI components (InputField, EmptyState, …)
│   │   ├── context/             # AuthContext (JWT storage & refresh)
│   │   ├── navigation/          # Stack & Tab navigator definitions
│   │   ├── hooks/               # useTranslate (i18n hook)
│   │   └── utils/               # TranslationService, API helpers
│   └── package.json
│
├── backend/                     # Node.js / Express API
│   ├── prisma/
│   │   └── schema.prisma        # DB schema (User, Inventory, Customer, Dealer, Invoice)
│   ├── src/
│   │   ├── index.js             # Entry point
│   │   ├── routes/
│   │   │   ├── auth.js          # /api/auth/*
│   │   │   ├── inventory.js     # /api/inventory/*
│   │   │   ├── invoices.js      # /api/invoices/*
│   │   │   ├── customers.js     # /api/customers/*
│   │   │   ├── dealers.js       # /api/dealers/*
│   │   │   └── sales.js         # /api/sales/* (dashboard stats)
│   │   ├── controllers/         # Route handler logic
│   │   ├── middleware/          # JWT auth middleware
│   │   ├── config/              # DB / Prisma client setup
│   │   └── utils/               # Email / OTP helpers
│   ├── .env.example
│   └── package.json
│
└── package.json                 # Root scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- [Expo Go](https://expo.dev/client) app on your Android/iOS device  
  *(or Android Studio / Xcode for emulators)*
- PostgreSQL database (local or [Supabase](https://supabase.com) free tier)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/RetailPro.git
cd RetailPro
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/retailpro?schema=public"
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=30d
NODE_ENV=development
```

Run database migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend:

```bash
npm run dev
```

> Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Open `src/utils/` (or `AuthContext.js`) and set your backend IP:

```js
// Replace with your machine's local IP (not localhost — Expo runs on device)
const BASE_URL = "http://192.168.x.x:5000/api";
```

> **Tip:** Find your IP with `ip addr show` (Linux) or `ipconfig` (Windows).

Start the Expo dev server:

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

---

### 4. Run Both Together (from root)

```bash
# Terminal 1
npm run backend

# Terminal 2
npm start
```

---

## 🗄️ Database Schema

```
User         — id, name, email, shopName, password(hash), googleId, resetToken
  │
  ├── Inventory  — id, userId, name, hsnCode, category, quantity, threshold, unit, price, supplier
  │
  ├── Customer   — id, userId, name, phone, totalBilled, totalPaid, pending, status
  │     └── Invoice[]
  │
  ├── Dealer     — id, userId, name, phone, gst, totalOrdered, totalPaid, pending, status
  │
  └── Invoice    — id, userId, invoiceNumber, customerId, items(JSON),
                   subtotal, taxTotal, grandTotal, amountPaid, balance,
                   paymentMode, status, isTaxFree
```

All tables cascade-delete on User removal.

---

## 📡 API Reference

All routes (except `/api/auth/*`) require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/forgot-password` | Send OTP to email |
| `POST` | `/api/auth/reset-password` | Reset with OTP |
| `GET`  | `/api/auth/me` | Get current user profile |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/inventory` | List all items |
| `POST`   | `/api/inventory` | Add item |
| `PUT`    | `/api/inventory/:id` | Update item |
| `DELETE` | `/api/inventory/:id` | Delete item |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/invoices` | List all invoices |
| `POST` | `/api/invoices` | Create invoice (atomic transaction) |
| `GET`  | `/api/invoices/:id` | Get single invoice |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/customers` | List all customers |
| `POST`   | `/api/customers` | Add customer |
| `PUT`    | `/api/customers/:id` | Update customer |
| `DELETE` | `/api/customers/:id` | Delete customer |
| `POST`   | `/api/customers/:id/settle` | Settle pending balance |

### Dealers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/dealers` | List all dealers |
| `POST`   | `/api/dealers` | Add dealer |
| `PUT`    | `/api/dealers/:id` | Update dealer |
| `DELETE` | `/api/dealers/:id` | Delete dealer |

### Sales / Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sales/dashboard` | KPIs + weekly sales + alerts |

---

## 🔒 Security

- Passwords hashed with **Bcrypt** (10 salt rounds) — never stored in plain text
- **JWT** tokens expire in 30 days, stored securely in AsyncStorage
- All API routes protected by `authMiddleware` that validates the JWT
- Every database query filters by `userId` — no cross-user data leaks
- Password reset tokens are hashed and expire after a set time

---

## 🌍 Localization

RetailPro supports multiple Indian languages via the built-in `TranslationService`:

| Language | Code |
|----------|------|
| English  | `en` |
| Telugu   | `te` |
| Hindi    | `hi` |
| Tamil    | `ta` |

Use the `useTranslate` hook inside any screen to get translated strings.

---

## 🔮 Future Roadmap

- [ ] 📵 Offline sync (expo-sqlite queue → sync on reconnect)
- [ ] 📷 QR / Barcode scanning for fast billing
- [ ] 🖨️ Bluetooth thermal printer support (58mm / 80mm)
- [ ] 🤖 ML sales forecasting (ARIMA / LSTM)
- [ ] 🏪 Multi-shop support per owner account
- [ ] 📊 GSTR-1 auto-export for GST filing

---

## 👨‍💻 Team

| Name | Role |
|------|------|
| **Shaik Masthan Basha** | Full Stack Developer |
| **Shaik Nasir Ahammed** | Team Member |

**Guide:** Ms. E. Susmitha, M.Tech (Ph.D)  
**Institution:** RGUKT RK Valley · 2024–2025

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ for India's small retailers
</div>
