# AssetTracker - Physical Asset Management System

A modern, responsive web application for tracking personal or organizational assets with QR scanning, lending management, and role-based administration.

## 🌟 Project Title & One-Line Pitch

**"AssetTracker - Physical Asset Management System"**

A modern, responsive web application for tracking personal or organizational assets with QR scanning, lending management, and role-based administration.

## 🚀 Key Features

*   **Dual-Role Authentication:**
    *   Secure Email/Password Login (JWT).
    *   **OAuth Integration** (Google & Microsoft).
    *   **Split Login Flow:** Dedicated "Admin Login" vs. "Standard Sign In".
*   **Admin Dashboard:**
    *   Visual statistics (Total Users, Items, Value).
    *   User Management Table (View all users, Delete users).
    *   Role-based route protection (`RequireAdmin`).
*   **Asset Management:**
    *   Create, Read, Update, Delete (CRUD) items.
    *   Organize items by **Locations**.
    *   **Search & Filter** functionality.
*   **Advanced Tools:**
    *   **QR Code/Barcode Scanning** (for quick lookup).
    *   **Lending System** (Track borrowed/lent items).
    *   **PayPal Integration** (for payments/subscriptions).
    *   **Dark Mode** support.

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white)

*   **Frontend:** React, Vite, Tailwind CSS, Lucide React (Icons), React Router v6.
*   **Backend:** Node.js, Express, Sequelize ORM.
*   **Database:** PostgreSQL.
*   **Security:** BCrypt (hashing), JWT (tokens), CORS.

## 📦 Installation & Setup

### Prerequisites

*   Node.js (v16 or higher)
*   PostgreSQL installed and running
*   Git

### 1. Cloning the Repo

```bash
git clone https://github.com/yangpeisen/asset-tracker.git
cd asset-tracker
```

### 2. Database Setup

1.  Open your PostgreSQL tool (e.g., pgAdmin or command line).
2.  Create a new database named `asset_tracker`.

```sql
CREATE DATABASE asset_tracker;
```

### 3. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory based on the template below:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asset_tracker
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

Run database migrations (if applicable) or start the server to sync models:

```bash
npm run migrate
# OR
npm run dev
```

### 4. Frontend Setup

Open a new terminal, navigate to the project root (frontend), and install dependencies:

```bash
cd ..
# or cd asset-tracker if opening a new terminal
npm install
```

Create a `.env.local` file in the root directory if needed (for frontend-specific vars):

```bash
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

### 5. Running the App

*   **Backend:** Runs on `http://localhost:5000`
*   **Frontend:** Runs on `http://localhost:5173`

Access the application at `http://localhost:5173`.

## 📸 Screenshots

### Login Screen
![Login Screen](path/to/image)

### Admin Dashboard
![Admin Dashboard](path/to/image)

### Asset Scanning
![Asset Scanning](path/to/image)

## 📞 Contact

*   **Developer:** Yang Peisen
*   **Email:** p9386415@gmail.com
*   **GitHub:** [Yang Peisen](https://github.com/yangpeisen)
