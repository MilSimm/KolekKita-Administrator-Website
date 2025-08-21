import { z } from "zod";

// Base type definitions for Firebase collections

export type UserRole = "admin" | "junk_shop_owner" | "junkshop" | "collector" | "customer" | "resident";
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "junk_shop_owner" | "junkshop" | "collector" | "customer" | "resident";
  profilePhoto?: string | null;
  phone?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: Date | any;
  updatedAt?: Date | any;
  uid?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  collectorId: string | null;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords: {lat: number, lng: number} | null;
  dropoffCoords: {lat: number, lng: number} | null;
  scheduledTime: Date | null;
  completedTime: Date | null;
  price: string | null;
  notes: string | null;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: "text" | "image" | "system";
  isRead: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "chat" | "system";
  isRead: boolean;
  data: any | null;
  createdAt: Date;
}

export interface PhotoUpload {
  id: string;
  fileName: string;
  originalName: string;
  downloadURL: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  description: string | null;
  uploadedAt: Date;
}

export interface JunkShop {
  id: string;
  shopName: string;
  ownerName: string;
  businessLicense: string;
  address: string;
  phone: string;
  email: string;
  verificationStatus: "pending" | "approved" | "rejected" | "under_review";
  verificationNotes: string | null;
  submittedAt: Date;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  documents: string[]; // URLs to uploaded documents
  businessHours: {
    open: string;
    close: string;
    days: string[];
  } | null;
  services: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "junk_shop_owner", "collector", "customer"]).default("customer"),
  profilePhoto: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const insertBookingSchema = z.object({
  customerId: z.string(),
  collectorId: z.string().nullable().optional(),
  status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]).default("pending"),
  pickupLocation: z.string().min(1),
  dropoffLocation: z.string().min(1),
  pickupCoords: z.object({lat: z.number(), lng: z.number()}).nullable().optional(),
  dropoffCoords: z.object({lat: z.number(), lng: z.number()}).nullable().optional(),
  scheduledTime: z.date().nullable().optional(),
  completedTime: z.date().nullable().optional(),
  price: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.array(z.string()).default([]),
});

export const insertChatMessageSchema = z.object({
  bookingId: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  message: z.string().min(1),
  messageType: z.enum(["text", "image", "system"]).default("text"),
  isRead: z.boolean().default(false),
});

export const insertReviewSchema = z.object({
  bookingId: z.string(),
  reviewerId: z.string(),
  revieweeId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().nullable().optional(),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["booking", "chat", "system"]),
  isRead: z.boolean().default(false),
  data: z.any().optional(),
});

export const insertPhotoUploadSchema = z.object({
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  downloadURL: z.string().url(),
  fileSize: z.number().positive(),
  fileType: z.string().min(1),
  uploadedBy: z.string(),
  description: z.string().nullable().optional(),
});

export const insertJunkShopSchema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string().min(1),
  businessLicense: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  verificationStatus: z.enum(["pending", "approved", "rejected", "under_review"]).default("pending"),
  verificationNotes: z.string().nullable().optional(),
  documents: z.array(z.string()).default([]),
  businessHours: z.object({
    open: z.string(),
    close: z.string(),
    days: z.array(z.string())
  }).nullable().optional(),
  services: z.array(z.string()).default([]),
});

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertPhotoUpload = z.infer<typeof insertPhotoUploadSchema>;
export type InsertJunkShop = z.infer<typeof insertJunkShopSchema>;

// User role types
export type UserRole = "admin" | "junk_shop_owner" | "collector" | "customer";

// Extended User type with Firebase-specific fields
export interface UserWithFirebaseData extends User {
  isOnline?: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  vehicleInfo?: {
    type: string;
    plateNumber: string;
  };
}

// Extended Booking type with coordinates
export interface BookingWithCoordinates extends Booking {
  pickupCoordinates?: {
    latitude: number;
    longitude: number;
  };
  dropoffCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export type BookingStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
