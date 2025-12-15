import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, ChevronLeft, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const InventoryManagement = ({ restaurants = [] }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // State for restaurant selection
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  // State for menu items with inventory
  const [menuItemsWithInventory, setMenuItemsWithInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for editing inventory
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Get auth token
  const getAuthToken = () => {
    let token = localStorage.getItem("accessToken");
    if (!token) {
      token = localStorage.getItem("authToken");
    }
    if (!token) {
      token = localStorage.getItem("sessionId");
    }
    return token;
  };

  // Fetch menu items for selected restaurant
  const fetchMenuItemsWithInventory = async (restaurantId) => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        toast({
          title: "⚠️ Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        return;
      }

      console.log(
        "🔄 Fetching menu items for restaurant:",
        restaurantId
      );

      // Fetch menu items from menu service
      const menuResponse = await axios.get(
        `http://localhost:9002/api/menu/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Menu items response:", menuResponse.data);
      
      // Handle both array and Map formats
      let menuItems = [];
      if (Array.isArray(menuResponse.data)) {
        menuItems = menuResponse.data;
      } else if (typeof menuResponse.data === 'object' && menuResponse.data !== null) {
        // Response is a Map<categoryName, List<MenuItemDto>>
        // Flatten it to an array of all menu items
        menuItems = Object.values(menuResponse.data).flat();
      }

      console.log("📋 Menu items fetched:", menuItems.length, "items");

      // Fetch inventory items from inventory service - filtered by restaurant
      const inventoryResponse = await axios.get(
        `http://localhost:9006/api/inventory/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("✅ Inventory response:", inventoryResponse.data);
      let inventoryItems = Array.isArray(inventoryResponse.data)
        ? inventoryResponse.data
        : [];

      // Merge menu items with inventory data
      const merged = menuItems.map((menuItem) => {
        const inventory = inventoryItems.find(
          (inv) => Number(inv.itemId) === Number(menuItem.itemId)
        );
        return {
          ...menuItem,
          quantityAvailable: inventory?.quantityAvailable || 0,
          reorderThreshold: inventory?.reorderThreshold || 5,
          inventoryId: inventory?.inventoryId,
          categoryId: inventory?.categoryId || menuItem.categoryId,
        };
      });

      setMenuItemsWithInventory(merged);
      console.log("📦 Merged items:", merged.length, "items with inventory");
    } catch (error) {
      console.error("❌ Failed to fetch menu items with inventory:", error);
      toast({
        title: "⚠️ Error Loading Items",
        description: "Could not fetch menu items and inventory. Please try again.",
        variant: "destructive",
      });
      setMenuItemsWithInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh menu items and inventory
  const handleRefresh = async () => {
    if (!selectedRestaurant) return;
    setRefreshing(true);
    await fetchMenuItemsWithInventory(
      selectedRestaurant.restaurantId || selectedRestaurant.id
    );
    setRefreshing(false);
  };

  // Handle restaurant selection
  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setEditingItemId(null);
    setEditValues({});
    fetchMenuItemsWithInventory(restaurant.restaurantId || restaurant.id);
  };

  // Handle edit mode for quantity
  const handleEditQuantity = (item) => {
    setEditingItemId(item.itemId);
    setEditValues({
      quantityAvailable: item.quantityAvailable,
      reorderThreshold: item.reorderThreshold,
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditValues({});
  };

  // Update inventory quantity
  const handleUpdateQuantity = async (item) => {
    try {
      const token = getAuthToken();

      if (!token) {
        toast({
          title: "⚠️ Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        return;
      }

      // Validate inputs
      if (
        editValues.quantityAvailable === "" ||
        editValues.reorderThreshold === ""
      ) {
        toast({
          title: "⚠️ Validation Error",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }

      const quantityAvailable = parseInt(editValues.quantityAvailable);
      const reorderThreshold = parseInt(editValues.reorderThreshold);

      console.log("🔄 Updating inventory for item:", item.itemId);

      const restaurantId = selectedRestaurant.restaurantId || selectedRestaurant.id;
      
      // Build payload - only include inventoryId if it exists
      const payload = {
        itemName: item.itemName,
        quantityAvailable: quantityAvailable,
        reorderThreshold: reorderThreshold,
        itemId: Number(item.itemId),
        restaurantId: Number(restaurantId),
        categoryId: Number(item.categoryId),
      };
      
      // Only include inventoryId if it exists (for PUT requests)
      if (item.inventoryId) {
        payload.inventoryId = item.inventoryId;
      }

      // If inventory doesn't exist yet, create it
      if (!item.inventoryId) {
        // Try to create new inventory entry
        // If it fails with duplicate key error, it means inventory already exists
        // In that case, fetch the inventory ID and update instead
        try {
          const createResponse = await axios.post(
            "http://localhost:9006/api/inventory",
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              timeout: 10000,
            }
          );

          console.log("✅ Inventory created:", createResponse.data);

          // Update local state with new inventory
          setMenuItemsWithInventory((prev) =>
            prev.map((i) =>
              i.itemId === item.itemId
                ? {
                    ...i,
                    quantityAvailable: quantityAvailable,
                    reorderThreshold: reorderThreshold,
                    inventoryId: createResponse.data.inventoryId,
                  }
                : i
            )
          );
        } catch (createError) {
          // If POST fails with duplicate key error (500 with constraint violation),
          // try to fetch existing inventory and update it instead
          if (createError.response?.status === 500 && 
              createError.response?.data?.message?.includes("Duplicate")) {
            console.log("⚠️ Inventory already exists, attempting to update instead...");
            console.log("📊 Duplicate error details:", createError.response?.data);
            
            // Try to find existing inventory by itemId and restaurantId
            try {
              // First, refresh inventory to get the ID
              const inventoryResponse = await axios.get(
                "http://localhost:9006/api/inventory",
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  timeout: 10000,
                }
              );

              console.log("📦 Fetched inventory items:", inventoryResponse.data);
              const inventoryList = (inventoryResponse.data || []);
              console.log("🔍 Looking for itemId:", item.itemId, "restaurantId:", restaurantId);
              console.log("📋 Available inventory records:", inventoryList.length);
              
              // First try exact match
              let existingInventory = inventoryList.find(
                (inv) =>
                  Number(inv.itemId) === Number(item.itemId) &&
                  Number(inv.restaurantId) === Number(restaurantId)
              );
              
              // If not found, try matching by itemId only (backend might filter restaurant already)
              if (!existingInventory) {
                console.log("⚠️ Exact match not found, trying itemId only...");
                existingInventory = inventoryList.find(
                  (inv) => Number(inv.itemId) === Number(item.itemId)
                );
              }

              if (existingInventory) {
                console.log("✅ Found existing inventory:", existingInventory);
                
                // Update the existing inventory
                // Build update payload with inventoryId from existing record
                const updatePayload = {
                  ...payload,
                  inventoryId: existingInventory.inventoryId,
                };
                
                console.log("🔄 Sending PUT with payload:", updatePayload);
                
                const updateResponse = await axios.put(
                  `http://localhost:9006/api/inventory/${existingInventory.inventoryId}`,
                  updatePayload,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                    timeout: 10000,
                  }
                );

                console.log("✅ Inventory updated:", updateResponse.data);

                setMenuItemsWithInventory((prev) =>
                  prev.map((i) =>
                    i.itemId === item.itemId
                      ? {
                          ...i,
                          quantityAvailable: quantityAvailable,
                          reorderThreshold: reorderThreshold,
                          inventoryId: existingInventory.inventoryId,
                        }
                      : i
                  )
                );
              } else {
                console.error("❌ No existing inventory found!");
                console.error("Available records:", inventoryList.map(inv => 
                  `itemId=${inv.itemId}, restaurantId=${inv.restaurantId}, inventoryId=${inv.inventoryId}`
                ));
                const error = new Error(
                  `Could not find inventory for itemId=${item.itemId}, restaurantId=${restaurantId}. ` +
                  `Searched ${inventoryList.length} records. ` +
                  `Verify backend service is rebuilt with 'mvn clean install'.`
                );
                throw error;
              }
            } catch (fetchError) {
              console.error("❌ Failed to update existing inventory:", fetchError);
              console.error("🔍 Debug info:", {
                itemId: item.itemId,
                restaurantId: restaurantId,
                errorMessage: fetchError?.message,
                fetchErrorResponse: fetchError?.response?.data
              });
              throw createError; // Throw original duplicate error
            }
          } else {
            throw createError;
          }
        }
      } else {
        // Update existing inventory entry
        // Ensure inventoryId is in the payload for PUT
        const updatePayload = {
          ...payload,
          inventoryId: item.inventoryId,
        };
        
        const updateResponse = await axios.put(
          `http://localhost:9006/api/inventory/${item.inventoryId}`,
          updatePayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        console.log("✅ Inventory updated:", updateResponse.data);

        // Update local state
        setMenuItemsWithInventory((prev) =>
          prev.map((i) =>
            i.itemId === item.itemId
              ? {
                  ...i,
                  quantityAvailable: quantityAvailable,
                  reorderThreshold: reorderThreshold,
                }
              : i
          )
        );
      }

      setEditingItemId(null);
      setEditValues({});

      toast({
        title: "✅ Success",
        description: "Inventory updated successfully",
      });
    } catch (error) {
      console.error("❌ Failed to update inventory:", error);
      toast({
        title: "⚠️ Error Updating Inventory",
        description:
          error.response?.data?.message ||
          "Could not update inventory. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select Restaurant */}
      {restaurants.length === 0 ? (
        <div className="p-6 rounded-md border border-dashed bg-muted">
          <p className="text-center text-muted-foreground">
            No restaurants available. Please add restaurants first.
          </p>
        </div>
      ) : !selectedRestaurant ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Restaurant</CardTitle>
            <CardDescription>
              Choose a restaurant to manage inventory for its menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Button
                  key={restaurant.restaurantId || restaurant.id}
                  onClick={() => handleSelectRestaurant(restaurant)}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left hover:bg-primary/10"
                >
                  <h3 className="font-semibold">
                    {restaurant.restaurantName || restaurant.name}
                  </h3>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Step 2: Display menu items with inventory
        <>
          {/* Header with back and refresh */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedRestaurant(null);
                  setMenuItemsWithInventory([]);
                  setEditingItemId(null);
                }}
              >
                ← Back to Restaurants
              </Button>
              <h2 className="mt-2 text-2xl font-bold">
                {selectedRestaurant.restaurantName || selectedRestaurant.name} - Inventory
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage stock levels for menu items
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="p-6 rounded-md border border-dashed bg-muted">
              <p className="text-center text-muted-foreground">
                Loading menu items and inventory...
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && menuItemsWithInventory.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">No Menu Items</h3>
                    <p className="text-sm text-muted-foreground">
                      No menu items found for this restaurant. Add menu items first.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Menu items grid with inventory */}
          {!loading && menuItemsWithInventory.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menuItemsWithInventory.map((item) => (
                <Card key={item.itemId} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {item.itemName}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-2">
                          {item.description || "No description"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          item.quantityAvailable > 0 ? "default" : "destructive"
                        }
                      >
                        {item.quantityAvailable > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price display */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Price:
                      </span>
                      <span className="font-semibold text-primary">
                        ₹{item.price || item.unitPrice || "0"}
                      </span>
                    </div>

                    {/* Availability status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status:
                      </span>
                      <Badge
                        variant={
                          item.isavailable ? "outline" : "secondary"
                        }
                      >
                        {item.isavailable ? "✓ Available" : "✗ Unavailable"}
                      </Badge>
                    </div>

                    {editingItemId === item.itemId ? (
                      // Edit mode
                      <div className="space-y-3 border-t pt-4">
                        <div>
                          <Label htmlFor={`qty-${item.itemId}`}>
                            Quantity Available
                          </Label>
                          <Input
                            id={`qty-${item.itemId}`}
                            type="number"
                            value={editValues.quantityAvailable || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                quantityAvailable: e.target.value,
                              }))
                            }
                            min="0"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`threshold-${item.itemId}`}>
                            Reorder Threshold
                          </Label>
                          <Input
                            id={`threshold-${item.itemId}`}
                            type="number"
                            value={editValues.reorderThreshold || ""}
                            onChange={(e) =>
                              setEditValues((prev) => ({
                                ...prev,
                                reorderThreshold: e.target.value,
                              }))
                            }
                            min="0"
                            className="mt-1"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateQuantity(item)}
                            className="flex-1"
                          >
                            <Check className="mr-1 h-4 w-4" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                          >
                            <X className="mr-1 h-4 w-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Quantity Available
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              {item.quantityAvailable}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Reorder Threshold
                            </p>
                            <p className="text-2xl font-bold">
                              {item.reorderThreshold}
                            </p>
                          </div>
                        </div>

                        {item.quantityAvailable <= item.reorderThreshold &&
                          item.quantityAvailable > 0 && (
                            <div className="rounded-md bg-warning/10 p-3 border border-warning/20">
                              <p className="text-xs font-semibold text-warning">
                                ⚠️ Low Stock Alert
                              </p>
                              <p className="text-xs text-warning/80">
                                Quantity is at or below reorder threshold
                              </p>
                            </div>
                          )}

                        <Button
                          size="sm"
                          onClick={() => handleEditQuantity(item)}
                          variant="outline"
                          className="w-full"
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Stock
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
