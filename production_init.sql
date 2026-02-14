-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cleanup (Drop tables in reverse dependency order)
DROP TABLE IF EXISTS "lending_logs" CASCADE;
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "locations" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;

-- 1. Profiles Table
CREATE TABLE "profiles" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "avatar_url" TEXT,
    "google_id" VARCHAR(255) UNIQUE,
    "microsoft_id" VARCHAR(255) UNIQUE,
    "pro_start_date" TIMESTAMP WITH TIME ZONE,
    "pro_expiry" TIMESTAMP WITH TIME ZONE,
    "is_admin" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Locations Table
CREATE TABLE "locations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "parent_id" UUID REFERENCES "locations"("id") ON DELETE SET NULL,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE "categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(255),
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Items Table
CREATE TABLE "items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10, 2),
    "quantity" INTEGER DEFAULT 1,
    "serial_number" VARCHAR(255),
    "warranty_expires" TIMESTAMP WITH TIME ZONE,
    "photo_url" TEXT,
    "status" VARCHAR(255) DEFAULT 'available',
    "category" VARCHAR(255), -- Legacy/denormalized
    "category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
    "location_id" UUID REFERENCES "locations"("id") ON DELETE SET NULL,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ai_tags" JSONB DEFAULT '[]'::jsonb,
    "image_vector" FLOAT[], -- Standard array of floats
    "borrower" VARCHAR(255),
    "borrower_note" TEXT,
    "lent_at" TIMESTAMP WITH TIME ZONE,
    "due_date" TIMESTAMP WITH TIME ZONE
);

-- 5. LendingLogs Table
CREATE TABLE "lending_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "item_id" UUID NOT NULL REFERENCES "items"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
    "borrower" VARCHAR(255) NOT NULL,
    "due_date" TIMESTAMP WITH TIME ZONE,
    "returned_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEEDING: Admin User
INSERT INTO "profiles" (
    "id", 
    "email", 
    "password_hash", 
    "full_name", 
    "is_admin", 
    "created_at", 
    "updated_at"
) VALUES (
    uuid_generate_v4(),
    'p9386415@gmail.com',
    '$2b$10$EpRnTzVlqHNP0.fUbXUwSO90oCNI7uYb45gq/8.R.s.R.s.R.s.R.', -- Hash for "admin123"
    'Admin User',
    TRUE,
    NOW(),
    NOW()
);

