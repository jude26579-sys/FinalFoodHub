import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantsManagement } from "@/components/vendor/RestaurantsManagement";
import { MenuManagement } from "@/components/vendor/MenuManagement";
import { InventoryManagement } from "@/components/vendor/InventoryManagement";
import { VendorOrders } from "@/components/vendor/VendorOrders";
import  VendorFeedback  from "@/components/vendor/VendorFeedback";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// VendorDashboard now fetches restaurants from the backend database
// and filters them based on the logged-in vendor's ID

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
  const { toast } = useToast();

  const { user } = useAuth();

  // restaurants assigned to the logged-in vendor (fetched from backend)
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  // menuItemsByRestaurant: { [restaurantId]: [items] }
  // persisted per-vendor in localStorage key `vendor_menu_items_v1_<vendorId>`
  const [menuItemsByRestaurant, setMenuItemsByRestaurant] = useState({});

  // Fetch restaurants assigned to the current vendor from the backend
  const fetchVendorRestaurants = async () => {
    if (!user) {
      console.warn("❌ User not authenticated");
      return;
    }

    console.log("👤 Current user:", user);
    console.log("🔑 Fetching restaurants for vendor...");

    setLoadingRestaurants(true);
    try {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      if (!token) {
        console.warn("❌ No authentication token found");
        setRestaurants([]);
        setLoadingRestaurants(false);
        return;
      }

      console.log("🔐 Token found, length:", token.length);
      console.log("🔐 Token prefix (first 50 chars):", token.substring(0, 50) + "...");

      // Fetch restaurants assigned to the current vendor using the /my endpoint
      // This endpoint extracts vendor ID from JWT token automatically
      const response = await axios.get(
        "http://localhost:8182/api/restaurants/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
      
      console.log("✅ Response status:", response.status);
      console.log("✅ Response data:", response.data);

      let vendorRestaurants = Array.isArray(response.data) ? response.data : [];
      
      console.log("🏪 Restaurants assigned to vendor:", vendorRestaurants);
      console.log("📊 Restaurant count:", vendorRestaurants.length);
      
      if (vendorRestaurants.length > 0) {
        console.log("📍 First restaurant structure:", vendorRestaurants[0]);
      }

      setRestaurants(vendorRestaurants);
      console.log(
        `✅ Fetched ${vendorRestaurants.length} restaurants for vendor`
      );

      // Load menu items for this vendor from localStorage
      const menuKey = `vendor_menu_items_v1_${user.id}`;
      const saved = JSON.parse(localStorage.getItem(menuKey) || "{}");
      setMenuItemsByRestaurant(saved || {});
    } catch (error) {
      console.error("❌ Failed to fetch vendor restaurants:", error);
      if (error.response?.status === 404) {
        console.log("No restaurants found for this vendor");
        setRestaurants([]);
      } else if (error.response?.status === 401) {
        console.error("Unauthorized - token may be invalid");
        toast({
          title: "⚠️ Authentication Error",
          description: "Your session may have expired. Please login again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "⚠️ Error Loading Restaurants",
          description: "Could not fetch your assigned restaurants. Please try again.",
          variant: "destructive",
        });
      }
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  // Load assigned restaurants on component mount and when user changes
  useEffect(() => {
    if (!user || !user.id) return;
    fetchVendorRestaurants();
  }, [user]);

  // persist vendor menu items when they change
  useEffect(() => {
    if (!user || !user.id) return;
    try {
      const menuKey = `vendor_menu_items_v1_${user.id}`;
      localStorage.setItem(menuKey, JSON.stringify(menuItemsByRestaurant));
    } catch (err) {
      console.warn("Failed to persist vendor menu items to localStorage", err);
    }
  }, [menuItemsByRestaurant, user]);

  const addRestaurant = (restaurant) => {
    setRestaurants((prev) => [...prev, restaurant]);
  };

  const deleteRestaurant = (id) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    setMenuItemsByRestaurant((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const addMenuItem = (restaurantId, item) => {
    setMenuItemsByRestaurant((prev) => {
      const list = prev[restaurantId] ? [...prev[restaurantId]] : [];
      list.push(item);
      return { ...prev, [restaurantId]: list };
    });
  };

  const deleteMenuItem = (restaurantId, itemId) => {
    setMenuItemsByRestaurant((prev) => ({
      ...prev,
      [restaurantId]: (prev[restaurantId] || []).filter((i) => i.id !== itemId),
    }));
  };

  const handleRestaurantStatusChange = (restaurantId, newStatus) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        (r.restaurantId || r.id) === restaurantId
          ? { ...r, status: newStatus }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Vendor Dashboard</h1>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Use flex for tab list so triggers don't wrap below content when panels render */}
          <TabsList className="flex gap-2 flex-wrap w-full lg:w-[600px]">
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="space-y-4">
            {loadingRestaurants ? (
              <div className="p-6 rounded-md border border-dashed bg-muted">
                <p className="text-center text-muted-foreground">
                  Loading your restaurants...
                </p>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="space-y-4">
                <div className="p-6 rounded-md border border-dashed bg-muted">
                  <h3 className="text-xl font-semibold">
                    No Restaurants Assigned
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You don't have any restaurants assigned to your account yet.
                    An admin must register restaurants and assign them to your
                    vendor account before you can manage menus.
                  </p>
                  <p className="text-sm mt-3">
                    Please contact your admin or check the Admin Dashboard for
                    restaurant assignments.
                  </p>
                </div>
                <RestaurantsManagement
                  restaurants={restaurants}
                  onAdd={addRestaurant}
                  onDelete={deleteRestaurant}
                  onStatusChange={handleRestaurantStatusChange}
                />
              </div>
            ) : (
              <RestaurantsManagement
                restaurants={restaurants}
                onAdd={addRestaurant}
                onDelete={deleteRestaurant}
                onStatusChange={handleRestaurantStatusChange}
              />
            )}
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <MenuManagement
              restaurants={restaurants}
              menuItemsByRestaurant={menuItemsByRestaurant}
              onAddMenuItem={addMenuItem}
              onDeleteMenuItem={deleteMenuItem}
            />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryManagement restaurants={restaurants} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <VendorOrders />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <VendorFeedback />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;
