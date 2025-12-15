import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import { Navbar } from "@/components/Navbar";
import { Plus } from "lucide-react";

const RestaurantMenu = () => {
  const { id, restaurantId } = useParams();
  const actualId = id || restaurantId; // Support both route patterns
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [menuByCategory, setMenuByCategory] = useState({});

  useEffect(() => {
    if (actualId) {
      fetchData();
    }
  }, [actualId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Try to fetch restaurant
    try {
      console.log(`Fetching restaurant with ID: ${actualId}`);
      const res = await apiRequest(API_ENDPOINTS.RESTAURANTS.BY_ID(actualId));
      console.log('Restaurant response:', res);
      setRestaurant(res);
    } catch (err) {
      console.error("Failed to fetch restaurant:", err);
      // fallback mock
      setRestaurant({
        id: actualId,
        name: `Restaurant ${actualId}`,
        cuisine: "Various",
        description: "Delicious food",
      });
    }

    // Try to fetch menu items
    try {
      console.log(`Fetching menu items for restaurant: ${actualId}`);
      const menu = await apiRequest(API_ENDPOINTS.MENU_ITEMS.BY_RESTAURANT(actualId));
      console.log('Menu response:', menu);
      
      // If menu is already grouped by category, use it as is
      if (menu && typeof menu === 'object' && !Array.isArray(menu)) {
        // Validate that it's a proper map structure and not empty
        const validMenu = {};
        Object.keys(menu).forEach(key => {
          if (Array.isArray(menu[key]) && menu[key].length > 0) {
            validMenu[key] = menu[key];
          }
        });
        setMenuByCategory(validMenu);
        console.log('Menu set from grouped response:', validMenu);
      } else if (Array.isArray(menu)) {
        // If it's an array, group by category
        const grouped = {};
        menu.forEach(item => {
          const category = item.category || item.categoryName || 'Other';
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(item);
        });
        setMenuByCategory(grouped);
        console.log('Menu grouped from array response:', grouped);
      } else {
        console.log('Menu response is invalid, setting empty menu');
        setMenuByCategory({});
      }
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      console.error("Error details:", err.message);
      setMenuByCategory({}); // Show empty menu instead of fallback
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <p className="text-xl text-gray-600 animate-pulse">Loading menu...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Restaurant Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-orange-500 mb-3">
            {restaurant?.restaurantName || restaurant?.name || `Restaurant ${actualId}`}
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            {restaurant?.cuisine || restaurant?.location}
          </p>
          <p className="text-gray-500">
            {restaurant?.description || `Welcome to our restaurant`}
          </p>
        </div>

        {/* Menu Items */}
        {Object.keys(menuByCategory).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-lg text-gray-600">
              No menu items available for this restaurant.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div key={category} className="space-y-6">
                {/* Category Heading */}
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-bold text-gray-800">{category}</h2>
                  <div className="flex-grow h-1 bg-gradient-to-r from-orange-500 to-transparent rounded"></div>
                </div>

                {/* Menu Items Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, index) => (
                    <div
                      key={item.itemId || item.id || `${category}-${index}`}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:border-orange-200"
                    >
                      <div className="p-6">
                        {/* Item Name */}
                        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                          {item.itemName || item.name}
                        </h3>

                        {/* Item Description */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-10">
                          {item.description || item.itemDescription || "Delicious food item"}
                        </p>

                        {/* Price and Button Container */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          {/* Price */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-orange-600">
                              ₹{item.price?.toFixed?.(2) ?? item.price ?? 0}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{item.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() => {
                              // TODO: Add to cart functionality
                              navigate("/customer/cart");
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
                            title="Add to cart"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantMenu;
