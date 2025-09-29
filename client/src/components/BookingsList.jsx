import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { orderBy, limit } from "firebase/firestore";
import { Package, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", color: "bg-gray-500", icon: Clock },
  assigned: { label: "Assigned", color: "bg-blue-500", icon: Package },
  in_progress: { label: "In Progress", color: "bg-yellow-500", icon: Package },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: Clock },
};

export const BookingsList = () => {
  const { data: bookings, loading, error } = useFirestoreCollection(
    "bookings",
    [orderBy("createdAt", "desc"), limit(10)]
  );

  if (loading) {
    return (
      <Card className="lg:col-span-2 border-gray-100 dark:border-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Bookings</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <LoadingSpinner className="h-32" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="lg:col-span-2 border-gray-100 dark:border-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Bookings</h3>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-red-500" data-testid="text-bookings-error">
            Error loading bookings: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 border-gray-100 dark:border-gray-800" data-testid="card-recent-bookings">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Bookings</h3>
          <Button variant="link" className="text-primary" data-testid="button-view-all-bookings">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-bookings">
            No bookings found
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              let formattedTime = 'N/A';
              if (booking.createdAt) {
                try {
                  const date = booking.createdAt instanceof Date 
                    ? booking.createdAt 
                    : booking.createdAt.toDate
                      ? booking.createdAt.toDate()
                      : new Date(booking.createdAt);
                  formattedTime = date.toLocaleString('id-ID', { 
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit'
                  });
                } catch (e) {
                  formattedTime = 'Invalid Date';
                }
              }

              return (
                <div 
                  key={booking.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  data-testid={`card-booking-${booking.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", 
                      booking.status === 'completed' ? 'bg-green-500' : 
                      booking.status === 'in_progress' ? 'bg-yellow-500' : 
                      booking.status === 'pending' ? 'bg-gray-500' : 'bg-blue-500'
                    )}>
                      <StatusIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100" data-testid={`text-booking-id-${booking.id}`}>
                        #{booking.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300" data-testid={`text-booking-customer-${booking.id}`}>
                        Customer ID: {booking.customerId?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400" data-testid={`text-booking-route-${booking.id}`}>
                        {booking.pickupLocation} → {booking.dropoffLocation}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={cn("text-white", config.color)}
                      data-testid={`badge-booking-status-${booking.id}`}
                    >
                      {config.label}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1" data-testid={`text-booking-time-${booking.id}`}>
                      {formattedTime}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
