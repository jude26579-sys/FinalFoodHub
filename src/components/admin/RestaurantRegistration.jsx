import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export const RestaurantRegistration = () => {
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetchingVendors, setIsFetchingVendors] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: "",
    location: "",
    cuisine: "",
    openTime: "",
    closeTime: "",
    status: "OPEN",
    vendorId: "",
  });

  // Fetch vendors from database
  const fetchVendors = async () => {
    setIsFetchingVendors(true);
    try {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      if (!token) {
        toast({
          title: "⚠️ Authentication Required",
          description: "Please login again to register restaurants.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.get(
        "http://localhost:8080/vendor/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      let vendorList = Array.isArray(response.data) ? response.data : [];
      setVendors(vendorList);
      console.log(`✅ Successfully fetched ${vendorList.length} vendors`);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      toast({
        title: "❌ Error Loading Vendors",
        description: "Could not fetch vendors from database.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingVendors(false);
    }
  };

  // Fetch restaurants from database
  const fetchRestaurants = async () => {
    try {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      if (!token) {
        setRestaurants([]);
        return;
      }

      const response = await axios.get(
        "http://localhost:8182/api/restaurants",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      let restaurantList = Array.isArray(response.data) ? response.data : [];
      setRestaurants(restaurantList);
      console.log(`✅ Successfully fetched ${restaurantList.length} restaurants`);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
      // Don't show error toast, just keep empty list
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchRestaurants();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (
        !formData.restaurantName ||
        !formData.location ||
        !formData.cuisine ||
        !formData.vendorId
      ) {
        throw new Error("All fields are required");
      }

      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Prepare request body - match your entity structure
      const requestData = {
        restaurantName: formData.restaurantName,
        location: formData.location,
        cuisine: formData.cuisine,
        openTime: formData.openTime || null,
        closeTime: formData.closeTime || null,
        status: formData.status,
        vendorId: formData.vendorId,
      };

      const response = await axios.post(
        "http://localhost:8182/api/restaurants",
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast({
          title: "✅ Restaurant Registered Successfully",
          description: `${formData.restaurantName} has been registered and assigned to vendor`,
        });

        setFormData({
          restaurantName: "",
          location: "",
          cuisine: "",
          openTime: "",
          closeTime: "",
          status: "OPEN",
          vendorId: "",
        });
        setShowForm(false);

        // Refresh restaurant list
        setTimeout(() => {
          fetchRestaurants();
        }, 500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "❌ Registration Failed",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to register restaurant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (restaurantId) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) {
      return;
    }

    try {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      const response = await axios.delete(
        `http://localhost:8182/api/restaurants/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast({
          title: "✅ Restaurant Deleted",
          description: "The restaurant has been successfully deleted.",
        });
        fetchRestaurants();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "❌ Delete Failed",
        description: error.response?.data?.message || "Failed to delete restaurant",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Restaurant Management</h2>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setFormData({
              restaurantName: "",
              location: "",
              cuisine: "",
              openTime: "",
              closeTime: "",
              status: "OPEN",
              vendorId: "",
            });
          }}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {showForm ? "Cancel" : "➕ Register New Restaurant"}
        </Button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle>Register New Restaurant</CardTitle>
            <CardDescription>
              Create a new restaurant and assign it to a vendor
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">Restaurant Name *</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    placeholder="e.g., The Italian Bistro"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuisine">Cuisine Type *</Label>
                  <Input
                    id="cuisine"
                    name="cuisine"
                    placeholder="e.g., Italian, Chinese, Indian"
                    value={formData.cuisine}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Address / Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., 123 Main St, City"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendorId">Assign to Vendor *</Label>
                  <select
                    id="vendorId"
                    name="vendorId"
                    value={formData.vendorId}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                    required
                    disabled={isFetchingVendors}
                  >
                    <option value="">
                      {isFetchingVendors ? "Loading vendors..." : "Select vendor"}
                    </option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openTime">Opening Time (Optional)</Label>
                  <Input
                    id="openTime"
                    name="openTime"
                    type="time"
                    value={formData.openTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closeTime">Closing Time (Optional)</Label>
                  <Input
                    id="closeTime"
                    name="closeTime"
                    type="time"
                    value={formData.closeTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                    required
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Registering..." : "Register Restaurant"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Restaurants List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Registered Restaurants</h3>
          <Button
            onClick={fetchRestaurants}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            🔄 Refresh
          </Button>
        </div>

        {restaurants.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No restaurants registered yet. Click "Register New Restaurant" to add one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => {
              const assignedVendor = vendors.find(
                (v) => v.id === restaurant.vendorId
              );
              return (
                <div 
                  key={restaurant.restaurantId}
                  className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-5 border-b-4 border-orange-700">
                    <h3 className="text-2xl font-bold text-white">{restaurant.restaurantName}</h3>
                    <p className="text-orange-100 text-sm font-semibold mt-1">🍽️ {restaurant.cuisine}</p>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 bg-white space-y-4">
                    {/* Location Box */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-600">
                      <p className="text-xs uppercase font-bold text-orange-700 tracking-widest">📍 Location</p>
                      <p className="text-gray-800 font-bold text-lg mt-1">{restaurant.location}</p>
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
                    </div>

                    {/* Vendor Box */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-600">
                      <p className="text-xs uppercase font-bold text-blue-700 tracking-widest">👤 Assigned Vendor</p>
                      <p className="text-gray-800 font-bold mt-1">
                        {assignedVendor ? (
                          <>
                            {assignedVendor.name}
                            <br />
                            <span className="text-xs text-gray-600 font-normal">{assignedVendor.email}</span>
                          </>
                        ) : (
                          "Not assigned"
                        )}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t-2 border-orange-200">
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 rounded-lg transition-all duration-200"
                        onClick={() => handleDelete(restaurant.restaurantId)}
                      >
                        🗑️ Delete Restaurant
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
