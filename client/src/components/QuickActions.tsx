import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";
import { 
  Plus, 
  Users, 
  MessageSquare, 
  MapPin, 
  Settings,
  Download,
  Bell,
  RefreshCw,
  UserCheck,
  BarChart3
} from "lucide-react";
import type { Booking, User, Notification } from "@shared/schema";

export const QuickActions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get real-time data for alerts (only if user is authenticated)
  const { data: bookings } = useFirestoreCollection<Booking>("bookings", []);
  const { data: notifications } = useFirestoreCollection<Notification>("notifications", 
    user ? [where("userId", "==", user.id), where("isRead", "==", false)] : []
  );

  const handleNewBooking = () => {
    setLocation("/new-booking");
  };

  const handleManageUsers = () => {
    setLocation("/users");
  };

  const handleBroadcast = () => {
    // TODO: Implement broadcast functionality
    toast({
      title: "Broadcast System",
      description: "Broadcast messaging system coming soon",
    });
  };

  const handleTracking = () => {
    setLocation("/tracking");
  };

  const handleSettings = () => {
    setLocation("/settings");
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    toast({
      title: "Export Data",
      description: "Data export functionality coming soon",
    });
  };

  // Quick actions based on user role
  const getQuickActions = () => {
    const baseActions = [
      {
        id: "new-booking",
        title: "New Booking",
        description: "Schedule junk pickup",
        icon: Plus,
        color: "bg-blue-500 hover:bg-blue-600",
        textColor: "text-white",
        action: handleNewBooking,
        roles: ["customer", "admin", "junk_shop_owner"]
      },
      {
        id: "track-pickups",
        title: "Live Tracking",
        description: "Track active pickups",
        icon: MapPin,
        color: "bg-orange-500 hover:bg-orange-600",
        textColor: "text-white",
        action: handleTracking,
        roles: ["admin", "junk_shop_owner", "collector"]
      },
      {
        id: "manage-users",
        title: "Manage Users",
        description: "User management & verification",
        icon: UserCheck,
        color: "bg-green-500 hover:bg-green-600",
        textColor: "text-white",
        action: handleManageUsers,
        roles: ["admin"]
      },
      {
        id: "broadcast-message",
        title: "Broadcast",
        description: "Send announcements",
        icon: MessageSquare,
        color: "bg-purple-500 hover:bg-purple-600",
        textColor: "text-white",
        action: handleBroadcast,
        roles: ["admin", "junk_shop_owner"]
      },
      {
        id: "analytics",
        title: "Analytics",
        description: "View system analytics",
        icon: BarChart3,
        color: "bg-indigo-500 hover:bg-indigo-600",
        textColor: "text-white",
        action: () => toast({ title: "Analytics", description: "Analytics dashboard coming soon" }),
        roles: ["admin", "junk_shop_owner"]
      },
      {
        id: "system-settings",
        title: "Settings",
        description: "Configure system",
        icon: Settings,
        color: "bg-gray-500 hover:bg-gray-600",
        textColor: "text-white",
        action: handleSettings,
        roles: ["admin", "junk_shop_owner", "collector", "customer"]
      },
    ];

    return baseActions.filter(action => 
      !user || action.roles.includes(user.role as any)
    );
  };

  const quickActions = getQuickActions();

  // Real-time alerts based on actual data
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const unreadNotifications = notifications.length;

  const alerts = [
    {
      id: "pending-bookings",
      title: "Pending Bookings",
      count: pendingBookings,
      severity: pendingBookings > 5 ? "high" : pendingBookings > 2 ? "medium" : "low",
      action: () => setLocation("/bookings"),
    },
    {
      id: "notifications",
      title: "Notifications",
      count: unreadNotifications,
      severity: unreadNotifications > 5 ? "high" : unreadNotifications > 0 ? "medium" : "low",
      action: () => setLocation("/notifications"),
    },
  ].filter(alert => alert.count > 0);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="border-gray-100 dark:border-gray-800" data-testid="card-quick-actions">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Quick Actions
          </span>
          <Button variant="ghost" size="sm" data-testid="button-refresh-actions">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Action Buttons */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Actions</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={action.action}
                  className={`${action.color} ${action.textColor} h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 transform hover:scale-105`}
                  data-testid={`button-${action.id}`}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs opacity-80">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Alerts & Notifications</h4>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={alert.action}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)} animate-pulse`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{alert.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {alert.count} item{alert.count !== 1 ? 's' : ''} need attention
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={alert.severity === "high" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {alert.count}
                  </Badge>
                  <Bell className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">System Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">99.9%</div>
              <div className="text-sm text-green-600 dark:text-green-400">Uptime</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Support</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};