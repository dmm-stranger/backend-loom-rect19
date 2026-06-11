# TechStore Backend — Phase 1 (Config + Auth)

Node.js + Express + MongoDB backend for the TechStore MERN e-commerce project.
This phase implements: project config, error handling, JWT auth (register/login/logout/me),
and a user seeder.

## Setup

```bash
cd techstore-backend
npm install
cp .env.example .env
# edit .env -> set MONGO_URI, JWT_SECRET, CLIENT_URL

npm run seed     # creates an admin user + demo customer
npm run dev      # starts server on http://localhost:8000
```

## Connecting to the Frontend

1. The frontend's `.env` should have:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```
2. `CLIENT_URL` in this backend's `.env` must match the frontend's dev URL
   (`http://localhost:5173`) — required for CORS + cookies (`credentials: true`).
3. In `baseApi.js` (RTK Query), set `credentials: "include"` so the httpOnly
   auth cookie is sent with every request:
   ```js
   fetchBaseQuery({
     baseUrl: import.meta.env.VITE_API_BASE_URL,
     credentials: "include",
     prepareHeaders: (headers, { getState }) => {
       const token = getState().auth.token;
       if (token) headers.set("Authorization", `Bearer ${token}`);
       return headers;
     },
   })
   ```

## Endpoints (Phase 1)

| Method | Endpoint              | Access  | Description                |
|--------|-----------------------|---------|-----------------------------|
| POST   | `/api/v1/auth/register` | Public  | Create account, returns `{ user, token }` |
| POST   | `/api/v1/auth/login`    | Public  | Login, returns `{ user, token }` + sets httpOnly cookie |
| POST   | `/api/v1/auth/logout`   | Private | Clears auth cookie |
| GET    | `/api/v1/auth/me`       | Private | Returns current user |

### Response Shape

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "...", "email": "...", "avatar": null, "role": "customer" },
    "token": "eyJhbGciOi..."
  }
}
```

This `data.user` shape matches the frontend's `authSlice.user` type:
`{ id, name, email, avatar }` (with `role` added for admin checks).

## Seeded Accounts

| Role     | Email              | Password       |
|----------|--------------------|----------------|
| admin    | [email protected]  | Admin@12345    |
| customer | [email protected] | Customer@123   |

(Override via `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.)

## Next Phases

- Phase 2 (originally planned as part of this) is now complete — auth is done.
- Phase 3: Category & Product CRUD + Cloudinary image upload
- Phase 4: Cart endpoints
- Phase 5: Wishlist & Reviews
- Phase 6: Orders + Stripe
- Phase 7: Admin dashboard APIs
- Phase 8: Hardening + deployment
