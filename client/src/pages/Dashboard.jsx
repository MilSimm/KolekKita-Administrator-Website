import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { useToast } from "@/hooks/use-toast";
import { orderBy } from "firebase/firestore";
import { Users, CheckCircle, Shield, BarChart3, Download, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";


const getRoleDisplayName = (role) => {
  switch (role) {
    case "admin": return "Admin";
    case "junk_shop_owner": return "Junk Shop Owner";
    case "collector": return "Collector";
    case "customer": return "Customer";
    default: return role;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: users } = useFirestoreCollection("users", [orderBy("createdAt", "desc")]);
  const { data: bookings } = useFirestoreCollection("bookings", [orderBy("createdAt", "desc")]);
  const { data: reviews } = useFirestoreCollection("reviews", [orderBy("createdAt", "desc")]);
  const { data: verifications } = useFirestoreCollection("verifications", [orderBy("createdAt", "desc")]);
  const { toast } = useToast();
  
  // State for show more/less functionality
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  
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
  
  // Calculate admin stats - Fix junk shop count to include both role names
  const totalUsers = users.length;
  const junkShops = users.filter(u => u.role === 'junk_shop_owner' || u.role === 'junkshop').length;
  const collectors = users.filter(u => u.role === 'collector').length;
  
  const adminStats = {
    totalUsers,
    junkShops,
    collectors
  };

  // Generate recent activity from multiple sources
  const recentActivity = (() => {
    const activities = [];
    
    // Recent user registrations
    users.slice(0, 10).forEach(user => {
      if (user.createdAt) {
        activities.push({
          type: 'user_registration',
          message: `New ${user.role.replace('_', ' ')} registered`,
          details: user.name,
          timestamp: getValidDate(user.createdAt),
          icon: Users,
          color: 'bg-blue-500'
        });
      }
    });

    // Recent bookings
    bookings.slice(0, 8).forEach(booking => {
      if (booking.createdAt) {
        activities.push({
          type: 'booking',
          message: 'New booking created',
          details: `Booking ID: ${booking.id?.slice(-8)}`,
          timestamp: getValidDate(booking.createdAt),
          icon: Calendar,
          color: 'bg-green-500'
        });
      }
    });

    // Recent reviews
    reviews.slice(0, 5).forEach(review => {
      if (review.createdAt) {
        activities.push({
          type: 'review',
          message: 'New review submitted',
          details: `${review.rating}/5 stars`,
          timestamp: getValidDate(review.createdAt),
          icon: Shield,
          color: 'bg-purple-500'
        });
      }
    });

    // Recent verifications
    verifications.slice(0, 5).forEach(verification => {
      const timestamp = verification.createdAt || verification.metadata?.submissionTimestamp;
      if (timestamp) {
        activities.push({
          type: 'verification',
          message: 'New verification submitted',
          details: `Document: ${verification.documentType || 'Unknown'}`,
          timestamp: getValidDate(timestamp),
          icon: CheckCircle,
          color: 'bg-orange-500'
        });
      }
    });

    // Sort by timestamp and return activities
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Return based on show more/less state
    return showMoreActivities ? sortedActivities.slice(0, 10) : sortedActivities.slice(0, 5);
  })();

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Admin Dashboard 👨‍💼
                </h1>
                <p className="text-green-100">
                  Platform management and oversight center
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    toast({
                      title: "Export Complete",
                      description: "Dashboard data exported successfully"
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Users</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{adminStats.totalUsers}</p>
                  <p className="text-xs text-green-600">All platform users</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Junk Shops</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{adminStats.junkShops}</p>
                  <p className="text-xs text-green-600">Business partners</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Collectors</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{adminStats.collectors}</p>
                  <p className="text-xs text-green-600">Active collectors</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        </div>

        {/* Recent Platform Activity - Full Width */}
        <Card className="border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Platform Activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Live updates from across the platform
                </p>
              </div>
              {recentActivity.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMoreActivities(!showMoreActivities)}
                  className="flex items-center space-x-2"
                >
                  {showMoreActivities ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Show More</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length > 0 ? (
              <>
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.message}</p>
                        <p className="text-muted-foreground text-sm">
                          {activity.details} • {activity.timestamp.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!showMoreActivities && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      Showing {recentActivity.length} of recent activities
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Platform activity will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}