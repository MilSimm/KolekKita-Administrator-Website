import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { orderBy } from "firebase/firestore";
import VerificationService, { useVerifications } from "@/services/verificationService";
import { VerificationStatuses, DocumentTypes } from "@shared/schema";
import { CheckCircle, XCircle, Clock, ShieldCheck, Phone, Mail, Calendar, Building2, MapPin, FileText, Filter, Download } from "lucide-react";
import DatabaseConnectionTest from "@/components/DatabaseConnectionTest";
import { useAuth } from "@/contexts/AuthContext";
import { initializeFirebaseData } from "@/lib/initializeData";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { setUserAsAdmin } from "@/utils/setAdminRole";

export default function Verification() {
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to safely convert timestamps to Date objects
  const getValidDate = (timestamp) => {
    if (!timestamp) return new Date();
    
    // Handle Firebase Timestamp objects
    if (timestamp && typeof timestamp === 'object') {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      }
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
    }
    
    // Handle string timestamps
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Handle Date objects
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? new Date() : timestamp;
    }
    
    // Fallback to current date
    return new Date();
  };

  // Fetch verifications with proper ordering using enhanced hook
  const { data: allVerifications = [], loading, error } = useFirestoreCollection("verifications", [orderBy("createdAt", "desc")]);
  
  // Additional verification stats from service
  const [verificationStats, setVerificationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
    total: 0,
    approvalRate: 0
  });

  // Load verification statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await VerificationService.getVerificationStats();
        setVerificationStats(stats);
      } catch (error) {
        console.error("Error loading verification stats:", error);
      }
    };
    
    if (allVerifications.length > 0) {
      loadStats();
    }
  }, [allVerifications]);

  // Filter verifications by status and role - properly sync with database
  // Temporarily show all verifications for debugging
  const junkshopVerifications = allVerifications;
  
  // Debug: Log the data structure and test direct database access
  useEffect(() => {
    if (allVerifications.length > 0) {
      console.log('🔍 All verifications:', allVerifications);
      console.log('📊 Sample verification:', allVerifications[0]);
      console.log('🔑 Available keys:', Object.keys(allVerifications[0] || {}));
    }
    
    // Direct database test
    const testDirectAccess = async () => {
      try {
        console.log('🧪 Testing direct database access...');
        const verificationsRef = collection(db, 'verifications');
        const snapshot = await getDocs(verificationsRef);
        console.log('✅ Direct access successful, found:', snapshot.size, 'documents');
        snapshot.docs.forEach((doc, index) => {
          console.log(`📄 Document ${index + 1}:`, { id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.error('❌ Direct access failed:', error);
      }
    };
    
    testDirectAccess();
  }, [allVerifications]);
  
  const pendingJunkshops = junkshopVerifications.filter(item => item.status === 'pending' || !item.status);
  const approvedJunkshops = junkshopVerifications.filter(item => item.status === 'approved');
  const rejectedJunkshops = junkshopVerifications.filter(item => item.status === 'rejected');
  const underReviewJunkshops = junkshopVerifications.filter(item => item.status === 'under_review');

  // Firestore operations for direct updates
  const { updateDocument } = useFirestoreOperations('verifications');

  // Update verification status function - using enhanced verification service
  const handleVerification = async (verification, status) => {
    try {
      const options = {
        adminNotes: verificationNotes || `Verification ${status} by admin`
      };

      // Add rejection reason if rejecting
      if (status === VerificationStatuses.REJECTED) {
        options.rejectionReason = verificationNotes || 'Rejected by admin';
      }

      // Update using the verification service
      await VerificationService.updateVerificationStatus(
        verification.id, 
        status, 
        'admin', // In a real app, this would be the current admin's ID
        options
      );
      
      console.log(`Successfully ${status} verification ${verification.id}`);
      setSelectedVerification(null);
      setVerificationNotes("");
      
      // Show success toast
      toast({
        title: "Verification Updated",
        description: `Verification successfully ${status}!`,
        variant: status === VerificationStatuses.APPROVED ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Update Failed",
        description: `Failed to ${status} verification. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Export Reports functionality
  const handleExportReports = () => {
    try {
      // Get filtered verifications based on current status filter
      let verificationsToExport = junkshopVerifications;
      
      if (statusFilter === 'pending') {
        verificationsToExport = pendingJunkshops;
      } else if (statusFilter === 'approved') {
        verificationsToExport = approvedJunkshops;
      } else if (statusFilter === 'rejected') {
        verificationsToExport = rejectedJunkshops;
      }

      // Prepare CSV data
      const csvHeaders = [
        'Verification ID', 
        'User ID', 
        'Document Type', 
        'Status', 
        'User Role',
        'Submission Date', 
        'Reviewed By', 
        'Review Date',
        'Rejection Reason',
        'Admin Notes'
      ];
      
      const csvData = verificationsToExport.map(verification => [
        verification.id || 'N/A',
        verification.userId || 'N/A',
        verification.documentType || 'N/A',
        verification.status || 'pending',
        verification.userRole || 'N/A',
        verification.metadata?.submissionTimestamp 
          ? getValidDate(verification.metadata.submissionTimestamp).toLocaleDateString('en-US')
          : verification.createdAt 
            ? getValidDate(verification.createdAt).toLocaleDateString('en-US')
            : 'N/A',
        verification.reviewedBy || 'N/A',
        verification.reviewedAt ? getValidDate(verification.reviewedAt).toLocaleDateString('en-US') : 'N/A',
        verification.rejectionReason || 'N/A',
        verification.adminNotes || 'N/A'
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const filterSuffix = statusFilter === 'all' ? 'all' : statusFilter;
      link.setAttribute('download', `junkshop-verifications-${filterSuffix}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${verificationsToExport.length} verification records to CSV file`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export verification data",
        variant: "destructive",
      });
    }
  };

  // Get filtered verifications based on status filter
  const getFilteredVerifications = () => {
    switch (statusFilter) {
      case 'pending':
        return pendingJunkshops;
      case 'approved':
        return approvedJunkshops;
      case 'rejected':
        return rejectedJunkshops;
      case 'all':
      default:
        return junkshopVerifications;
    }
  };

  const filteredVerifications = getFilteredVerifications();

  // Debug information
  console.log('🔍 Debug Verification Data:');
  console.log('📊 allVerifications.length:', allVerifications.length);
  console.log('📊 allVerifications:', allVerifications);
  console.log('🏪 junkshopVerifications.length:', junkshopVerifications.length);
  console.log('📋 filteredVerifications.length:', filteredVerifications.length);
  console.log('🎯 statusFilter:', statusFilter);
  console.log('⏳ loading:', loading);
  console.log('❌ error:', error);
  console.log('👤 user:', user);
  console.log('🔑 user.id:', user?.id);
  console.log('👨‍💼 user.role:', user?.role);

  return (
    <Layout title="Junk Shop Verification">
      <div className="space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Junk Shop Verification 🏪
                </h1>
                <p className="text-green-100">
                  Review and verify junk shop document submissions
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={handleExportReports}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-white/20 text-white border-white/30">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verifications ({allVerifications.length})</SelectItem>
                    <SelectItem value="pending">Pending ({pendingJunkshops.length})</SelectItem>
                    <SelectItem value="approved">Approved ({approvedJunkshops.length})</SelectItem>
                    <SelectItem value="rejected">Rejected ({rejectedJunkshops.length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Connection Test */}
        <DatabaseConnectionTest />

        {/* Database Connection Status */}
        <Card className={`mb-6 ${
          loading ? 'border-yellow-200 bg-yellow-50' : 
          error ? 'border-red-200 bg-red-50' : 
          allVerifications.length === 0 ? 'border-orange-200 bg-orange-50' : 
          'border-green-200 bg-green-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  loading ? 'bg-yellow-500' : 
                  error ? 'bg-red-500' : 
                  allVerifications.length === 0 ? 'bg-orange-500' : 
                  'bg-green-500'
                } animate-pulse`}></div>
                <div>
                  <div className="font-medium text-sm">
                    {loading ? 'Connecting to Database...' : 
                     error ? 'Database Connection Error' : 
                     allVerifications.length === 0 ? 'No Data Found' : 
                     'Database Connected'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {loading ? 'Loading verification data from Firestore' :
                     error ? `Error: ${error}` :
                     `Found ${allVerifications.length} verifications (${junkshopVerifications.length} junk shops)`}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                {!loading && allVerifications.length === 0 && !error && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const currentUserId = user?.id || "admin-user-" + Date.now();
                        
                        await initializeFirebaseData(currentUserId);
                        
                        toast({
                          title: "Success!",
                          description: "Sample verification data has been created successfully. The page will refresh automatically.",
                        });
                        
                        // Refresh page after 2 seconds to show new data
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                        
                      } catch (error) {
                        console.error("Failed to initialize data:", error);
                        toast({
                          title: "Error",
                          description: `Failed to initialize sample data: ${error.message}`,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Initialize Sample Data
                  </Button>
                )}
                
                {/* Set Admin Role Button */}
                <Button 
                  size="sm" 
                  variant="outline"
                  className="ml-2"
                  onClick={async () => {
                    try {
                      if (!user?.id) {
                        toast({
                          title: "Error",
                          description: "No user logged in",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const success = await setUserAsAdmin(user.id);
                      
                      if (success) {
                        toast({
                          title: "Success!",
                          description: "Admin role set successfully. Please refresh the page.",
                        });
                        
                        // Refresh page after 2 seconds
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      }
                    } catch (error) {
                      console.error("Failed to set admin role:", error);
                      toast({
                        title: "Error",
                        description: `Failed to set admin role: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Set Admin Role
                </Button>
                
                <Badge variant="outline" className="text-xs">
                  Firebase Firestore
                </Badge>
              </div>
            </div>
            
            {/* Additional Debug Info */}
            {(!loading && allVerifications.length === 0 && !error) && (
              <div className="mt-3 p-3 bg-white rounded border text-xs">
                <div className="font-medium mb-2">Troubleshooting:</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Ensure Firebase configuration is correct</li>
                  <li>Check Firestore security rules allow read access</li>
                  <li>Initialize sample data using the admin panel</li>
                  <li>Verify the "verifications" collection exists</li>
                </ul>
              </div>
            )}
            
            {/* Show sample data structure if available */}
            {allVerifications.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs font-medium cursor-pointer">View Sample Data Structure</summary>
                <pre className="text-xs bg-white p-2 mt-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(allVerifications[0], null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Pending</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{verificationStats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Approved</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{verificationStats.approved}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{verificationStats.rejected}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Approval Rate</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{verificationStats.approvalRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Badge className="bg-green-600 text-white">{verificationStats.approvalRate}%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Results */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {statusFilter === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
              {statusFilter === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {statusFilter === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
              {statusFilter === 'all' && <Filter className="h-5 w-5 text-blue-600" />}
              <span>
                {statusFilter === 'all' && `All Verifications (${allVerifications.length}/${filteredVerifications.length})`}
                {statusFilter === 'pending' && `Pending Verifications (${filteredVerifications.length})`}
                {statusFilter === 'approved' && `Approved Verifications (${filteredVerifications.length})`}
                {statusFilter === 'rejected' && `Rejected Verifications (${filteredVerifications.length})`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredVerifications.length > 0 ? (
                filteredVerifications.map((verification) => (
                  <div 
                    key={verification.id} 
                    className={`rounded-lg p-6 ${
                      verification.status === 'approved' ? 'bg-green-50 border border-green-200' :
                      verification.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                      'bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          verification.status === 'approved' ? 'bg-green-100' :
                          verification.status === 'rejected' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {verification.status === 'approved' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : verification.status === 'rejected' ? (
                            <XCircle className="h-6 w-6 text-red-600" />
                          ) : (
                            <FileText className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">Junk Shop Verification</h3>
                          <p className="text-sm text-muted-foreground">Document: {verification.documentType || 'Unknown Document'}</p>
                          <div className="flex items-center space-x-4 text-muted-foreground text-sm mt-2">
                            <span className="flex items-center space-x-1">
                              <Building2 className="h-4 w-4" />
                              <span>User ID: {verification.userId}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Submitted: {verification.metadata?.submissionTimestamp 
                                ? getValidDate(verification.metadata.submissionTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : verification.createdAt 
                                  ? getValidDate(verification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : 'Recently'}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-muted-foreground text-sm mt-1">
                            <span className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>Type: {verification.documentType}</span>
                            </span>
                            {verification.documentURL && (
                              <span className="flex items-center space-x-1">
                                <FileText className="h-4 w-4" />
                                <span>Document Available</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <Badge variant="secondary">Junk Shop</Badge>
                            <Badge variant="outline" className={
                              verification.status === 'approved' ? 'bg-green-100 text-green-800' :
                              verification.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {verification.status === 'pending' || !verification.status ? 'Pending Review' : 
                               verification.status === 'under_review' ? 'Under Review' : 
                               verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                            </Badge>
                            {verification.documentType && (
                              <Badge variant="outline">{verification.documentType.replace('_', ' ')}</Badge>
                            )}
                          </div>
                          {verification.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>Rejection Reason:</strong> {verification.rejectionReason}
                            </div>
                          )}
                          {verification.adminNotes && verification.adminNotes !== verification.rejectionReason && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                              <strong>Admin Notes:</strong> {verification.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {(verification.status === 'pending' || !verification.status) && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleVerification(verification, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleVerification(verification, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedVerification(verification)}>
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Verification Details</DialogTitle>
                            </DialogHeader>
                            {selectedVerification && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Document Type</label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      {selectedVerification.documentType || 'Unknown Document'}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      {selectedVerification.userId || 'Unknown User'}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      {selectedVerification.status || 'Pending'}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">User Role</label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      {selectedVerification.userRole || 'Unknown'}
                                    </div>
                                  </div>
                                </div>
                                {selectedVerification.documentURL && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Document</label>
                                    <div className="mt-1 p-3 bg-muted rounded-md">
                                      <a href={selectedVerification.documentURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        View Document
                                      </a>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Verification Notes</label>
                                  <Textarea
                                    placeholder="Add notes about this verification..."
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <div className="flex space-x-2 justify-end">
                                  {(selectedVerification.status === 'pending' || !selectedVerification.status) && (
                                    <>
                                      <Button 
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => {
                                          handleVerification(selectedVerification, 'approved');
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => {
                                          handleVerification(selectedVerification, 'rejected');
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {statusFilter === 'all' ? '' : statusFilter} verifications found</p>
                  <p className="text-sm">
                    {statusFilter === 'all' 
                      ? 'Verification requests will appear here when submitted' 
                      : `No ${statusFilter} verifications at this time`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}