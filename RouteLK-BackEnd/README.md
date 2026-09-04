# RouteLK - Backend API

RouteLK is a Sri Lankan public transportation web application that empowers passengers to find intercity buses, check routes and schedules, compare fares between AC and Non-AC buses, see live seat availability for specific travel dates, and reserve seats.

Built for simplicity, speed, and demonstration during hackathons.

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas via Mongoose
- **Authentication**: JWT (JSON Web Tokens) with `Bearer` scheme
- **Password Security**: `bcryptjs`
- **Validation**: `express-validator`
- **CORS**: `cors` (configured for React Vite frontend on `http://localhost:5173`)

---

## Project Structure

```text
RouteLK-BackEnd/
├── config/
│   └── db.js                 # MongoDB connection logic
├── controllers/
│   ├── authController.js     # Register, Login, Current user profile
│   ├── busController.js      # Bus search, seat map, CRUD, owner buses
│   ├── bookingController.js  # Booking creation, seat locks, cancellation
│   └── userController.js     # Admin user management & system statistics
├── middleware/
│   ├── authMiddleware.js     # JWT token verification & user attachment
│   ├── roleMiddleware.js     # Role authorization guard (passenger, owner, admin)
│   └── errorMiddleware.js    # Centralized 404 and error response handler
├── models/
│   ├── User.js               # User schema with bcrypt password hashing
│   ├── Bus.js                # Bus schema with AC/NON_AC & search indexes
│   └── Booking.js            # Booking schema with seat numbers and fares
├── routes/
│   ├── authRoutes.js         # /api/auth
│   ├── busRoutes.js          # /api/buses
│   ├── bookingRoutes.js      # /api/bookings
│   ├── userRoutes.js         # /api/users
│   └── adminRoutes.js        # /api/admin
├── utils/
│   └── generateBookingId.js  # Formats human-readable booking IDs (RLK-10001)
├── seed/
│   └── seedData.js           # Seeds sample users, 10 Sri Lankan buses, and bookings
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration (git ignored)
├── package.json
└── server.js                 # Application entry point
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster connection string (or a local MongoDB instance)

### 2. Installation
```bash
cd RouteLK-BackEnd
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` (or update `.env`):
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/routelk?retryWrites=true&w=majority
JWT_SECRET=routelk_secret_jwt_key_hackathon_2026_super_secure
CLIENT_URL=http://localhost:5173
```

### 4. Seed Demo Data
To populate the database with 1 Admin, 2 Owners, 3 Passengers, 10 Sri Lankan buses, and sample bookings:
```bash
npm run seed
```

#### Default Seed Credentials:
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@routelk.lk` | `admin123` |
| **Owner 1** | `owner1@routelk.lk` | `owner123` |
| **Owner 2** | `owner2@routelk.lk` | `owner123` |
| **Passenger** | `kasun@routelk.lk` | `pass123` |

### 5. Running the Server
- **Development mode** (with nodemon auto-restart):
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```
The server will start at `http://localhost:5000`.

---

## User Roles & Permissions

1. **`passenger`**:
   - Register and login (public registration is restricted to passenger role).
   - Search buses with filters (`from`, `to`, `travelDate`, `busType`, fare range).
   - Inspect bus details, route stops, and seat availability for any travel date.
   - Book seats (backend calculates fare and prevents seat collision).
   - View and cancel own bookings.
2. **`owner`**:
   - Add new buses (`POST /api/buses`).
   - View, update, or delete own buses (`/api/buses/owner/my-buses`).
   - View passenger bookings for own buses (`/api/bookings/bus/:busId`).
3. **`admin`**:
   - Manage all users (`GET`, `DELETE /api/users`).
   - View all buses and delete any bus.
   - View all system bookings (`GET /api/bookings`).
   - Access system metrics dashboard (`GET /api/admin/statistics`).

---

## Bus Types & Seat Booking Logic

### 1. AC & NON-AC Buses
RouteLK categorizes buses using `busType`:
- `"AC"`: Air-conditioned buses (e.g. Express highway routes)
- `"NON_AC"`: Standard non-air-conditioned buses

### 2. Date-Specific Seat Availability
- Seat availability is calculated dynamically based on the requested `travelDate`.
- A seat booked on `2026-09-10` is unavailable on `2026-09-10`, but remains completely free on other dates.
- Endpoint `GET /api/buses/:id/seats?travelDate=YYYY-MM-DD` returns:
  ```json
  {
    "totalSeats": 40,
    "bookedSeats": [3, 5, 6, 12],
    "availableSeats": [1, 2, 4, 7, 8, 9, 10, 11, ...]
  }
  ```

### 3. Server-Calculated Fares & Collision Prevention
When booking via `POST /api/bookings`:
- The client sends `{ busId, travelDate, seats: [5, 6] }`.
- The backend checks for duplicate seat entries, valid bounds (`1..totalSeats`), and conflicts with any existing `CONFIRMED` booking on that date.
- The server computes: `passengerCount = seats.length`, `totalFare = seats.length * bus.fare`. Fares sent by clients are ignored.
- Generates a human-friendly booking reference: `RLK-10001`.

---

## API Endpoints Reference

### Health & Root
- `GET /` - Root welcoming message
- `GET /api/health` - Backend health status

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new passenger
- `POST /api/auth/login` - Authenticate user & get JWT token
- `GET /api/auth/me` - Get current user profile (Requires Bearer token)

### Buses (`/api/buses`)
- `GET /api/buses` - List all active buses
- `GET /api/buses/search?from=Colombo&to=Kandy&travelDate=2026-09-10&busType=AC&minFare=300&maxFare=600` - Search buses
- `GET /api/buses/:id` - Get single bus details
- `GET /api/buses/:id/seats?travelDate=2026-09-10` - Get seat availability for a travel date
- `GET /api/buses/owner/my-buses` - List buses owned by logged-in owner (Owner only)
- `POST /api/buses` - Add new bus (Owner only)
- `PUT /api/buses/:id` - Update bus (Bus owner or Admin)
- `DELETE /api/buses/:id` - Delete bus (Bus owner or Admin)

### Bookings (`/api/bookings`)
- `POST /api/bookings` - Create a new booking (Passenger/Owner/Admin)
- `GET /api/bookings/my` - View current user's bookings
- `GET /api/bookings/:id` - View single booking details
- `PUT /api/bookings/:id/cancel` - Cancel a booking
- `GET /api/bookings/bus/:busId` - View bookings for a specific bus (Bus owner or Admin)
- `GET /api/bookings` - View all bookings across the platform (Admin only)

### Admin & Users (`/api/users` & `/api/admin`)
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get single user (Admin only)
- `DELETE /api/users/:id` - Delete a user (Admin only)
- `GET /api/admin/statistics` - Platform overview stats (Admin only)

# 1. Commit the staged Google Pay files with your account
git commit -m "feat: add Google Pay payment gateway for wallet top-up"

# 2. Push directly to GitHub
git push origin main