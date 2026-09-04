export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'passenger' | 'owner' | 'admin';
  walletBalance?: number;
  createdAt?: string;
}

export interface WalletTransaction {
  _id?: string;
  id?: string;
  transactionId: string;
  userId: string;
  type: 'TOPUP' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod: string;
  reference: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  bookingId?: any;
  createdAt: string;
}

export interface WalletSummary {
  totalTopUp: number;
  totalSpent: number;
  totalRefunded: number;
  transactionCount: number;
}

export interface WalletData {
  balance: number;
  summary: WalletSummary;
  transactions: WalletTransaction[];
}

export interface TopUpPayload {
  amount: number;
  paymentMethod?: string;
  reference?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface AdminStats {
  totalUsers: number;
  totalPassengers: number;
  totalOwners: number;
  totalBuses: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
}

export interface Bus {
  id?: string;
  _id?: string;
  busNumber: string;
  busType: 'AC' | 'NON_AC';
  operatorName: string;
  from: string;
  to: string;
  routeStops?: string[];
  departureTime: string;
  arrivalTime: string;
  fare: number;
  totalSeats: number;
  isActive?: boolean;
}

export interface Booking {
  _id?: string;
  id?: string;
  bookingId?: string;
  userId?: string | User;
  busId?: string | Bus;
  travelDate: string;
  seats: number[];
  passengerCount?: number;
  farePerSeat?: number;
  totalFare: number;
  status: 'CONFIRMED' | 'CANCELLED';
  passengerDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed. Please check your credentials.');
  }
  return data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed.');
  }
  return data;
}

export async function getMeApi(token: string): Promise<{ success: boolean; user: User }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch user session.');
  }
  return data;
}

export async function getAdminStatsApi(token: string): Promise<{ success: boolean; data: AdminStats }> {
  const res = await fetch(`${API_BASE}/admin/statistics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch admin statistics.');
  }
  return data;
}

export async function getUsersApi(token: string): Promise<{ success: boolean; data: User[] }> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch users.');
  }
  return data;
}

export async function deleteUserApi(id: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete user.');
  }
  return data;
}

export async function getBusesApi(all: boolean = false): Promise<{ success: boolean; data: Bus[] }> {
  const url = all ? `${API_BASE}/buses?all=true` : `${API_BASE}/buses`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch buses.');
  }
  return data;
}

export async function deleteBusApi(id: string, token: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/buses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete bus.');
  }
  return data;
}

export async function createBusApi(busData: Partial<Bus>, token: string): Promise<{ success: boolean; data: Bus }> {
  const res = await fetch(`${API_BASE}/buses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(busData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create bus.');
  }
  return data;
}

export async function updateBusApi(
  id: string,
  busData: Partial<Bus>,
  token: string
): Promise<{ success: boolean; message: string; data: Bus }> {
  const res = await fetch(`${API_BASE}/buses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(busData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update bus.');
  }
  return data;
}

export async function getMyBookingsApi(token: string): Promise<{ success: boolean; data: Booking[] }> {
  const res = await fetch(`${API_BASE}/bookings/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch your bookings.');
  }
  return data;
}

export async function cancelBookingApi(
  bookingId: string,
  token: string
): Promise<{ success: boolean; message: string; data: Booking }> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to cancel booking.');
  }
  return data;
}

export interface BusSeatAvailability {
  busId: string;
  busNumber: string;
  busType: 'AC' | 'NON_AC';
  travelDate: string;
  fare: number;
  totalSeats: number;
  bookedSeats: number[];
  availableSeats: number[];
}

export async function getBusSeatsApi(
  busId: string,
  travelDate: string
): Promise<{ success: boolean; data: BusSeatAvailability }> {
  const res = await fetch(`${API_BASE}/buses/${busId}/seats?travelDate=${travelDate}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch seat availability.');
  }
  return data;
}

export interface CreateBookingPayload {
  busId: string;
  travelDate: string;
  seats: number[];
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  booking: {
    id: string;
    bookingId: string;
    bus: string;
    busNumber?: string;
    operatorName?: string;
    busType?: string;
    departureTime?: string;
    arrivalTime?: string;
    from: string;
    to: string;
    travelDate: string;
    seats: number[];
    passengerCount: number;
    farePerSeat: number;
    totalFare: number;
    paymentMethod?: string;
    remainingWalletBalance?: number;
    status: string;
    createdAt: string;
  };
}

export async function createBookingApi(
  payload: CreateBookingPayload,
  token: string
): Promise<CreateBookingResponse> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Booking failed.');
  }
  return data;
}

export async function getWalletApi(
  token: string
): Promise<{ success: boolean; data: WalletData }> {
  const res = await fetch(`${API_BASE}/wallet`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch wallet information.');
  }
  return data;
}

export async function topUpWalletApi(
  payload: TopUpPayload,
  token: string
): Promise<{
  success: boolean;
  message: string;
  data: { balance: number; transaction: WalletTransaction };
}> {
  const res = await fetch(`${API_BASE}/wallet/topup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Top-up failed. Please check your details.');
  }
  return data;
}

