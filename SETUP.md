# 🌾 Digital Farming Advisory System - Setup Guide

A full-stack web application connecting farmers with buyers through a dynamic marketplace.

---

## ✨ Features

✅ **User Registration & Authentication**
- Secure JWT-based authentication
- Password hashing with bcrypt
- User profile management

✅ **Farmer Inventory Management**
- Add/edit/delete crops to sell
- Real-time marketplace listings
- Price suggestions

✅ **Buyer Marketplace**
- Browse all available crops
- Search and filter by location, crop type
- Shopping cart functionality
- Direct farmer contact

✅ **Dynamic Dashboard**
- User-specific data display
- Weather information
- Activity feed
- Quick access to key features

✅ **Backend API**
- RESTful endpoints for all operations
- MongoDB database integration
- Secure token-based authorization

---

## 🏗️ Project Structure

```
digital-farming-advisory-system/
├── backend/
│   ├── server.js           # Main Express server
│   ├── package.json        # Backend dependencies
│   ├── .env               # Environment variables (create this)
│   ├── models/
│   │   ├── User.js        # User schema
│   │   └── Crop.js        # Crop schema
│
├── frontend/
│   ├── index.html         # Landing page
│   ├── register.html      # Registration/Login
│   ├── dashboard.html     # User dashboard
│   ├── sell-crops.html    # Inventory management
│   ├── marketplace.html   # Marketplace
│   ├── js/
│   │   ├── api-service.js # API client module
│   │   ├── auth.js        # Auth helpers
│   │   └── shared-nav.js  # Navigation
│   └── css/
│       └── styles.css     # Styling

├── README.md              # This file
└── SETUP.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14+): [Download](https://nodejs.org/)
- **MongoDB** (Local or Atlas): [Setup](https://www.mongodb.com/)
- **npm** or **yarn** package manager

---

## 📋 Step-by-Step Installation

### 1️⃣ Clone/Setup Project

```bash
cd "c:\priyanshi pm\digital-farming-advisory-system"
```

### 2️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

**Expected packages:**
- express
- mongoose
- cors
- bcryptjs
- jsonwebtoken
- dotenv

### 3️⃣ Setup MongoDB

#### Option A: Local MongoDB
```bash
# Make sure MongoDB is running locally (default: mongodb://localhost:27017)
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a cluster and get connection string
3. Update `.env` file with your URI

### 4️⃣ Configure Environment Variables

Create `.env` file in `backend/` folder:

```env
MONGO_URI=mongodb://localhost:27017/agriadvisor
PORT=5000
JWT_SECRET=supersecret_agriadvisor_key
NODE_ENV=development
```

**Note:** Change `JWT_SECRET` to something secure in production.

### 5️⃣ Start Backend Server

```bash
# From backend/ directory
node server.js
# Or use nodemon for development:
npx nodemon server.js
```

**Expected Output:**
```
✅ MongoDB Connected
🚀 Server running on http://localhost:5000
```

### 6️⃣ Open Frontend

Open browser and navigate to:
```
file:///c:/priyanshi%20pm/digital-farming-advisory-system/index.html
```

Or serve with a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```

Then visit: `http://localhost:8000`

---

## 📱 User Flow

### 1. **Registration** → Register as Farmer
   - Enter name, phone, location, crop, farm size
   - Create password
   - JWT token stored in browser

### 2. **Dashboard** → View personalized information
   - Your crop inventory
   - Available crops in marketplace
   - Weather updates
   - Quick actions

### 3. **Sell Crops** (Farmer Side)
   - Add crop name, quantity, price
   - Publish to marketplace
   - See all your active listings

### 4. **Marketplace** (Buyer Side)
   - Browse all available crops
   - Search & filter by location/crop type
   - Add to cart
   - Place order

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register    # Create new account
POST   /api/auth/login       # Login with phone & password
GET    /api/user/me          # Get current user (requires token)
```

### Crops & Marketplace
```
POST   /api/crops            # Add crop to inventory (requires token)
GET    /api/crops/my-inventory  # Get user's crops (requires token)
GET    /api/crops/marketplace    # Get all active crops
GET    /api/crops/:id        # Get single crop details
PUT    /api/crops/:id        # Update crop (requires token)
DELETE /api/crops/:id        # Delete crop (requires token)
GET    /api/health           # Server health check
```

### Request/Response Examples

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ravi",
    "lastName": "Kumar",
    "phone": "9876543210",
    "email": "ravi@example.com",
    "location": "Rohtak, Haryana",
    "crop": "Wheat",
    "farmSize": 5,
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ravi Kumar",
    "location": "Rohtak, Haryana"
  }
}
```

**Add Crop to Inventory:**
```bash
curl -X POST http://localhost:5000/api/crops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "cropName": "Wheat HD-2967",
    "quantity": 50,
    "price": 2100,
    "grade": "Grade A"
  }'
```

**Get All Marketplace Crops:**
```bash
curl http://localhost:5000/api/crops/marketplace
```

---

## 🔐 Security Notes

1. **Never hardcode sensitive data** in production
2. **Use environment variables** for secrets
3. **JWT tokens expire** after 7 days
4. **Passwords are hashed** with bcrypt
5. **CORS is enabled** for frontend access

---

## 🐛 Troubleshooting

### Error: `MongoDB Connection Error`
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env` file
- Verify network connectivity

### Error: `Cannot fetch from backend`
- Backend must be running on `http://localhost:5000`
- Check browser console for CORS errors
- Ensure ports aren't already in use

### Error: `Token is invalid or expired`
- Clear browser localStorage: `localStorage.clear()`
- Register again
- Check JWT_SECRET matches in .env

### Error: `Port 5000 already in use`
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  email: String,
  password: String (hashed),
  location: String,
  crop: String,
  farmSize: Number,
  createdAt: Date
}
```

### Crops Collection
```javascript
{
  _id: ObjectId,
  sellerId: ObjectId (ref: User),
  sellerName: String,
  location: String,
  cropName: String,
  quantity: Number,
  price: Number,
  grade: String,
  status: String (Active/Pending/Sold Out),
  createdAt: Date
}
```

---

## 🚀 Deployment

### Deploy Backend (Node.js)
Options: Heroku, Railway, Vercel, AWS, DigitalOcean

**Example (Railway):**
```bash
npm install -g railway
railway login
railway init
railway up
```

### Deploy Frontend (Static HTML)
Options: GitHub Pages, Netlify, Vercel

```bash
# Copy HTML/CSS/JS files to hosting
# Update API_BASE_URL in api-service.js to production backend
```

---

## 📝 Future Enhancements

- [ ] Payment integration (Razorpay/Stripe)
- [ ] Real weather API integration
- [ ] SMS notifications
- [ ] Image upload for crops
- [ ] User reviews & ratings
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Admin panel

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API endpoint documentation
3. Check browser console for errors
4. Verify backend is running

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🎯 Key Files to Modify

When deploying or customizing:

1. **`backend/.env`** - Update database and secret keys
2. **`js/api-service.js`** - Change `API_BASE_URL` for production
3. **`backend/models/User.js`** - Add custom fields
4. **`backend/models/Crop.js`** - Add more crop details
5. **HTML files** - Customize branding and UI

---

**Happy Farming! 🌾🚜**
