import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin, Calendar, Package } from "lucide-react";


export default function NewBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pickupLocation: "",
    dropoffLocation: "",
    scheduledTime: "",
    notes: "",
    materialType: "",
    estimatedWeight: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const booking = {
        customerId: user.id,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation || "Recycling Center",
        scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime) : null,
        notes: `${formData.materialType ? `Material: ${formData.materialType}. ` : ''}${formData.estimatedWeight ? `Estimated weight: ${formData.estimatedWeight}kg. ` : ''}${formData.notes}`,
        status: "pending",
        photos: [],
      };

      await addDoc(collection(db, "bookings"), {
        ...booking,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Booking Created",
        description: "Your junk pickup has been scheduled successfully!",
      });

      // Reset form
      setFormData({
        pickupLocation: "",
        dropoffLocation: "",
        scheduledTime: "",
        notes: "",
        materialType: "",
        estimatedWeight: "",
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="New Junk Pickup Booking">
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Schedule Junk Pickup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pickupLocation" className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Pickup Location *
                </Label>
                <Input
                  id="pickupLocation"
                  required
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                  placeholder="Enter your pickup address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialType">Material Type</Label>
                <Select 
                  value={formData.materialType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, materialType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="paper">Paper & Cardboard</SelectItem>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="glass">Glass</SelectItem>
                    <SelectItem value="mixed">Mixed Materials</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="appliances">Appliances</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedWeight">Estimated Weight (kg)</Label>
                <Input
                  id="estimatedWeight"
                  type="number"
                  value={formData.estimatedWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedWeight: e.target.value }))}
                  placeholder="Approximate weight in kilograms"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Preferred Pickup Time
                </Label>
                <Input
                  id="scheduledTime"
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions or additional information..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !formData.pickupLocation}
              >
                {isSubmitting ? "Creating Booking..." : "Schedule Pickup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}