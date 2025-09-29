import { z } from "zod";

/**
 * @fileoverview KolekKita Data Schema Definitions
 * JavaScript schema definitions for Firebase collections with JSDoc comments
 */

/**
 * User object structure
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} email - User email
 * @property {string} name - User name
 * @property {"admin"|"junk_shop_owner"|"junkshop"|"collector"|"customer"|"resident"} role - User role
 * @property {string|null} [profilePhoto] - Profile picture URL
 * @property {string|null} [phone] - Contact phone number
 * @property {boolean} [isActive] - Whether user is active
 * @property {boolean} [isVerified] - Whether user is verified
 * @property {Date|any} [createdAt] - Account creation date
 * @property {Date|any} [updatedAt] - Last update date
 * @property {string} [uid] - Firebase Auth UID
 */

/**
 * Booking object structure
 * @typedef {Object} Booking
 * @property {string} id - Booking ID
 * @property {string} customerId - Customer user ID
 * @property {string|null} collectorId - Collector user ID
 * @property {"pending"|"assigned"|"in_progress"|"completed"|"cancelled"} status - Booking status
 * @property {string} pickupLocation - Pickup address
 * @property {string} dropoffLocation - Dropoff address
 * @property {{lat: number, lng: number}|null} pickupCoords - Pickup coordinates
 * @property {{lat: number, lng: number}|null} dropoffCoords - Dropoff coordinates
 * @property {Date|null} scheduledTime - Scheduled pickup time
 * @property {Date|null} completedTime - Completion time
 * @property {string|null} price - Booking price
 * @property {string|null} notes - Additional notes
 * @property {string[]} photos - Photo URLs
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * Chat message object structure
 * @typedef {Object} ChatMessage
 * @property {string} id - Message ID
 * @property {string} bookingId - Related booking ID
 * @property {string} senderId - Sender user ID
 * @property {string} receiverId - Receiver user ID
 * @property {string} message - Message content
 * @property {"text"|"image"|"system"} messageType - Message type
 * @property {boolean} isRead - Read status
 * @property {Date} createdAt - Creation date
 */

/**
 * Review object structure
 * @typedef {Object} Review
 * @property {string} id - Review ID
 * @property {string} bookingId - Related booking ID
 * @property {string} reviewerId - Reviewer user ID
 * @property {string} revieweeId - Reviewee user ID
 * @property {number} rating - Rating (1-5)
 * @property {string|null} comment - Review comment
 * @property {Date} createdAt - Creation date
 */

/**
 * Notification object structure
 * @typedef {Object} Notification
 * @property {string} id - Notification ID
 * @property {string} userId - Target user ID
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {"booking"|"chat"|"system"} type - Notification type
 * @property {boolean} isRead - Read status
 * @property {any|null} data - Additional data
 * @property {Date} createdAt - Creation date
 */

/**
 * Photo upload object structure
 * @typedef {Object} PhotoUpload
 * @property {string} id - Photo ID
 * @property {string} fileName - File name
 * @property {string} originalName - Original file name
 * @property {string} downloadURL - Download URL
 * @property {number} fileSize - File size in bytes
 * @property {string} fileType - MIME type
 * @property {string} uploadedBy - Uploader user ID
 * @property {string|null} description - Photo description
 * @property {Date} uploadedAt - Upload date
 */

/**
 * Verification object structure
 * @typedef {Object} Verification
 * @property {string} id - Verification ID
 * @property {string} userId - User ID who submitted verification
 * @property {"junk_shop_owner"|"junkshop"|"collector"|"customer"} userRole - Role of user being verified
 * @property {"business_license"|"tax_certificate"|"identification"|"permit"} documentType - Type of document
 * @property {string} documentURL - URL to the uploaded document
 * @property {"pending"|"approved"|"rejected"|"under_review"} status - Verification status
 * @property {string|null} shopName - Shop name (for junk shop verifications)
 * @property {string|null} businessLicense - Business license number
 * @property {string|null} address - Business address
 * @property {string|null} phoneNumber - Contact phone number
 * @property {Date} submissionDate - When verification was submitted
 * @property {string|null} reviewedBy - Admin who reviewed (admin ID)
 * @property {Date|null} reviewedAt - When verification was reviewed
 * @property {string|null} rejectionReason - Reason for rejection (if rejected)
 * @property {string|null} adminNotes - Admin notes about the verification
 * @property {Object} metadata - Additional metadata
 * @property {Date} metadata.submissionTimestamp - Submission timestamp
 * @property {string} metadata.documentSize - Document file size
 * @property {string} metadata.fileType - Document file type
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * Junk shop object structure
 * @typedef {Object} JunkShop
 * @property {string} id - Shop ID
 * @property {string} shopName - Shop name
 * @property {string} ownerName - Owner name
 * @property {string} businessLicense - Business license number
 * @property {string} address - Shop address
 * @property {string} phone - Contact phone
 * @property {string} email - Contact email
 * @property {"pending"|"approved"|"rejected"|"under_review"} verificationStatus - Verification status
 * @property {string|null} verificationNotes - Verification notes
 * @property {Date} submittedAt - Submission date
 * @property {Date|null} verifiedAt - Verification date
 * @property {string|null} verifiedBy - Verifier admin ID
 * @property {string[]} documents - Document URLs
 * @property {{open: string, close: string, days: string[]}|null} businessHours - Operating hours
 * @property {string[]} services - Services offered
 * @property {Date} createdAt - Creation date
 * @property {Date} updatedAt - Last update date
 */

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

export const insertVerificationSchema = z.object({
  userId: z.string().min(1),
  userRole: z.enum(["junk_shop_owner", "junkshop", "collector", "customer"]),
  documentType: z.enum(["business_license", "tax_certificate", "identification", "permit"]),
  documentURL: z.string().url(),
  status: z.enum(["pending", "approved", "rejected", "under_review"]).default("pending"),
  shopName: z.string().nullable().optional(),
  businessLicense: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  submissionDate: z.date().default(() => new Date()),
  reviewedBy: z.string().nullable().optional(),
  reviewedAt: z.date().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  metadata: z.object({
    submissionTimestamp: z.date().default(() => new Date()),
    documentSize: z.string(),
    fileType: z.string()
  }).optional(),
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

// Insert types (converted to constants for JavaScript)
export const UserRoles = {
  ADMIN: "admin",
  JUNK_SHOP_OWNER: "junk_shop_owner",
  COLLECTOR: "collector",
  CUSTOMER: "customer"
};

// Booking status constants (converted from TypeScript types)
export const BookingStatuses = {
  PENDING: "pending",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

// Verification status constants
export const VerificationStatuses = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  UNDER_REVIEW: "under_review"
};

// Document types for verification
export const DocumentTypes = {
  BUSINESS_LICENSE: "business_license",
  TAX_CERTIFICATE: "tax_certificate",
  IDENTIFICATION: "identification",
  PERMIT: "permit"
};
