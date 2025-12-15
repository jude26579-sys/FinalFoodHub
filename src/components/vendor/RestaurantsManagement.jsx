import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const RestaurantsManagement = ({
  restaurants = [],
  onAdd = () => {},
  onDelete = () => {},
  onStatusChange = () => {},
}) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    address: "",
  });

  // Function to toggle restaurant status between OPEN and CLOSED
  const toggleRestaurantStatus = async (restaurantId, currentStatus) => {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    
    try {
      setLoadingStatus((prev) => ({ ...prev, [restaurantId]: true }));

      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      if (!token) {
        toast({
          title: "⚠️ Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        return;
      }

      // Call the backend API to update restaurant status
      const response = await axios.put(
        `http://localhost:8182/api/restaurants/${restaurantId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "✅ Success",
          description: `Restaurant status changed to ${newStatus}`,
        });
        
        // Update the restaurant status in the parent component
        if (onStatusChange) {
          onStatusChange(restaurantId, newStatus);
        }
      }
    } catch (error) {
      console.error("❌ Failed to update restaurant status:", error);
      toast({
        title: "⚠️ Error",
        description: `Failed to update restaurant status: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoadingStatus((prev) => ({ ...prev, [restaurantId]: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRestaurant = { ...formData, id: Date.now() };
    onAdd(newRestaurant);
    toast({ title: "Restaurant added successfully!" });
    setFormData({ name: "", cuisine: "", address: "" });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onDelete(id);
    toast({ title: "Restaurant deleted" });
  };

  const { user } = useAuth();
  const canAdd = user && user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Restaurants</h2>
        {canAdd && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Restaurant
          </Button>
        )}
        {!canAdd && (
          <div className="text-sm text-muted-foreground">
            Restaurant creation is managed by Admin.
          </div>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Restaurant</CardTitle>
            <CardDescription>Fill in the restaurant details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine Type</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine}
                  onChange={(e) =>
                    setFormData({ ...formData, cuisine: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Restaurant</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => (
          <div 
            key={restaurant.restaurantId || restaurant.id}
            className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-5 border-b-4 border-orange-700">
              <h3 className="text-2xl font-bold text-white">{restaurant.restaurantName || restaurant.name}</h3>
              <p className="text-orange-100 text-sm font-semibold mt-1">🍽️ {restaurant.cuisine}</p>
            </div>

            {/* Content Section */}
            <div className="p-6 bg-white space-y-4">
              {/* Location Box */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-600">
                <p className="text-xs uppercase font-bold text-orange-700 tracking-widest">📍 Location</p>
                <p className="text-gray-800 font-bold text-lg mt-1">{restaurant.location || restaurant.address}</p>
              </div>

              {/* Time Section */}
              {(restaurant.openTime || restaurant.closeTime) && (
                <div className="grid grid-cols-2 gap-3">
                  {restaurant.openTime && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border-l-4 border-green-600">
                      <p className="text-xs uppercase font-bold text-green-700 tracking-widest">🕐 Opens</p>
                      <p className="text-gray-800 font-bold mt-1">{restaurant.openTime}</p>
                    </div>
                  )}
                  {restaurant.closeTime && (
                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3 border-l-4 border-red-600">
                      <p className="text-xs uppercase font-bold text-red-700 tracking-widest">🕐 Closes</p>
                      <p className="text-gray-800 font-bold mt-1">{restaurant.closeTime}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Box */}
              {restaurant.status && (
                <div className={`rounded-lg p-4 border-l-4 ${
                  restaurant.status === "OPEN" 
                    ? "bg-gradient-to-r from-green-50 to-green-100 border-green-600" 
                    : "bg-gradient-to-r from-red-50 to-red-100 border-red-600"
                }`}>
                  <p className={`text-xs uppercase font-bold tracking-widest ${
                    restaurant.status === "OPEN" ? "text-green-700" : "text-red-700"
                  }`}>📌 Status</p>
                  <p className="text-gray-800 font-bold text-lg mt-1">
                    {restaurant.status === "OPEN" ? "🟢 OPEN" : "🔴 CLOSED"}
                  </p>
                  
                  {/* Status Toggle Button */}
                  <Button
                    onClick={() => toggleRestaurantStatus(restaurant.restaurantId || restaurant.id, restaurant.status)}
                    disabled={loadingStatus[restaurant.restaurantId || restaurant.id]}
                    className={`mt-3 w-full font-semibold ${
                      restaurant.status === "OPEN"
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {loadingStatus[restaurant.restaurantId || restaurant.id] ? (
                      <span>Updating...</span>
                    ) : (
                      <span>
                        {restaurant.status === "OPEN" ? "Close Restaurant" : "Open Restaurant"}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
