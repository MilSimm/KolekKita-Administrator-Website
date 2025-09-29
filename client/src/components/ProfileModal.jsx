import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X,
  Camera
} from "lucide-react";



export const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Update user document in Firestore
      await updateDoc(doc(db, "users", user.id), {
        name: formData.name,
        phone: formData.phone,
        updatedAt: new Date()
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: user?.name || "",
      phone: user?.phone || ""
    });
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    
    // Handle Firebase Timestamp
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle regular Date objects or strings
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'moderator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Admin Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-white/20">
                      <AvatarImage src={user?.profilePhoto || undefined} />
                      <AvatarFallback className="bg-white/20 text-white text-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 p-0"
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Profile Info */}
                  <div>
                    <h2 className="text-xl font-bold mb-1">
                      {user?.name || "Admin User"}
                    </h2>
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={`${getRoleColor(user?.role || 'admin')} border-0`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user?.role?.toUpperCase() || "ADMIN"}
                      </Badge>
                      <span className="text-blue-100 text-sm">
                        Member since {formatDate(user?.createdAt)}
                      </span>
                    </div>
                    <p className="text-blue-100 text-sm max-w-md">
                      Platform administrator with full system access and management capabilities.
                    </p>
                  </div>
                </div>
                
                {/* Edit Button */}
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/20 text-white hover:bg-white/30"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-green-500/20 text-white hover:bg-green-500/30"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-red-500/20 text-white hover:bg-red-500/30"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <User className="h-4 w-4 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="h-9"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-muted rounded-md text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.name || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email Address</Label>
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded-md text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{user?.email || "Not provided"}</span>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter your phone number"
                      className="h-9"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-muted rounded-md text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Shield className="h-4 w-4 mr-2" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Role</span>
                    </div>
                    <Badge className={getRoleColor(user?.role || 'admin')} variant="secondary">
                      {user?.role?.toUpperCase() || "ADMIN"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Member Since</span>
                    </div>
                    <span className="text-sm">{formatDate(user?.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Last Updated</span>
                    </div>
                    <span className="text-sm">{formatDate(user?.updatedAt || user?.createdAt)}</span>
                  </div>

                  <Separator className="my-3" />

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Account settings and preferences will be available here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
