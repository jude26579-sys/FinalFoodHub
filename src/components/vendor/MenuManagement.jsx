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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const MenuManagement = ({
  restaurants = [],
  menuItemsByRestaurant = {},
  onAddMenuItem = () => {},
  onDeleteMenuItem = () => {},
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Step 1: Select Restaurant
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantSelected, setRestaurantSelected] = useState(false);

  // Step 2: Manage Categories
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    categoryName: "",
    description: "",
  });

  // Step 3: Manage Menu Items
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [menuFormData, setMenuFormData] = useState({
    itemName: "",
    description: "",
    price: "",
    isavailable: true,
  });
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

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

  // Fetch categories for selected restaurant
  const fetchCategories = async () => {
    if (!selectedRestaurant) return;

    try {
      setLoadingCategories(true);
      const token = getAuthToken();
      
      if (!token) {
        toast({
          title: "⚠️ Error",
          description: "Authentication token not found",
          variant: "destructive",
        });
        return;
      }

      console.log("🔄 Fetching categories from http://localhost:9002/api/category");
      console.log("📱 Token:", token.substring(0, 50) + "...");

      // Get all categories (backend doesn't filter by restaurant, so we display all)
      const response = await axios.get("http://localhost:9002/api/category", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      console.log("✅ Categories response:", response.status, response.data);
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);
      console.log("📂 Categories fetched successfully:", categoriesData.length, "categories");
      
      if (categoriesData.length === 0) {
        console.log("⚠️ No categories found. You may need to create some.");
      }
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config,
      });
      
      toast({
        title: "⚠️ Error Loading Categories",
        description: error.response?.data?.message || error.message || "Failed to load categories. Make sure menu service is running on port 9002.",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch menu items for selected category and restaurant
  const fetchMenuItems = async (categoryId) => {
    if (!selectedRestaurant || !categoryId) return;

    try {
      setLoadingMenuItems(true);
      const token = getAuthToken();

      const response = await axios.get("http://localhost:9002/api/menu", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Filter menu items by restaurant and category
      const filteredItems = (response.data || []).filter(
        (item) =>
          item.restaurantId === (selectedRestaurant.restaurantId || selectedRestaurant.id) &&
          item.categoryId === categoryId
      );

      setMenuItems(filteredItems);
      console.log("🍽️ Menu items fetched:", filteredItems);
    } catch (error) {
      console.error("❌ Failed to fetch menu items:", error);
      toast({
        title: "⚠️ Error Loading Menu Items",
        description: error.response?.data?.message || "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoadingMenuItems(false);
    }
  };

  // Add category
  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!categoryFormData.categoryName.trim()) {
      toast({
        title: "⚠️ Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = getAuthToken();

      const response = await axios.post(
        "http://localhost:9002/api/category",
        categoryFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setCategories([...categories, response.data]);
      toast({
        title: "✅ Success",
        description: "Category added successfully",
      });

      setCategoryFormData({ categoryName: "", description: "" });
      setShowCategoryForm(false);
    } catch (error) {
      console.error("❌ Failed to add category:", error);
      toast({
        title: "⚠️ Error",
        description: error.response?.data?.message || "Failed to add category",
        variant: "destructive",
      });
    }
  };

  // Add menu item
  const handleAddMenuItem = async (e) => {
    e.preventDefault();

    // If editing, call update handler instead
    if (editingItemId) {
      return handleUpdateMenuItem(e);
    }

    if (!menuFormData.itemName.trim() || !menuFormData.price) {
      toast({
        title: "⚠️ Error",
        description: "Item name and price are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = getAuthToken();

      const payload = {
        itemName: menuFormData.itemName,
        description: menuFormData.description,
        price: parseFloat(menuFormData.price),
        categoryId: selectedCategory,
        restaurantId: selectedRestaurant.restaurantId || selectedRestaurant.id,
        isavailable: menuFormData.isavailable,
      };

      const response = await axios.post(
        "http://localhost:9002/api/menu",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMenuItems([...menuItems, response.data]);
      toast({
        title: "✅ Success",
        description: "Menu item added successfully",
      });

      setMenuFormData({
        itemName: "",
        description: "",
        price: "",
        isavailable: true,
      });
      setShowMenuForm(false);
    } catch (error) {
      console.error("❌ Failed to add menu item:", error);
      toast({
        title: "⚠️ Error",
        description: error.response?.data?.message || "Failed to add menu item",
        variant: "destructive",
      });
    }
  };

  // Delete menu item
  const handleDeleteMenuItem = async (itemId) => {
    try {
      const token = getAuthToken();

      await axios.delete(`http://localhost:9002/api/menu/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setMenuItems(menuItems.filter((item) => item.itemId !== itemId));
      toast({
        title: "✅ Success",
        description: "Menu item deleted successfully",
      });
    } catch (error) {
      console.error("❌ Failed to delete menu item:", error);
      toast({
        title: "⚠️ Error",
        description: error.response?.data?.message || "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  // Edit menu item
  const handleEditMenuItem = (item) => {
    setEditingItemId(item.itemId);
    setMenuFormData({
      itemName: item.itemName,
      description: item.description,
      price: item.price,
      isavailable: item.isavailable,
    });
    setShowMenuForm(true);
  };

  // Update menu item
  const handleUpdateMenuItem = async (e) => {
    e.preventDefault();

    if (!menuFormData.itemName.trim()) {
      toast({
        title: "⚠️ Error",
        description: "Item name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = getAuthToken();

      const response = await axios.put(
        `http://localhost:9002/api/menu/${editingItemId}`,
        {
          itemName: menuFormData.itemName,
          description: menuFormData.description,
          price: parseFloat(menuFormData.price),
          categoryId: selectedCategory,
          restaurantId: selectedRestaurant.restaurantId || selectedRestaurant.id,
          isavailable: menuFormData.isavailable,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update the menu item in the list
      setMenuItems(
        menuItems.map((item) => 
          item.itemId === editingItemId ? response.data : item
        )
      );
      
      toast({
        title: "✅ Success",
        description: "Menu item updated successfully",
      });

      setMenuFormData({
        itemName: "",
        description: "",
        price: "",
        isavailable: true,
      });
      setEditingItemId(null);
      setShowMenuForm(false);
    } catch (error) {
      console.error("❌ Failed to update menu item:", error);
      toast({
        title: "⚠️ Error",
        description: error.response?.data?.message || "Failed to update menu item",
        variant: "destructive",
      });
    }
  };

  // Step 1: Restaurant Selection
  if (!restaurantSelected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Select a Restaurant</h2>
          <p className="text-muted-foreground mb-6">
            Choose a restaurant to manage its menu categories and items.
          </p>
        </div>

        {restaurants.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No restaurants assigned to you yet. An admin needs to assign restaurants to your account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.restaurantId || restaurant.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedRestaurant(restaurant);
                  setRestaurantSelected(true);
                  fetchCategories();
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {restaurant.restaurantName || restaurant.name}
                  </CardTitle>
                  <CardDescription>
                    📍 {restaurant.location || restaurant.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Manage Menu
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2 & 3: Category and Menu Management
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRestaurantSelected(false);
            setSelectedRestaurant(null);
            setSelectedCategory(null);
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Restaurants
        </Button>
        <h2 className="text-2xl font-semibold">
          {selectedRestaurant.restaurantName || selectedRestaurant.name}
        </h2>
      </div>

      {!selectedCategory ? (
        // Category Selection/Management View
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Menu Categories</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log("🔄 Manually refreshing categories...");
                  fetchCategories();
                }}
                disabled={loadingCategories}
              >
                {loadingCategories ? "Loading..." : "Refresh"}
              </Button>
              <Button onClick={() => setShowCategoryForm(!showCategoryForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Category</CardTitle>
                <CardDescription>Create a menu category (e.g., Appetizers, Main Course)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      placeholder="e.g., Appetizers, Main Course"
                      value={categoryFormData.categoryName}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          categoryName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDesc">Description</Label>
                    <Textarea
                      id="categoryDesc"
                      placeholder="Describe this category..."
                      value={categoryFormData.description}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Category</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCategoryForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loadingCategories ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center">Loading categories...</p>
              </CardContent>
            </Card>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No categories yet. Create one to add menu items.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card
                  key={category.categoryId}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedCategory(category.categoryId);
                    fetchMenuItems(category.categoryId);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{category.categoryName}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Manage Items</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Menu Items View
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="mb-4"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
              <h3 className="text-xl font-semibold">
                {
                  categories.find((c) => c.categoryId === selectedCategory)
                    ?.categoryName
                }
              </h3>
            </div>
            <Button onClick={() => setShowMenuForm(!showMenuForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Button>
          </div>

          {showMenuForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Menu Item</CardTitle>
                <CardDescription>Add a new item to this category</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMenuItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      placeholder="e.g., Paneer Tikka"
                      value={menuFormData.itemName}
                      onChange={(e) =>
                        setMenuFormData({
                          ...menuFormData,
                          itemName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemDesc">Description</Label>
                    <Textarea
                      id="itemDesc"
                      placeholder="Describe the item..."
                      value={menuFormData.description}
                      onChange={(e) =>
                        setMenuFormData({
                          ...menuFormData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={menuFormData.price}
                      onChange={(e) =>
                        setMenuFormData({
                          ...menuFormData,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {editingItemId ? "Update Item" : "Add Item"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowMenuForm(false);
                        setEditingItemId(null);
                        setMenuFormData({
                          itemName: "",
                          description: "",
                          price: "",
                          isavailable: true,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loadingMenuItems ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center">Loading menu items...</p>
              </CardContent>
            </Card>
          ) : menuItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No items in this category yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {menuItems.map((item) => (
                <div
                  key={item.itemId}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-orange-200"
                >
                  {/* Item Header with Title and Price */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">
                        {item.itemName}
                      </h3>
                    </div>
                    <div className="bg-white rounded-lg p-3 mb-4 border-2 border-orange-300">
                      <p className="text-2xl font-bold text-orange-600">
                        ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.description || "No description provided"}
                    </p>
                  </div>

                  {/* Availability Badge */}
                  <div className="mb-5">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        item.isavailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isavailable ? "✅ Available" : "❌ Out of Stock"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditMenuItem(item)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.itemId)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
