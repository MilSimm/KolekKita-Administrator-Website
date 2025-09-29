import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { where } from "firebase/firestore";
import { MapPin, Navigation, Truck } from "lucide-react";




// Global google variable

export const LiveTracking = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  
  // Get active bookings and online drivers
  const { data: activeBookings, loading: bookingsLoading } = useFirestoreCollection(
    "bookings", 
    [where("status", "in", ["assigned", "in_progress"])]
  );
  
  const { data: onlineDrivers, loading: driversLoading } = useFirestoreCollection(
    "users",
    [where("role", "==", "driver"), where("isOnline", "==", true)]
  );

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current || map) return;

    // Check if Google Maps is loaded
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      console.warn("Google Maps API not loaded");
      return;
    }

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: -6.2088, lng: 106.8456 }, // Jakarta center
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(mapInstance);
  }, [map]);

  // Update markers when data changes
  useEffect(() => {
    if (!map || bookingsLoading || driversLoading) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = [];

    // Add driver markers
    onlineDrivers.forEach(driver => {
      if (driver.currentLocation) {
        const marker = new window.google.maps.Marker({
          position: {
            lat: driver.currentLocation.latitude,
            lng: driver.currentLocation.longitude
          },
          map: map,
          title: `Driver: ${driver.name}`,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="2"/>
                <path d="M12 16L14.5 18.5L20 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">${driver.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">Status: Online</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Vehicle: ${driver.vehicleInfo?.type || 'N/A'}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      }
    });

    // Add booking markers
    activeBookings.forEach(booking => {
      // Pickup location marker
      if (booking.pickupCoordinates) {
        const pickupMarker = new window.google.maps.Marker({
          position: {
            lat: booking.pickupCoordinates.latitude,
            lng: booking.pickupCoordinates.longitude
          },
          map: map,
          title: `Pickup: ${booking.pickupLocation}`,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        newMarkers.push(pickupMarker);
      }

      // Dropoff location marker
      if (booking.dropoffCoordinates) {
        const dropoffMarker = new window.google.maps.Marker({
          position: {
            lat: booking.dropoffCoordinates.latitude,
            lng: booking.dropoffCoordinates.longitude
          },
          map: map,
          title: `Dropoff: ${booking.dropoffLocation}`,
          icon: {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="white" stroke-width="2"/>
                <path d="M12 12L20 20M20 12L12 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        newMarkers.push(dropoffMarker);
      }
    });

    setMarkers(newMarkers);
  }, [map, activeBookings, onlineDrivers, bookingsLoading, driversLoading]);

  const loading = bookingsLoading || driversLoading;

  if (loading) {
    return (
      <Card className="border-gray-100 dark:border-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LoadingSpinner className="h-80" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-100 dark:border-gray-800" data-testid="card-live-tracking">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Navigation className="h-5 w-5 mr-2" />
            Live Tracking
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center">
              <Truck className="h-3 w-3 mr-1" />
              {onlineDrivers.length} Online
            </Badge>
            <Badge variant="outline" className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {activeBookings.length} Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div 
            ref={mapRef} 
            className="h-80 w-full bg-gray-100 dark:bg-gray-800"
            data-testid="google-map"
          />
          {(typeof window === 'undefined' || !window.google) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-4" />
                <p>Google Maps API not configured</p>
                <p className="text-sm mt-2">Add GOOGLE_MAPS_API_KEY to environment</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-300">Online Drivers</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-300">Pickup Points</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-300">Dropoff Points</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};