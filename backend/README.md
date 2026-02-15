# Asset Tracker Backend API

Backend API for Asset Tracker - A Multi-tenant SaaS Asset Inventory Management System.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:
- Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- JWT_SECRET (use a strong random string)
- PORT (default: 5000)

### 3. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE asset_tracker;

# Exit
\q
```

### 4. Initialize Database Schema

```bash
npm run migrate
```

This will create all tables according to the schema.

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (total value, financial loss, overdue count, total items)

### Profiles
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/:id` - Update profile

### Locations
- `GET /api/locations` - List all locations
- `GET /api/locations/:id` - Get location by ID
- `POST /api/locations` - Create location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Items
- `GET /api/items` - List all items (with filters)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/lend` - Lend item
- `POST /api/items/:id/return` - Return item

### Lending Logs
- `GET /api/lending-logs` - List lending logs
- `GET /api/items/:id/lending-logs` - Get lending history for item

## Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require authentication.

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Multi-Tenant Isolation

The system implements row-level multi-tenancy. Each user can only access their own data. The `user_id` field in all tables ensures data isolation.

## Testing

Test database connection:
```bash
npm run test:db
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Sequelize models
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── migrations/          # Database migrations
├── server.js            # Entry point
└── package.json
```
