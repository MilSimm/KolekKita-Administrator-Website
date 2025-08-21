import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useToast } from "@/hooks/use-toast";
import { orderBy } from "firebase/firestore";
import { AlertTriangle, Flag, MessageSquare, ShieldCheck, Eye, CheckCircle, XCircle, Clock, Download, Calendar, Filter, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User, Review, Booking } from "@shared/schema";

export default function Moderation() {
  const [filterType, setFilterType] = useState<string>("all"); // New unified filter state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [actionType, setActionType] = useState<string>("");
  const { toast } = useToast();
  const { addDocument, updateDocument } = useFirestoreOperations("reports");
  
  // Helper function to safely convert timestamps to Date objects
  const getValidDate = (timestamp: any): Date => {
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
  
  // Fetch data with proper ordering
  const { data: users } = useFirestoreCollection<User>("users", [orderBy("createdAt", "desc")]);
  const { data: reviews } = useFirestoreCollection<Review>("reviews", [orderBy("createdAt", "desc")]);
  const { data: bookings } = useFirestoreCollection<Booking>("bookings", [orderBy("createdAt", "desc")]);
  const { data: reports } = useFirestoreCollection<any>("reports", [orderBy("createdAt", "desc")]);
  
  // Real moderation statistics based on actual database data
  const flaggedReviews = reviews.filter(review => 
    review.rating <= 2 || 
    (review.comment && review.comment.length < 10) ||
    (review.comment && /spam|fake|bot|test/i.test(review.comment))
  );
  
  const suspiciousUsers = users.filter(user => 
    !user.email || 
    user.email.length < 5 || 
    !user.name || 
    user.name.length < 2 ||
    /test|fake|spam/i.test(user.name || '')
  );
  
  const problematicBookings = bookings.filter(booking => 
    !booking.price || 
    parseFloat(booking.price) === 0 ||
    booking.status === 'cancelled' ||
    !booking.pickupLocation ||
    !booking.dropoffLocation
  );
  
  // Generate comprehensive report queue from multiple sources
  const reportQueue = [
    // Direct reports from database
    ...reports.map(report => ({
      id: report.id,
      type: report.type || 'Content Violation',
      category: report.category || 'General',
      description: report.description || 'No description provided',
      reportedBy: report.reportedBy || 'System',
      priority: report.priority || 'Medium',
      date: getValidDate(report.createdAt).toISOString(),
      status: report.status || 'pending'
    })),
    // Flagged reviews
    ...flaggedReviews.map(review => ({
      id: `review-${review.id}`,
      type: 'Inappropriate Content',
      category: 'Review',
      description: `${review.rating <= 1 ? 'Very low rating' : 'Low rating'} review (${review.rating}/5 stars)${review.comment ? ': "' + review.comment.substring(0, 50) + '..."' : ''}`,
      reportedBy: 'System Detection',
      priority: review.rating <= 1 ? 'High' : 'Medium',
      date: getValidDate(review.createdAt).toISOString(),
      status: 'pending'
    })),
    // Suspicious users
    ...suspiciousUsers.slice(0, 5).map(user => ({
      id: `user-${user.id}`,
      type: 'Suspicious Account',
      category: 'User',
      description: `Account with incomplete or suspicious profile: ${user.name || 'No name'} (${user.email || 'No email'})`,
      reportedBy: 'System Validation',
      priority: 'Medium',
      date: getValidDate(user.createdAt).toISOString(),
      status: 'pending'
    })),
    // Problematic bookings
    ...problematicBookings.slice(0, 3).map(booking => ({
      id: `booking-${booking.id}`,
      type: 'Booking Issue',
      category: 'Transaction',
      description: `${booking.status === 'cancelled' ? 'Cancelled booking' : 'Incomplete booking data'} - ${booking.pickupLocation || 'Unknown pickup'} to ${booking.dropoffLocation || 'Unknown dropoff'}`,
      reportedBy: 'System Monitor',
      priority: booking.status === 'cancelled' ? 'Low' : 'Medium',
      date: getValidDate(booking.createdAt).toISOString(),
      status: 'pending'
    }))
  ].sort((a, b) => {
    // Sort by priority (High, Medium, Low) then by date
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const moderationStats = {
    pendingReports: reportQueue.filter(r => r.status === 'pending').length,
    reviewsToModerate: flaggedReviews.length,
    contentViolations: flaggedReviews.length + suspiciousUsers.length,
    actionsTaken: reports.filter(r => r.status === 'resolved').length + problematicBookings.length
  };

  // Export Reports functionality
  const handleExportReports = () => {
    try {
      const reportsToExport = getDisplayedReports();

      // Prepare CSV data
      const csvHeaders = [
        'Report ID',
        'Type',
        'Category', 
        'Description',
        'Reported By',
        'Priority',
        'Status',
        'Date Reported',
        'Action Taken'
      ];
      
      const csvData = reportsToExport.map(report => [
        report.id,
        report.type,
        report.category,
        report.description,
        report.reportedBy,
        report.priority,
        report.status,
        new Date(report.date).toLocaleDateString('en-US'),
        'Pending' // Action status will be updated when actions are taken
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
      
      const getFilterPrefix = () => {
        switch(filterType) {
          case 'urgent': return 'urgent-reports';
          case 'pending': return 'pending-reports';
          case 'high-priority': return 'high-priority-reports';
          case 'resolved': return 'resolved-reports';
          case 'content': return 'content-reports';
          case 'user': return 'user-reports';
          default: return 'moderation-reports';
        }
      };
      
      link.setAttribute('download', `${getFilterPrefix()}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${reportsToExport.length} report records to CSV file`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export moderation data",
        variant: "destructive",
      });
    }
  };

  // Handle review action
  const handleReviewReport = (report: any) => {
    setSelectedReport(report);
    setShowReviewDialog(true);
  };

  // Handle take action
  const handleTakeAction = (report: any) => {
    setSelectedReport(report);
    setActionNotes("");
    setActionType("");
    setShowActionDialog(true);
  };

  // Execute moderation action
  const executeAction = async () => {
    if (!selectedReport || !actionType) return;
    
    try {
      // Update the report status
      if (selectedReport.id.startsWith('review-') || selectedReport.id.startsWith('user-') || selectedReport.id.startsWith('booking-')) {
        // For system-generated reports, create a new record or update existing
        await addDocument({
          originalId: selectedReport.id,
          type: selectedReport.type,
          category: selectedReport.category,
          description: selectedReport.description,
          reportedBy: selectedReport.reportedBy,
          priority: selectedReport.priority,
          status: 'resolved',
          actionTaken: actionType,
          actionNotes: actionNotes,
          resolvedBy: 'admin',
          resolvedAt: new Date(),
          createdAt: new Date(selectedReport.date)
        });
      } else {
        // For direct reports from database, update the existing document
        await updateDocument(selectedReport.id, {
          status: 'resolved',
          actionTaken: actionType,
          actionNotes: actionNotes,
          resolvedBy: 'admin',
          resolvedAt: new Date()
        });
      }

      toast({
        title: "Action completed",
        description: `Report has been resolved with action: ${actionType}`,
      });

      setShowActionDialog(false);
      setSelectedReport(null);
    } catch (error) {
      toast({
        title: "Action failed",
        description: "Failed to complete moderation action",
        variant: "destructive",
      });
    }
  };

  // Filter reports based on current view
  const getDisplayedReports = () => {
    switch(filterType) {
      case 'urgent':
        return reportQueue.filter(r => r.priority === 'High');
      case 'pending':
        return reportQueue.filter(r => r.status === 'pending');
      case 'high-priority':
        return reportQueue.filter(r => r.priority === 'High' || r.priority === 'Medium');
      case 'resolved':
        return reportQueue.filter(r => r.status === 'resolved');
      case 'content':
        return reportQueue.filter(r => r.category === 'Review' || r.type.includes('Content'));
      case 'user':
        return reportQueue.filter(r => r.category === 'User');
      case 'recent':
        return reportQueue.filter(r => {
          const reportDate = new Date(r.date);
          const daysDiff = (new Date().getTime() - reportDate.getTime()) / (1000 * 3600 * 24);
          return daysDiff <= 7;
        });
      default:
        return reportQueue;
    }
  };

  const displayedReports = getDisplayedReports();

  // Get filter display info
  const getFilterInfo = () => {
    switch(filterType) {
      case 'urgent': return { title: 'Urgent Reports Queue', description: 'High priority reports requiring immediate attention' };
      case 'pending': return { title: 'Pending Review Queue', description: 'Reports waiting for admin review and action' };
      case 'high-priority': return { title: 'High Priority Reports', description: 'High and medium priority reports' };
      case 'resolved': return { title: 'Resolved Reports', description: 'Reports that have been resolved' };
      case 'content': return { title: 'Content Reports', description: 'Reports related to content and reviews' };
      case 'user': return { title: 'User Reports', description: 'Reports related to user accounts' };
      case 'recent': return { title: 'Recent Reports', description: 'Reports from the last 7 days' };
      default: return { title: 'All Reports Queue', description: 'Review and moderate flagged content' };
    }
  };

  const filterInfo = getFilterInfo();

  return (
    <Layout title="Content Moderation">
      <div className="space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Content Moderation 🛡️</h1>
                <p className="text-blue-100">Review reports, reviews, and manage platform content</p>
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {filterType === 'all' ? 'All Reports' : 
                       filterType === 'urgent' ? 'Urgent Reports' :
                       filterType === 'pending' ? 'Review Queue' :
                       filterType === 'high-priority' ? 'High Priority' :
                       filterType === 'resolved' ? 'Resolved' :
                       filterType === 'content' ? 'Content Reports' :
                       filterType === 'user' ? 'User Reports' :
                       filterType === 'recent' ? 'Recent Reports' : 'All Reports'}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('all');
                        toast({
                          title: "All Reports",
                          description: `Showing all ${reportQueue.length} reports`
                        });
                      }}
                      className={filterType === 'all' ? 'bg-muted' : ''}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      All Reports
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('urgent');
                        const urgentCount = reportQueue.filter(r => r.priority === 'High').length;
                        toast({
                          title: "Urgent Reports",
                          description: `Showing ${urgentCount} urgent reports`,
                          variant: "destructive"
                        });
                      }}
                      className={filterType === 'urgent' ? 'bg-muted' : ''}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Urgent Reports
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('pending');
                        const pendingCount = reportQueue.filter(r => r.status === 'pending').length;
                        toast({
                          title: "Review Queue",
                          description: `Showing ${pendingCount} pending reviews`
                        });
                      }}
                      className={filterType === 'pending' ? 'bg-muted' : ''}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Review Queue
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('high-priority');
                        const highPriorityCount = reportQueue.filter(r => r.priority === 'High' || r.priority === 'Medium').length;
                        toast({
                          title: "High Priority",
                          description: `Showing ${highPriorityCount} high priority reports`
                        });
                      }}
                      className={filterType === 'high-priority' ? 'bg-muted' : ''}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('resolved');
                        const resolvedCount = reportQueue.filter(r => r.status === 'resolved').length;
                        toast({
                          title: "Resolved Reports",
                          description: `Showing ${resolvedCount} resolved reports`
                        });
                      }}
                      className={filterType === 'resolved' ? 'bg-muted' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('content');
                        const contentCount = reportQueue.filter(r => r.category === 'Review' || r.type.includes('Content')).length;
                        toast({
                          title: "Content Reports",
                          description: `Showing ${contentCount} content-related reports`
                        });
                      }}
                      className={filterType === 'content' ? 'bg-muted' : ''}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Content Reports
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('user');
                        const userCount = reportQueue.filter(r => r.category === 'User').length;
                        toast({
                          title: "User Reports",
                          description: `Showing ${userCount} user-related reports`
                        });
                      }}
                      className={filterType === 'user' ? 'bg-muted' : ''}
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      User Reports
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setFilterType('recent');
                        const recentCount = reportQueue.filter(r => {
                          const reportDate = new Date(r.date);
                          const daysDiff = (new Date().getTime() - reportDate.getTime()) / (1000 * 3600 * 24);
                          return daysDiff <= 7;
                        }).length;
                        toast({
                          title: "Recent Reports",
                          description: `Showing ${recentCount} reports from last 7 days`
                        });
                      }}
                      className={filterType === 'recent' ? 'bg-muted' : ''}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Recent (7 days)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pending Reports</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{moderationStats.pendingReports}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Reviews to Moderate</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{moderationStats.reviewsToModerate}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Content Violations</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{moderationStats.contentViolations}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Flag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Actions Taken</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{moderationStats.actionsTaken}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Queue */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{filterInfo.title}</span>
              <Badge variant="outline">
                {displayedReports.length} {displayedReports.length === 1 ? 'Report' : 'Reports'}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {filterInfo.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedReports.length > 0 ? (
              displayedReports.map((report, index) => (
                <div key={report.id} className="bg-muted rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        report.priority === 'High' ? 'bg-red-100' : 
                        report.priority === 'Medium' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        {report.category === 'Review' ? (
                          <MessageSquare className={`h-6 w-6 ${
                            report.priority === 'High' ? 'text-red-600' : 
                            report.priority === 'Medium' ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                        ) : (
                          <AlertTriangle className={`h-6 w-6 ${
                            report.priority === 'High' ? 'text-red-600' : 
                            report.priority === 'Medium' ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{report.type}</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          Reported by {report.reportedBy} • {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-sm mt-2">{report.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge 
                            variant={
                              report.priority === 'High' ? 'destructive' : 
                              report.priority === 'Medium' ? 'default' : 'secondary'
                            }
                            className="mt-2"
                          >
                            {report.priority} Priority
                          </Badge>
                          <Badge variant="outline" className="mt-2">
                            {report.category}
                          </Badge>
                          <Badge 
                            variant={report.status === 'pending' ? 'outline' : 'default'}
                            className="mt-2"
                          >
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReviewReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleTakeAction(report)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Take Action
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldCheck className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {filterType === 'urgent' && "No Urgent Reports"}
                  {filterType === 'pending' && "No Pending Reviews"}
                  {filterType === 'resolved' && "No Resolved Reports"}
                  {filterType === 'content' && "No Content Reports"}
                  {filterType === 'user' && "No User Reports"}
                  {filterType === 'recent' && "No Recent Reports"}
                  {filterType === 'high-priority' && "No High Priority Reports"}
                  {filterType === 'all' && "No Reports to Review"}
                </p>
                <p className="text-sm">
                  {filterType === 'urgent' && "No high-priority reports need immediate attention"}
                  {filterType === 'pending' && "All reports have been reviewed"}
                  {filterType === 'resolved' && "No reports have been resolved yet"}
                  {filterType === 'content' && "No content-related reports found"}
                  {filterType === 'user' && "No user-related reports found"}
                  {filterType === 'recent' && "No reports from the last 7 days"}
                  {filterType === 'high-priority' && "No high or medium priority reports"}
                  {filterType === 'all' && "All content is clean and compliant"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Report Details</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Report Type</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      {selectedReport.type}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      {selectedReport.category}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      <Badge variant={
                        selectedReport.priority === 'High' ? 'destructive' : 
                        selectedReport.priority === 'Medium' ? 'default' : 'secondary'
                      }>
                        {selectedReport.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reported By</label>
                    <div className="mt-1 p-3 bg-muted rounded-md">
                      {selectedReport.reportedBy}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {selectedReport.description}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Report Date</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {new Date(selectedReport.date).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setShowReviewDialog(false);
                    handleTakeAction(selectedReport);
                  }}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Take Action
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Take Action Dialog */}
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Take Moderation Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Action Type</label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action to take" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning_issued">Issue Warning</SelectItem>
                    <SelectItem value="content_removed">Remove Content</SelectItem>
                    <SelectItem value="user_suspended">Suspend User</SelectItem>
                    <SelectItem value="account_banned">Ban Account</SelectItem>
                    <SelectItem value="no_action">No Action Required</SelectItem>
                    <SelectItem value="escalate">Escalate to Senior Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Action Notes</label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add notes about the action taken..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={executeAction} 
                  className="flex-1"
                  disabled={!actionType}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Execute Action
                </Button>
                <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}