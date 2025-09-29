import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";


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



export class FirebaseStorage {
  
  // Helper method to handle Firestore errors gracefully
  async safeFirestoreOperation(operation, fallback) {
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

  // Junk Shop operations - using "verifications" collection specified
  async getJunkShop(id) {
    return this.safeFirestoreOperation(async () => {
      const doc = await adminDb.collection('verifications').doc(id).get();
      if (!doc.exists) return undefined;
      return { id.id, ...doc.data() };
    }, undefined);
  }

  async getAllJunkShops() {
    return this.safeFirestoreOperation(async () => {
      const snapshot = await adminDb.collection('verifications').get();
      return snapshot.docs.map(doc => ({ id.id, ...doc.data() }));
    }, []);
  }

  async getJunkShopsByStatus(status) {
    return this.safeFirestoreOperation(async () => {
      const snapshot = await adminDb.collection('verifications')
        .where('verificationStatus', '==', status)
        .get();
      return snapshot.docs.map(doc => ({ id.id, ...doc.data() }));
    }, []);
  }

  async createJunkShop(insertJunkShop) {
    return this.safeFirestoreOperation(async () => {
      const docRef = adminDb.collection('verifications').doc();
      const junkShop= {
        ...insertJunkShop,
        id.id,
        verificationStatus.verificationStatus || "pending",
        verificationNotes.verificationNotes || null,
        documents.documents || [],
        businessHours.businessHours || null,
        services.services || [],
        submittedAt(),
        verifiedAt,
        verifiedBy,
        createdAt(),
        updatedAt()
      };
      await docRef.set(junkShop);
      return junkShop;
    });
  }

  async updateJunkShop(id, updates) {
    return this.safeFirestoreOperation(async () => {
      const updatedData = { ...updates, updatedAt() };
      await adminDb.collection('verifications').doc(id).update(updatedData);
      const updatedJunkShop = await this.getJunkShop(id);
      return updatedJunkShop!;
    });
  }

  async updateJunkShopVerification(id, status, notes, verifiedBy) {
    return this.safeFirestoreOperation(async () => {
      const updatedData = {
        verificationStatus,
        verificationNotes,
        verifiedBy,
        verifiedAt(),
        updatedAt()
      };
      await adminDb.collection('verifications').doc(id).update(updatedData);
      const updatedJunkShop = await this.getJunkShop(id);
      return updatedJunkShop!;
    });
  }

  // User operations - stubbed for now
  async getUser(id) {
    return undefined;
  }

  async getUserByEmail(email) {
    return undefined;
  }

  async createUser(insertUser) {
    const user= {
      ...insertUser,
      id: 'user' + Date.now(),
      role.role || "customer",
      profilePhoto.profilePhoto || null,
      phone.phone || null,
      isActive.isActive !== undefined ? insertUser.isActive ,
      createdAt(),
      updatedAt()
    };
    return user;
  }

  async updateUser(id, updates) {
    throw new Error('Not implemented');
  }

  async getAllUsers() {
    return [];
  }

  // Booking operations - stubbed for now
  async getBooking(id) {
    return undefined;
  }

  async createBooking(insertBooking) {
    throw new Error('Not implemented');
  }

  async updateBooking(id, updates) {
    throw new Error('Not implemented');
  }

  async getAllBookings() {
    return [];
  }

  async getBookingsByUser(userId) {
    return [];
  }

  // Chat operations - stubbed for now
  async getChatMessages(bookingId) {
    return [];
  }

  async createChatMessage(insertMessage) {
    throw new Error('Not implemented');
  }

  // Review operations - stubbed for now
  async getReviews(userId) {
    return [];
  }

  async createReview(insertReview) {
    throw new Error('Not implemented');
  }

  // Notification operations - stubbed for now
  async getNotifications(userId) {
    return [];
  }

  async createNotification(insertNotification) {
    throw new Error('Not implemented');
  }

  async markNotificationRead(id) {
    // No-op
  }
}

export const storage = new FirebaseStorage();
