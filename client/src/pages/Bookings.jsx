import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection, useFirestoreOperations } from "@/hooks/useFirestore";
import { useToast } from "@/hooks/use-toast";
import { orderBy, where } from "firebase/firestore";
import { Calendar, MapPin, Clock, DollarSign, User } from "lucide-react";
import { cn } from "@/lib/utils";


export default function Bookings() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { updateDocument } = useFirestoreOperations("bookings");

  const constraints = statusFilter === "all" 
    ? [orderBy("createdAt", "desc")]
    : [where("status", "==", statusFilter), orderBy("createdAt", "desc")];

  const { data: bookings, loading, error } = useFirestoreCollection(
    "bookings",
    constraints
  );

  const filteredBookings = bookings.filter(booking =>
    booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.dropoffLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateDocument(bookingId, { 
        status: newStatus,
        ...(newStatus === "completed" && { completedTime: new Date() })
      });
      toast({
        title: "Status updated",
        description: `Booking status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-gray-500";
      case "assigned": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (loading) {
    return (
      <Layout title="Pickup Bookings">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Pickup Bookings">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Filters and Search */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Filter Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search by location or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:max-w-sm"
                data-testid="input-search-bookings"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                <SelectTrigger className="sm:max-w-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-6">
              <div className="text-red-700 dark:text-red-300" data-testid="text-bookings-error">
                Error loading bookings: {error}
              </div>
            </CardContent>
          </Card>
        )}

        {!error && filteredBookings.length === 0 && (
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600 dark:text-gray-400" data-testid="text-no-bookings">
                {searchTerm ? "Try adjusting your search terms" : "No bookings match the selected filters"}
              </p>
            </CardContent>
          </Card>
        )}

        {!error && filteredBookings.length > 0 && (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="border-gray-100 dark:border-gray-800" data-testid={`card-booking-${booking.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid={`text-booking-id-${booking.id}`}>
                          Booking #{booking.id.slice(0, 8)}
                        </h3>
                        <Badge 
                          className={cn("text-white", getStatusColor(booking.status))}
                          data-testid={`badge-status-${booking.id}`}
                        >
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-green-500" />
                            <span>From: </span>
                            <span className="font-medium ml-1" data-testid={`text-pickup-${booking.id}`}>
                              {booking.pickupLocation}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 text-red-500" />
                            <span>To: </span>
                            <span className="font-medium ml-1" data-testid={`text-dropoff-${booking.id}`}>
                              {booking.dropoffLocation}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4 mr-2" />
                            <span>Customer: </span>
                            <span className="font-medium ml-1" data-testid={`text-customer-${booking.id}`}>
                              {booking.customerId?.slice(0, 8)}
                            </span>
                          </div>
                          {booking.driverId && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <User className="h-4 w-4 mr-2" />
                              <span>Driver: </span>
                              <span className="font-medium ml-1" data-testid={`text-driver-${booking.id}`}>
                                {booking.driverId.slice(0, 8)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span data-testid={`text-created-${booking.id}`}>
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        {booking.price && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="font-medium" data-testid={`text-price-${booking.id}`}>
                              Rp {booking.price}
                            </span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Notes: </span>
                          <span data-testid={`text-notes-${booking.id}`}>{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                      <Select 
                        value={booking.status} 
                        onValueChange={(value) => handleStatusChange(booking.id, value)}
                        data-testid={`select-status-${booking.id}`}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-view-details-${booking.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}