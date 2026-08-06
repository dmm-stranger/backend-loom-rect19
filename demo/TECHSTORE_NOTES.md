# TechStore Backend — Complete Notes
> Node.js · Express 4 · MongoDB · Mongoose · JWT · Stripe · Cloudinary · Nodemailer

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + httpOnly Cookie |
| Payments | Stripe PaymentIntents |
| Images | Cloudinary (prod) / Local (dev) |
| Email | Nodemailer + Gmail SMTP |
| Validation | express-validator |
| Security | Helmet, CORS, Rate Limiting |

---

## 2. Folder Structure

```
techstore-backend/
├── src/
│   ├── config/
│   │   ├── db.js                          # MongoDB connection
│   │   ├── cloudinary.js                  # Cloudinary SDK config
│   │   └── stripe.js                      # Stripe SDK init
│   │
│   ├── models/
│   │   ├── User.model.js                  # User + addresses + ban + reset token
│   │   ├── Product.model.js               # Product + images + specs + ratings
│   │   ├── Category.model.js              # Category + parent support
│   │   ├── Cart.model.js                  # Cart + items + coupon
│   │   ├── Coupon.model.js                # Coupon + validate() method
│   │   ├── Wishlist.model.js              # Wishlist product references
│   │   ├── Review.model.js                # Review + auto rating recalc hook
│   │   ├── Order.model.js                 # Order + payment + shipping
│   │   ├── Settings.model.js              # Store settings (tax, shipping)
│   │   └── Notification.model.js          # User notifications
│   │
│   ├── controllers/
│   │   ├── auth.controller.js             # register, login, logout, me,
│   │   │                                  # forgotPassword, resetPassword, changePassword
│   │   ├── user.controller.js             # profile, addresses, deleteAccount
│   │   ├── product.controller.js          # CRUD, search, filter, featured,
│   │   │                                  # suggestions, related, brands
│   │   ├── category.controller.js         # CRUD + image upload
│   │   ├── cart.controller.js             # cart, items, coupon, merge
│   │   ├── wishlist.controller.js         # get, add, remove
│   │   ├── review.controller.js           # createOrUpdate, get, delete
│   │   ├── order.controller.js            # create, myOrders, getById, cancel
│   │   ├── payment.controller.js          # createIntent, webhook, refund
│   │   ├── notification.controller.js     # get, markRead, markAllRead,
│   │   │                                  # delete, clearRead
│   │   └── admin/
│   │       ├── adminDashboard.controller.js  # stats, topCustomers, salesByCategory
│   │       ├── adminOrder.controller.js      # all, single, status, delete
│   │       ├── adminProduct.controller.js    # all, single, featured, stock
│   │       ├── adminUser.controller.js       # all, single, role, ban, delete
│   │       ├── adminCoupon.controller.js     # CRUD
│   │       ├── adminReview.controller.js     # all, delete
│   │       └── adminSettings.controller.js   # get, update
│   │
│   ├── routes/
│   │   ├── index.js                       # mounts all routers under /api/v1
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   ├── category.routes.js
│   │   ├── cart.routes.js
│   │   ├── wishlist.routes.js
│   │   ├── review.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── notification.routes.js
│   │   └── admin.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js             # protect + authorize(role) + banned check
│   │   ├── error.middleware.js            # centralized error handler
│   │   ├── notFound.middleware.js         # 404 handler
│   │   ├── upload.middleware.js           # storage switcher (local/cloudinary)
│   │   ├── upload.local.js               # multer disk storage
│   │   ├── upload.cloudinary.js          # multer memory + Cloudinary
│   │   ├── validate.middleware.js         # express-validator result handler
│   │   └── rateLimiter.middleware.js      # auth, api, payment limiters
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── product.validator.js
│   │   ├── cart.validator.js
│   │   ├── order.validator.js
│   │   └── review.validator.js
│   │
│   ├── utils/
│   │   ├── asyncHandler.js               # wraps async controllers
│   │   ├── ApiError.js                   # custom error class
│   │   ├── ApiResponse.js                # standard success response
│   │   ├── generateToken.js              # JWT + httpOnly cookie
│   │   ├── generateResetToken.js         # crypto reset token
│   │   ├── sendEmail.js                  # nodemailer + email templates
│   │   └── calculateOrderTotals.js       # items + shipping + tax + discount
│   │
│   ├── seeder/
│   │   └── seed.js                       # 2 users + 6 categories + 12 products
│   │
│   ├── app.js                            # Express app + middleware stack
│   └── server.js                         # HTTP server bootstrap
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Database Models (Mongoose Schemas)

### User
```js
{
  name:                 String,
  email:                String (unique, lowercase),
  password:             String (bcrypt hashed, select: false),
  role:                 String (enum: customer | admin, default: customer),
  isBanned:             Boolean (default: false),
  avatar:               { url: String, public_id: String },
  addresses: [{
    label:      String,
    line1:      String,
    city:       String,
    state:      String,
    postalCode: String,
    country:    String,
    isDefault:  Boolean
  }],
  passwordResetToken:   String (hashed, default: null),
  passwordResetExpires: Date (default: null),
  timestamps: true
}
```

### Product
```js
{
  name:           String,
  slug:           String (unique, auto-generated),
  description:    String,
  brand:          String,
  category:       ObjectId → Category,
  price:          Number,
  discountPrice:  Number (default: 0),
  stock:          Number (default: 0),
  images:         [{ url: String, public_id: String }] (max 5),
  specs:          Map (key-value pairs e.g. { RAM: "16GB" }),
  ratingsAverage: Number (default: 0, auto-updated by Review hook),
  ratingsCount:   Number (default: 0, auto-updated by Review hook),
  isFeatured:     Boolean (default: false),
  timestamps: true
}
// Indexes: text on name/brand/description, category, price, isFeatured
```

### Category
```js
{
  name:   String (unique),
  slug:   String (unique, auto-generated),
  image:  { url: String, public_id: String },
  parent: ObjectId → Category (default: null),
  timestamps: true
}
```

### Cart
```js
{
  user:    ObjectId → User (unique),
  items: [{
    product: ObjectId → Product,
    name:    String (snapshot),
    image:   String (snapshot),
    price:   Number (snapshot),
    qty:     Number (min: 1)
  }],
  coupon:  ObjectId → Coupon (default: null),
  timestamps: true
}
// Virtuals: itemCount, subtotal
```

### Coupon
```js
{
  code:            String (unique, uppercase),
  discountPercent: Number (1-100),
  minOrderAmount:  Number (default: 0),
  maxUses:         Number (default: null = unlimited),
  usedCount:       Number (default: 0),
  expiresAt:       Date,
  isActive:        Boolean (default: true),
  timestamps: true
}
// Methods: validate(cartSubtotal), calculateDiscount(subtotal)
```

### Wishlist
```js
{
  user:     ObjectId → User (unique),
  products: [ObjectId → Product],
  timestamps: true
}
```

### Review
```js
{
  product:  ObjectId → Product,
  user:     ObjectId → User,
  rating:   Number (1-5),
  comment:  String (10-500 chars),
  timestamps: true
}
// Compound unique index: { product, user }
// Hooks: post(save) + post(deleteOne) → recalculates product ratings
```

### Order
```js
{
  user:  ObjectId → User,
  items: [{
    product: ObjectId → Product,
    name:    String (snapshot),
    image:   String (snapshot),
    price:   Number (snapshot),
    qty:     Number
  }],
  shippingAddress: {
    fullName:   String,
    line1:      String,
    city:       String,
    state:      String,
    postalCode: String,
    country:    String,
    phone:      String
  },
  paymentInfo: {
    provider:              String (default: stripe),
    stripePaymentIntentId: String,
    status:                String (pending|paid|failed|refunded),
    paidAt:                Date
  },
  couponCode:    String,
  itemsPrice:    Number,
  shippingPrice: Number,
  taxPrice:      Number,
  discount:      Number,
  totalPrice:    Number,
  orderStatus:   String (processing|shipped|delivered|cancelled),
  deliveredAt:   Date,
  timestamps: true
}
```

### Settings
```js
{
  storeName:          String (default: TechStore),
  storeEmail:         String,
  currency:           String (USD|EUR|GBP|BDT|INR),
  taxRate:            Number (default: 0.15 = 15%),
  shippingCost:       Number (default: 10),
  freeShippingMin:    Number (default: 100),
  isStoreOpen:        Boolean (default: true),
  maintenanceMessage: String,
  socialLinks: {
    facebook:  String,
    instagram: String,
    twitter:   String,
    youtube:   String
  },
  timestamps: true
}
// Static: getSettings() → auto-creates if none exist
```

### Notification
```js
{
  user:           ObjectId → User,
  type:           String (order_placed|order_status|order_cancelled|
                          order_refunded|review_deleted|account_banned|admin_message),
  title:          String,
  message:        String,
  reference:      ObjectId (optional),
  referenceModel: String (Order|Product|Review|null),
  isRead:         Boolean (default: false),
  timestamps: true
}
// Indexes: { user, isRead }, { user, createdAt }
// Static: createNotification({ userId, type, title, message, reference, referenceModel })
```

---

## 4. Environment Variables

```bash
# Server
NODE_ENV=development
PORT=8000
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://127.0.0.1:27017/techstore

# Auth
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
COOKIE_EXPIRE_DAYS=7

# Image Storage — change ONE line to switch
IMAGE_STORAGE=local        # dev  → /uploads folder
IMAGE_STORAGE=cloudinary   # prod → Cloudinary CDN

# Cloudinary (required when IMAGE_STORAGE=cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Email (Gmail SMTP)
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
FROM_NAME=TechStore
FROM_EMAIL=noreply@techstore.com

# Seeder
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@techstore.com
ADMIN_PASSWORD=Admin@12345
```

---

## 5. Order Total Calculation

```
itemsPrice    = sum(price × qty)
shippingPrice = $0 if itemsPrice >= freeShippingMin, else shippingCost
taxPrice      = itemsPrice × taxRate
discount      = coupon discount amount
totalPrice    = itemsPrice + shippingPrice + taxPrice - discount

Default values (from Settings collection):
  taxRate          = 0.15  (15%)
  shippingCost     = $10
  freeShippingMin  = $100
```

---

## 6. Rate Limiting

| Route | Limit |
|---|---|
| `POST /auth/register` | 10 req / 15 min |
| `POST /auth/login` | 10 req / 15 min |
| `POST /auth/forgot-password` | 10 req / 15 min |
| `PATCH /auth/reset-password/:token` | 10 req / 15 min |
| `POST /payments/create-payment-intent` | 20 req / 1 hour |
| All `/api/*` routes | 300 req / 15 min |

---

## 7. Image Storage Switch

```bash
# Local dev
IMAGE_STORAGE=local
# Images saved to: /uploads/filename.jpg
# Served at: http://localhost:8000/uploads/filename.jpg

# Production (Vercel)
IMAGE_STORAGE=cloudinary
# Images saved to: Cloudinary CDN
# Served at: https://res.cloudinary.com/...
```

---

## 8. All API Endpoints (77 Total)

### 🔐 Auth — `/api/v1/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /register | Public | Create account |
| POST | /login | Public | Login + set cookie |
| POST | /logout | Private | Clear auth cookie |
| GET | /me | Private | Get current user |
| POST | /forgot-password | Public | Send reset email |
| PATCH | /reset-password/:token | Public | Reset via email token |
| PATCH | /change-password | Private | Change password (logged in) |

### 👤 Users — `/api/v1/users`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| PATCH | /profile | Private | Update name/avatar |
| DELETE | /account | Private | Delete own account (GDPR) |
| GET | /addresses | Private | Get saved addresses |
| POST | /addresses | Private | Add address (max 5) |
| PATCH | /addresses/:addressId | Private | Update address |
| DELETE | /addresses/:addressId | Private | Delete address |

### 📦 Products — `/api/v1/products`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Public | Paginated + filtered list |
| GET | /featured | Public | Featured products |
| GET | /brands | Public | All unique brands |
| GET | /search/suggestions?q= | Public | Autocomplete search |
| GET | /related/:id | Public | Related products |
| GET | /:id | Public | Single product (id or slug) |
| POST | / | Admin | Create product (up to 5 images) |
| PUT | /:id | Admin | Update product |
| DELETE | /:id | Admin | Delete product + images |

### 📁 Categories — `/api/v1/categories`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Public | All categories |
| GET | /:id | Public | Single category |
| POST | / | Admin | Create category |
| PUT | /:id | Admin | Update category |
| DELETE | /:id | Admin | Delete category |

### 🛒 Cart — `/api/v1/cart`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Private | Get cart with totals |
| DELETE | / | Private | Clear cart |
| POST | /merge | Private | Merge guest cart on login |
| POST | /items | Private | Add item |
| PATCH | /items/:itemId | Private | Update quantity |
| DELETE | /items/:itemId | Private | Remove item |
| POST | /apply-coupon | Private | Apply coupon code |
| DELETE | /coupon | Private | Remove coupon |

### ❤️ Wishlist — `/api/v1/wishlist`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Private | Get wishlist |
| POST | /:productId | Private | Add to wishlist |
| DELETE | /:productId | Private | Remove from wishlist |

### ⭐ Reviews — `/api/v1/products/:productId/reviews`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Public | Get all reviews |
| POST | / | Private | Create or update review |
| DELETE | /:reviewId | Private | Delete review (owner/admin) |

### 📋 Orders — `/api/v1/orders`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | / | Private | Create order from cart |
| GET | /my | Private | My order history |
| GET | /:id | Private | Single order detail |
| PATCH | /:id/cancel | Private | Cancel order |

### 💳 Payments — `/api/v1/payments`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /create-payment-intent | Private | Create Stripe PaymentIntent |
| POST | /webhook | Stripe-signed | Handle payment events |

### 🔔 Notifications — `/api/v1/notifications`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | / | Private | Get notifications + unread count |
| PATCH | /read-all | Private | Mark all as read |
| DELETE | /clear | Private | Delete all read notifications |
| PATCH | /:id/read | Private | Mark one as read |
| DELETE | /:id | Private | Delete one notification |

### 👑 Admin — `/api/v1/admin`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /dashboard/stats | Admin | Revenue, orders, users, charts |
| GET | /dashboard/top-customers | Admin | Top 10 customers by spending |
| GET | /dashboard/sales-by-category | Admin | Revenue per category |
| GET | /orders | Admin | All orders (paginated + filtered) |
| GET | /orders/:id | Admin | Single order full detail |
| PATCH | /orders/:id/status | Admin | Update order status |
| POST | /orders/:id/refund | Admin | Refund via Stripe |
| DELETE | /orders/:id | Admin | Delete cancelled order |
| GET | /products | Admin | All products + stock filter |
| GET | /products/:id | Admin | Single product for edit form |
| PATCH | /products/:id/featured | Admin | Toggle featured on/off |
| PATCH | /products/:id/stock | Admin | Quick stock update |
| GET | /users | Admin | All users |
| GET | /users/:id | Admin | Single user + order history |
| PATCH | /users/:id/role | Admin | Promote/demote role |
| PATCH | /users/:id/ban | Admin | Ban/unban user |
| DELETE | /users/:id | Admin | Delete user |
| GET | /coupons | Admin | All coupons |
| POST | /coupons | Admin | Create coupon |
| PATCH | /coupons/:id | Admin | Update coupon |
| DELETE | /coupons/:id | Admin | Delete coupon |
| GET | /reviews | Admin | All reviews (moderation) |
| DELETE | /reviews/:id | Admin | Delete review |
| GET | /settings | Admin | Get store settings |
| PATCH | /settings | Admin | Update store settings |

---

## 9. Standard Response Shape

```json
// Success
{
  "success": true,
  "statusCode": 200,
  "message": "Products fetched",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Product not found",
  "stack": "...only in development"
}
```

---

## 10. Notification Triggers

| Event | Type | Triggered In |
|---|---|---|
| Order placed | order_placed | order.controller.js |
| Payment confirmed | order_status | payment.controller.js (webhook) |
| Payment failed | order_status | payment.controller.js (webhook) |
| Order refunded | order_refunded | payment.controller.js |
| Order cancelled by customer | order_cancelled | order.controller.js |
| Order status changed by admin | order_status | adminOrder.controller.js |
| User banned | account_banned | adminUser.controller.js |
| User unbanned | account_banned | adminUser.controller.js |
| Review deleted by admin | review_deleted | adminReview.controller.js |

---

## 11. Seeded Accounts

| Role | Email | Password |
|---|---|---|
| admin | admin@techstore.com | Admin@12345 |
| customer | demo@techstore.com | Customer@123 |

---

## 12. Scripts

```bash
yarn dev           # start dev server (nodemon)
yarn start         # start production server
yarn seed          # seed DB (users + categories + products)
yarn seed:destroy  # wipe all seeded data
```

---

## 13. Deployment Notes (Vercel)

```bash
# Required env vars on Vercel
NODE_ENV=production
IMAGE_STORAGE=cloudinary    # ← MUST be cloudinary (no filesystem on Vercel)
MONGO_URI=mongodb+srv://... # ← MongoDB Atlas connection string
CLIENT_URL=https://your-frontend.vercel.app

# Vercel cannot:
# - Write to filesystem (no local image storage)
# - Run persistent processes (no WebSockets without extra setup)
# - Store files between deployments
```

---

## 14. Frontend Integration (RTK Query)

```js
// baseApi.js
fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL, // http://localhost:8000/api/v1
  credentials: "include",                      // sends httpOnly cookie
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
})
```

---

## 15. Phase History

| Phase | What Was Built | Endpoints |
|---|---|---|
| 1 | Config, Auth, JWT, Error handling | 4 |
| 2 | Products, Categories, Image upload | +11 = 15 |
| 3 | Cart, Coupon system | +7 = 22 |
| 4 | Wishlist, Reviews, Auto ratings | +6 = 28 |
| 5 | Orders, Stripe payments, Webhook | +5 = 33 |
| 6 | Admin dashboard, Users, Coupons | +10 = 43 |
| 7 | User Profile, Addresses, Security | +6 = 49 |
| 8 | Admin single fetch, featured, stock, ban, reviews, settings | +11 = 60 |
| 9 | Forgot/Reset password, Cancel order, Refund, Merge cart, Delete account | +7 = 67 |
| 10 | Brands, Suggestions, Related, Top customers, Sales by category, Notifications | +10 = 77 |
| **Total** | **Complete MERN Backend** | **77** |
