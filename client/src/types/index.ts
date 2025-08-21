export interface StatsData {
  activeBookings: number;
  onlineDrivers: number;
  revenue: string;
  rating: number;
  activeBookingsChange: number;
  onlineDriversChange: number;
  revenueChange: number;
  ratingChange: number;
}

export interface BookingWithDetails {
  id: string;
  customerId: string;
  customerName: string;
  driverId?: string;
  driverName?: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  pickupLocation: string;
  dropoffLocation: string;
  scheduledTime?: Date;
  completedTime?: Date;
  price?: number;
  route: string;
}

export interface ChatMessageWithUser {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  message: string;
  messageType: "text" | "image" | "system";
  isRead: boolean;
  createdAt: Date;
}

export interface ReviewWithUser {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface DriverLocation {
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  status: "available" | "en_route" | "delivering";
  currentBookingId?: string;
}
