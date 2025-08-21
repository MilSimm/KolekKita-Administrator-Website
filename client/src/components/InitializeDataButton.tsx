import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { initializeFirebaseData } from "@/lib/initializeData";
import { Database, Loader2 } from "lucide-react";

export const InitializeDataButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInitialize = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to initialize data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await initializeFirebaseData(user.id);
      toast({
        title: "Success",
        description: "Sample data has been initialized successfully!",
      });
    } catch (error) {
      console.error("Error initializing data:", error);
      toast({
        title: "Error",
        description: "Failed to initialize sample data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInitialize}
      disabled={loading}
      variant="outline"
      size="sm"
      className="flex items-center space-x-2"
      data-testid="button-initialize-data"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      <span>{loading ? "Initializing..." : "Add Sample Data"}</span>
    </Button>
  );
};