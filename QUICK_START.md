# 🚀 Quick Start Cheat Sheet

## First Time Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Create Configuration
Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/agriadvisor
PORT=5000
JWT_SECRET=supersecret_agriadvisor_key
NODE_ENV=development
```

### Step 3: Ensure MongoDB is Running
```bash
mongod
# or use MongoDB Atlas cloud version
```

### Step 4: Start Backend (Terminal 1)
```bash
cd backend
node server.js
```
Expected: `✅ MongoDB Connected` and `🚀 Server running on http://localhost:5000`

### Step 5: Start Frontend (Terminal 2)
```bash
python -m http.server 8000
# or: npx http-server -p 8000
```
Expected: `Serving HTTP on http://localhost:8000`

### Step 6: Open Browser
```
http://localhost:8000
```

---

## 🎯 Common Tasks

### Register as New Farmer
```
1. Click "Get Started" or go to /register.html
2. Fill: Name, Phone, Location, Crop, Farm Size
3. Create password
4. Submit
5. Auto-redirect to dashboard
```

### Login
```
1. Go to /login.html
2. Phone: 9876543210
3. Password: SecurePass123
4. Click "Login"
```

### Add Crop to Inventory (Farmer)
```
1. Login to dashboard
2. Click "🌿 List a Crop" or go to /sell-crops.html
3. Fill crop details (name, quantity, price)
4. Click "🌿 Publish Listing"
5. Check /marketplace.html to see it live
```

### Browse Marketplace (Buyer)
```
1. Go to /marketplace.html
2. Search or filter crops
3. Click "🛒 Add" to add to cart
4. Click 🛒 button to view cart
5. Click "✅ Place Order"
```

### View Your Dashboard
```
1. After login, you're on /dashboard.html
2. See your name, location
3. View your crops
4. See marketplace updates
5. Access quick action buttons
```

---

## 🔧 Troubleshooting Quick Fixes

### "Cannot connect to backend"
```bash
# Ensure backend is running
cd backend
node server.js
# Check: http://localhost:5000/api/health
```

### "MongoDB connection error"
```bash
# Start MongoDB
mongod

# Or update .env with your MongoDB Atlas connection
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/agriadvisor
```

### "Port already in use"
```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### "npm install fails"
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "CORS Error"
```
Backend must be running on http://localhost:5000
Frontend must call that exact URL
Check js/api-service.js has correct API_BASE_URL
```

---

## 📱 API Endpoints Quick Reference

```bash
# Register
POST http://localhost:5000/api/auth/register
Body: {firstName, lastName, phone, email, location, crop, farmSize, password}

# Login
POST http://localhost:5000/api/auth/login
Body: {phone, password}

# Get Current User
GET http://localhost:5000/api/user/me
Header: Authorization: Bearer <token>

# Add Crop
POST http://localhost:5000/api/crops
Header: Authorization: Bearer <token>
Body: {cropName, quantity, price, grade}

# Get Marketplace
GET http://localhost:5000/api/crops/marketplace

# Get My Inventory
GET http://localhost:5000/api/crops/my-inventory
Header: Authorization: Bearer <token>

# Delete Crop
DELETE http://localhost:5000/api/crops/<cropId>
Header: Authorization: Bearer <token>

# Health Check
GET http://localhost:5000/api/health
```

---

## 🗂️ Important Files

| File | Purpose |
|------|---------|
| `backend/server.js` | Main API server |
| `js/api-service.js` | Frontend API client |
| `js/auth.js` | Auth helpers |
| `register.html` | Sign up page |
| `login.html` | Sign in page |
| `dashboard.html` | User dashboard |
| `sell-crops.html` | Inventory management |
| `marketplace.html` | Marketplace |
| `backend/.env` | Configuration |
| `README.md` | Full documentation |
| `API_REFERENCE.md` | API docs |

---

## 🔐 Test Credentials

```
Phone:    9876543210
Password: SecurePass123
```

---

## 🎓 Learning Path

1. **Understand Structure**
   - Read README.md
   - Review IMPLEMENTATION_SUMMARY.md

2. **Set Up**
   - Run through Quick Start section
   - Verify with verify_setup.bat

3. **Test**
   - Register new user
   - Add crop
   - Browse marketplace

4. **Customize**
   - Modify UI in HTML files
   - Add new API endpoints in server.js
   - Update database schemas

5. **Deploy**
   - See SETUP.md deployment section
   - Deploy backend (Heroku/Railway)
   - Deploy frontend (Netlify/GitHub Pages)

---

## 🛠️ Development Workflow

### Backend Development
```bash
cd backend
npm install nodemon -g
nodemon server.js
# Changes auto-reload
```

### Frontend Development
```bash
# Keep updating HTML/CSS/JS
# Refresh browser to see changes
# Open browser DevTools (F12) to debug
```

### Database Management
```bash
# View with MongoDB Compass
# Or use MongoDB Atlas dashboard
# Collections: users, crops
```

---

## 📦 Project Structure Simplified

```
Project Root
├── backend/               # Node.js server
│   ├── server.js         # Main app
│   ├── models/           # Database schemas
│   ├── package.json      # Dependencies
│   └── .env             # Config
├── frontend/             # HTML pages
│   ├── index.html       # Landing
│   ├── register.html    # Sign up
│   ├── login.html       # Sign in
│   ├── dashboard.html   # Dashboard
│   ├── sell-crops.html  # Inventory
│   ├── marketplace.html # Marketplace
│   ├── js/              # JavaScript
│   └── css/             # Styling
└── Documentation/
    ├── README.md
    ├── SETUP.md
    ├── API_REFERENCE.md
    └── This file
```

---

## ⚡ Performance Tips

- **Frontend**: Minify CSS/JS for production
- **Backend**: Enable compression middleware
- **Database**: Create indexes for frequent queries
- **Deployment**: Use CDN for static assets
- **Monitoring**: Set up error tracking (Sentry)

---

## 🆘 Getting Help

1. **Check Documentation**
   - README.md - Overview
   - SETUP.md - Installation
   - API_REFERENCE.md - Endpoints
   - IMPLEMENTATION_SUMMARY.md - Architecture

2. **Debug**
   - Open browser DevTools (F12)
   - Check Network tab for API calls
   - Check Console for errors
   - View backend terminal logs

3. **Common Issues**
   - See "Troubleshooting Quick Fixes" section above
   - MongoDB connection → Check MONGO_URI in .env
   - CORS errors → Backend must be running
   - Port conflicts → Kill process on port 5000

---

## 🎉 You're All Set!

Your Digital Farming Advisory System is ready to use.

**Commands to Remember:**

```bash
# Setup (first time only)
cd backend && npm install

# Run Backend
cd backend && node server.js

# Run Frontend
python -m http.server 8000

# Open Browser
http://localhost:8000
```

**Happy Farming! 🌾🚜**

---

Last Updated: January 2024
Version: 1.0.0
