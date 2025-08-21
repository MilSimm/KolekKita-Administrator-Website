import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Edit3, 
  Save,
  Camera,
  Key,
  Bell,
  Globe
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@kolekkit.com",
    phone: "+1 (555) 123-4567",
    role: "Super Administrator",
    department: "Platform Management",
    bio: "Experienced platform administrator with 5+ years of experience managing large-scale applications and user communities.",
    location: "Manila, Philippines",
    timezone: "Asia/Manila",
    joinDate: "January 15, 2023",
    lastLogin: "Today at 2:30 PM"
  });

  const [notifications, setNotifications] = useState({
    emailReports: true,
    systemAlerts: true,
    userNotifications: false,
    securityUpdates: true
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
    setIsEditing(false);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Notification settings updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const stats = [
    { label: "Actions Performed", value: "1,247", icon: Shield },
    { label: "Users Managed", value: "856", icon: User },
    { label: "Reports Reviewed", value: "342", icon: Mail },
    { label: "Days Active", value: "89", icon: Calendar }
  ];

  return (
    <Layout title="My Profile">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white/20">
                    <AvatarImage src="/avatar-placeholder.png" alt="Profile" />
                    <AvatarFallback className="text-2xl font-bold bg-green-400 text-white">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 bg-white/20 hover:bg-white/30"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profileData.name}</h1>
                  <div className="flex items-center space-x-4 text-green-100">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                      {profileData.role}
                    </Badge>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profileData.location}
                    </span>
                  </div>
                  <p className="text-green-100 mt-2">{profileData.department}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 text-white hover:bg-white/30 border-white/20"
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{stat.label}</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{profileData.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{profileData.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{profileData.phone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">{profileData.location}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{profileData.bio}</p>
                )}
              </div>
              {isEditing && (
                <Button onClick={handleSaveProfile} className="w-full bg-green-600 hover:bg-green-700">
                  Save Profile Information
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Change Password</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Two-Factor Authentication</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Enabled
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Language & Region</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Notification Preferences</h4>
                <div className="space-y-2">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Button
                        variant={value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleNotificationChange(key, !value)}
                        className={value ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {value ? "On" : "Off"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Member Since</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">{profileData.joinDate}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Last Login</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">{profileData.lastLogin}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Session Status</p>
                <div className="flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-lg font-semibold text-green-900 dark:text-green-100">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
