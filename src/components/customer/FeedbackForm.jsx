import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
 
const FeedbackForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
 
  // ⬅️ Data passed from goToFeedback()
  const { orderId, restaurantId, customerId, items = [] } = location.state || {};
 
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [itemRatings, setItemRatings] = useState({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
 
  // ⭐ Setting rating for an item
  const handleItemRating = (itemId, rating) => {
    setItemRatings((prev) => ({
      ...prev,
      [itemId]: rating,
    }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    if (!restaurantRating) {
      toast({
        title: "Error",
        description: "Please provide a restaurant rating.",
        variant: "destructive",
      });
      return;
    }
 
    setLoading(true);
 
    try {
      // ⭐ 1) Submit restaurant-level rating
      await apiRequest(API_ENDPOINTS.FEEDBACK.SUBMIT, {
        method: "POST",
        body: JSON.stringify({
          orderId,
          userId: customerId,
          restaurantId,
          itemId: null,
          itemName: null,
          rating: restaurantRating,
          comment,
        }),
      });
 
      // ⭐ 2) Submit item-level rating (only those with rating > 0)
      for (let item of items) {
        const rating = itemRatings[item.itemId];
 
        if (rating && rating > 0) {
          await apiRequest(API_ENDPOINTS.FEEDBACK.SUBMIT, {
            method: "POST",
            body: JSON.stringify({
              orderId,
              userId: customerId,
              restaurantId,
              itemId: item.itemId,
              itemName: item.itemName,
              rating,
              comment,
            }),
          });
        }
      }
 
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
 
      navigate("/customer"); // redirect to customer dashboard
 
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: err.message || "Could not submit feedback.",
        variant: "destructive",
      });
    }
 
    setLoading(false);
  };
 
  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>Leave Feedback</CardTitle>
        <CardDescription>Rate the restaurant and the items you ordered</CardDescription>
      </CardHeader>
 
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
 
          {/* ⭐ Restaurant Rating */}
          <div>
            <Label>Restaurant Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  onClick={() => setRestaurantRating(star)}
                  className={`h-8 w-8 cursor-pointer transition fill-current ${
                    star <= restaurantRating  ? "text-orange-500"
                          : "text-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
 
          {/* ⭐ Item Ratings */}
          <div>
            <Label>Rate Items</Label>
 
            {items.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">No items found for this order.</p>
            )}
 
            {items.map((item) => (
              <div key={item.itemId} className="mt-4">
                <p className="font-semibold">{item.itemName}</p>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => handleItemRating(item.itemId, star)}
                      className={`h-6 w-6 cursor-pointer transition fill-current ${
                        star <= (itemRatings[item.itemId] || 0)
                          ? "text-orange-500"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
 
          {/* 💬 Comment */}
          <div>
            <br/><Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
            />
          </div>
 
          <br/><Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
 
export default FeedbackForm;
 
 