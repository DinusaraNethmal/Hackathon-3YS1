# RouteLK Booking Management API Specification

## 1. Overview
The RouteLK Booking Management Subsystem manages bus seat reservations, real-time date-specific availability, conductor ticket verifications, and passenger trip histories across Sri Lanka's intercity transit network.

---

## 2. Booking Lifecycle & State Machine
```
[Select Seats on Cabin Layout]
           │
           ▼
[POST /api/bookings] ─── (Seat Lock Conflict Check)
           │
           ├─ Conflicted ──► HTTP 409 Conflict
           │
           └─ Available ──► Status: "CONFIRMED" (Booking Reference: RLK-XXXXX)
                                 │
                                 ├──► [GET /api/bookings/verify/:bookingId] ──► Status: "VALID_ACTIVE"
                                 │
                                 └──► [PUT /api/bookings/:id/cancel] ───────► Status: "CANCELLED"
                                                                                 │
                                                                                 └──► Seats immediately released
```

---

## 3. Endpoints Reference

### 3.1 Create Seat Reservation
- **Route**: `POST /api/bookings`
- **Access**: Private (Authenticated Passenger, Owner, or Admin)
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Payload**:
```json
{
  "busId": "65e5b38d4f1a2c3d4e5f6789",
  "travelDate": "2026-09-10",
  "seats": [7, 8],
  "passengerName": "Kasun Perera",
  "passengerPhone": "0771234567",
  "passengerEmail": "kasun@routelk.lk"
}
```
- **Validation Rules**:
  - `travelDate`: Must match `YYYY-MM-DD` and cannot be in the past.
  - `seats`: Must be an array of integers between 1 and `bus.totalSeats`. Maximum 6 seats per transaction.
  - Duplicate seat numbers in single request are rejected.
  - Already confirmed seats on the specified date trigger an immediate `409 Conflict`.
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": {
    "id": "67c69da9792fa62776c59bd0",
    "bookingId": "RLK-10018",
    "bus": "WP NA-4512",
    "busNumber": "WP NA-4512",
    "operatorName": "Southern Superline",
    "busType": "AC",
    "departureTime": "06:30",
    "arrivalTime": "09:00",
    "from": "Colombo",
    "to": "Galle",
    "travelDate": "2026-09-10",
    "seats": [7, 8],
    "passengerCount": 2,
    "farePerSeat": 850,
    "totalFare": 1700,
    "passengerName": "Kasun Perera",
    "passengerPhone": "0771234567",
    "passengerEmail": "kasun@routelk.lk",
    "status": "CONFIRMED",
    "createdAt": "2026-09-04T07:15:00.000Z"
  }
}
```

---

### 3.2 Public Ticket Verification
- **Route**: `GET /api/bookings/verify/:bookingId`
- **Access**: Public (Conductors, station inspectors, passenger validation)
- **Parameters**: `bookingId` (e.g. `RLK-10018`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "valid": true,
  "verificationStatus": "VALID_ACTIVE",
  "ticket": {
    "bookingId": "RLK-10018",
    "status": "CONFIRMED",
    "passengerName": "Kasun Perera",
    "passengerPhone": "0771234567",
    "busNumber": "WP NA-4512",
    "operatorName": "Southern Superline",
    "busType": "AC",
    "from": "Colombo",
    "to": "Galle",
    "departureTime": "06:30",
    "arrivalTime": "09:00",
    "travelDate": "2026-09-10",
    "seats": [7, 8],
    "seatCount": 2,
    "totalFare": 1700,
    "issuedAt": "2026-09-04T07:15:00.000Z"
  }
}
```

---

### 3.3 Cancel Booking
- **Route**: `PUT /api/bookings/:id/cancel`
- **Access**: Private (Booking owner or Admin)
- **Request Body** (optional):
```json
{
  "reason": "Trip postponed to next week"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": "RLK-10018",
    "status": "CANCELLED",
    "cancelledAt": "2026-09-04T08:00:00.000Z",
    "cancellationReason": "Trip postponed to next week"
  }
}
```

---

### 3.4 Admin All Bookings (Filters, Search & Pagination)
- **Route**: `GET /api/bookings?page=1&limit=20&status=CONFIRMED&travelDate=2026-09-10&search=Kasun`
- **Access**: Private (Admin only)
- **Query Parameters**:
  - `page`: Page index (default: `1`).
  - `limit`: Items per page (default: `50`, max: `100`).
  - `status`: `CONFIRMED` | `CANCELLED` | `ALL`.
  - `travelDate`: Format `YYYY-MM-DD`.
  - `busId`: Filter by MongoDB `_id` of bus.
  - `search`: Case-insensitive regex match against `bookingId`, `passengerName`, or `passengerPhone`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "count": 1,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasMore": false
  },
  "summary": {
    "totalRevenue": 1700,
    "totalSeatsBooked": 2,
    "confirmedBookings": 1,
    "cancelledBookings": 0
  },
  "data": [...]
}
```

---

### 3.5 Real-Time Seat Availability
- **Route**: `GET /api/buses/:id/seats?travelDate=YYYY-MM-DD`
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "busId": "65e5b38d4f1a2c3d4e5f6789",
    "busNumber": "WP NA-4512",
    "busType": "AC",
    "travelDate": "2026-09-10",
    "fare": 850,
    "totalSeats": 40,
    "bookedSeats": [1, 2, 3, 4, 7, 8],
    "availableSeats": [5, 6, 9, 10, "..."]
  }
}
```

---

## 4. Automated Testing
Run the comprehensive booking management test suite:
```bash
npm test
# or
npm run test:booking
```
Tests cover:
1. Sequential Booking ID (`RLK-XXXXX`) pattern verification.
2. Seat boundary calculations (`1 <= seat <= totalSeats`).
3. Anti-duplicate seat selection rejection.
4. Maximum seat limit enforcement (max 6 seats).
5. Accurate fare calculation (`farePerSeat * seats.length`).
6. Double-booking conflict detector.
7. Available seat capacity subtraction.
8. Ticket verification format & validity states.
