import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

import { useFirestoreCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";
import { format } from "date-fns";
import { Menu, Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import type { Notification } from "@shared/schema";

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case "admin": return "Admin";
    case "junk_shop_owner": return "Junk Shop Owner";
    case "collector": return "Collector";
    case "customer": return "Customer";
    default: return role;
  }
};

export const Header = ({ title, onMenuToggle }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  
  // Get real-time notification count (only if user is authenticated)
  const { data: notifications } = useFirestoreCollection<Notification>(
    "notifications", 
    user ? [where("userId", "==", user.id), where("isRead", "==", false)] : []
  );

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutDialogOpen(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 border-b border-gray-200">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden mr-4"
          onClick={onMenuToggle}
          data-testid="button-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-gray-800" data-testid="text-page-title">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Real-time Status Indicator */}
        <div className="flex items-center space-x-2" data-testid="status-realtime">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Live</span>
        </div>



        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowNotifications(!showNotifications)}
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications && notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                data-testid="badge-notification-count"
              >
                {notifications.length > 99 ? "99+" : notifications.length}
              </Badge>
            )}
          </Button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.createdAt && format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
              {notifications && notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setShowNotifications(false)}
                  >
                    Mark all as read
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8" data-testid="avatar-user">
            <AvatarImage src={user?.profilePhoto || undefined} />
            <AvatarFallback>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-700" data-testid="text-username">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-gray-500" data-testid="text-user-role">
              {user?.role ? getRoleDisplayName(user.role) : "User"}
            </span>
          </div>
          
          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-user-menu">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {/* Logout with Confirmation Dialog */}
              <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setIsLogoutDialogOpen(true);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be signed out of your account and redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Log out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
