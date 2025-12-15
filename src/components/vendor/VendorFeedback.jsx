import { useEffect, useState } from "react";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
 
const VendorFeedback = () => {
  const [restaurantRatings, setRestaurantRatings] = useState([]);
  const [itemRatings, setItemRatings] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const restaurantId = localStorage.getItem("restaurantId");
 
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!restaurantId) {
        console.error("❌ No restaurantId found in localStorage");
        setLoading(false);
        return;
      }
 
      try {
        const data = await apiRequest(
          API_ENDPOINTS.FEEDBACK.BY_RESTAURANT(restaurantId)
        );
 
        // Group the feedback
        const overall = data.filter((f) => f.itemId === null);
        const items = data.filter((f) => f.itemId !== null);
 
        setRestaurantRatings(overall);
        setItemRatings(items);
      } catch (error) {
        console.error("⚠️ Failed to load vendor feedback:", error);
      } finally {
        setLoading(false);
      }
    };
 
    fetchFeedback();
  }, [restaurantId]);
 
  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading feedback...</p>
      </div>
    );
  }
 
  // Calculate average restaurant rating
  const averageRating =
    restaurantRatings.length > 0
      ? (
          restaurantRatings.reduce((sum, item) => sum + item.rating, 0) /
          restaurantRatings.length
        ).toFixed(1)
      : "No ratings yet";
 
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Customer Feedback</h1>
 
      {/* ⭐ Restaurant Average Rating */}
      <div className="mb-6 p-4 rounded bg-yellow-50 border border-yellow-300 shadow-sm">
        <h2 className="text-lg font-bold mb-2">⭐ Overall Restaurant Rating</h2>
        <p className="text-2xl font-bold text-yellow-600">{averageRating}</p>
      </div>
 
      {/* 📌 Item Ratings */}
      <div className="p-4 rounded bg-white border shadow-sm">
        <h2 className="text-lg font-bold mb-3">📌 Item Ratings</h2>
 
        {itemRatings.length === 0 ? (
          <p className="text-gray-500 text-sm">No item feedback yet.</p>
        ) : (
          <ul className="space-y-3">
            {itemRatings.map((item) => (
              <li
                key={item.id}
                className="border p-3 rounded bg-gray-50 shadow-sm"
              >
                <p className="font-semibold">{item.itemName}</p>
                <p>
                  ⭐ <strong>{item.rating}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  {item.comment || "No comment"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
 
export default VendorFeedback;