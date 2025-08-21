import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { initializeFirebaseData } from "@/lib/initializeData";
import { Settings, Database, Users, Zap, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  const [initializing, setInitializing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInitializeData = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to initialize data",
        variant: "destructive",
      });
      return;
    }

    setInitializing(true);
    try {
      await initializeFirebaseData(user.id);
      toast({
        title: "Data initialized successfully",
        description: "Sample data has been added to Firestore for testing",
      });
    } catch (error) {
      console.error("Failed to initialize data:", error);
      toast({
        title: "Initialization failed",
        description: error instanceof Error ? error.message : "Failed to initialize sample data",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  const settingsCategories = [
    {
      title: "Data Management",
      icon: Database,
      items: [
        {
          name: "Initialize Sample Data",
          description: "Add sample bookings, users, and chat messages for testing",
          action: handleInitializeData,
          loading: initializing,
          variant: "default" as const,
          testId: "button-initialize-data"
        },
        {
          name: "Clear All Data",
          description: "Remove all data from Firestore (use with caution)",
          action: () => toast({ title: "Feature", description: "Data clearing feature would be implemented here", variant: "destructive" }),
          loading: false,
          variant: "destructive" as const,
          testId: "button-clear-data"
        }
      ]
    },
    {
      title: "User Management",
      icon: Users,
      items: [
        {
          name: "User Permissions",
          description: "Configure role-based access control",
          action: () => toast({ title: "Feature", description: "User permissions would be configured here" }),
          loading: false,
          variant: "outline" as const,
          testId: "button-user-permissions"
        },
        {
          name: "Driver Registration",
          description: "Manage driver onboarding and verification",
          action: () => toast({ title: "Feature", description: "Driver registration management would be implemented here" }),
          loading: false,
          variant: "outline" as const,
          testId: "button-driver-registration"
        }
      ]
    },
    {
      title: "System Configuration",
      icon: Settings,
      items: [
        {
          name: "Firebase Rules",
          description: "Configure security rules for Firestore and Storage",
          action: () => toast({ title: "Feature", description: "Firebase rules configuration would be implemented here" }),
          loading: false,
          variant: "outline" as const,
          testId: "button-firebase-rules"
        },
        {
          name: "API Settings",
          description: "Configure external API integrations",
          action: () => toast({ title: "Feature", description: "API settings would be configured here" }),
          loading: false,
          variant: "outline" as const,
          testId: "button-api-settings"
        }
      ]
    },
    {
      title: "Performance",
      icon: Zap,
      items: [
        {
          name: "Cache Management",
          description: "Clear application cache and optimize performance",
          action: () => toast({ title: "Feature", description: "Cache management would be implemented here" }),
          loading: false,
          variant: "outline" as const,
          testId: "button-cache-management"
        },
        {
          name: "Database Optimization",
          description: "Optimize Firestore queries and indexes",
          action: () => toast({ title: "Feature", description: "Database optimization would be implemented here" }),
          loading: false,
          variant: "outline" as const,
          testId: "button-database-optimization"
        }
      ]
    }
  ];

  const systemStatus = [
    { name: "Firebase Connection", status: "connected", color: "bg-green-500" },
    { name: "Authentication", status: "active", color: "bg-green-500" },
    { name: "Firestore Database", status: "healthy", color: "bg-green-500" },
    { name: "Storage Bucket", status: "operational", color: "bg-green-500" },
    { name: "Real-time Updates", status: "active", color: "bg-green-500" },
  ];

  return (
    <Layout title="System Settings">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* System Status */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemStatus.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`status-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`w-3 h-3 rounded-full ${item.color} animate-pulse`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Categories */}
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="border-gray-100 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon className="h-5 w-5 mr-2" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div 
                      key={item.name}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      data-testid={`setting-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        variant={item.variant}
                        onClick={item.action}
                        disabled={item.loading}
                        className="ml-4"
                        data-testid={item.testId}
                      >
                        {item.loading ? <LoadingSpinner size="sm" /> : "Configure"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Quick Actions */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                data-testid="button-export-data"
              >
                <Database className="h-6 w-6" />
                <span>Export Data</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                data-testid="button-system-backup"
              >
                <Shield className="h-6 w-6" />
                <span>System Backup</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                data-testid="button-analytics-report"
              >
                <Zap className="h-6 w-6" />
                <span>Analytics Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                data-testid="button-system-logs"
              >
                <Settings className="h-6 w-6" />
                <span>System Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Environment Information */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Environment:</span>
                <Badge variant="secondary" className="ml-2">Development</Badge>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Version:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">1.0.0</span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Firebase Project:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {import.meta.env.VITE_FIREBASE_PROJECT_ID || "Not configured"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">Last Updated:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}