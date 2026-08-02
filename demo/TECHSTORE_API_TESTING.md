# TechStore API — Complete Postman Testing Guide

## Setup

### 1. Create Environment in Postman
Go to **Environments → Add** and create `TechStore` with these variables:

| Variable | Local Value | Production Value |
|---|---|---|
| `BASE_URL` | `http://localhost:8000/api/v1` | `https://your-backend.vercel.app/api/v1` |
| `TOKEN` | *(auto-filled after login)* | *(auto-filled after login)* |
| `PRODUCT_ID` | *(fill after creating product)* | *(fill after creating product)* |
| `CATEGORY_ID` | *(fill after creating category)* | *(fill after creating category)* |
| `ORDER_ID` | *(fill after creating order)* | *(fill after creating order)* |
| `ITEM_ID` | *(fill after adding cart item)* | *(fill after adding cart item)* |

### 2. Set Auth Header Automatically
In Postman → Collection → **Pre-request Script** OR use this in each request:
```
Authorization: Bearer {{TOKEN}}
```

---

## ─── PHASE 1: AUTH ───────────────────────────────────────

### 1. Register User
```
POST {{BASE_URL}}/auth/register
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Test User",
  "email": "testuser@gmail.com",
  "password": "Test@12345"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "64f2a3b...",
      "name": "Test User",
      "email": "testuser@gmail.com",
      "avatar": null,
      "role": "customer"
    },
    "token": "eyJhbGciOi..."
  }
}
```
📌 **Copy the token → paste into `TOKEN` environment variable**

---

### 2. Login (Customer)
```
POST {{BASE_URL}}/auth/login
Content-Type: application/json
```
**Body:**
```json
{
  "email": "testuser@gmail.com",
  "password": "Test@12345"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "Test User", "role": "customer" },
    "token": "eyJhbGciOi..."
  }
}
```

---

### 3. Login (Admin)
```
POST {{BASE_URL}}/auth/login
Content-Type: application/json
```
**Body:**
```json
{
  "email": "admin@techstore.com",
  "password": "Admin@12345"
}
```
📌 **Copy admin token → use for all Admin endpoints below**

---

### 4. Get Current User
```
GET {{BASE_URL}}/auth/me
Authorization: Bearer {{TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Test User",
      "email": "testuser@gmail.com",
      "role": "customer"
    }
  }
}
```

---

### 5. Logout
```
POST {{BASE_URL}}/auth/logout
Authorization: Bearer {{TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

## ─── PHASE 2: CATEGORIES ─────────────────────────────────

### 6. Get All Categories
```
GET {{BASE_URL}}/categories
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "_id": "...", "name": "Laptops", "slug": "laptops", "image": { "url": "..." } },
      { "_id": "...", "name": "Smartphones", "slug": "smartphones" }
    ]
  }
}
```
📌 **Copy a `_id` → paste into `CATEGORY_ID` environment variable**

---

### 7. Get Single Category
```
GET {{BASE_URL}}/categories/{{CATEGORY_ID}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "category": { "_id": "...", "name": "Laptops", "slug": "laptops" }
  }
}
```

---

### 8. Create Category (Admin)
```
POST {{BASE_URL}}/categories
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: multipart/form-data
```
**Form Data:**
```
name = Gaming Peripherals
```
*(image field is optional)*

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "category": { "_id": "...", "name": "Gaming Peripherals", "slug": "gaming-peripherals" }
  }
}
```

---

### 9. Update Category (Admin)
```
PUT {{BASE_URL}}/categories/{{CATEGORY_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: multipart/form-data
```
**Form Data:**
```
name = Gaming Accessories
```

---

### 10. Delete Category (Admin)
```
DELETE {{BASE_URL}}/categories/{{CATEGORY_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Category deleted",
  "data": null
}
```

---

## ─── PHASE 2: PRODUCTS ───────────────────────────────────

### 11. Get All Products
```
GET {{BASE_URL}}/products
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": { "total": 12, "page": 1, "pages": 1, "limit": 12 }
  }
}
```
📌 **Copy a product `_id` → paste into `PRODUCT_ID` environment variable**

---

### 12. Get Products — With Filters
```
GET {{BASE_URL}}/products?page=1&limit=6&sort=price_asc
GET {{BASE_URL}}/products?search=apple
GET {{BASE_URL}}/products?category={{CATEGORY_ID}}
GET {{BASE_URL}}/products?minPrice=100&maxPrice=500
GET {{BASE_URL}}/products?sort=rating
```

---

### 13. Get Featured Products
```
GET {{BASE_URL}}/products/featured
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      { "_id": "...", "name": "Apple MacBook Pro 14-inch M3", "isFeatured": true }
    ]
  }
}
```

---

### 14. Get Single Product
```
GET {{BASE_URL}}/products/{{PRODUCT_ID}}
```

---

### 15. Create Product (Admin)
```
POST {{BASE_URL}}/products
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: multipart/form-data
```
**Form Data:**
```
name         = Samsung Galaxy Book Pro
description  = Lightweight professional laptop with AMOLED display and Intel Core i7
brand        = Samsung
category     = {{CATEGORY_ID}}
price        = 1299.99
discountPrice= 1199.99
stock        = 20
isFeatured   = false
specs        = {"Processor":"Intel Core i7","RAM":"16GB","Storage":"512GB SSD"}
images       = [attach image files — up to 5]
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": "Product created",
  "data": { "product": { "_id": "...", "name": "Samsung Galaxy Book Pro" } }
}
```

---

### 16. Update Product (Admin)
```
PUT {{BASE_URL}}/products/{{PRODUCT_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: multipart/form-data
```
**Form Data (only fields you want to change):**
```
price = 999.99
stock = 15
```

---

### 17. Delete Product (Admin)
```
DELETE {{BASE_URL}}/products/{{PRODUCT_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

## ─── PHASE 3: CART ───────────────────────────────────────

### 18. Get Cart
```
GET {{BASE_URL}}/cart
Authorization: Bearer {{TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [],
    "itemCount": 0,
    "subtotal": 0,
    "coupon": null,
    "discount": 0,
    "total": 0
  }
}
```

---

### 19. Add Item to Cart
```
POST {{BASE_URL}}/cart/items
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "productId": "{{PRODUCT_ID}}",
  "qty": 2
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64f...",
        "product": "...",
        "name": "Apple MacBook Pro 14-inch M3",
        "price": 1849.99,
        "qty": 2,
        "image": "/uploads/..."
      }
    ],
    "itemCount": 2,
    "subtotal": 3699.98,
    "total": 3699.98
  }
}
```
📌 **Copy item `_id` → paste into `ITEM_ID` environment variable**

---

### 20. Update Cart Item Quantity
```
PATCH {{BASE_URL}}/cart/items/{{ITEM_ID}}
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "qty": 1
}
```

---

### 21. Remove Cart Item
```
DELETE {{BASE_URL}}/cart/items/{{ITEM_ID}}
Authorization: Bearer {{TOKEN}}
```

---

### 22. Apply Coupon
```
POST {{BASE_URL}}/cart/apply-coupon
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "code": "SAVE20"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Coupon \"SAVE20\" applied — 20% off",
  "data": {
    "subtotal": 1849.99,
    "coupon": { "code": "SAVE20", "discountPercent": 20, "discount": 370.00 },
    "discount": 370.00,
    "total": 1479.99
  }
}
```
⚠️ First create a coupon via admin endpoint (see Phase 6 below)

---

### 23. Remove Coupon
```
DELETE {{BASE_URL}}/cart/coupon
Authorization: Bearer {{TOKEN}}
```

---

### 24. Clear Cart
```
DELETE {{BASE_URL}}/cart
Authorization: Bearer {{TOKEN}}
```

---

## ─── PHASE 4: WISHLIST ───────────────────────────────────

### 25. Get Wishlist
```
GET {{BASE_URL}}/wishlist
Authorization: Bearer {{TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "products": [],
    "productIds": []
  }
}
```

---

### 26. Add to Wishlist
```
POST {{BASE_URL}}/wishlist/{{PRODUCT_ID}}
Authorization: Bearer {{TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Product added to wishlist",
  "data": { "productIds": ["64f..."] }
}
```

---

### 27. Remove from Wishlist
```
DELETE {{BASE_URL}}/wishlist/{{PRODUCT_ID}}
Authorization: Bearer {{TOKEN}}
```

---

## ─── PHASE 4: REVIEWS ────────────────────────────────────

### 28. Get Product Reviews
```
GET {{BASE_URL}}/products/{{PRODUCT_ID}}/reviews
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [],
    "ratingsAverage": 0,
    "ratingsCount": 0
  }
}
```

---

### 29. Create or Update Review
```
POST {{BASE_URL}}/products/{{PRODUCT_ID}}/reviews
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "rating": 5,
  "comment": "Absolutely amazing product! The performance is top notch and build quality is excellent."
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "_id": "...",
      "rating": 5,
      "comment": "Absolutely amazing product!...",
      "user": { "name": "Test User" }
    }
  }
}
```
📌 **Copy review `_id` → save as `REVIEW_ID`**

---

### 30. Delete Review
```
DELETE {{BASE_URL}}/products/{{PRODUCT_ID}}/reviews/{{REVIEW_ID}}
Authorization: Bearer {{TOKEN}}
```

---

## ─── PHASE 5: ORDERS ─────────────────────────────────────

### 31. Create Order
```
POST {{BASE_URL}}/orders
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
⚠️ **Must have items in cart first (step 19)**

**Body:**
```json
{
  "shippingAddress": {
    "fullName": "Test User",
    "line1": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "phone": "+1234567890"
  }
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": "Order created — complete payment to confirm",
  "data": {
    "order": {
      "_id": "...",
      "items": [...],
      "itemsPrice": 1849.99,
      "shippingPrice": 0,
      "taxPrice": 277.50,
      "discount": 0,
      "totalPrice": 2127.49,
      "orderStatus": "processing",
      "paymentInfo": { "status": "pending" }
    }
  }
}
```
📌 **Copy order `_id` → paste into `ORDER_ID` environment variable**

---

### 32. Get My Orders
```
GET {{BASE_URL}}/orders/my
Authorization: Bearer {{TOKEN}}
```

---

### 33. Get Single Order
```
GET {{BASE_URL}}/orders/{{ORDER_ID}}
Authorization: Bearer {{TOKEN}}
```

---

## ─── PHASE 5: PAYMENTS ───────────────────────────────────

### 34. Create Payment Intent
```
POST {{BASE_URL}}/payments/create-payment-intent
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "orderId": "{{ORDER_ID}}"
}
```
**Expected Response (200):**
```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "clientSecret": "pi_3Nxxx_secret_xxx"
  }
}
```
📌 **Use `clientSecret` in your frontend Stripe.js to confirm payment**

---

## ─── PHASE 6: ADMIN ──────────────────────────────────────

> ⚠️ All admin endpoints require Admin token

### 35. Dashboard Stats
```
GET {{BASE_URL}}/admin/dashboard/stats
Authorization: Bearer {{ADMIN_TOKEN}}
```
**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 0,
    "totalOrders": 1,
    "totalUsers": 1,
    "totalProducts": 12,
    "ordersByStatus": {
      "processing": 1,
      "shipped": 0,
      "delivered": 0,
      "cancelled": 0
    },
    "revenueByMonth": [],
    "topProducts": [],
    "recentOrders": [...]
  }
}
```

---

### 36. Get All Orders (Admin)
```
GET {{BASE_URL}}/admin/orders
Authorization: Bearer {{ADMIN_TOKEN}}
```
**With filters:**
```
GET {{BASE_URL}}/admin/orders?status=processing
GET {{BASE_URL}}/admin/orders?paymentStatus=paid
GET {{BASE_URL}}/admin/orders?page=1&limit=10
```

---

### 37. Update Order Status (Admin)
```
PATCH {{BASE_URL}}/admin/orders/{{ORDER_ID}}/status
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "status": "shipped"
}
```
**Valid values:** `processing` → `shipped` → `delivered` → `cancelled`

---

### 38. Get All Products (Admin)
```
GET {{BASE_URL}}/admin/products
Authorization: Bearer {{ADMIN_TOKEN}}
```
**With filters:**
```
GET {{BASE_URL}}/admin/products?stock=out
GET {{BASE_URL}}/admin/products?stock=low
GET {{BASE_URL}}/admin/products?stock=in
```

---

### 39. Get All Users (Admin)
```
GET {{BASE_URL}}/admin/users
Authorization: Bearer {{ADMIN_TOKEN}}
```
**With filters:**
```
GET {{BASE_URL}}/admin/users?role=customer
GET {{BASE_URL}}/admin/users?search=test
```

---

### 40. Update User Role (Admin)
```
PATCH {{BASE_URL}}/admin/users/{{USER_ID}}/role
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "role": "admin"
}
```
**Valid values:** `customer` | `admin`

---

### 41. Create Coupon (Admin)
```
POST {{BASE_URL}}/admin/coupons
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "code": "SAVE20",
  "discountPercent": 20,
  "minOrderAmount": 100,
  "maxUses": 100,
  "expiresAt": "2026-12-31"
}
```
**Expected Response (201):**
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "coupon": {
      "_id": "...",
      "code": "SAVE20",
      "discountPercent": 20,
      "minOrderAmount": 100,
      "usedCount": 0,
      "isActive": true
    }
  }
}
```

---

### 42. Get All Coupons (Admin)
```
GET {{BASE_URL}}/admin/coupons
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

### 43. Update Coupon (Admin)
```
PATCH {{BASE_URL}}/admin/coupons/{{COUPON_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "discountPercent": 25,
  "isActive": false
}
```

---

### 44. Delete Coupon (Admin)
```
DELETE {{BASE_URL}}/admin/coupons/{{COUPON_ID}}
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

## ─── PHASE 7: USER PROFILE ───────────────────────────────

### 45. Update Profile
```
PATCH {{BASE_URL}}/users/profile
Authorization: Bearer {{TOKEN}}
Content-Type: multipart/form-data
```
**Form Data:**
```
name = Updated Name
image = [attach image file — optional]
```

---

### 46. Get Addresses
```
GET {{BASE_URL}}/users/addresses
Authorization: Bearer {{TOKEN}}
```

---

### 47. Add Address
```
POST {{BASE_URL}}/users/addresses
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "label": "Home",
  "line1": "456 Oak Avenue",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "country": "USA",
  "isDefault": true
}
```
📌 **Copy address `_id` → save as `ADDRESS_ID`**

---

### 48. Update Address
```
PATCH {{BASE_URL}}/users/addresses/{{ADDRESS_ID}}
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```
**Body:**
```json
{
  "city": "San Francisco",
  "postalCode": "94102"
}
```

---

### 49. Delete Address
```
DELETE {{BASE_URL}}/users/addresses/{{ADDRESS_ID}}
Authorization: Bearer {{TOKEN}}
```

---

## ─── ERROR RESPONSES TO EXPECT ───────────────────────────

| Scenario | Status | Message |
|---|---|---|
| Wrong password | 401 | Invalid email or password |
| No token | 401 | Not authorized, no token provided |
| Customer hits admin route | 403 | Role 'customer' is not permitted |
| Product not found | 404 | Product not found |
| Duplicate email | 409 | An account with this email already exists |
| Too many login attempts | 429 | Too many attempts from this IP |
| Empty cart on order | 400 | Your cart is empty |
| Out of stock | 400 | Only X unit(s) available in stock |
| Invalid coupon | 404 | Invalid coupon code |
| Expired coupon | 400 | This coupon has expired |

---

## ─── RECOMMENDED TEST ORDER ──────────────────────────────

Follow this sequence for a complete end-to-end test:

```
1.  Register new user
2.  Login as admin → copy admin token
3.  Get all categories → copy CATEGORY_ID
4.  Get all products → copy PRODUCT_ID
5.  Create coupon (admin)
6.  Login as customer → copy customer token
7.  Add item to cart → copy ITEM_ID
8.  Apply coupon to cart
9.  Add product to wishlist
10. Submit a review
11. Create order → copy ORDER_ID
12. Create payment intent
13. Check admin dashboard stats
14. Update order status (admin)
15. Update user profile
16. Add address
```
