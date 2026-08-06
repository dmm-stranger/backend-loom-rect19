# TechStore API — Instructions & Permissions Guide

> Who can access what, how to authenticate, and how to use every endpoint.

---

## 1. User Roles

| Role | Who | What They Can Do |
|---|---|---|
| **Guest** | Not logged in | Browse products, categories, reviews |
| **Customer** | Registered + logged in | Shop, cart, orders, wishlist, profile |
| **Admin** | Staff with admin role | Everything + manage store |

---

## 2. How Authentication Works

### Step 1 — Login to get a token
```
POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }
```

### Step 2 — Use token in every private request
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Two ways token is sent:
| Method | How | Used By |
|---|---|---|
| httpOnly Cookie | Automatic by browser | Frontend web app |
| Authorization Header | `Bearer TOKEN` | Postman / mobile app |

### Token expires in:
```
7 days (set by JWT_EXPIRE in .env)
```

---

## 3. Permission Levels

| Symbol | Meaning |
|---|---|
| 🌐 Public | Anyone — no login needed |
| 🔒 Private | Must be logged in (customer or admin) |
| 👑 Admin | Must be logged in AND have admin role |
| 🔑 Owner | Must be the owner of that resource |
| 🔑👑 Owner or Admin | Either the owner or an admin |

---

## 4. All Endpoints — Who Can Use Them

---

### 🔐 AUTH — `/api/v1/auth`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| POST | /register | 🌐 Public | Anyone | Creates customer account |
| POST | /login | 🌐 Public | Anyone | Returns token |
| POST | /logout | 🔒 Private | Logged-in user | Clears cookie |
| GET | /me | 🔒 Private | Logged-in user | Returns current user profile |
| POST | /forgot-password | 🌐 Public | Anyone | Sends reset email |
| PATCH | /reset-password/:token | 🌐 Public | Anyone with reset token | Token from email only |
| PATCH | /change-password | 🔒 Private | Logged-in user | Requires current password |

**Rate limits:**
- `/register`, `/login`, `/forgot-password`, `/reset-password` → max **10 requests per 15 minutes** per IP

---

### 👤 USERS — `/api/v1/users`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| PATCH | /profile | 🔒 Private | Logged-in user | Update own name/avatar |
| DELETE | /account | 🔒 Private | Logged-in user | Requires password confirmation |
| GET | /addresses | 🔒 Private | Logged-in user | Get own addresses only |
| POST | /addresses | 🔒 Private | Logged-in user | Max 5 addresses |
| PATCH | /addresses/:addressId | 🔑 Owner | Address owner only | Cannot edit others' addresses |
| DELETE | /addresses/:addressId | 🔑 Owner | Address owner only | Cannot delete others' addresses |

---

### 📦 PRODUCTS — `/api/v1/products`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| GET | / | 🌐 Public | Anyone | Supports: page, limit, search, category, minPrice, maxPrice, sort |
| GET | /featured | 🌐 Public | Anyone | Homepage featured products |
| GET | /brands | 🌐 Public | Anyone | All unique brand names |
| GET | /search/suggestions?q= | 🌐 Public | Anyone | Min 2 chars, returns 8 results |
| GET | /related/:id | 🌐 Public | Anyone | Same category, excludes current |
| GET | /:id | 🌐 Public | Anyone | Lookup by id OR slug |
| POST | / | 👑 Admin | Admin only | multipart/form-data, up to 5 images |
| PUT | /:id | 👑 Admin | Admin only | multipart/form-data |
| DELETE | /:id | 👑 Admin | Admin only | Also deletes Cloudinary images |

**Query params for GET /products:**
```
?page=1           → page number (default: 1)
?limit=12         → per page (default: 12)
?search=apple     → text search on name, brand, description
?category=ID      → filter by category ObjectId
?minPrice=100     → minimum price
?maxPrice=500     → maximum price
?sort=price_asc   → price_asc | price_desc | rating | newest
```

---

### 📁 CATEGORIES — `/api/v1/categories`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| GET | / | 🌐 Public | Anyone | All categories with parent populated |
| GET | /:id | 🌐 Public | Anyone | Lookup by id OR slug |
| POST | / | 👑 Admin | Admin only | multipart/form-data (image optional) |
| PUT | /:id | 👑 Admin | Admin only | multipart/form-data |
| DELETE | /:id | 👑 Admin | Admin only | Also deletes Cloudinary image |

---

### 🛒 CART — `/api/v1/cart`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| GET | / | 🔒 Private | Logged-in user | Returns cart with totals |
| DELETE | / | 🔒 Private | Logged-in user | Clears all items + coupon |
| POST | /merge | 🔒 Private | Logged-in user | Call on login if guest had items |
| POST | /items | 🔒 Private | Logged-in user | Body: { productId, qty } |
| PATCH | /items/:itemId | 🔒 Private | Logged-in user | Body: { qty } — use itemId not productId |
| DELETE | /items/:itemId | 🔒 Private | Logged-in user | Removes single item |
| POST | /apply-coupon | 🔒 Private | Logged-in user | Body: { code } |
| DELETE | /coupon | 🔒 Private | Logged-in user | Removes applied coupon |

**Important:**
- `itemId` = cart item's `_id` (from cart response) — NOT the product's `_id`
- Cart is server-side — one cart per user
- Guest cart lives in Redux — merge on login using `/cart/merge`

---

### ❤️ WISHLIST — `/api/v1/wishlist`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| GET | / | 🔒 Private | Logged-in user | Returns products + productIds array |
| POST | /:productId | 🔒 Private | Logged-in user | Adds to wishlist |
| DELETE | /:productId | 🔒 Private | Logged-in user | Removes from wishlist |

**Frontend tip:**
Use `productIds` array from GET response to show filled/empty heart icons on product cards.

---

### ⭐ REVIEWS — `/api/v1/products/:productId/reviews`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| GET | / | 🌐 Public | Anyone | Returns reviews + ratingsAverage + ratingsCount |
| POST | / | 🔒 Private | Logged-in user | Creates OR updates (one review per user per product) |
| DELETE | /:reviewId | 🔑👑 Owner or Admin | Review owner or admin | Auto-recalculates product ratings |

**One review per user per product** — if user reviews again it updates the existing one.

---

### 📋 ORDERS — `/api/v1/orders`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| POST | / | 🔒 Private | Logged-in user | Cart must have items |
| GET | /my | 🔒 Private | Logged-in user | Own orders only, newest first |
| GET | /:id | 🔑👑 Owner or Admin | Order owner or admin | |
| PATCH | /:id/cancel | 🔑 Owner | Order owner only | Only "processing" orders can be cancelled |

**Order flow:**
```
1. Add items to cart
2. POST /orders → creates order (status: pending)
3. POST /payments/create-payment-intent → get clientSecret
4. Frontend confirms payment with Stripe.js
5. Stripe webhook fires → order marked as paid
6. Stock reduced, cart cleared automatically
```

---

### 💳 PAYMENTS — `/api/v1/payments`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| POST | /create-payment-intent | 🔒 Private | Logged-in user | Body: { orderId } — returns clientSecret |
| POST | /webhook | Stripe-signed | Stripe servers only | Do NOT call manually |

**Rate limit:**
- `/create-payment-intent` → max **20 requests per hour** per IP

**Stripe test card:**
```
Card:   4242 4242 4242 4242
Expiry: Any future date
CVV:    Any 3 digits
```

---

### 🔔 NOTIFICATIONS — `/api/v1/notifications`

| Method | Endpoint | Permission | Who Uses It | Notes |
|---|---|---|---|---|
| GET | / | 🔒 Private | Logged-in user | Returns notifications + unreadCount |
| PATCH | /read-all | 🔒 Private | Logged-in user | Marks all as read |
| DELETE | /clear | 🔒 Private | Logged-in user | Deletes all read notifications |
| PATCH | /:id/read | 🔒 Private | Logged-in user | Marks one as read |
| DELETE | /:id | 🔒 Private | Logged-in user | Deletes one notification |

**Query params for GET /notifications:**
```
?isRead=false  → unread only
?isRead=true   → read only
?page=1        → pagination
?limit=20      → per page
```

**Notification types:**
```
order_placed      → when customer places an order
order_status      → when admin updates order status
order_cancelled   → when customer cancels order
order_refunded    → when admin refunds order
review_deleted    → when admin deletes a review
account_banned    → when admin bans/unbans account
admin_message     → custom admin message
```

---

### 👑 ADMIN — `/api/v1/admin`
> All admin endpoints require Admin role token

#### Dashboard
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | /dashboard/stats | 👑 Admin | Revenue, orders, users, charts, low stock |
| GET | /dashboard/top-customers | 👑 Admin | Top spenders |
| GET | /dashboard/sales-by-category | 👑 Admin | Revenue per category with % |

**Query params for dashboard:**
```
?startDate=2024-01-01  → filter start (default: 6 months ago)
?endDate=2024-12-31    → filter end (default: today)
?limit=10              → top-customers limit
```

---

#### Orders (Admin)
| Method | Endpoint | Permission | Description | Notes |
|---|---|---|---|---|
| GET | /orders | 👑 Admin | All orders paginated | Filter: status, paymentStatus |
| GET | /orders/:id | 👑 Admin | Single order full detail | |
| PATCH | /orders/:id/status | 👑 Admin | Update order status | processing→shipped→delivered→cancelled |
| POST | /orders/:id/refund | 👑 Admin | Refund via Stripe | Order must be paid |
| DELETE | /orders/:id | 👑 Admin | Delete order | Only cancelled orders |

**Valid order statuses:**
```
processing → shipped → delivered
any status → cancelled
```

---

#### Products (Admin)
| Method | Endpoint | Permission | Description | Notes |
|---|---|---|---|---|
| GET | /products | 👑 Admin | All products + stock filter | ?stock=out/low/in |
| GET | /products/:id | 👑 Admin | Single product for edit form | |
| PATCH | /products/:id/featured | 👑 Admin | Toggle featured on/off | No body needed |
| PATCH | /products/:id/stock | 👑 Admin | Quick stock update | Body: { stock: 50 } |

---

#### Users (Admin)
| Method | Endpoint | Permission | Description | Notes |
|---|---|---|---|---|
| GET | /users | 👑 Admin | All users paginated | Filter: role, search |
| GET | /users/:id | 👑 Admin | Single user + order history + total spent | |
| PATCH | /users/:id/role | 👑 Admin | Promote/demote | Body: { role: "admin" or "customer" } |
| PATCH | /users/:id/ban | 👑 Admin | Ban/unban | Body: { isBanned: true/false } |
| DELETE | /users/:id | 👑 Admin | Delete user | Cannot delete admins or self |

**Ban rules:**
- Cannot ban yourself
- Cannot ban other admins
- Banned users get 403 on all protected routes

---

#### Coupons (Admin)
| Method | Endpoint | Permission | Description | Notes |
|---|---|---|---|---|
| GET | /coupons | 👑 Admin | All coupons | Filter: ?isActive=true/false |
| POST | /coupons | 👑 Admin | Create coupon | Body below |
| PATCH | /coupons/:id | 👑 Admin | Update coupon | Partial update |
| DELETE | /coupons/:id | 👑 Admin | Delete coupon | |

**Create coupon body:**
```json
{
    "code": "SAVE20",
    "discountPercent": 20,
    "minOrderAmount": 100,
    "maxUses": 100,
    "expiresAt": "2026-12-31"
}
```

---

#### Reviews (Admin)
| Method | Endpoint | Permission | Description | Notes |
|---|---|---|---|---|
| GET | /reviews | 👑 Admin | All reviews for moderation | Filter: rating, product |
| DELETE | /reviews/:id | 👑 Admin | Delete any review | Auto-recalculates product ratings |

---

#### Settings (Admin)
| Method | Endpoint | Permission | Description | Notes |
|---|---|---|---|---|
| GET | /settings | 👑 Admin | Get store settings | |
| PATCH | /settings | 👑 Admin | Update settings | Partial update |

**Updatable settings:**
```json
{
    "storeName": "TechStore",
    "storeEmail": "support@techstore.com",
    "currency": "USD",
    "taxRate": 0.15,
    "shippingCost": 10,
    "freeShippingMin": 100,
    "isStoreOpen": true,
    "maintenanceMessage": "Back soon!",
    "socialLinks": {
        "facebook": "https://facebook.com/techstore",
        "instagram": "https://instagram.com/techstore",
        "twitter": "https://twitter.com/techstore",
        "youtube": "https://youtube.com/techstore"
    }
}
```

---

## 5. Common Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | "qty is required" | Missing required field in body |
| 400 | "Your cart is empty" | Trying to order with empty cart |
| 400 | "Only processing orders can be cancelled" | Wrong order status |
| 401 | "Not authorized, no token provided" | Missing Authorization header |
| 401 | "Invalid email or password" | Wrong credentials |
| 401 | "Authentication token has expired" | JWT expired — login again |
| 403 | "Role 'customer' is not permitted" | Customer hitting admin route |
| 403 | "Your account has been banned" | Banned user |
| 404 | "Product not found" | Wrong product ID |
| 404 | "Route not found: /api/v1/..." | Wrong URL |
| 409 | "An account with this email already exists" | Duplicate email |
| 429 | "Too many attempts from this IP" | Rate limit exceeded |
| 500 | "Email could not be sent" | Gmail SMTP error |

---

## 6. Request Body Formats

### Always use JSON for:
```
Auth, Cart, Orders, Wishlist, Reviews,
Notifications, Admin (status/role/ban/settings/coupons)
```
```
Headers: Content-Type: application/json
Body: raw → JSON in Postman
```

### Always use form-data for:
```
Products (create/update), Categories (create/update), User profile update
```
```
Body: form-data in Postman
(Postman auto-sets Content-Type: multipart/form-data)
```

---

## 7. Pagination Pattern

All list endpoints support:
```
?page=1    → page number (default: 1)
?limit=20  → items per page (default varies)
```

Response always includes:
```json
"pagination": {
    "total": 100,
    "page": 1,
    "pages": 5,
    "limit": 20
}
```

---

## 8. Quick Access — By User Type

### Guest can access:
```
GET  /products
GET  /products/featured
GET  /products/brands
GET  /products/search/suggestions
GET  /products/related/:id
GET  /products/:id
GET  /categories
GET  /categories/:id
GET  /products/:id/reviews
POST /auth/register
POST /auth/login
POST /auth/forgot-password
PATCH /auth/reset-password/:token
```

### Customer can access (everything above PLUS):
```
POST   /auth/logout
GET    /auth/me
PATCH  /auth/change-password
PATCH  /users/profile
DELETE /users/account
GET    /users/addresses
POST   /users/addresses
PATCH  /users/addresses/:id
DELETE /users/addresses/:id
GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id
DELETE /cart
POST   /cart/merge
POST   /cart/apply-coupon
DELETE /cart/coupon
GET    /wishlist
POST   /wishlist/:productId
DELETE /wishlist/:productId
POST   /products/:id/reviews
DELETE /products/:id/reviews/:reviewId (own only)
POST   /orders
GET    /orders/my
GET    /orders/:id (own only)
PATCH  /orders/:id/cancel
POST   /payments/create-payment-intent
GET    /notifications
PATCH  /notifications/read-all
DELETE /notifications/clear
PATCH  /notifications/:id/read
DELETE /notifications/:id
```

### Admin can access (everything above PLUS):
```
POST   /categories
PUT    /categories/:id
DELETE /categories/:id
POST   /products
PUT    /products/:id
DELETE /products/:id
DELETE /products/:id/reviews/:reviewId (any)
GET    /orders/:id (any)
GET    /admin/dashboard/stats
GET    /admin/dashboard/top-customers
GET    /admin/dashboard/sales-by-category
GET    /admin/orders
GET    /admin/orders/:id
PATCH  /admin/orders/:id/status
POST   /admin/orders/:id/refund
DELETE /admin/orders/:id
GET    /admin/products
GET    /admin/products/:id
PATCH  /admin/products/:id/featured
PATCH  /admin/products/:id/stock
GET    /admin/users
GET    /admin/users/:id
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/ban
DELETE /admin/users/:id
GET    /admin/coupons
POST   /admin/coupons
PATCH  /admin/coupons/:id
DELETE /admin/coupons/:id
GET    /admin/reviews
DELETE /admin/reviews/:id
GET    /admin/settings
PATCH  /admin/settings
```

---

## 9. Frontend Integration Tips

### After login — always do:
```js
// 1. Save token to Redux
dispatch(setCredentials({ user, token }));

// 2. Merge guest cart if any items
if (guestCartItems.length > 0) {
  await dispatch(mergeCart({ items: guestCartItems }));
}

// 3. Load notifications count
dispatch(fetchNotifications({ isRead: false }));
```

### On every API call — include:
```js
headers: {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
}
credentials: "include" // for cookie support
```

### Image URLs:
```js
// Local dev
`http://localhost:8000${product.images[0].url}`

// Production (Cloudinary)
product.images[0].url // already a full URL
```
