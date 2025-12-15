 
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
 
export const RestaurantsList = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  // Array of UNIQUE restaurant images
  const restaurantImages = [
    "/image_2.webp", // LOCAL IMAGE - Biryani House
    "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=300&fit=crop", // Pizza/Italian
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=300&fit=crop", // Burger/Fast Food
    "https://images.unsplash.com/photo-1585238341710-4dd0287fbc89?w=500&h=300&fit=crop", // Asian
    "https://images.unsplash.com/photo-1555939594-58d7cb561404?w=500&h=300&fit=crop", // Indian
  ];
 
  useEffect(() => {
    fetchRestaurants();
  }, []);
 
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching restaurants from database...");
     
      // Get access token from localStorage
      const accessToken = localStorage.getItem("accessToken");
     
      const response = await axios.get("http://localhost:8182/api/restaurants", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
 
      console.log("✅ Restaurants API Response:", response.data);
     
      const restaurantsData = Array.isArray(response.data)
        ? response.data
        : response.data.data || response.data.restaurants || [];
     
      const mappedRestaurants = restaurantsData.map((restaurant, index) => {
        // Use local image for Biryani House restaurant
        let img = restaurantImages[index % restaurantImages.length];
       
        // Check by name or by ID (5 is often Biryani House)
        if ((restaurant.restaurantName &&
             (restaurant.restaurantName.toLowerCase().includes("biryani") ||
              restaurant.restaurantName.toLowerCase().includes("house"))) ||
            restaurant.restaurantId === 5) {
          img = "/image_2.webp";
          console.log("🍛 Assigned Biryani image to:", restaurant.restaurantName);
        }
       
        console.log(`Restaurant ${index}: ${restaurant.restaurantName} → Image: ${img}`);
       
        return {
          id: restaurant.restaurantId,
          name: restaurant.restaurantName,
          location: restaurant.location,
          openTime: restaurant.openTime,
          closeTime: restaurant.closeTime,
          status: restaurant.status,
          vendorId: restaurant.vendorId,
          rating: 4.0 + Math.random() * 0.7,
          img: img,
        };
      });
     
      console.log("✅ Mapped restaurants:", mappedRestaurants);
      setRestaurants(mappedRestaurants);
    } catch (error) {
      console.error("❌ Failed to fetch restaurants:", error);
      setError(error.message || "Failed to load restaurants from database");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };
 
  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading restaurants...</p>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-gray-50 rounded-2xl p-12 shadow-lg max-w-md">
          <p className="text-red-600 font-semibold mb-6 text-lg">❌ {error}</p>
          <button
            onClick={fetchRestaurants}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          {/* SEARCH BAR */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="   Search for restaurant and food"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-4 py-3 bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-600 text-sm font-medium placeholder-gray-500"
            />
          </div>
        </div>
      </div>
 
      {/* MAIN CONTENT */}
      <div className="px-6 py-8 max-w-5xl mx-auto">
        {filteredRestaurants.length > 0 ? (
          <div>
            {/* SECTION TITLE */}
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              All restaurants
            </h2>
 
            {/* RESTAURANTS LIST - HORIZONTAL CARDS */}
            <div className="space-y-4">
              {filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => navigate(`/customer/restaurant/${restaurant.id}`)}
                  className="cursor-pointer group"
                >
                  {/* RESTAURANT CARD - HORIZONTAL */}
                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-row h-32">
                   
                    {/* LEFT SECTION - DETAILS */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                     
                      {/* RESTAURANT NAME */}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">
                          {restaurant.name}
                        </h3>
 
                        {/* LOCATION */}
                        <p className="text-gray-600 text-sm line-clamp-1 mb-2">
                          📍 {restaurant.location}
                        </p>
                      </div>
 
                      {/* STATUS & RATING */}
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          restaurant.status === "OPEN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {restaurant.status === "OPEN" ? "🟢 Open" : "🔴 Closed"}
                        </span>
                       
                        {/* RATING */}
                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                          <span className="text-green-600 font-black">★</span>
                          <span className="font-bold text-gray-900 text-sm">{restaurant.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
 
                    {/* RIGHT SECTION - IMAGE */}
                    <div className="relative w-40 h-32 bg-gray-300 overflow-hidden flex-shrink-0">
                     
                      {/* IMAGE */}
                      <img
                        src={restaurant.img}
                        alt={restaurant.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=300&fit=crop";
                        }}
                      />
 
                      {/* GRADIENT OVERLAY */}
                      <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl shadow-md">
            <p className="text-2xl text-gray-600 font-black mb-4">🔍 No restaurants found</p>
            <p className="text-gray-500 mb-8">
              {restaurants.length === 0
                ? "No restaurants available at the moment."
                : "Try a different search term to find what you're looking for."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
 
 
 
 
 
 
 