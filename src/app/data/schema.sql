-- Database Schema for Health Modules

-- 1. Food Diary
CREATE TABLE IF NOT EXISTS food_diary_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT, -- Not strictly enforced with FK if users table is managed elsewhere
    meals JSONB,
    feelings TEXT,
    reflection TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Plan Your Plate
CREATE TABLE IF NOT EXISTS meal_plan_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    meals JSONB,
    reflection TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Daily Sugar Ease
CREATE TABLE IF NOT EXISTS sugar_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    total_sugar NUMERIC,
    score NUMERIC,
    level TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Healthy Recipe Log
CREATE TABLE IF NOT EXISTS healthy_recipes (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    ingredients TEXT,
    instructions TEXT,
    prep_time TEXT,
    meal_type TEXT,
    rating INTEGER,
    healthiness TEXT,
    tags TEXT[],
    photo TEXT,
    reflection TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
