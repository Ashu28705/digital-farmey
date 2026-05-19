-- AgriAdvisor Seed Data

-- Insert Users
INSERT INTO users (name, email, password_hash, role, phone, location) VALUES 
('Ravi Kumar', 'ravi@example.com', 'hashed_pw_1', 'farmer', '9876543210', 'Rohtak, Haryana'),
('Singh Farms', 'singh@example.com', 'hashed_pw_2', 'farmer', '9876543211', 'Karnal, Haryana'),
('AgroCorp Buyer', 'buyer1@example.com', 'hashed_pw_3', 'buyer', '9876543212', 'Delhi, NCR');

-- Insert Soil Health
INSERT INTO soil_health (user_id, ph_level, nitrogen, phosphorus, potassium, moisture, test_date) VALUES 
(1, 6.8, 280.5, 120.0, 200.0, 45.5, '2026-04-10'),
(2, 7.1, 240.0, 110.5, 190.0, 42.0, '2026-04-15');

-- Insert Crop Inventory
INSERT INTO crop_inventory (user_id, crop_name, quantity_qtl, grade, status, price_per_qtl) VALUES 
(1, 'Premium Wheat', 12.0, 'Grade A', 'Active', 2150.0),
(1, 'Red Onions', 5.0, 'Organic', 'Pending', 2800.0),
(1, 'Mustard Seeds', 8.0, 'Hybrid', 'Sold Out', 5100.0),
(2, 'Organic Chana', 20.0, 'Grade A', 'Active', 5300.0),
(2, 'Hybrid Maize', 50.0, 'Grade B', 'Active', 1850.0);

-- Insert Marketplace Listings
INSERT INTO marketplace_listings (inventory_id, seller_id, is_active) VALUES 
(1, 1, 1),
(4, 2, 1),
(5, 2, 1);

-- Insert Transactions
INSERT INTO transactions (listing_id, buyer_id, seller_id, quantity_bought, total_price, status) VALUES 
(1, 3, 1, 12.0, 25800.0, 'completed');

-- Insert Notifications & Alerts
INSERT INTO notifications_and_alerts (user_id, type, icon, title, description, confidence_score) VALUES 
(1, 'ai_recommendation', '🌧️', 'Delay Irrigation by 2 Days', 'Heavy rain (15mm) is expected within 36 hours. Skipping the next irrigation cycle will prevent waterlogging.', 94.0),
(1, 'ai_recommendation', '🧪', 'Apply Top Dressing (Urea)', 'Your Wheat crop is at the CRI stage. Apply Urea (25 kg/ha) within the next 48 hours for optimal tiller development.', 91.0),
(1, 'alert', '⚠️', 'Weather Alert', 'High wind speeds detected in your region. Secure loose equipment.', NULL),
(1, 'notification', '💰', 'Sale Completed', 'You successfully sold 12 qtl of Wheat to AgroCorp.', NULL);
