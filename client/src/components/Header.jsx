import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ProfileModal } from "@/components/ProfileModal";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";

const getRoleDisplayName = (role) => {
  switch (role) {
    case "admin": return "Admin";
    case "junk_shop_owner": return "Junk Shop Owner";
    case "collector": return "Collector";
    case "customer": return "Customer";
    default: return role;
  }
};

export const Header = ({ title, onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
              <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
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

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </header>
  );
};
