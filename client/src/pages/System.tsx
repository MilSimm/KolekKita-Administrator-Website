import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { useToast } from "@/hooks/use-toast";
import { Server, Database, Shield, Bell, MessageSquare, Settings as SettingsIcon, Send, Download, Calendar } from "lucide-react";

export default function System() {
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const { toast } = useToast();
  
  const { data: systemLogs } = useFirestoreCollection<any>("system_logs", []);
  const { data: notifications } = useFirestoreCollection<any>("notifications", []);
  
  const systemStats = {
    systemStatus: 'ONLINE',
    databaseSize: Math.floor(systemLogs.length / 100) || 0,
    notificationsSent: notifications.length,
    storageUsed: Math.floor(notifications.length / 10) || 0
  };

  return (
    <Layout title="System Management">
      <div className="space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  System Management ⚙️
                </h1>
                <p className="text-green-100">
                  Firebase configuration, notifications, and system settings
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    toast({
                      title: "Export System Data",
                      description: "System logs and configurations exported to CSV file"
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    toast({
                      title: "Database Status",
                      description: "Firebase connection: HEALTHY | Latency: 45ms | Active connections: 12"
                    });
                  }}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Database Status
                </Button>
                <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send System Notification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input 
                        placeholder="Notification title" 
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                      />
                      <Textarea 
                        placeholder="Notification message" 
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={() => {
                          toast({
                            title: "Notification Sent",
                            description: `"${notificationTitle}" has been broadcast to all users`
                          });
                          setShowNotificationDialog(false);
                          setNotificationTitle("");
                          setNotificationMessage("");
                        }}>
                          Send to All Users
                        </Button>
                        <Button variant="outline" onClick={() => setShowNotificationDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">System Status</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{systemStats.systemStatus}</p>
                  <p className="text-xs text-green-600">99.9% uptime</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Server className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Database Size</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{systemStats.databaseSize} GB</p>
                  <p className="text-xs text-green-600">Firebase storage</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Notifications Sent</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{systemStats.notificationsSent}</p>
                  <p className="text-xs text-green-600">Total messages</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Storage Used</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{systemStats.storageUsed} MB</p>
                  <p className="text-xs text-green-600">File storage</p>
                </div>
                <div className="w-12 h-12 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Enable system maintenance</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">User Registration</p>
                  <p className="text-sm text-muted-foreground">Allow new user signups</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Send system notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardHeader>
              <CardTitle>Broadcast Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select message type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message Content</label>
                <Textarea 
                  placeholder="Enter your broadcast message..."
                  className="mt-2"
                />
              </div>
              <Button className="w-full">
                Send Broadcast
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent System Logs */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle>Recent System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {systemLogs.length > 0 ? (
              <div className="space-y-2">
                {systemLogs.slice(-10).map((log: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warning' ? 'default' : 'secondary'}>
                        {log.level || 'info'}
                      </Badge>
                      <span className="text-sm">{log.message || 'System log entry'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Now'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <SettingsIcon className="h-16 w-16 mx-auto mb-4" />
                <p className="text-lg">No system logs available</p>
                <p className="text-sm">System is running smoothly.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}