# API Quick Reference

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Register New User
**POST** `/auth/register`

```json
Request Body:
{
  "firstName": "Ravi",
  "lastName": "Kumar",
  "phone": "9876543210",
  "email": "ravi@example.com",
  "location": "Rohtak, Haryana",
  "crop": "Wheat",
  "farmSize": 5,
  "password": "SecurePass123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ravi Kumar",
    "location": "Rohtak, Haryana"
  }
}

Status: 200 OK
```

### 2. Login
**POST** `/auth/login`

```json
Request Body:
{
  "phone": "9876543210",
  "password": "SecurePass123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ravi Kumar",
    "location": "Rohtak, Haryana"
  }
}

Status: 200 OK
```

### 3. Get Current User
**GET** `/user/me`

Headers:
```
Authorization: Bearer <token>
```

```json
Response:
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Ravi Kumar",
  "phone": "9876543210",
  "email": "ravi@example.com",
  "location": "Rohtak, Haryana",
  "crop": "Wheat",
  "farmSize": 5,
  "createdAt": "2024-01-15T10:30:00Z"
}

Status: 200 OK
```

---

## Crop Management Endpoints

### 1. Add Crop (Create Listing)
**POST** `/crops`

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```

```json
Request Body:
{
  "cropName": "Wheat HD-2967",
  "quantity": 50,
  "price": 2100,
  "grade": "Grade A"
}

Response:
{
  "_id": "507f1f77bcf86cd799439012",
  "sellerId": "507f1f77bcf86cd799439011",
  "sellerName": "Ravi Kumar",
  "location": "Rohtak, Haryana",
  "cropName": "Wheat HD-2967",
  "quantity": 50,
  "price": 2100,
  "grade": "Grade A",
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z"
}

Status: 200 OK
```

### 2. Get My Inventory
**GET** `/crops/my-inventory`

Headers:
```
Authorization: Bearer <token>
```

```json
Response:
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "sellerId": "507f1f77bcf86cd799439011",
    "sellerName": "Ravi Kumar",
    "location": "Rohtak, Haryana",
    "cropName": "Wheat HD-2967",
    "quantity": 50,
    "price": 2100,
    "grade": "Grade A",
    "status": "Active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]

Status: 200 OK
```

### 3. Get Marketplace (All Active Crops)
**GET** `/crops/marketplace`

```json
Response:
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "sellerId": "507f1f77bcf86cd799439011",
    "sellerName": "Ravi Kumar",
    "location": "Rohtak, Haryana",
    "cropName": "Wheat HD-2967",
    "quantity": 50,
    "price": 2100,
    "grade": "Grade A",
    "status": "Active",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "sellerId": "507f1f77bcf86cd799439021",
    "sellerName": "Sharma Farm",
    "location": "Panipat, Haryana",
    "cropName": "Mustard Seeds",
    "quantity": 100,
    "price": 5100,
    "grade": "Premium",
    "status": "Active",
    "createdAt": "2024-01-15T09:15:00Z"
  }
]

Status: 200 OK
```

### 4. Get Single Crop Details
**GET** `/crops/{cropId}`

```json
Response:
{
  "_id": "507f1f77bcf86cd799439012",
  "sellerId": "507f1f77bcf86cd799439011",
  "sellerName": "Ravi Kumar",
  "location": "Rohtak, Haryana",
  "cropName": "Wheat HD-2967",
  "quantity": 50,
  "price": 2100,
  "grade": "Grade A",
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z"
}

Status: 200 OK
```

### 5. Update Crop (Seller Only)
**PUT** `/crops/{cropId}`

Headers:
```
Authorization: Bearer <token>
Content-Type: application/json
```

```json
Request Body:
{
  "quantity": 45,
  "status": "Active"
}

Response:
{
  "_id": "507f1f77bcf86cd799439012",
  "sellerId": "507f1f77bcf86cd799439011",
  "sellerName": "Ravi Kumar",
  "location": "Rohtak, Haryana",
  "cropName": "Wheat HD-2967",
  "quantity": 45,
  "price": 2100,
  "grade": "Grade A",
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z"
}

Status: 200 OK
```

### 6. Delete Crop (Seller Only)
**DELETE** `/crops/{cropId}`

Headers:
```
Authorization: Bearer <token>
```

```json
Response:
{
  "message": "Crop deleted successfully"
}

Status: 200 OK
```

---

## Utility Endpoints

### 1. Health Check
**GET** `/health`

```json
Response:
{
  "status": "Server is running",
  "timestamp": "2024-01-15T10:30:00Z"
}

Status: 200 OK
```

---

## Error Responses

### 401 - Unauthorized (Missing Token)
```json
{
  "error": "Access Denied: No Token Provided!"
}
```

### 400 - Bad Request (Invalid Token)
```json
{
  "error": "Invalid Token"
}
```

### 400 - User Not Found
```json
{
  "error": "User not found"
}
```

### 400 - Invalid Password
```json
{
  "error": "Invalid password"
}
```

### 404 - Crop Not Found
```json
{
  "error": "Crop not found"
}
```

### 403 - Forbidden (Not the Owner)
```json
{
  "error": "Unauthorized"
}
```

### 500 - Server Error
```json
{
  "error": "Server error [operation name]"
}
```

---

## Using with Frontend API Service

The frontend has `APIService` module that wraps these endpoints:

```javascript
// Register
const result = await APIService.register({
  firstName: "Ravi",
  lastName: "Kumar",
  phone: "9876543210",
  email: "ravi@example.com",
  location: "Rohtak, Haryana",
  crop: "Wheat",
  farmSize: 5,
  password: "SecurePass123"
});
// Token is automatically stored in localStorage

// Login
const result = await APIService.login({
  phone: "9876543210",
  password: "SecurePass123"
});

// Get current user
const user = await APIService.getCurrentUser();

// Add crop
const crop = await APIService.addCrop({
  cropName: "Wheat",
  quantity: 50,
  price: 2100,
  grade: "Grade A"
});

// Get inventory
const crops = await APIService.getMyInventory();

// Get marketplace
const allCrops = await APIService.getMarketplace();

// Update crop
await APIService.updateCrop(cropId, { quantity: 45, status: "Active" });

// Delete crop
await APIService.deleteCrop(cropId);

// Logout
APIService.logout();
```

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ravi","lastName":"Kumar","phone":"9876543210","email":"ravi@example.com","location":"Rohtak","crop":"Wheat","farmSize":5,"password":"Pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","password":"Pass123"}'

# Get user (replace token)
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get marketplace
curl -X GET http://localhost:5000/api/crops/marketplace

# Health check
curl http://localhost:5000/api/health
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200  | OK - Request successful |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Missing/invalid token |
| 403  | Forbidden - No permission |
| 404  | Not Found - Resource doesn't exist |
| 500  | Server Error - Internal error |

---

Last Updated: January 2024
