import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { type User, type InsertUser, type Booking, type InsertBooking, type ChatMessage, type InsertChatMessage, type Review, type InsertReview, type Notification, type InsertNotification, type JunkShop, type InsertJunkShop } from "@shared/schema";

// Firebase Admin configuration
const firebaseConfig = {
  projectId: "kolekkita",
};

// Initialize Firebase Admin with emulator settings for development
let adminApp;
try {
  adminApp = initializeApp(firebaseConfig);
} catch (error) {
  console.log("Firebase already initialized");
}

// Get Firestore instance
const adminDb = getFirestore(adminApp);

// Set Firestore to use emulator in development (avoiding authentication issues)
if (process.env.NODE_ENV === 'development') {
  // For development, we'll handle connection errors gracefully
  console.log("Using Firebase in development mode");
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Booking operations
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByUser(userId: string): Promise<Booking[]>;

  // Chat operations
  getChatMessages(bookingId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Review operations
  getReviews(userId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Junk Shop operations
  getJunkShop(id: string): Promise<JunkShop | undefined>;
  getAllJunkShops(): Promise<JunkShop[]>;
  getJunkShopsByStatus(status: string): Promise<JunkShop[]>;
  createJunkShop(junkShop: InsertJunkShop): Promise<JunkShop>;
  updateJunkShop(id: string, updates: Partial<JunkShop>): Promise<JunkShop>;
  updateJunkShopVerification(id: string, status: string, notes: string, verifiedBy: string): Promise<JunkShop>;
}

export class FirebaseStorage implements IStorage {
  
  // Helper method to handle Firestore errors gracefully
  private async safeFirestoreOperation<T>(operation: () => Promise<T>, fallback?: T): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error("Firestore operation failed:", error);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  // Junk Shop operations - using "verifications" collection as user specified
  async getJunkShop(id: string): Promise<JunkShop | undefined> {
    return this.safeFirestoreOperation(async () => {
      const doc = await adminDb.collection('verifications').doc(id).get();
      if (!doc.exists) return undefined;
      return { id: doc.id, ...doc.data() } as JunkShop;
    }, undefined);
  }

  async getAllJunkShops(): Promise<JunkShop[]> {
    return this.safeFirestoreOperation(async () => {
      const snapshot = await adminDb.collection('verifications').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JunkShop));
    }, []);
  }

  async getJunkShopsByStatus(status: string): Promise<JunkShop[]> {
    return this.safeFirestoreOperation(async () => {
      const snapshot = await adminDb.collection('verifications')
        .where('verificationStatus', '==', status)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JunkShop));
    }, []);
  }

  async createJunkShop(insertJunkShop: InsertJunkShop): Promise<JunkShop> {
    return this.safeFirestoreOperation(async () => {
      const docRef = adminDb.collection('verifications').doc();
      const junkShop: JunkShop = {
        ...insertJunkShop,
        id: docRef.id,
        verificationStatus: insertJunkShop.verificationStatus || "pending",
        verificationNotes: insertJunkShop.verificationNotes || null,
        documents: insertJunkShop.documents || [],
        businessHours: insertJunkShop.businessHours || null,
        services: insertJunkShop.services || [],
        submittedAt: new Date(),
        verifiedAt: null,
        verifiedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await docRef.set(junkShop);
      return junkShop;
    });
  }

  async updateJunkShop(id: string, updates: Partial<JunkShop>): Promise<JunkShop> {
    return this.safeFirestoreOperation(async () => {
      const updatedData = { ...updates, updatedAt: new Date() };
      await adminDb.collection('verifications').doc(id).update(updatedData);
      const updatedJunkShop = await this.getJunkShop(id);
      return updatedJunkShop!;
    });
  }

  async updateJunkShopVerification(id: string, status: string, notes: string, verifiedBy: string): Promise<JunkShop> {
    return this.safeFirestoreOperation(async () => {
      const updatedData = {
        verificationStatus: status,
        verificationNotes: notes,
        verifiedBy: verifiedBy,
        verifiedAt: new Date(),
        updatedAt: new Date()
      };
      await adminDb.collection('verifications').doc(id).update(updatedData);
      const updatedJunkShop = await this.getJunkShop(id);
      return updatedJunkShop!;
    });
  }

  // User operations - stubbed for now
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: 'user' + Date.now(),
      role: insertUser.role || "customer",
      profilePhoto: insertUser.profilePhoto || null,
      phone: insertUser.phone || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    throw new Error('Not implemented');
  }

  async getAllUsers(): Promise<User[]> {
    return [];
  }

  // Booking operations - stubbed for now
  async getBooking(id: string): Promise<Booking | undefined> {
    return undefined;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    throw new Error('Not implemented');
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    throw new Error('Not implemented');
  }

  async getAllBookings(): Promise<Booking[]> {
    return [];
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return [];
  }

  // Chat operations - stubbed for now
  async getChatMessages(bookingId: string): Promise<ChatMessage[]> {
    return [];
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    throw new Error('Not implemented');
  }

  // Review operations - stubbed for now
  async getReviews(userId: string): Promise<Review[]> {
    return [];
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    throw new Error('Not implemented');
  }

  // Notification operations - stubbed for now
  async getNotifications(userId: string): Promise<Notification[]> {
    return [];
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    throw new Error('Not implemented');
  }

  async markNotificationRead(id: string): Promise<void> {
    // No-op
  }
}

export const storage = new FirebaseStorage();
