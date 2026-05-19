-- AgriAdvisor MySQL Database Schema and Seed Data
-- Import this file into phpMyAdmin

CREATE DATABASE IF NOT EXISTS agriadvisor;
USE agriadvisor;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS marketplace_listings;
DROP TABLE IF EXISTS notifications_and_alerts;
DROP TABLE IF EXISTS market_prices;
DROP TABLE IF EXISTS crop_inventory;
DROP TABLE IF EXISTS soil_health;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('farmer', 'buyer', 'expert') NOT NULL DEFAULT 'farmer',
    phone VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    crop VARCHAR(255) NOT NULL,
    farm_size DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE soil_health (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ph_level FLOAT,
    nitrogen FLOAT,
    phosphorus FLOAT,
    potassium FLOAT,
    moisture FLOAT,
    test_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE crop_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    crop_name VARCHAR(255) NOT NULL,
    quantity_qtl FLOAT NOT NULL,
    grade VARCHAR(50),
    status ENUM('Active', 'Pending', 'Sold Out') NOT NULL DEFAULT 'Active',
    price_per_qtl DECIMAL(10,2) NOT NULL,
    added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE marketplace_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NOT NULL,
    seller_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    listed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES crop_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    quantity_bought FLOAT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE TABLE notifications_and_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('alert', 'notification', 'ai_recommendation') NOT NULL,
    icon VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence_score FLOAT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price_per_qtl DECIMAL(10,2) NOT NULL,
    min_price DECIMAL(10,2) NOT NULL,
    max_price DECIMAL(10,2) NOT NULL,
    change_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    trend ENUM('up', 'down', 'flat') NOT NULL DEFAULT 'flat',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users (first_name, last_name, name, email, password_hash, role, phone, location, crop, farm_size) VALUES
('Ravi', 'Kumar', 'Ravi Kumar', 'ravi@example.com', 'hashed_pw_1', 'farmer', '9876543210', 'Rohtak, Haryana', 'Wheat', 5.00),
('Singh', 'Farms', 'Singh Farms', 'singh@example.com', 'hashed_pw_2', 'farmer', '9876543211', 'Karnal, Haryana', 'Rice', 8.00),
('AgroCorp', 'Buyer', 'AgroCorp Buyer', 'buyer1@example.com', 'hashed_pw_3', 'buyer', '9876543212', 'Delhi, NCR', 'Wheat', NULL);

INSERT INTO soil_health (user_id, ph_level, nitrogen, phosphorus, potassium, moisture, test_date) VALUES
(1, 6.8, 280.5, 120.0, 200.0, 45.5, '2026-04-10'),
(2, 7.1, 240.0, 110.5, 190.0, 42.0, '2026-04-15');

INSERT INTO crop_inventory (user_id, crop_name, quantity_qtl, grade, status, price_per_qtl) VALUES
(1, 'Premium Wheat', 12.0, 'Grade A', 'Active', 2150.00),
(1, 'Red Onions', 5.0, 'Organic', 'Pending', 2800.00),
(1, 'Mustard Seeds', 8.0, 'Hybrid', 'Sold Out', 5100.00),
(2, 'Organic Chana', 20.0, 'Grade A', 'Active', 5300.00),
(2, 'Hybrid Maize', 50.0, 'Grade B', 'Active', 1850.00);

INSERT INTO marketplace_listings (inventory_id, seller_id, is_active) VALUES
(1, 1, TRUE),
(4, 2, TRUE),
(5, 2, TRUE);

INSERT INTO transactions (listing_id, buyer_id, seller_id, quantity_bought, total_price, status) VALUES
(1, 3, 1, 12.0, 25800.00, 'completed');

INSERT INTO notifications_and_alerts (user_id, type, icon, title, description, confidence_score) VALUES
(1, 'ai_recommendation', '🌧️', 'Delay Irrigation by 2 Days', 'Heavy rain (15mm) is expected within 36 hours. Skipping the next irrigation cycle will prevent waterlogging.', 94.0),
(1, 'ai_recommendation', '🧪', 'Apply Top Dressing (Urea)', 'Your Wheat crop is at the CRI stage. Apply Urea (25 kg/ha) within the next 48 hours for optimal tiller development.', 91.0),
(1, 'alert', '⚠️', 'Weather Alert', 'High wind speeds detected in your region. Secure loose equipment.', NULL),
(1, 'notification', '💰', 'Sale Completed', 'You successfully sold 12 qtl of Wheat to AgroCorp.', NULL);

INSERT INTO market_prices (crop_name, category, price_per_qtl, min_price, max_price, change_value, trend) VALUES
('Wheat', 'cereal', 2100.00, 1980.00, 2250.00, 80.00, 'up'),
('Rice (Basmati)', 'cereal', 3800.00, 3600.00, 4100.00, -120.00, 'down'),
('Rice (Non-Basmati)', 'cereal', 2500.00, 2300.00, 2700.00, 50.00, 'up'),
('Maize', 'cereal', 1800.00, 1650.00, 1960.00, 30.00, 'up'),
('Sugarcane', 'cash', 320.00, 290.00, 350.00, 0.00, 'flat'),
('Cotton', 'cash', 6200.00, 5800.00, 6600.00, 250.00, 'up'),
('Mustard', 'oilseed', 5100.00, 4800.00, 5400.00, -80.00, 'down'),
('Sunflower', 'oilseed', 4800.00, 4500.00, 5100.00, 100.00, 'up'),
('Soybean', 'oilseed', 3900.00, 3700.00, 4200.00, -50.00, 'down'),
('Chana (Chickpea)', 'pulse', 5200.00, 4900.00, 5600.00, 120.00, 'up'),
('Urad Dal', 'pulse', 6800.00, 6400.00, 7200.00, 200.00, 'up'),
('Moong Dal', 'pulse', 7200.00, 6800.00, 7700.00, -100.00, 'down'),
('Potato', 'vegetable', 1200.00, 1000.00, 1450.00, 40.00, 'up'),
('Onion', 'vegetable', 2800.00, 2400.00, 3200.00, -200.00, 'down'),
('Tomato', 'vegetable', 1800.00, 1400.00, 2400.00, 350.00, 'up');
