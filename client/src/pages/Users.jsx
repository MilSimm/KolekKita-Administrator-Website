import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useToast } from "@/hooks/use-toast";
import { orderBy, where } from "firebase/firestore";
import { Users as UsersIcon, Mail, Phone, Shield, MoreVertical, Download, Calendar, Edit, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";


export default function Users() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: ""
  });
  const { toast } = useToast();
  const { updateDocument, deleteDocument } = useFirestoreOperations("users");

  // Helper function to safely convert timestamps to Date objects (same as Dashboard)
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

  const constraints = [orderBy("createdAt", "desc")];

  const { data: allUsers, loading, error } = useFirestoreCollection(
    "users",
    constraints
  );

  // Client-side filtering for better control and reliability
  const filteredUsersByRole = roleFilter === "all" 
    ? allUsers 
    : roleFilter === "junk_shop_owner"
      ? allUsers.filter(user => user.role === "junk_shop_owner" || user.role === "junkshop")
      : allUsers.filter(user => user.role === roleFilter);

  const filteredUsers = filteredUsersByRole.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (userId, isActive) => {
    try {
      await updateDocument(userId, { isActive });
      toast({
        title: "Status updated",
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteDocument(userId);
      toast({
        title: "User deleted",
        description: `${userName} has been removed from the system`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewUserDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateDocument(selectedUser.id, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        role: editFormData.role,
        updatedAt: new Date()
      });
      
      toast({
        title: "User updated",
        description: "User information has been successfully updated",
      });
      
      setShowEditUserDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update user information",
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = () => {
    try {
      // Prepare CSV data
      const csvHeaders = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Join Date'];
      const csvData = filteredUsers.map(user => [
        user.name,
        user.email,
        user.phone || 'N/A',
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        getValidDate(user.createdAt).toLocaleDateString('en-US')
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
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${filteredUsers.length} users to CSV file`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export user data",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin": return "default";
      case "junk_shop_owner": return "secondary";
      case "junkshop": return "secondary";
      case "collector": return "outline";
      case "customer": return "destructive";
      case "resident": return "destructive";
      default: return "outline";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return "👑";
      case "junk_shop_owner": return "🏪";
      case "junkshop": return "🏪";
      case "collector": return "🚚";
      case "customer": return "👤";
      case "resident": return "👤";
      default: return "❓";
    }
  };

  if (loading) {
    return (
      <Layout title="User Management">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Management">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-white">
                  User Management 👥
                </h1>
                <p className="text-green-100">
                  Manage system users, roles, and permissions
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={handleExportUsers}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              User Directory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter} data-testid="select-role-filter">
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="junk_shop_owner">Junk Shop</SelectItem>
                  <SelectItem value="collector">Collector</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-red-500 text-sm" data-testid="text-users-error">
                Error loading users: {error}
              </div>
            )}

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-green-200 border">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allUsers.filter(u => u.role === "admin").length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Admins</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-green-200 border">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allUsers.filter(u => u.role === "junk_shop_owner" || u.role === "junkshop").length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Junk Shops</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-green-200 border">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allUsers.filter(u => u.role === "collector").length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Collectors</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-green-200 border">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allUsers.filter(u => u.role === "resident" || u.role === "customer").length}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Residents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-no-users">
                <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
                <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`user-item-${user.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profilePhoto || ""} alt={user.name} />
                          <AvatarFallback className="text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {user.name}
                            </h3>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                              {getRoleIcon(user.role)} {user.role}
                            </Badge>
                            <Badge 
                              variant={user.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Joined: {getValidDate(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Select 
                          value={user.isActive ? "active" : "inactive"}
                          onValueChange={(value) => handleStatusChange(user.id, value === "active")}
                          data-testid={`select-status-${user.id}`}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-more-${user.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View User Details Dialog */}
        <Dialog open={showViewUserDialog} onOpenChange={setShowViewUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedUser.profilePhoto || ""} alt={selectedUser.name} />
                    <AvatarFallback className="text-2xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedUser.name}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                        {getRoleIcon(selectedUser.role)} {selectedUser.role}
                      </Badge>
                      <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                        <p className="text-sm">{selectedUser.phone}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</label>
                      <p className="text-sm capitalize">{selectedUser.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Joined</label>
                      <p className="text-sm">
                        {getValidDate(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                      <p className="text-sm">{selectedUser.isActive ? "Active User" : "Inactive User"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</label>
                      <p className="text-xs font-mono">{selectedUser.id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowViewUserDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setShowViewUserDialog(false);
                    handleEditUser(selectedUser);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="User name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="User email"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Phone number (optional)"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="junk_shop_owner">Junk Shop Owner</SelectItem>
                    <SelectItem value="collector">Collector</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="resident">Resident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleUpdateUser} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Update User
                </Button>
                <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
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