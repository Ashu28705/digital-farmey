-- AgriAdvisor Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT DEFAULT '',
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('farmer', 'buyer', 'expert')) NOT NULL DEFAULT 'farmer',
    phone TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    crop TEXT NOT NULL,
    farm_size REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS soil_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ph_level REAL,
    nitrogen REAL,
    phosphorus REAL,
    potassium REAL,
    moisture REAL,
    test_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS crop_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    crop_name TEXT NOT NULL,
    quantity_qtl REAL NOT NULL,
    grade TEXT,
    status TEXT CHECK(status IN ('Active', 'Pending', 'Sold Out')) NOT NULL,
    price_per_qtl REAL NOT NULL,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    listed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES crop_inventory(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    buyer_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    quantity_bought REAL NOT NULL,
    total_price REAL NOT NULL,
    status TEXT CHECK(status IN ('completed', 'pending', 'cancelled')) DEFAULT 'completed',
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications_and_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('alert', 'notification', 'ai_recommendation')) NOT NULL,
    icon TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score REAL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_per_qtl REAL NOT NULL,
    min_price REAL NOT NULL,
    max_price REAL NOT NULL,
    change_value REAL NOT NULL DEFAULT 0,
    trend TEXT NOT NULL DEFAULT 'flat',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
