import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
// Types removed for JavaScript conversion

export const initializeFirebaseData = async (currentUserId) => {
  try {
    // Check if data already exists
    const existingBookings = await getDocs(collection(db, "bookings"));
    if (existingBookings.docs.length > 0) {
      console.log("Sample data already exists");
      return;
    }

    // Sample Users
    const sampleUsers = [
      {
        email: "admin@kolekita.com",
        name: "System Admin",
        role: "admin",
        profilePhoto: null,
        phone: "+62812345678",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "shop@kolekita.com", 
        name: "Jakarta Recycling Center",
        role: "junk_shop_owner",
        profilePhoto: null,
        phone: "+62812345679",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: "collector@kolekita.com",
        name: "Budi Collector",
        role: "collector", 
        profilePhoto: null,
        phone: "+62812345680",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Add sample users
    const userIds = [];
    for (const userData of sampleUsers) {
      const docRef = await addDoc(collection(db, "users"), userData);
      userIds.push(docRef.id);
    }

    // Sample Bookings
    const sampleBookings = [
      {
        customerId: currentUserId,
        collectorId: userIds[2],
        pickupLocation: "Jl. Sudirman No. 123, Jakarta",
        dropoffLocation: "Jakarta Recycling Center",
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: "pending",
        notes: "Material: Electronics. Estimated weight: 15kg. Old laptop and printer",
        photos: [],
        pickupCoords: { latitude: -6.2088, longitude: 106.8456 },
        dropoffCoords: { latitude: -6.1751, longitude: 106.8650 },
        completedTime: null,
        price: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        customerId: currentUserId,
        collectorId: userIds[2],
        pickupLocation: "Jl. Thamrin No. 456, Jakarta",
        dropoffLocation: "Jakarta Recycling Center", 
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        status: "assigned",
        notes: "Material: Paper & Cardboard. Estimated weight: 25kg. Newspaper and cardboard boxes",
        photos: [],
        pickupCoords: { latitude: -6.1944, longitude: 106.8229 },
        dropoffCoords: { latitude: -6.1751, longitude: 106.8650 },
        completedTime: null,
        price: 75000,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        customerId: currentUserId,
        collectorId: userIds[2],
        pickupLocation: "Jl. Gatot Subroto No. 789, Jakarta",
        dropoffLocation: "Jakarta Recycling Center",
        scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: "completed",
        notes: "Material: Plastic. Estimated weight: 10kg. Plastic bottles and containers",
        photos: [],
        pickupCoords: { latitude: -6.2297, longitude: 106.8253 },
        dropoffCoords: { latitude: -6.1751, longitude: 106.8650 },
        completedTime: new Date(),
        price: 35000,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }
    ];

    // Add sample bookings
    const bookingIds = [];
    for (const bookingData of sampleBookings) {
      const docRef = await addDoc(collection(db, "bookings"), bookingData);
      bookingIds.push(docRef.id);
    }

    // Sample Chat Messages
    const sampleMessages = [
      {
        bookingId: bookingIds[0],
        senderId: userIds[2],
        receiverId: currentUserId,
        message: "Hi! I'll be collecting your electronics tomorrow. Please have them ready by 10 AM.",
        messageType: "text",
        isRead: false,
        createdAt: new Date(),
      },
      {
        bookingId: bookingIds[1],
        senderId: currentUserId,
        receiverId: userIds[2],
        message: "The cardboard is in the garage. The door will be unlocked.",
        messageType: "text",
        isRead: true,
        createdAt: new Date(),
      }
    ];

    for (const messageData of sampleMessages) {
      await addDoc(collection(db, "chat_messages"), messageData);
    }

    // Sample Reviews
    const sampleReviews = [
      {
        bookingId: bookingIds[2],
        reviewerId: currentUserId,
        revieweeId: userIds[2],
        rating: 5,
        comment: "Excellent service! Very professional and punctual collector.",
        createdAt: new Date(),
      }
    ];

    for (const reviewData of sampleReviews) {
      await addDoc(collection(db, "reviews"), reviewData);
    }

    // Sample Notifications
    const sampleNotifications = [
      {
        userId: currentUserId,
        title: "Pickup Scheduled",
        message: "Your electronics pickup is scheduled for tomorrow at 10 AM.",
        type: "booking_update",
        data: { bookingId: bookingIds[0] },
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId: currentUserId,
        title: "New Message",
        message: "You have a new message from your collector.",
        type: "message",
        data: { bookingId: bookingIds[0] },
        isRead: false,
        createdAt: new Date(),
      }
    ];

    for (const notificationData of sampleNotifications) {
      await addDoc(collection(db, "notifications"), notificationData);
    }

    // Sample Verifications for Junk Shop Owners
    const sampleVerifications = [
      {
        userId: userIds[1], // Jakarta Recycling Center
        userRole: "junk_shop_owner",
        documentType: "business_license",
        documentURL: "https://example.com/business-license.pdf",
        shopName: "Jakarta Recycling Center",
        businessLicense: "BL-2024-JKT-001",
        address: "Jl. Industri No. 45, Jakarta Utara",
        phoneNumber: "+62812345679",
        status: "pending",
        submissionDate: new Date(),
        metadata: {
          submissionTimestamp: new Date(),
          documentSize: "2.5MB",
          fileType: "PDF"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: userIds[1], // Another verification
        userRole: "junk_shop_owner", 
        documentType: "tax_certificate",
        documentURL: "https://example.com/tax-cert.pdf",
        shopName: "Jakarta Recycling Center",
        businessLicense: "BL-2024-JKT-001",
        address: "Jl. Industri No. 45, Jakarta Utara",
        phoneNumber: "+62812345679",
        status: "approved",
        submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        reviewedBy: "admin",
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        adminNotes: "All documents verified and approved",
        metadata: {
          submissionTimestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          documentSize: "1.8MB", 
          fileType: "PDF"
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      }
    ];

    for (const verificationData of sampleVerifications) {
      await addDoc(collection(db, "verifications"), verificationData);
    }

    // Sample Reports for Content Moderation
    const sampleReports = [
      {
        type: "Inappropriate Content",
        category: "Review",
        description: "Low rating review with suspicious content",
        reportedBy: "System Detection",
        priority: "Medium",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        type: "Suspicious Account", 
        category: "User",
        description: "Account with incomplete profile information",
        reportedBy: "System Validation",
        priority: "Low",
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const reportData of sampleReports) {
      await addDoc(collection(db, "reports"), reportData);
    }

    // Sample System Logs
    const sampleSystemLogs = [
      {
        level: "info",
        message: "User registration completed successfully",
        timestamp: new Date(),
        userId: userIds[1],
        action: "user_registration",
        createdAt: new Date(),
      },
      {
        level: "warning",
        message: "Multiple failed login attempts detected",
        timestamp: new Date(),
        userId: null,
        action: "security_alert", 
        createdAt: new Date(),
      }
    ];

    for (const logData of sampleSystemLogs) {
      await addDoc(collection(db, "system_logs"), logData);
    }

    console.log("Sample data initialized successfully!");
    return true;
  } catch (error) {
    console.error("Error initializing sample data:", error);
    throw error;
  }
};