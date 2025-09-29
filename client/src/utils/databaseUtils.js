import { collection, addDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VerificationStatuses, DocumentTypes } from "@shared/schema";

/**
 * Database Connection Utilities for Verification System
 */
export class DatabaseUtils {
  
  /**
   * Test database connection and permissions
   * @returns {Promise<Object>} Connection test results
   */
  static async testConnection() {
    const results = {
      canRead: false,
      canWrite: false,
      collections: {},
      errors: []
    };

    try {
      // Test read permissions
      const verificationsRef = collection(db, "verifications");
      const testQuery = query(verificationsRef, limit(1));
      const snapshot = await getDocs(testQuery);
      
      results.canRead = true;
      results.collections.verifications = {
        exists: true,
        docCount: snapshot.size,
        hasData: snapshot.size > 0
      };

      // Test write permissions (create a test document)
      try {
        const testDoc = {
          _test: true,
          userId: "test_user_id",
          userRole: "junk_shop_owner",
          documentType: DocumentTypes.BUSINESS_LICENSE,
          documentURL: "https://example.com/test.pdf",
          status: VerificationStatuses.PENDING,
          shopName: "Test Shop",
          businessLicense: "TEST-123",
          address: "Test Address",
          phoneNumber: "+1234567890",
          submissionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            submissionTimestamp: new Date(),
            documentSize: "1KB",
            fileType: "PDF"
          }
        };

        await addDoc(verificationsRef, testDoc);
        results.canWrite = true;
      } catch (writeError) {
        results.canWrite = false;
        results.errors.push(`Write test failed: ${writeError.message}`);
      }

    } catch (readError) {
      results.canRead = false;
      results.errors.push(`Read test failed: ${readError.message}`);
    }

    return results;
  }

  /**
   * Initialize sample verification data
   * @returns {Promise<Array>} Array of created verification IDs
   */
  static async initializeSampleVerifications() {
    try {
      const sampleVerifications = [
        {
          userId: "user_001",
          userRole: "junk_shop_owner",
          documentType: DocumentTypes.BUSINESS_LICENSE,
          documentURL: "https://example.com/business-license-001.pdf",
          status: VerificationStatuses.PENDING,
          shopName: "Jakarta Recycling Hub",
          businessLicense: "BL-2025-JKT-001",
          address: "Jl. Industri Raya No. 123, Jakarta Utara",
          phoneNumber: "+6281234567890",
          submissionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            submissionTimestamp: new Date(),
            documentSize: "2.5MB",
            fileType: "PDF"
          }
        },
        {
          userId: "user_002",
          userRole: "junk_shop_owner",
          documentType: DocumentTypes.TAX_CERTIFICATE,
          documentURL: "https://example.com/tax-cert-002.pdf",
          status: VerificationStatuses.APPROVED,
          shopName: "Bandung Waste Management",
          businessLicense: "BL-2025-BDG-002",
          address: "Jl. Soekarno Hatta No. 456, Bandung",
          phoneNumber: "+6281234567891",
          submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          reviewedBy: "admin_001",
          reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          adminNotes: "All documents verified and approved successfully",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          metadata: {
            submissionTimestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            documentSize: "1.8MB",
            fileType: "PDF"
          }
        },
        {
          userId: "user_003",
          userRole: "junk_shop_owner",
          documentType: DocumentTypes.BUSINESS_LICENSE,
          documentURL: "https://example.com/business-license-003.pdf",
          status: VerificationStatuses.REJECTED,
          shopName: "Surabaya Scrap Center",
          businessLicense: "BL-2025-SBY-003",
          address: "Jl. Raya Gubeng No. 789, Surabaya",
          phoneNumber: "+6281234567892",
          submissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          reviewedBy: "admin_001",
          reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
          rejectionReason: "Business license document is not clear and readable",
          adminNotes: "Please resubmit with a clearer document scan",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          metadata: {
            submissionTimestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            documentSize: "3.2MB",
            fileType: "PDF"
          }
        },
        {
          userId: "user_004",
          userRole: "junk_shop_owner",
          documentType: DocumentTypes.PERMIT,
          documentURL: "https://example.com/permit-004.pdf",
          status: VerificationStatuses.UNDER_REVIEW,
          shopName: "Medan Metal Works",
          businessLicense: "BL-2025-MDN-004",
          address: "Jl. Polonia No. 321, Medan",
          phoneNumber: "+6281234567893",
          submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          reviewedBy: "admin_002",
          reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          adminNotes: "Under review - waiting for additional documentation",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          metadata: {
            submissionTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            documentSize: "4.1MB",
            fileType: "PDF"
          }
        },
        {
          userId: "user_005",
          userRole: "collector",
          documentType: DocumentTypes.IDENTIFICATION,
          documentURL: "https://example.com/id-005.pdf",
          status: VerificationStatuses.PENDING,
          shopName: null,
          businessLicense: null,
          address: "Jl. Merdeka No. 654, Yogyakarta",
          phoneNumber: "+6281234567894",
          submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          metadata: {
            submissionTimestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            documentSize: "1.2MB",
            fileType: "PDF"
          }
        }
      ];

      const createdIds = [];
      const verificationsRef = collection(db, "verifications");

      for (const verification of sampleVerifications) {
        const docRef = await addDoc(verificationsRef, verification);
        createdIds.push(docRef.id);
      }

      console.log(`Created ${createdIds.length} sample verifications`);
      return createdIds;
    } catch (error) {
      console.error("Error initializing sample verifications:", error);
      throw error;
    }
  }

  /**
   * Get database health metrics
   * @returns {Promise<Object>} Health metrics
   */
  static async getHealthMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        collections: {},
        performance: {}
      };

      // Test verifications collection
      const startTime = Date.now();
      const verificationsRef = collection(db, "verifications");
      const snapshot = await getDocs(verificationsRef);
      const endTime = Date.now();

      metrics.collections.verifications = {
        docCount: snapshot.size,
        queryTime: endTime - startTime,
        hasData: snapshot.size > 0,
        status: snapshot.size > 0 ? 'healthy' : 'empty'
      };

      metrics.performance.totalQueryTime = endTime - startTime;
      metrics.performance.avgResponseTime = metrics.performance.totalQueryTime;

      return metrics;
    } catch (error) {
      return {
        timestamp: new Date(),
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Cleanup test documents
   * @returns {Promise<number>} Number of cleaned documents
   */
  static async cleanupTestData() {
    try {
      const verificationsRef = collection(db, "verifications");
      const testQuery = query(verificationsRef);
      const snapshot = await getDocs(testQuery);
      
      let cleanedCount = 0;
      const batch = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data._test === true || data.userId?.includes('test_')) {
          batch.push(doc.ref);
          cleanedCount++;
        }
      });

      // Note: In a real app, you'd use batch delete here
      console.log(`Found ${cleanedCount} test documents to clean`);
      
      return cleanedCount;
    } catch (error) {
      console.error("Error cleaning test data:", error);
      throw error;
    }
  }
}

export default DatabaseUtils;