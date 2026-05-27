const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();
const connection = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_agriadvisor_key';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

const pool = connection.promise();

app.use(cors());
app.use(express.json());

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function fallbackEmail(phone) {
  const digits = normalizePhone(phone) || Date.now().toString();
  return `user_${digits}@local.agriadvisor`;
}

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name || row.firstName || row.name?.split(' ')[0] || '',
    lastName: row.last_name || row.lastName || row.name?.split(' ').slice(1).join(' ') || '',
    email: row.email,
    phone: row.phone,
    location: row.location,
    crop: row.crop,
    farmSize: row.farm_size,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapCrop(row) {
  if (!row) return null;
  const category = inferCropCategory(row.crop_name);
  const hasListingFlag = Object.prototype.hasOwnProperty.call(row, 'listing_active');
  return {
    id: row.id,
    cropName: row.crop_name,
    category,
    cat: category,
    quantity: Number(row.quantity_qtl),
    grade: row.grade,
    status: row.status,
    price: Number(row.price_per_qtl),
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    location: row.location,
    createdAt: row.added_date,
    isListed: hasListingFlag ? !!row.listing_active : true,
  };
}

function inferCropCategory(cropName) {
  const text = String(cropName || '').toLowerCase();
  if (/(wheat|rice|paddy|maize|corn|jowar|bajra|barley)/.test(text)) return 'cereal';
  if (/(mustard|soybean|sunflower|groundnut|sesame|linseed|rapeseed|oilseed)/.test(text)) return 'oilseed';
  if (/(chana|gram|lentil|moong|urad|masoor|pea|pulse)/.test(text)) return 'pulse';
  if (/(tomato|onion|potato|cabbage|cauliflower|brinjal|chilli|vegetable|okra|pea)/.test(text)) return 'vegetable';
  if (/(cotton|sugarcane|tobacco|tea|coffee|jute)/.test(text)) return 'cash';
  return 'other';
}

function mapMarketPrice(row) {
  return {
    id: row.id,
    crop: row.crop_name,
    category: row.category,
    price: Number(row.price_per_qtl),
    min: Number(row.min_price),
    max: Number(row.max_price),
    change: Number(row.change_value),
    trend: row.trend,
    updatedAt: row.updated_at,
  };
}

function calculateProfileScore(user, inventoryRows, transactionRows, soilRows) {
  const fields = [
    user?.first_name,
    user?.last_name,
    user?.phone,
    user?.location,
    user?.crop,
    user?.farm_size,
  ];
  const completeness = (fields.filter(Boolean).length / fields.length) * 100;
  const inventoryScore = Math.min((inventoryRows.length / 5) * 100, 100);
  const salesScore = Math.min((transactionRows.length / 10) * 100, 100);
  const soilScore = soilRows.length > 0 ? 100 : 0;
  const score = Math.round(completeness * 0.4 + inventoryScore * 0.25 + salesScore * 0.25 + soilScore * 0.1);
  return Math.max(0, Math.min(100, score));
}

function buildProfileChecklist(user, inventoryRows, transactionRows, soilRows) {
  const checklist = [
    { done: !!user?.phone, t: 'Phone number verified' },
    { done: !!user?.location, t: 'Farm location added' },
    { done: !!user?.crop, t: 'Primary crop set' },
    { done: inventoryRows.length > 0, t: 'Add inventory listing' },
    { done: transactionRows.length > 0, t: 'Complete first sale' },
    { done: soilRows.length > 0, t: 'Add soil health record' },
  ];
  return checklist;
}

function buildAchievements(stats, profileScore) {
  return [
    { icon: '🌾', label: 'First Sale', pts: '50 pts', locked: stats.cropsSold < 1 },
    { icon: '⭐', label: '5-Star Seller', pts: '200 pts', locked: profileScore < 90 },
    { icon: '🔟', label: '10 Sales Club', pts: '500 pts', locked: stats.cropsSold < 10 },
    { icon: '💰', label: '₹1L Revenue', pts: '1000 pts', locked: stats.revenue < 100000 },
    { icon: '🤖', label: 'AI Explorer', pts: '100 pts', locked: profileScore < 70 },
    { icon: '🌍', label: 'Soil Master', pts: '150 pts', locked: stats.soilTests < 1 },
    { icon: '🌿', label: 'Organic Badge', pts: '300 pts', locked: !String(stats.primaryCrop || '').toLowerCase().includes('organic') },
    { icon: '👑', label: 'Elite Farmer', pts: '2000 pts', locked: profileScore < 95 },
    { icon: '🏆', label: 'Top Rated', pts: '800 pts', locked: profileScore < 85 },
  ];
}

function buildProfileBadges(user, stats, profileScore) {
  const badges = [];

  if (user?.phone || user?.location) {
    badges.push({ label: 'Verified Farmer', tone: 'green' });
  }

  if ((stats.revenue || 0) > 0 || (stats.cropsSold || 0) > 0) {
    badges.push({ label: 'Top Seller', tone: 'gold' });
  }

  if ((stats.activeListings || 0) > 0 || profileScore >= 35) {
    badges.push({ label: 'AI User', tone: 'purple' });
  }

  badges.push({ label: `${Number(stats.avgRating || 0).toFixed(1)} Rating`, tone: 'green' });
  return badges;
}

function buildProfileForecast(transactionRows, inventoryRows) {
  const completed = transactionRows.filter(row => String(row.status || '').toLowerCase() === 'completed');
  const revenue = completed.reduce((sum, row) => sum + Number(row.total_price || 0), 0);

  if (completed.length === 0 || revenue <= 0) {
    return {
      revenue30d: 0,
      confidence: 0,
      note: 'No completed sales yet, so the forecast stays at zero until real activity is recorded.',
    };
  }

  const timestamps = completed
    .map(row => new Date(row.transaction_date || Date.now()).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const spanDays = timestamps.length > 1
    ? Math.max(1, Math.ceil((timestamps[timestamps.length - 1] - timestamps[0]) / 86400000) + 1)
    : 1;

  const avgDailyRevenue = revenue / spanDays;
  const stockFactor = Math.min(1.4, Math.max(0.6, (inventoryRows.length || 1) / 2));
  const revenue30d = Math.max(0, Math.round(avgDailyRevenue * 30 * stockFactor));
  const confidence = Math.min(92, 40 + completed.length * 7 + inventoryRows.length * 3);

  return {
    revenue30d,
    confidence,
    note: `${completed.length} completed sale${completed.length === 1 ? '' : 's'} used for the forecast.`,
  };
}

function notificationKey(prefix, parts = []) {
  return [prefix, ...parts].map(part => String(part || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')).join(':');
}

function notificationTimeLabel(dateValue) {
  const date = new Date(dateValue || Date.now());
  const diff = Date.now() - date.getTime();
  const hour = 3600000;
  const day = 24 * hour;
  if (diff < hour) return 'Just now';
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))} hours ago`;
  if (diff < 2 * day) return 'Yesterday';
  return `${Math.max(2, Math.round(diff / day))} days ago`;
}

function notificationActionForType(type) {
  if (type === 'alert') return 'View Alerts';
  if (type === 'market') return 'View Market';
  if (type === 'sale') return 'View Sale';
  if (type === 'ai_recommendation') return 'View Advice';
  return 'Open';
}

async function syncNotificationsForUser(userId) {
  const userRows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  const user = userRows[0];
  if (!user) return [];

  const location = user.location || 'Rohtak, Haryana';
  const notifications = [];

  let weather = null;
  try {
    const weatherResponse = await fetch(`http://localhost:${PORT}/api/weather?location=${encodeURIComponent(location)}`);
    if (weatherResponse.ok) {
      weather = await weatherResponse.json();
    }
  } catch (err) {
    weather = null;
  }

  const current = weather?.current || {};
  const daily = Array.isArray(weather?.daily) ? weather.daily : [];
  const maxRain = Math.max(Number(current.rainProbability || 0), ...daily.map(day => Number(day.rainProb || 0)), 0);
  const maxTemp = Math.max(Number(current.temperature || 0), ...daily.map(day => Number(day.tempMax || 0)), 0);
  const maxWind = Math.max(Number(current.windSpeed || 0), 0);

  if (maxRain >= 70) {
    notifications.push({
      source_key: notificationKey('weather', ['heavy-rain', location]),
      type: 'alert',
      icon: '🌧️',
      title: 'Heavy Rainfall Warning',
      description: `Live forecast for ${location} shows a high chance of rain. Delay spraying and keep drains clear.`,
      category: 'weather',
      confidence: Math.min(99, 85 + Math.round(maxRain / 2)),
      link_url: 'alerts.html',
    });
  }

  if (maxTemp >= 40) {
    notifications.push({
      source_key: notificationKey('weather', ['heatwave', location]),
      type: 'alert',
      icon: '🔥',
      title: 'Heatwave Alert',
      description: `Temperatures near ${Math.round(maxTemp)} C are expected. Irrigate early morning or late evening.`,
      category: 'weather',
      confidence: 90,
      link_url: 'alerts.html',
    });
  }

  if (maxWind >= 35) {
    notifications.push({
      source_key: notificationKey('weather', ['wind', location]),
      type: 'alert',
      icon: '💨',
      title: 'Strong Wind Warning',
      description: `Wind speeds are trending near ${Math.round(maxWind)} km/h. Secure loose equipment and tall crops.`,
      category: 'weather',
      confidence: 88,
      link_url: 'alerts.html',
    });
  }

  const marketRows = await query(
    'SELECT crop_name, price_per_qtl, change_value, trend, updated_at FROM market_prices ORDER BY ABS(change_value) DESC, updated_at DESC LIMIT 3'
  );
  for (const row of marketRows) {
    const change = Number(row.change_value || 0);
    if (!change) continue;
    notifications.push({
      source_key: notificationKey('market', [row.crop_name, row.updated_at]),
      type: 'notification',
      icon: change > 0 ? '📈' : '📉',
      title: `${row.crop_name} Price ${change > 0 ? 'Up' : 'Down'} ₹${Math.abs(change)}`,
      description: `${row.crop_name} is now ₹${Number(row.price_per_qtl).toLocaleString('en-IN')}/quintal. Check whether it is a good time to sell.`,
      category: 'market',
      confidence: 82,
      link_url: 'market-prices.html',
    });
  }

  const latestTxns = await query(
    `SELECT t.*, ci.crop_name
     FROM transactions t
     LEFT JOIN marketplace_listings ml ON ml.id = t.listing_id
     LEFT JOIN crop_inventory ci ON ci.id = ml.inventory_id
     WHERE t.seller_id = ?
     ORDER BY t.transaction_date DESC
     LIMIT 3`,
    [userId]
  );
  for (const row of latestTxns) {
    notifications.push({
      source_key: notificationKey('sale', [row.id]),
      type: 'notification',
      icon: '💰',
      title: `${row.crop_name || 'Crop'} sale completed`,
      description: `A buyer purchased ${Number(row.quantity_bought || 0)} qtl for ₹${Number(row.total_price || 0).toLocaleString('en-IN')}.`,
      category: 'sales',
      confidence: 95,
      link_url: 'profile.html',
    });
  }

  const profileRows = await query('SELECT * FROM crop_inventory WHERE user_id = ? ORDER BY added_date DESC LIMIT 2', [userId]);
  if (profileRows.length === 0) {
    notifications.push({
      source_key: notificationKey('ai', ['inventory', userId]),
      type: 'ai_recommendation',
      icon: '🤖',
      title: 'Add your first crop listing',
      description: 'Your profile is complete enough to start listing crops. Add inventory to unlock marketplace activity and recommendations.',
      category: 'ai',
      confidence: 78,
      link_url: 'sell-crops.html',
    });
  } else {
    notifications.push({
      source_key: notificationKey('ai', ['weather-advice', location]),
      type: 'ai_recommendation',
      icon: '💡',
      title: 'AI farming advice ready',
      description: `Based on live weather in ${location}, I can suggest the safest irrigation and spraying window.`,
      category: 'ai',
      confidence: 83,
      link_url: 'chatbot.html',
    });
  }

  await exec('DELETE FROM notifications_and_alerts WHERE user_id = ? AND source_key IS NOT NULL', [userId]);

  for (const item of notifications) {
    await exec(
      `INSERT INTO notifications_and_alerts
        (user_id, type, icon, title, description, confidence_score, is_read, created_at, source_key, category, link_url)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW(), ?, ?, ?)`,
      [
        userId,
        item.type,
        item.icon,
        item.title,
        item.description,
        item.confidence,
        item.source_key,
        item.category,
        item.link_url,
      ]
    );
  }

  return notifications;
}

function classifyChatIntent(message) {
  const text = String(message || '').toLowerCase();
  if (/(weather|rain|temperature|humidity|forecast)/.test(text)) return 'weather';
  if (/(price|market|mandi|sell|rate|quintal)/.test(text)) return 'market';
  if (/(fertilizer|urea|dap|potash|npk|manure)/.test(text)) return 'fertilizer';
  if (/(pest|insect|disease|spray|fungus|aphid|bollworm|locust)/.test(text)) return 'pest';
  if (/(irrigation|drip|sprinkler|water|moisture|watering)/.test(text)) return 'irrigation';
  if (/(soil|ph|nitrogen|phosphorus|potassium|compost|organic)/.test(text)) return 'soil';
  if (/(scheme|subsidy|pm kisan|fasal|insurance|kcc|loan|government)/.test(text)) return 'schemes';
  if (/(wheat|rice|paddy|maize|corn|cotton|mustard|soybean|sugarcane|tomato|onion|potato)/.test(text)) return 'crop';
  if (/(profile|revenue|sales|earnings|listing|inventory|account)/.test(text)) return 'profile';
  return 'general';
}

function extractLikelyLocation(message, user) {
  const text = String(message || '');
  const patterns = [
    /\bweather\s+(?:in|for|at)\s+([A-Za-z][A-Za-z\s.,-]{2,40})/i,
    /\b(?:in|for|at)\s+([A-Za-z][A-Za-z\s.,-]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1]
        .replace(/\b(today|tomorrow|now|currently|please)\b/gi, '')
        .replace(/\s+/g, ' ')
        .replace(/[.,-]\s*$/, '')
        .trim();
    }
  }
  return user?.location || '';
}

async function buildChatbotReply(message, user) {
  const intent = classifyChatIntent(message);
  const location = extractLikelyLocation(message, user);
  const profileRows = user ? await query('SELECT * FROM users WHERE id = ? LIMIT 1', [user.id]) : [];
  const currentUser = profileRows[0] || user || null;

  if (intent === 'weather') {
    if (!location) {
      return {
        reply: 'Share your village, city, or district and I’ll fetch the live weather and forecast for you.',
        intent,
      };
    }

    const weatherRes = await fetch(`http://localhost:${PORT}/api/weather?location=${encodeURIComponent(location)}`);
    if (weatherRes.ok) {
      const weather = await weatherRes.json();
      const today = weather.current || {};
      const daily = Array.isArray(weather.daily) ? weather.daily[0] : null;
      return {
        reply: `Live weather for ${weather.location?.name || location}: ${today.description || 'weather data available'} with ${Math.round(Number(today.temperature || 0))}°C, humidity ${Math.round(Number(today.humidity || 0))}%, and wind ${Math.round(Number(today.windSpeed || 0))} km/h. ${daily ? `Tomorrow looks ${daily.label?.toLowerCase() || 'normal'} with ${Math.round(Number(daily.tempMin || 0))}°C to ${Math.round(Number(daily.tempMax || 0))}°C.` : ''}`,
        intent,
      };
    }

    return {
      reply: `I couldn't fetch live weather for ${location}. Please try again after the weather service responds.`,
      intent,
    };
  }

  if (intent === 'market') {
    const prices = await query('SELECT * FROM market_prices ORDER BY updated_at DESC, crop_name ASC LIMIT 5');
    if (!prices.length) {
      return { reply: 'Market prices are not loaded yet. Please check again after the price table is seeded.', intent };
    }
    const lines = prices.map(row => `• ${row.crop_name}: ₹${Number(row.price_per_qtl).toLocaleString('en-IN')} / quintal (${row.trend || 'flat'})`);
    return {
      reply: `Here are the latest market prices:\n${lines.join('\n')}\nIf you want, I can also compare this with your crop and location.`,
      intent,
    };
  }

  if (intent === 'profile') {
    const inventoryRows = currentUser ? await query('SELECT COUNT(*) AS total FROM crop_inventory WHERE user_id = ?', [currentUser.id]) : [{ total: 0 }];
    const txRows = currentUser ? await query('SELECT COUNT(*) AS total, COALESCE(SUM(total_price),0) AS revenue FROM transactions WHERE seller_id = ?', [currentUser.id]) : [{ total: 0, revenue: 0 }];
    const listingCount = currentUser ? await query('SELECT COUNT(*) AS total FROM marketplace_listings WHERE seller_id = ? AND is_active = TRUE', [currentUser.id]) : [{ total: 0 }];
    const sold = txRows[0]?.total || 0;
    const revenue = Number(txRows[0]?.revenue || 0);
    const listings = listingCount[0]?.total || 0;
    return {
      reply: `${currentUser?.name || 'Your'} account is dynamic now: ${sold} completed sale${sold === 1 ? '' : 's'}, ₹${revenue.toLocaleString('en-IN')} revenue, ${listings} active listing${listings === 1 ? '' : 's'}, and ${inventoryRows[0]?.total || 0} inventory item${(inventoryRows[0]?.total || 0) === 1 ? '' : 's'}.`,
      intent,
    };
  }

  const cropName = currentUser?.crop || 'your crop';
  const baseReply = {
    crop: `For ${cropName}, I can help with sowing, fertilizer, irrigation, pest control, and harvest timing. Tell me your crop stage and I’ll give a focused recommendation.`,
    fertilizer: 'Fertilizer advice works best with crop name, acreage, and soil test values. If you share those, I’ll narrow it down.',
    pest: 'For pests and disease, share the crop, symptoms, and whether the issue is on leaves, stem, or roots.',
    irrigation: 'I can suggest drip, sprinkler, or flood irrigation based on crop, soil type, and water availability.',
    soil: 'Soil advice gets much better with pH, nitrogen, phosphorus, potassium, and moisture values from a soil test.',
    schemes: 'I can summarize farmer schemes like PM-Kisan, PMFBY, PMKSY, and KCC if you want a quick breakdown.',
    general: `I’m ready to help with live weather, market prices, crop advice, fertilizer, pests, soil health, and government schemes. If you share your crop and location, I’ll make the answer more specific.`,
  };

  return { reply: baseReply[intent] || baseReply.general, intent };
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if ([3, 45, 48].includes(code)) return '⛅';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return '🌦️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌤️';
}

function getWeatherLabel(code) {
  if (code === 0) return 'Clear sky';
  if ([1, 2].includes(code)) return 'Partly cloudy';
  if ([3, 45, 48].includes(code)) return 'Cloudy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Rain showers';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Weather';
}

function normalizeLocationQuery(location) {
  return String(location || '')
    .trim()
    .replace(/[^\w\s,.-]/g, '')
    .replace(/\s+/g, ' ')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .join(',');
}

function buildLocationCandidates(location) {
  const normalized = normalizeLocationQuery(location);
  const cityOnly = normalized.split(',')[0] || normalized;
  const candidates = [cityOnly, normalized];
  if (cityOnly && cityOnly !== normalized) {
    candidates.push(`${cityOnly},IN`);
  }
  if (!/,[A-Z]{2}$/.test(normalized)) {
    candidates.push(`${normalized},IN`);
  }
  return [...new Set(candidates.filter(Boolean))];
}

function mapOpenWeatherIcon(code) {
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 400) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '🌨️';
  if (code >= 700 && code < 800) return '🌫️';
  if (code === 800) return '☀️';
  if (code === 801) return '🌤️';
  if (code === 802) return '⛅';
  if (code === 803 || code === 804) return '☁️';
  return '🌤️';
}

function mapOpenWeatherLabel(code) {
  if (code >= 200 && code < 300) return 'Thunderstorm';
  if (code >= 300 && code < 400) return 'Drizzle';
  if (code >= 500 && code < 600) return 'Rain';
  if (code >= 600 && code < 700) return 'Snow';
  if (code >= 700 && code < 800) return 'Mist';
  if (code === 800) return 'Clear sky';
  if (code === 801) return 'Few clouds';
  if (code === 802) return 'Scattered clouds';
  if (code === 803 || code === 804) return 'Cloudy';
  return 'Weather';
}

async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function exec(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return result;
}

async function seedMarketPrices() {
  const rows = await query('SELECT COUNT(*) AS total FROM market_prices');
  if (rows[0].total > 0) return;

  const seed = [
    ['Wheat', 'cereal', 2100, 1980, 2250, 80, 'up'],
    ['Rice (Basmati)', 'cereal', 3800, 3600, 4100, -120, 'down'],
    ['Rice (Non-Basmati)', 'cereal', 2500, 2300, 2700, 50, 'up'],
    ['Maize', 'cereal', 1800, 1650, 1960, 30, 'up'],
    ['Sugarcane', 'cash', 320, 290, 350, 0, 'flat'],
    ['Cotton', 'cash', 6200, 5800, 6600, 250, 'up'],
    ['Mustard', 'oilseed', 5100, 4800, 5400, -80, 'down'],
    ['Sunflower', 'oilseed', 4800, 4500, 5100, 100, 'up'],
    ['Soybean', 'oilseed', 3900, 3700, 4200, -50, 'down'],
    ['Chana (Chickpea)', 'pulse', 5200, 4900, 5600, 120, 'up'],
    ['Urad Dal', 'pulse', 6800, 6400, 7200, 200, 'up'],
    ['Moong Dal', 'pulse', 7200, 6800, 7700, -100, 'down'],
    ['Potato', 'vegetable', 1200, 1000, 1450, 40, 'up'],
    ['Onion', 'vegetable', 2800, 2400, 3200, -200, 'down'],
    ['Tomato', 'vegetable', 1800, 1400, 2400, 350, 'up'],
  ];

  for (const item of seed) {
    await exec(
      `INSERT INTO market_prices
        (crop_name, category, price_per_qtl, min_price, max_price, change_value, trend)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      item
    );
  }
}

async function initDatabase() {
  const adminConnection = mysql.createConnection({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port,
  });

  const admin = adminConnection.promise();
  await admin.query(
    `CREATE DATABASE \`${DB_CONFIG.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  await exec(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) DEFAULT '',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      location VARCHAR(255) NOT NULL,
      crop VARCHAR(255) NOT NULL,
      farm_size DECIMAL(10,2) DEFAULT NULL,
      role ENUM('farmer', 'buyer', 'expert') NOT NULL DEFAULT 'farmer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await exec(`ALTER TABLE users ADD COLUMN first_name VARCHAR(100) NULL`);
  await exec(`ALTER TABLE users ADD COLUMN last_name VARCHAR(100) NULL DEFAULT ''`);
  await exec(`ALTER TABLE users ADD COLUMN crop VARCHAR(255) NULL`);
  await exec(`ALTER TABLE users ADD COLUMN farm_size DECIMAL(10,2) NULL`);
  await exec(`ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NULL`);
  await exec(`ALTER TABLE users MODIFY COLUMN location VARCHAR(255) NULL`);
  await exec(`ALTER TABLE users MODIFY COLUMN role ENUM('farmer', 'buyer', 'expert') NOT NULL DEFAULT 'farmer'`);

  await exec(`
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
    )
  `);

  await exec(`
    CREATE TABLE marketplace_listings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inventory_id INT NOT NULL,
      seller_id INT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      listed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_id) REFERENCES crop_inventory(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await exec(`
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
    )
  `);

  await exec(`
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
    )
  `);

  await exec(`
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
    )
  `);

  await exec(`
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
    )
  `);
  await exec(`ALTER TABLE notifications_and_alerts ADD COLUMN source_key VARCHAR(191) NULL`);
  await exec(`ALTER TABLE notifications_and_alerts ADD COLUMN category VARCHAR(50) NULL`);
  await exec(`ALTER TABLE notifications_and_alerts ADD COLUMN link_url VARCHAR(255) NULL`);

  await seedMarketPrices();
}

const authMiddleware = (req, res, next) => {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Access denied: no token provided' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName = '', phone, email, location, crop, farmSize, password } = req.body;

    if (!firstName || !phone || !location || !crop || !password) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const normalizedPhone = normalizePhone(phone);
    const safeEmail = (email && String(email).trim()) || fallbackEmail(normalizedPhone);

    const existing = await query('SELECT id FROM users WHERE phone = ? OR email = ?', [
      normalizedPhone,
      safeEmail,
    ]);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const name = `${firstName} ${lastName}`.trim();

    const result = await exec(
      `INSERT INTO users
        (first_name, last_name, name, email, password_hash, phone, location, crop, farm_size, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'farmer')`,
      [
        firstName,
        lastName,
        name,
        safeEmail,
        hashedPassword,
        normalizedPhone,
        location,
        crop,
        farmSize || null,
      ]
    );

    const inserted = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const token = jwt.sign({ id: result.insertId }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: toUser(inserted[0]),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const normalizedPhone = normalizePhone(phone);
    const rows = await query('SELECT * FROM users WHERE phone = ? LIMIT 1', [normalizedPhone]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: toUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/user/me', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(toUser(rows[0]));
  } catch (error) {
    console.error('User fetch error:', error);
    return res.status(500).json({ error: 'Server error fetching user' });
  }
});

app.post('/api/crops', authMiddleware, async (req, res) => {
  try {
    const { cropName, quantity, price, grade = 'Standard' } = req.body;
    if (!cropName || quantity === undefined || price === undefined) {
      return res.status(400).json({ error: 'Missing crop fields' });
    }

    const userRows = await query('SELECT id, name, location FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const cropResult = await exec(
      `INSERT INTO crop_inventory
        (user_id, crop_name, quantity_qtl, grade, status, price_per_qtl)
       VALUES (?, ?, ?, ?, 'Active', ?)`,
      [req.user.id, cropName, quantity, grade, price]
    );

    await exec(
      `INSERT INTO marketplace_listings (inventory_id, seller_id, is_active)
       VALUES (?, ?, TRUE)`,
      [cropResult.insertId, req.user.id]
    );

    const inserted = await query(
      `SELECT ci.*, u.name AS seller_name, u.location
       FROM crop_inventory ci
       JOIN users u ON u.id = ci.user_id
       WHERE ci.id = ?`,
      [cropResult.insertId]
    );

    return res.json(mapCrop(inserted[0]));
  } catch (error) {
    console.error('Add crop error:', error);
    return res.status(500).json({ error: 'Server error adding crop' });
  }
});

app.get('/api/crops/my-inventory', authMiddleware, async (req, res) => {
  try {
    const rows = await query(
      `SELECT ci.*, u.name AS seller_name, u.location
       FROM crop_inventory ci
       JOIN users u ON u.id = ci.user_id
       WHERE ci.user_id = ?
       ORDER BY ci.added_date DESC`,
      [req.user.id]
    );

    return res.json(rows.map(mapCrop));
  } catch (error) {
    console.error('Inventory error:', error);
    return res.status(500).json({ error: 'Server error fetching inventory' });
  }
});

  app.get('/api/crops/marketplace', async (req, res) => {
    try {
      const rows = await query(
        `SELECT ci.*, u.name AS seller_name, u.location, ml.is_active AS listing_active
         FROM crop_inventory ci
         JOIN users u ON u.id = ci.user_id
         LEFT JOIN marketplace_listings ml ON ml.inventory_id = ci.id
         WHERE ci.status = 'Active' AND (ml.is_active = TRUE OR ml.id IS NULL)
         ORDER BY ci.added_date DESC`
      );

    return res.json(rows.map(mapCrop));
  } catch (error) {
    console.error('Marketplace error:', error);
    return res.status(500).json({ error: 'Server error fetching marketplace' });
  }
});

app.get('/api/crops/:id', async (req, res) => {
  try {
    const rows = await query(
      `SELECT ci.*, u.name AS seller_name, u.location
       FROM crop_inventory ci
       JOIN users u ON u.id = ci.user_id
       WHERE ci.id = ? LIMIT 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    return res.json(mapCrop(rows[0]));
  } catch (error) {
    console.error('Crop fetch error:', error);
    return res.status(500).json({ error: 'Server error fetching crop' });
  }
});

app.put('/api/crops/:id', authMiddleware, async (req, res) => {
  try {
    const { status, quantity } = req.body;
    const rows = await query('SELECT * FROM crop_inventory WHERE id = ? LIMIT 1', [req.params.id]);
    const crop = rows[0];

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    if (Number(crop.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const nextStatus = status || crop.status;
    const nextQuantity = quantity !== undefined ? quantity : crop.quantity_qtl;

    await exec(
      'UPDATE crop_inventory SET status = ?, quantity_qtl = ? WHERE id = ?',
      [nextStatus, nextQuantity, req.params.id]
    );

    await exec(
      'UPDATE marketplace_listings SET is_active = ? WHERE inventory_id = ?',
      [nextStatus === 'Active', req.params.id]
    );

    const updated = await query(
      `SELECT ci.*, u.name AS seller_name, u.location
       FROM crop_inventory ci
       JOIN users u ON u.id = ci.user_id
       WHERE ci.id = ? LIMIT 1`,
      [req.params.id]
    );

    return res.json(mapCrop(updated[0]));
  } catch (error) {
    console.error('Crop update error:', error);
    return res.status(500).json({ error: 'Server error updating crop' });
  }
});

app.delete('/api/crops/:id', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM crop_inventory WHERE id = ? LIMIT 1', [req.params.id]);
    const crop = rows[0];

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    if (Number(crop.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await exec('DELETE FROM marketplace_listings WHERE inventory_id = ?', [req.params.id]);
    await exec('DELETE FROM crop_inventory WHERE id = ?', [req.params.id]);

    return res.json({ message: 'Crop deleted successfully' });
  } catch (error) {
    console.error('Crop delete error:', error);
    return res.status(500).json({ error: 'Server error deleting crop' });
  }
});

app.get('/api/market-prices', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM market_prices ORDER BY category, crop_name');
    return res.json(rows.map(mapMarketPrice));
  } catch (error) {
    console.error('Market prices error:', error);
    return res.status(500).json({ error: 'Server error fetching market prices' });
  }
});

app.post('/api/chatbot', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let user = null;
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [payload.id]);
        user = rows[0] ? toUser(rows[0]) : null;
      } catch (err) {
        user = null;
      }
    }

    const result = await buildChatbotReply(message, user);
    return res.json({
      reply: result.reply,
      intent: result.intent,
      user: user ? { name: user.name, crop: user.crop, location: user.location } : null,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ error: 'Server error generating chatbot reply' });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const location = String(req.query.location || '').trim();
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const locationCandidates = buildLocationCandidates(location);
    if (OPENWEATHER_API_KEY) {
      let place = null;
      for (const candidate of locationCandidates) {
        const geoResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(candidate)}&limit=1&appid=${encodeURIComponent(OPENWEATHER_API_KEY)}`
        );
        const geoData = await geoResponse.json();
        place = Array.isArray(geoData) ? geoData[0] : null;
        if (place) break;
      }

      if (place) {
        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&appid=${encodeURIComponent(OPENWEATHER_API_KEY)}&units=metric`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${place.lat}&lon=${place.lon}&appid=${encodeURIComponent(OPENWEATHER_API_KEY)}&units=metric`
          ),
        ]);

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        const forecastByDay = new Map();
        for (const item of forecastData.list || []) {
          const dayKey = item.dt_txt.split(' ')[0];
          const current = forecastByDay.get(dayKey) || {
            date: dayKey,
            temps: [],
            rain: [],
            codes: [],
          };
          current.temps.push(item.main?.temp ?? 0);
          current.rain.push((item.pop ?? 0) * 100);
          current.codes.push(item.weather?.[0]?.id ?? 800);
          forecastByDay.set(dayKey, current);
        }

        const daily = Array.from(forecastByDay.values()).slice(0, 7).map(day => ({
          date: day.date,
          tempMin: Math.round(Math.min(...day.temps)),
          tempMax: Math.round(Math.max(...day.temps)),
          rainProb: Math.round(Math.max(...day.rain)),
          code: day.codes[0] || 800,
          icon: mapOpenWeatherIcon(day.codes[0] || 800),
          label: mapOpenWeatherLabel(day.codes[0] || 800),
        }));

        return res.json({
          location: {
            name: place.name,
            state: place.state || '',
            country: place.country,
            source: 'openweather',
          },
          current: {
            temperature: currentData.main?.temp ?? null,
            humidity: currentData.main?.humidity ?? null,
            windSpeed: currentData.wind?.speed ?? null,
            rainProbability: forecastData.list?.[0]?.pop != null ? Math.round(forecastData.list[0].pop * 100) : null,
            weatherCode: currentData.weather?.[0]?.id ?? 800,
            description: currentData.weather?.[0]?.description || '',
            icon: mapOpenWeatherIcon(currentData.weather?.[0]?.id ?? 800),
            label: mapOpenWeatherLabel(currentData.weather?.[0]?.id ?? 800),
          },
          daily,
        });
      }
    }

    let place = null;
    for (const candidate of locationCandidates) {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidate)}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();
      place = geoData.results && geoData.results[0];
      if (place) break;
    }

    if (!place) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );
    const weatherData = await weatherResponse.json();

    return res.json({
      location: {
        name: place.name,
        state: place.admin1 || '',
        country: place.country,
        source: 'open-meteo',
      },
      current: {
        temperature: weatherData.current?.temperature_2m ?? null,
        humidity: weatherData.current?.relative_humidity_2m ?? null,
        windSpeed: weatherData.current?.wind_speed_10m ?? null,
        rainProbability: weatherData.current?.precipitation_probability ?? null,
        weatherCode: weatherData.current?.weather_code ?? 0,
        description: getWeatherLabel(weatherData.current?.weather_code ?? 0),
        icon: getWeatherIcon(weatherData.current?.weather_code ?? 0),
        label: getWeatherLabel(weatherData.current?.weather_code ?? 0),
      },
      daily: (weatherData.daily?.time || []).slice(0, 7).map((day, i) => ({
        date: day,
        tempMin: Math.round(weatherData.daily.temperature_2m_min?.[i] ?? weatherData.current?.temperature_2m ?? 0),
        tempMax: Math.round(weatherData.daily.temperature_2m_max?.[i] ?? weatherData.current?.temperature_2m ?? 0),
        rainProb: Math.round(weatherData.daily.precipitation_probability_max?.[i] ?? 0),
        code: weatherData.daily.weather_code?.[i] ?? 0,
        icon: getWeatherIcon(weatherData.daily.weather_code?.[i] ?? 0),
        label: getWeatherLabel(weatherData.daily.weather_code?.[i] ?? 0),
      })),
    });
  } catch (error) {
    console.error('Weather error:', error);
    return res.status(500).json({ error: 'Server error fetching weather' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    return res.json({ status: 'Server is running', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'Server is running', database: 'error', timestamp: new Date().toISOString() });
  }
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    await syncNotificationsForUser(req.user.id);
    const rows = await query(
      'SELECT * FROM notifications_and_alerts WHERE user_id = ? ORDER BY is_read ASC, created_at DESC, id DESC',
      [req.user.id]
    );

    const notifications = rows.map(row => ({
      id: row.id,
      type: row.category || row.type,
      icon: row.icon || '🔔',
      title: row.title,
      desc: row.description,
      time: notificationTimeLabel(row.created_at),
      unread: !row.is_read,
      action: notificationActionForType(row.type),
      createdAt: row.created_at,
      link: row.link_url || '',
      confidence: row.confidence_score ?? null,
    }));

    return res.json({
      notifications,
      stats: {
        unread: notifications.filter(n => n.unread).length,
        weather: notifications.filter(n => n.type === 'weather').length,
        market: notifications.filter(n => n.type === 'market').length,
        ai: notifications.filter(n => n.type === 'ai').length,
        sales: notifications.filter(n => n.type === 'sales').length,
      },
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return res.status(500).json({ error: 'Server error fetching notifications' });
  }
});

app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await exec(
      'UPDATE notifications_and_alerts SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Notification read error:', error);
    return res.status(500).json({ error: 'Server error updating notification' });
  }
});

app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await exec(
      'UPDATE notifications_and_alerts SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Notification bulk read error:', error);
    return res.status(500).json({ error: 'Server error updating notifications' });
  }
});

app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
  try {
    await exec(
      'DELETE FROM notifications_and_alerts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Notification delete error:', error);
    return res.status(500).json({ error: 'Server error deleting notification' });
  }
});

app.delete('/api/notifications', authMiddleware, async (req, res) => {
  try {
    await exec('DELETE FROM notifications_and_alerts WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true });
  } catch (error) {
    console.error('Notification clear error:', error);
    return res.status(500).json({ error: 'Server error clearing notifications' });
  }
});

app.get('/api/profile/summary', authMiddleware, async (req, res) => {
  try {
    const userRows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const inventoryRows = await query(
      'SELECT * FROM crop_inventory WHERE user_id = ? ORDER BY added_date DESC',
      [req.user.id]
    );

    const transactionRows = await query(
      `SELECT t.*, ci.crop_name
       FROM transactions t
       LEFT JOIN marketplace_listings ml ON ml.id = t.listing_id
       LEFT JOIN crop_inventory ci ON ci.id = ml.inventory_id
       WHERE t.seller_id = ?
       ORDER BY t.transaction_date DESC`,
      [req.user.id]
    );

    const soilRows = await query(
      'SELECT * FROM soil_health WHERE user_id = ? ORDER BY test_date DESC',
      [req.user.id]
    );

    const revenue = transactionRows.reduce((sum, row) => sum + Number(row.total_price || 0), 0);
    const cropsSold = transactionRows.filter(row => String(row.status || '').toLowerCase() === 'completed').length;
    const activeListings = inventoryRows.filter(row => row.status === 'Active').length;
    const buyerContacts = new Set(transactionRows.map(row => row.buyer_id).filter(Boolean)).size;
    const profileScore = calculateProfileScore(user, inventoryRows, transactionRows, soilRows);
    const recentSales = transactionRows.slice(0, 5).map(row => ({
      crop: row.crop_name || 'Crop',
      buyer: `Buyer #${row.buyer_id}`,
      amount: Number(row.total_price || 0),
      date: row.transaction_date,
      quantity: Number(row.quantity_bought || 0),
      status: row.status,
    }));
    const transactions = transactionRows.map(row => ({
      icon: '💰',
      title: `${row.crop_name || 'Crop'} Sale`,
      date: row.transaction_date,
      amount: Number(row.total_price || 0),
      type: 'credit',
      quantity: Number(row.quantity_bought || 0),
      buyerId: row.buyer_id,
      status: row.status,
    }));
    const farmInfo = {
      primaryCrops: user.crop || 'Not added yet',
      location: user.location || 'Not added yet',
      farmArea: user.farm_size ? `${Number(user.farm_size).toFixed(1)} Acres` : 'Not added yet',
      irrigation: soilRows[0]?.moisture != null ? 'Data captured from soil record' : 'Not added yet',
      farmingType: inventoryRows.length > 0 ? 'Active seller' : 'Not added yet',
      registration: user.created_at ? 'Profile linked to farm account' : 'Not added yet',
    };
    const checklist = buildProfileChecklist(user, inventoryRows, transactionRows, soilRows);
    const achievements = buildAchievements({
      cropsSold,
      revenue,
      soilTests: soilRows.length,
      primaryCrop: user.crop,
    }, profileScore);
    const badges = buildProfileBadges(user, {
      cropsSold,
      revenue,
      activeListings,
      avgRating: profileScore >= 90 ? 4.9 : profileScore >= 75 ? 4.8 : profileScore >= 50 ? 4.5 : 4.0,
    }, profileScore);
    const forecast = buildProfileForecast(transactionRows, inventoryRows);

    return res.json({
      user: toUser(user),
      stats: {
        cropsSold,
        revenue,
        activeListings,
        buyerContacts,
        avgRating: profileScore >= 90 ? 4.9 : profileScore >= 75 ? 4.8 : profileScore >= 50 ? 4.5 : 4.0,
      },
      profileScore,
      farmInfo,
      recentSales,
      checklist,
      transactions,
      reviews: [],
      achievements,
      badges,
      forecast,
      membership: {
        plan: profileScore >= 75 ? 'Pro Plan' : 'Free Plan',
        daysRemaining: profileScore >= 75 ? 68 : 0,
        renewsText: 'Renewal tracked from account status',
      },
    });
  } catch (error) {
    console.error('Profile summary error:', error);
    return res.status(500).json({ error: 'Server error fetching profile summary' });
  }
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

start();
