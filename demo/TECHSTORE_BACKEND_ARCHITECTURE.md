# ⚙️ TechStore — E-Commerce Backend Architecture
> Node.js · Express 4 · MongoDB · Mongoose · JWT Auth · Stripe · Cloudinary · REST API

This document is the backend counterpart to `TECHSTORE_ARCHITECTURE.md` (frontend). It is designed to satisfy every RTK Query endpoint planned on the frontend, plus admin operations, payments, and image uploads.

---

## 1. Project Overview

| Attribute         | Decision                          | Rationale |
|-------------------|-----------------------------------|-----------|
| Runtime            | Node.js (LTS)                    | Stable, wide ecosystem support |
| Framework          | Express 4                        | Minimal, mature, huge middleware ecosystem |
| Database           | MongoDB + Mongoose ODM           | Flexible schema for product specs/variants, fast prototyping |
| Auth               | JWT (access token, httpOnly cookie) | Matches frontend `authSlice` token-based flow |
| Payments           | Stripe (PaymentIntents API)      | Matches `VITE_STRIPE_PUBLIC_KEY` on frontend |
| Image Storage      | Cloudinary                       | Offloads media storage, auto image optimization/CDN |
| Validation         | express-validator                | Declarative request validation |
| API Style          | REST, versioned (`/api/v1`)      | Matches `VITE_API_BASE_URL=http://localhost:8000/api/v1` |
| Roles              | `customer`, `admin`              | Supports full admin dashboard APIs |

---

## 2. Folder Structure

```
techstore-backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # Mongoose connection
│   │   ├── cloudinary.js          # Cloudinary SDK config
│   │   └── stripe.js              # Stripe SDK init
│   │
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Product.model.js
│   │   ├── Category.model.js
│   │   ├── Cart.model.js
│   │   ├── Order.model.js
│   │   ├── Review.model.js
│   │   ├── Wishlist.model.js
│   │   └── Coupon.model.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── category.controller.js
│   │   ├── cart.controller.js
│   │   ├── wishlist.controller.js
│   │   ├── order.controller.js
│   │   ├── review.controller.js
│   │   ├── payment.controller.js
│   │   └── admin/
│   │       ├── adminProduct.controller.js
│   │       ├── adminCategory.controller.js
│   │       ├── adminOrder.controller.js
│   │       ├── adminUser.controller.js
│   │       └── adminDashboard.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── category.routes.js
│   │   ├── cart.routes.js
│   │   ├── wishlist.routes.js
│   │   ├── order.routes.js
│   │   ├── review.routes.js
│   │   ├── payment.routes.js
│   │   ├── admin.routes.js
│   │   └── index.js               # Mounts all routers under /api/v1
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js     # protect (JWT verify), authorize(role)
│   │   ├── error.middleware.js    # centralized error handler
│   │   ├── notFound.middleware.js
│   │   ├── upload.middleware.js   # multer -> Cloudinary stream
│   │   ├── validate.middleware.js # express-validator result handler
│   │   └── rateLimiter.middleware.js
│   │
│   ├── utils/
│   │   ├── generateToken.js       # signs JWT, sets httpOnly cookie
│   │   ├── ApiError.js            # custom error class
│   │   ├── ApiResponse.js         # standard success response shape
│   │   ├── asyncHandler.js        # wraps async controllers
│   │   ├── slugify.js
│   │   └── calculateOrderTotals.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── product.validator.js
│   │   ├── order.validator.js
│   │   └── review.validator.js
│   │
│   ├── app.js                     # Express app: middleware + routes
│   └── server.js                  # HTTP server bootstrap, DB connect
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Core Dependencies

```json
{
  "dependencies": {
    "express": "^4.19.0",
    "mongoose": "^8.4.0",
    "dotenv": "^16.4.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "express-validator": "^7.1.0",
    "express-rate-limit": "^7.3.0",
    "express-async-handler": "^1.2.0",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^2.2.0",
    "stripe": "^15.0.0",
    "slugify": "^1.6.6"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

## 4. Database Models (Mongoose Schemas)

### 4.1 User
```js
{
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,            // bcrypt hashed
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  avatar: { url: String, public_id: String }, // Cloudinary
  addresses: [{
    label: String, line1: String, city: String, state: String,
    postalCode: String, country: String, isDefault: Boolean
  }],
  timestamps: true
}
```

### 4.2 Category
```js
{
  name: String,
  slug: { type: String, unique: true },
  image: { url: String, public_id: String },
  parent: { type: ObjectId, ref: "Category", default: null }
}
```
> Maps directly to frontend `constants/categories.js` and `/categories` endpoint.

### 4.3 Product
```js
{
  name: String,
  slug: { type: String, unique: true },
  description: String,
  brand: String,
  category: { type: ObjectId, ref: "Category" },
  price: Number,
  discountPrice: Number,
  stock: Number,
  images: [{ url: String, public_id: String }],
  specs: { type: Map, of: String },   // e.g. { RAM: "16GB", CPU: "i7" }
  ratingsAverage: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false }, // powers /products/featured
  timestamps: true
}
```

### 4.4 Cart
```js
{
  user: { type: ObjectId, ref: "User", unique: true },
  items: [{
    product: { type: ObjectId, ref: "Product" },
    name: String, price: Number, image: String, qty: Number
  }],
  coupon: { type: ObjectId, ref: "Coupon", default: null },
  timestamps: true
}
```

### 4.5 Wishlist
```js
{
  user: { type: ObjectId, ref: "User", unique: true },
  products: [{ type: ObjectId, ref: "Product" }]
}
```

### 4.6 Order
```js
{
  user: { type: ObjectId, ref: "User" },
  items: [{
    product: { type: ObjectId, ref: "Product" },
    name: String, price: Number, qty: Number, image: String
  }],
  shippingAddress: {
    line1: String, city: String, state: String, postalCode: String, country: String
  },
  paymentInfo: {
    provider: { type: String, default: "stripe" },
    stripePaymentIntentId: String,
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" }
  },
  itemsPrice: Number,
  shippingPrice: Number,
  taxPrice: Number,
  totalPrice: Number,
  orderStatus: {
    type: String,
    enum: ["processing", "shipped", "delivered", "cancelled"],
    default: "processing"
  },
  deliveredAt: Date,
  timestamps: true
}
```

### 4.7 Review
```js
{
  product: { type: ObjectId, ref: "Product" },
  user: { type: ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  timestamps: true
}
```

### 4.8 Coupon
```js
{
  code: { type: String, unique: true, uppercase: true },
  discountPercent: Number,
  expiresAt: Date,
  isActive: { type: Boolean, default: true }
}
```

---

## 5. API Routes (`/api/v1`)

### 5.1 Auth
| Endpoint              | Method | Access | Description |
|-----------------------|--------|--------|--------------|
| `/auth/register`      | POST   | Public | Create account, hash password, return JWT |
| `/auth/login`         | POST   | Public | Validate credentials, return JWT (cookie + body) |
| `/auth/logout`        | POST   | Private| Clear auth cookie |
| `/auth/me`            | GET    | Private| Return current user profile |

### 5.2 Users
| Endpoint              | Method | Access | Description |
|-----------------------|--------|--------|--------------|
| `/users/profile`      | PATCH  | Private| Update name/avatar (Cloudinary upload) |
| `/users/addresses`    | POST/PATCH/DELETE | Private | Manage shipping addresses |

### 5.3 Products
| Endpoint                  | Method | Access | Description |
|---------------------------|--------|--------|--------------|
| `/products`               | GET    | Public | Paginated list, query: `page, limit, category, search, sort, minPrice, maxPrice` |
| `/products/featured`      | GET    | Public | Homepage featured items (`isFeatured: true`) |
| `/products/:id`           | GET    | Public | Single product detail (with reviews populated) |
| `/products`               | POST   | Admin  | Create product (multipart, images → Cloudinary) |
| `/products/:id`           | PUT    | Admin  | Update product |
| `/products/:id`           | DELETE | Admin  | Delete product (and Cloudinary images) |

### 5.4 Categories
| Endpoint                  | Method | Access | Description |
|---------------------------|--------|--------|--------------|
| `/categories`             | GET    | Public | All categories (matches frontend `/categories`) |
| `/categories`             | POST   | Admin  | Create category |
| `/categories/:id`         | PUT/DELETE | Admin | Update/delete category |

### 5.5 Cart
| Endpoint                  | Method | Access | Description |
|---------------------------|--------|--------|--------------|
| `/cart`                   | GET    | Private| Server-side cart sync (matches frontend `/cart`) |
| `/cart/items`             | POST   | Private| Add item to cart |
| `/cart/items/:id`         | PATCH  | Private| Update item quantity |
| `/cart/items/:id`         | DELETE | Private| Remove item from cart |
| `/cart/apply-coupon`      | POST   | Private| Apply coupon code, recalculate totals |

### 5.6 Wishlist
| Endpoint                  | Method | Access | Description |
|---------------------------|--------|--------|--------------|
| `/wishlist`               | GET    | Private| Get wishlist product IDs |
| `/wishlist/:productId`    | POST/DELETE | Private | Toggle product in wishlist |

### 5.7 Reviews
| Endpoint                  | Method | Access | Description |
|---------------------------|--------|--------|--------------|
| `/products/:id/reviews`   | POST   | Private| Add/update review, recalc `ratingsAverage` |
| `/products/:id/reviews`   | GET    | Public | List reviews for a product |

### 5.8 Orders
| Endpoint                  | Method | Access | Description |
|---------------------------|--------|--------|--------------|
| `/orders`                 | POST   | Private| Create order from cart (matches frontend `/orders`) |
| `/orders/:id`             | GET    | Private| Order detail (owner or admin) |
| `/orders/my`              | GET    | Private| Current user's order history |

### 5.9 Payments (Stripe)
| Endpoint                          | Method | Access | Description |
|------------------------------------|--------|--------|--------------|
| `/payments/create-payment-intent` | POST   | Private| Create Stripe PaymentIntent for cart total, return `client_secret` |
| `/payments/webhook`               | POST   | Public (Stripe-signed) | Handle `payment_intent.succeeded` / `failed`, update Order |

### 5.10 Admin
| Endpoint                          | Method | Access | Description |
|------------------------------------|--------|--------|--------------|
| `/admin/dashboard/stats`          | GET    | Admin  | Revenue, order count, top products |
| `/admin/products`                 | GET    | Admin  | All products (incl. unpublished) |
| `/admin/orders`                   | GET    | Admin  | All orders, filter by status |
| `/admin/orders/:id/status`        | PATCH  | Admin  | Update order status (processing → shipped → delivered) |
| `/admin/users`                    | GET    | Admin  | List all users |
| `/admin/users/:id/role`           | PATCH  | Admin  | Promote/demote user role |

---

## 6. Authentication & Authorization Flow

1. **Register/Login** → password hashed with `bcryptjs` → JWT signed with `JWT_SECRET`, expiry `JWT_EXPIRE`.
2. Token returned **both** as an `httpOnly`, `secure`, `sameSite=strict` cookie **and** in the JSON response body — frontend `authSlice` can store it for `Authorization: Bearer` header use in RTK Query `baseApi.js`.
3. **`protect` middleware**: reads token from cookie or `Authorization` header, verifies via `jwt.verify`, attaches `req.user`.
4. **`authorize("admin")` middleware**: checks `req.user.role`, used on all `/admin/*` and product/category mutation routes.
5. Frontend `<AuthGuard>` checks `authSlice.user` for protected routes (`/checkout`, `/account`) — backend independently re-validates on every protected request.

---

## 7. Middleware Stack (`app.js` order)

```
1. helmet()                  // security headers
2. cors({ origin: CLIENT_URL, credentials: true })
3. express.json()
4. cookie-parser()
5. morgan("dev")              // request logging (dev only)
6. express-rate-limit          // global API rate limiting
7. /api/v1 routes
8. notFound middleware
9. centralized error middleware
```

---

## 8. Image Upload Flow (Cloudinary)

1. Client sends `multipart/form-data` to `/products` (admin) or `/users/profile`.
2. `multer` middleware (memory storage) captures file buffer.
3. `upload.middleware.js` streams buffer to Cloudinary via `cloudinary.uploader.upload_stream`.
4. Cloudinary returns `{ secure_url, public_id }` → stored on the Mongoose document.
5. On delete/update, `public_id` is used to remove the old asset via `cloudinary.uploader.destroy`.

---

## 9. Payment Flow (Stripe)

```
Frontend Checkout                Backend                          Stripe
      │                              │                                │
      │  POST /payments/create-      │                                │
      │  payment-intent (cart total) │                                │
      ├─────────────────────────────►│                                │
      │                              │  stripe.paymentIntents.create  │
      │                              ├───────────────────────────────►│
      │                              │◄───────────────────────────────┤
      │  ◄── client_secret ──────────┤                                │
      │                              │                                │
      │  Stripe.js confirmCardPayment│                                │
      ├──────────────────────────────────────────────────────────────►│
      │                              │   webhook: payment_intent.     │
      │                              │   succeeded                    │
      │                              │◄───────────────────────────────┤
      │                              │  Update Order.paymentInfo.status│
      │                              │  = "paid", reduce stock        │
```

> `/payments/webhook` must use `express.raw({ type: 'application/json' })` (not `express.json()`) so Stripe's signature verification works.

---

## 10. Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=8000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://127.0.0.1:27017/techstore

# Auth
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRE=7d
COOKIE_EXPIRE_DAYS=7

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

---

## 11. Setup Commands (Step-by-Step)

```bash
# 1. Scaffold project
mkdir techstore-backend && cd techstore-backend
npm init -y

# 2. Install core dependencies
npm install express mongoose dotenv jsonwebtoken bcryptjs cookie-parser cors helmet morgan
npm install express-validator express-rate-limit express-async-handler
npm install multer cloudinary stripe slugify

# 3. Install dev dependencies
npm install -D nodemon

# 4. Add scripts to package.json
#   "dev": "nodemon src/server.js"
#   "start": "node src/server.js"

# 5. Create folder structure (config, models, controllers, routes, middleware, utils, validators)

# 6. Connect MongoDB in src/config/db.js, call from server.js

# 7. Run dev server
npm run dev
```

---

## 12. Standard Response & Error Format

```js
// Success (ApiResponse.js)
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}

// Error (error.middleware.js)
{
  "success": false,
  "message": "Product not found",
  "stack": "...only in development"
}
```

All controllers wrapped in `asyncHandler` to forward errors to the centralized error middleware — avoids repetitive try/catch.

---

## 13. Development Phases

| Phase | Scope                                                  | Status   |
|-------|----------------------------------------------------------|----------|
| 1     | Project setup, DB connection, error/response utils, middleware stack | 🔄 Now |
| 2     | Auth (register/login/me), User model, JWT + cookies   | Planned  |
| 3     | Category & Product CRUD + Cloudinary image upload     | Planned  |
| 4     | Cart endpoints (sync with Redux `cartSlice`)          | Planned  |
| 5     | Wishlist & Reviews                                    | Planned  |
| 6     | Orders + Stripe PaymentIntent + webhook               | Planned  |
| 7     | Admin dashboard APIs (products, orders, users, stats) | Planned  |
| 8     | Validation hardening, rate limiting, deployment       | Planned  |

---

## 14. Frontend ↔ Backend Endpoint Mapping (Quick Reference)

| Frontend (RTK Query)       | Backend Route               | Status |
|------------------------------|------------------------------|--------|
| `/products`                | `GET /api/v1/products`       | ✅ |
| `/products/:id`            | `GET /api/v1/products/:id`   | ✅ |
| `/products/featured`       | `GET /api/v1/products/featured` | ✅ |
| `/categories`              | `GET /api/v1/categories`     | ✅ |
| `/cart`                     | `GET /api/v1/cart`           | ✅ |
| `/cart/items`               | `POST /api/v1/cart/items`    | ✅ |
| `/cart/items/:id`           | `PATCH/DELETE /api/v1/cart/items/:id` | ✅ |
| `/auth/login`               | `POST /api/v1/auth/login`    | ✅ |
| `/auth/register`            | `POST /api/v1/auth/register` | ✅ |
| `/orders`                    | `POST /api/v1/orders`        | ✅ |
| `/orders/:id`                | `GET /api/v1/orders/:id`     | ✅ |

> Recommend adding to frontend's `productsApi.js`: `wishlist`, `reviews`, and `payments/create-payment-intent` endpoints to fully utilize this backend.
