import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { orderBy, where, limit } from "firebase/firestore";
import { History, DollarSign, Download, Calendar, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";


export default function Transactions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  // Get completed bookings as transactions
  const constraints = [
    where("status", "==", "completed"),
    orderBy("completedTime", "desc"),
    limit(100)
  ];

  const { data: transactions, loading, error } = useFirestoreCollection(
    "bookings",
    constraints
  );

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.dropoffLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (dateFilter !== "all") {
      const now = new Date();
      const transactionDate = transaction.completedTime ? new Date(transaction.completedTime) : null;
      if (!transactionDate) return false;

      switch (dateFilter) {
        case "today":
          return transactionDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return transactionDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return transactionDate >= monthAgo;
        default:
          return true;
      }
    }
    
    return true;
  });

  // Calculate statistics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.price?.toString() || "0")), 0);
  const averageTransaction = filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0;
  const todayTransactions = filteredTransactions.filter(t => 
    t.completedTime && new Date(t.completedTime).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + (parseFloat(t.price?.toString() || "0")), 0);

  if (loading) {
    return (
      <Layout title="Transaction History">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Transaction History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Transaction History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage completed bookings and revenue
            </p>
          </div>
          <Button className="flex items-center space-x-2" data-testid="button-export-transactions">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <History className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {filteredTransactions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Transaction</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${averageTransaction.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${todayRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Transaction Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by booking ID, pickup, or dropoff location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-transactions"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter} data-testid="select-date-filter">
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-red-500 text-sm" data-testid="text-transactions-error">
                Error loading transactions: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-0">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-no-transactions">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`transaction-item-${transaction.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            Booking #{transaction.id.slice(0, 8)}
                          </h3>
                          <Badge variant="default" className="text-xs">
                            Completed
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Route:</span>
                            {transaction.pickupLocation} → {transaction.dropoffLocation}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>
                              <strong>Completed:</strong> {transaction.completedTime ? new Date(transaction.completedTime).toLocaleString() : 'N/A'}
                            </span>
                            <span>
                              <strong>Customer:</strong> {transaction.customerId?.slice(0, 8) || 'N/A'}
                            </span>
                            <span>
                              <strong>Driver:</strong> {transaction.driverId?.slice(0, 8) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${parseFloat(transaction.price?.toString() || "0").toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Revenue
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}