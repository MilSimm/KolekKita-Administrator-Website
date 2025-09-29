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
import { Star, ThumbsUp, MessageSquare, TrendingUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";


export default function Reviews() {
  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const constraints = [orderBy("createdAt", "desc"), limit(100)];
  const { data: reviews, loading, error } = useFirestoreCollection(
    "reviews",
    constraints
  );

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (ratingFilter !== "all") {
      return review.rating.toString() === ratingFilter;
    }
    
    return true;
  });

  // Calculate statistics
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600 dark:text-green-400";
    if (rating >= 3.5) return "text-yellow-600 dark:text-yellow-400";
    if (rating >= 2.5) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <Layout title="Ratings & Reviews">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Ratings & Reviews">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Ratings & Reviews
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor customer feedback and service quality
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center">
              <Star className="h-3 w-3 mr-1 text-yellow-500" />
              {averageRating.toFixed(1)} Average
            </Badge>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                  <p className={`text-2xl font-bold ${getRatingColor(averageRating)}`}>
                    {averageRating.toFixed(1)}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {reviews.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <ThumbsUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Positive Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {reviews.filter(r => r.rating >= 4).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Review Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search reviews by comment or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-reviews"
                />
              </div>
              <Select value={ratingFilter} onValueChange={setRatingFilter} data-testid="select-rating-filter">
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="text-red-500 text-sm" data-testid="text-reviews-error">
                Error loading reviews: {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-0">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-no-reviews">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviews found</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReviews.map((review) => (
                  <div 
                    key={review.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`review-item-${review.id}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={review.rating >= 4 ? "default" : review.rating >= 3 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {review.rating}/5
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      
                      {review.comment && (
                        <blockquote className="text-gray-700 dark:text-gray-300 italic border-l-4 border-gray-200 dark:border-gray-700 pl-4">
                          "{review.comment}"
                        </blockquote>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="space-x-4">
                          <span>Booking: #{review.bookingId?.slice(0, 8) || 'N/A'}</span>
                          <span>Reviewer: {review.reviewerId?.slice(0, 8) || 'Anonymous'}</span>
                          <span>Reviewee: {review.revieweeId?.slice(0, 8) || 'N/A'}</span>
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