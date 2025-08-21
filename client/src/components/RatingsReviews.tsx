import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { orderBy, limit } from "firebase/firestore";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import type { Review } from "@shared/schema";

export const RatingsReviews = () => {
  const { data: reviews, loading, error } = useFirestoreCollection<Review>(
    "reviews",
    [orderBy("createdAt", "desc"), limit(10)]
  );

  const getStarRating = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? "text-yellow-400 fill-yellow-400" 
            : "text-gray-300 dark:text-gray-600"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "bg-green-500";
    if (rating >= 3.5) return "bg-yellow-500";
    if (rating >= 2.5) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <Card className="border-gray-100 dark:border-gray-800">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <LoadingSpinner className="h-32" />
        </CardContent>
      </Card>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <Card className="border-gray-100 dark:border-gray-800" data-testid="card-ratings-reviews">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Customer Reviews
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center">
              <ThumbsUp className="h-3 w-3 mr-1" />
              {reviews.length} Reviews
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="text-red-500 text-sm mb-4" data-testid="text-reviews-error">
            Error loading reviews: {error}
          </div>
        )}

        {/* Overall Rating Summary */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex">
                  {getStarRating(Math.round(averageRating))}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {reviews.length} reviews
              </p>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getRatingColor(averageRating)}`}>
              <Star className="h-8 w-8 text-white fill-white" />
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingCounts[rating] || 0;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2 text-sm">
                  <span className="w-8 text-gray-600 dark:text-gray-400">{rating}★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-600 dark:text-gray-400 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Recent Reviews:</h4>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-no-reviews">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm mt-2">Reviews will appear here after customers rate their experience</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {reviews.map((review) => (
                <div 
                  key={review.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  data-testid={`review-item-${review.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {getStarRating(review.rating)}
                      </div>
                      <Badge 
                        variant={review.rating >= 4 ? "default" : review.rating >= 3 ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {review.rating}/5
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                      "{review.comment}"
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Booking #{review.bookingId?.slice(0, 8) || 'N/A'}</span>
                    <span>Reviewer: {review.reviewerId?.slice(0, 8) || 'Anonymous'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};