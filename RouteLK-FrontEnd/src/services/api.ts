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
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned error status ${res.status}. Please ensure backend is running.`);
  }
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
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned error status ${res.status}. Please ensure backend is running.`);
  }
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

export interface PayHerePaymentParams {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  custom_1?: string;
  custom_2?: string;
}

export async function initPayHereTopUpApi(
  amount: number,
  token: string
): Promise<{ success: boolean; data: PayHerePaymentParams }> {
  const res = await fetch(`${API_BASE}/wallet/payhere-init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to initialize PayHere checkout.');
  }
  return data;
}

export async function confirmPayHereTopUpApi(
  orderId: string,
  token: string,
  paymentId?: string
): Promise<{
  success: boolean;
  message: string;
  data: { balance: number; transaction: WalletTransaction };
}> {
  const res = await fetch(`${API_BASE}/wallet/payhere-confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId, paymentId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to verify PayHere top-up.');
  }
  return data;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

export interface ChatApiResponse {
  success: boolean;
  reply: string;
  source?: string;
  message?: string;
}

export async function sendChatMessageApi(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  token?: string | null
): Promise<ChatApiResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to get response from AI assistant.');
  }
  return data;
}


