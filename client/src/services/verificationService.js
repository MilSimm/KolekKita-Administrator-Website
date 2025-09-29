import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VerificationStatuses, DocumentTypes } from "@shared/schema";

/**
 * Verification Service - Database operations for verification management
 */
export class VerificationService {
  static COLLECTION_NAME = "verifications";

  /**
   * Create a new verification request
   * @param {Object} verificationData - Verification data
   * @returns {Promise<string>} - Document ID of created verification
   */
  static async createVerification(verificationData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...verificationData,
        status: VerificationStatuses.PENDING,
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          submissionTimestamp: serverTimestamp(),
          ...verificationData.metadata
        }
      });
      
      console.log("Verification created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating verification:", error);
      throw error;
    }
  }

  /**
   * Update verification status (approve/reject)
   * @param {string} verificationId - Verification document ID
   * @param {string} status - New status (approved/rejected/under_review)
   * @param {string} adminId - Admin who is updating
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  static async updateVerificationStatus(verificationId, status, adminId, options = {}) {
    try {
      const verificationRef = doc(db, this.COLLECTION_NAME, verificationId);
      
      const updateData = {
        status: status,
        reviewedBy: adminId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...options
      };

      // Add rejection reason if rejecting
      if (status === VerificationStatuses.REJECTED && options.rejectionReason) {
        updateData.rejectionReason = options.rejectionReason;
      }

      // Add admin notes
      if (options.adminNotes) {
        updateData.adminNotes = options.adminNotes;
      }

      await updateDoc(verificationRef, updateData);
      
      console.log(`Verification ${verificationId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating verification status:", error);
      throw error;
    }
  }

  /**
   * Get all verifications with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of verification documents
   */
  static async getVerifications(filters = {}) {
    try {
      let q = collection(db, this.COLLECTION_NAME);
      
      // Apply filters
      const constraints = [];
      
      if (filters.status) {
        constraints.push(where("status", "==", filters.status));
      }
      
      if (filters.userRole) {
        constraints.push(where("userRole", "==", filters.userRole));
      }
      
      if (filters.userId) {
        constraints.push(where("userId", "==", filters.userId));
      }

      if (filters.documentType) {
        constraints.push(where("documentType", "==", filters.documentType));
      }

      // Add ordering
      constraints.push(orderBy("createdAt", "desc"));
      
      // Add limit if specified
      if (filters.limit) {
        constraints.push(limit(filters.limit));
      }

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting verifications:", error);
      throw error;
    }
  }

  /**
   * Get verification statistics
   * @returns {Promise<Object>} - Statistics object
   */
  static async getVerificationStats() {
    try {
      const allVerifications = await this.getVerifications();
      
      const stats = {
        total: allVerifications.length,
        pending: allVerifications.filter(v => v.status === VerificationStatuses.PENDING).length,
        approved: allVerifications.filter(v => v.status === VerificationStatuses.APPROVED).length,
        rejected: allVerifications.filter(v => v.status === VerificationStatuses.REJECTED).length,
        underReview: allVerifications.filter(v => v.status === VerificationStatuses.UNDER_REVIEW).length,
      };

      // Calculate approval rate
      stats.approvalRate = stats.total > 0 
        ? Math.round((stats.approved / stats.total) * 100) 
        : 0;

      // Group by document type
      stats.byDocumentType = {};
      Object.values(DocumentTypes).forEach(type => {
        stats.byDocumentType[type] = allVerifications.filter(v => v.documentType === type).length;
      });

      // Group by user role
      stats.byUserRole = {};
      const roles = ["junk_shop_owner", "junkshop", "collector", "customer"];
      roles.forEach(role => {
        stats.byUserRole[role] = allVerifications.filter(v => v.userRole === role).length;
      });

      return stats;
    } catch (error) {
      console.error("Error getting verification stats:", error);
      throw error;
    }
  }

  /**
   * Bulk update verifications (for batch operations)
   * @param {Array} updates - Array of {id, data} objects
   * @returns {Promise<void>}
   */
  static async bulkUpdateVerifications(updates) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(update => {
        const verificationRef = doc(db, this.COLLECTION_NAME, update.id);
        batch.update(verificationRef, {
          ...update.data,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Bulk updated ${updates.length} verifications`);
    } catch (error) {
      console.error("Error bulk updating verifications:", error);
      throw error;
    }
  }

  /**
   * Delete a verification (soft delete by updating status)
   * @param {string} verificationId - Verification document ID
   * @param {string} adminId - Admin performing the deletion
   * @returns {Promise<void>}
   */
  static async deleteVerification(verificationId, adminId) {
    try {
      const verificationRef = doc(db, this.COLLECTION_NAME, verificationId);
      
      await updateDoc(verificationRef, {
        status: "deleted",
        deletedBy: adminId,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Verification ${verificationId} soft deleted`);
    } catch (error) {
      console.error("Error deleting verification:", error);
      throw error;
    }
  }

  /**
   * Get pending verifications for a specific user role
   * @param {string} userRole - User role to filter by
   * @returns {Promise<Array>} - Array of pending verifications
   */
  static async getPendingVerificationsByRole(userRole) {
    return await this.getVerifications({
      status: VerificationStatuses.PENDING,
      userRole: userRole
    });
  }

  /**
   * Search verifications by shop name or business license
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} - Array of matching verifications
   */
  static async searchVerifications(searchTerm) {
    try {
      // Since Firestore doesn't support full-text search natively,
      // we'll get all verifications and filter in memory
      const allVerifications = await this.getVerifications();
      
      const searchLower = searchTerm.toLowerCase();
      
      return allVerifications.filter(verification => 
        (verification.shopName && verification.shopName.toLowerCase().includes(searchLower)) ||
        (verification.businessLicense && verification.businessLicense.toLowerCase().includes(searchLower)) ||
        (verification.userId && verification.userId.toLowerCase().includes(searchLower)) ||
        (verification.address && verification.address.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error("Error searching verifications:", error);
      throw error;
    }
  }
}

/**
 * React hook for real-time verification updates
 * @param {Object} filters - Filter options
 * @returns {Object} - {data, loading, error}
 */
export const useVerifications = (filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      let q = collection(db, VerificationService.COLLECTION_NAME);
      
      // Apply filters
      const constraints = [];
      
      if (filters.status) {
        constraints.push(where("status", "==", filters.status));
      }
      
      if (filters.userRole) {
        constraints.push(where("userRole", "==", filters.userRole));
      }
      
      if (filters.userId) {
        constraints.push(where("userId", "==", filters.userId));
      }

      // Add ordering
      constraints.push(orderBy("createdAt", "desc"));
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const verifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(verifications);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Verification subscription error:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error("Verification hook setup error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
};

export default VerificationService;