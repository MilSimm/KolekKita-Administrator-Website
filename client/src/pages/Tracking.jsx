import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LiveTracking } from "@/components/LiveTracking";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { where, orderBy } from "firebase/firestore";
import { MapPin, Clock, Navigation, Users } from "lucide-react";


export default function Tracking() {
  const { data: drivers } = useFirestoreCollection("users", [where("role", "==", "driver")]);
  
  // Convert Firebase users to DriverLocation format
  const [activeDrivers, setActiveDrivers] = useState([]);

  // Update active drivers from Firebase data
  useEffect(() => {
    const driverLocations = drivers
      .filter((driver) => driver.isOnline && driver.currentLocation)
      .map((driver) => ({
        driverId: driver.id,
        driverName: driver.name,
        lat: driver.currentLocation.latitude,
        lng: driver.currentLocation.longitude,
        status: driver.status || "available",
        currentBookingId: driver.currentBookingId
      }));
    setActiveDrivers(driverLocations);
  }, [drivers]);

  const { data: activeBookings, loading: bookingsLoading } = useFirestoreCollection(
    "bookings",
    [where("status", "in", ["assigned", "in_progress"]), orderBy("createdAt", "desc")]
  );

  // Simulate real-time driver location updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDrivers(prev => prev.map(driver => ({
        ...driver,
        lat: driver.lat + (Math.random() - 0.5) * 0.001,
        lng: driver.lng + (Math.random() - 0.5) * 0.001,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "en_route": return "bg-yellow-500";
      case "delivering": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "available": return "Available";
      case "en_route": return "En Route";
      case "delivering": return "Delivering";
      default: return status;
    }
  };

  return (
    <Layout title="Live Tracking">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-active-drivers">
                    {activeDrivers.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Drivers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Navigation className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-en-route">
                    {activeDrivers.filter(d => d.status === 'en_route').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">En Route</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-active-deliveries">
                    {activeBookings?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Map */}
        <LiveTracking />

        {/* Driver Status List */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Driver Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {activeDrivers.map((driver) => (
                <div 
                  key={driver.driverId}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`driver-status-${driver.driverId}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(driver.status)} animate-pulse`} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100" data-testid={`text-driver-name-${driver.driverId}`}>
                        {driver.driverName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ID: {driver.driverId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Location: {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge 
                      className={`text-white ${getStatusColor(driver.status)}`}
                      data-testid={`badge-driver-status-${driver.driverId}`}
                    >
                      {getStatusLabel(driver.status)}
                    </Badge>
                    {driver.currentBookingId && (
                      <Badge variant="outline" data-testid={`badge-booking-${driver.driverId}`}>
                        #{driver.currentBookingId.slice(0, 8)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Bookings */}
        {bookingsLoading ? (
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <LoadingSpinner className="h-32" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-100 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Active Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!activeBookings || activeBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-active-bookings">
                  No active bookings at the moment
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`active-booking-${booking.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          #{booking.id.slice(0, 8)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.pickupLocation} → {booking.dropoffLocation}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Driver: {booking.driverId?.slice(0, 8) || "Unassigned"}
                        </p>
                      </div>
                      <Badge 
                        className={`text-white ${
                          booking.status === 'assigned' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                        data-testid={`badge-booking-status-${booking.id}`}
                      >
                        {booking.status === 'assigned' ? 'Assigned' : 'In Progress'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}