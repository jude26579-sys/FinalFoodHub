import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, Plus, Minus, ShoppingCart, X, Check, CreditCard, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
 
export const RestaurantMenu = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
 
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [cartId, setCartId] = useState(null);
  const [isSavingCart, setIsSavingCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
 
  const accessToken = localStorage.getItem("accessToken");
  const [customerId, setCustomerId] = useState(localStorage.getItem("customerId"));
 
  useEffect(() => {
    // Read customerId from localStorage each time component loads
    const storedCustomerId = localStorage.getItem("customerId");
    console.log("🔍 RestaurantMenu - Checking localStorage for customerId:", storedCustomerId);
   
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
      console.log("✅ Customer ID loaded from localStorage:", storedCustomerId);
    } else {
      console.warn("⚠️ Customer ID not found in localStorage!");
    }
   
    fetchRestaurantDetails();
    fetchCategories();
    fetchMenuItems();
  }, [restaurantId]);
 
  const fetchRestaurantDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8182/api/restaurants/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setRestaurant(response.data);
      console.log("✅ Restaurant details:", response.data);
    } catch (error) {
      console.error("❌ Failed to fetch restaurant details:", error);
      setError("Failed to load restaurant details");
    }
  };
 
  const fetchCategories = async () => {
    try {
      console.log("🔄 Fetching categories for restaurantId:", restaurantId);
     
      const response = await axios.get("http://localhost:9002/api/category", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
     
      console.log("📥 Raw categories API response:", response.data);
     
      const allCategories = Array.isArray(response.data) ? response.data : [];
      const restaurantCategories = allCategories.filter(
        (cat) => {
          console.log(`Checking category: ${cat.categoryName}, restaurantId: ${cat.restaurantId}, comparing with: ${parseInt(restaurantId)}`);
          return cat.restaurantId === parseInt(restaurantId);
        }
      );
     
      console.log("✅ Filtered categories for this restaurant:", restaurantCategories);
     
      setCategories(restaurantCategories);
      if (restaurantCategories.length > 0) {
        setSelectedCategory(restaurantCategories[0].categoryId);
      }
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
      // Don't fail the page - categories are optional, we can extract them from menu items
    }
  };
 
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching menu items for restaurantId:", restaurantId);
     
      const response = await axios.get("http://localhost:9002/api/menu", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
     
      console.log("📥 Raw API response:", response.data);
     
      const allItems = Array.isArray(response.data) ? response.data : [];
      console.log("📋 All menu items from API:", allItems);
     
      const restaurantItems = allItems.filter(
        (item) => {
          console.log(`Checking item: ${item.itemName}, restaurantId: ${item.restaurantId}, comparing with: ${parseInt(restaurantId)}`);
          return item.restaurantId === parseInt(restaurantId);
        }
      );
     
      console.log("✅ Filtered menu items for this restaurant:", restaurantItems);
      setMenuItems(restaurantItems);
    } catch (error) {
      console.error("❌ Failed to fetch menu items:", error);
      setError("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };
 
  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === null || item.categoryId === selectedCategory;
    const matchSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });
 
  const addToCart = async (item) => {
    try {
      setIsSavingCart(true);
     
      // Update local cart state first (for UI responsiveness)
      const existingItem = cart.find((cartItem) => cartItem.menuItemId === item.menuItemId || cartItem.itemId === item.menuItemId);
     
      let updatedCart;
      if (existingItem) {
        updatedCart = cart.map((cartItem) =>
          (cartItem.menuItemId === item.menuItemId || cartItem.itemId === item.menuItemId)
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        updatedCart = [...cart, {
          ...item,
          quantity: 1,
          menuItemId: item.menuItemId || item.itemId,
          itemId: item.menuItemId || item.itemId
        }];
      }
     
      setCart(updatedCart);
     
      // Calculate total cart price
      const totalCartPrice = updatedCart.reduce((sum, cartItem) => {
        return sum + (cartItem.price * cartItem.quantity);
      }, 0);
     
      // Prepare cart data for backend
      const cartData = {
        customerId: parseInt(customerId) || null,
        restaurantId: parseInt(restaurantId) || null,
        cartItems: updatedCart.map(cartItem => ({
          itemId: cartItem.menuItemId || cartItem.itemId,
          quantity: cartItem.quantity || 1
        })),
        totalCartPrice: totalCartPrice
      };
     
      // Try to save to backend Cart Service
      console.log("💾 Saving cart to backend with data:", JSON.stringify(cartData, null, 2));
     
      try {
        const response = await axios.post(
          `/api/cart`,
          cartData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
       
        console.log("✅ Cart saved to backend successfully! Response:", response.data);
        setCartId(response.data.cartId);
       
        toast({
          title: "✅ Added to Cart",
          description: `${item.itemName} added to your cart (saved to backend)`,
        });
      } catch (backendError) {
        console.warn("⚠️ Backend cart save failed", backendError.message);
        console.error("Error details:", backendError.response?.data);
       
        // Still show error message to user
        toast({
          title: "⚠️ Backend Error",
          description: backendError.response?.data?.message || "Failed to save to backend",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Error adding to cart:", {
        message: error.message,
      });
      toast({
        title: "❌ Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setIsSavingCart(false);
    }
  };
 
  const removeFromCart = async (menuItemId) => {
    try {
      // Update local cart state
      const updatedCart = cart.filter((item) => item.menuItemId !== menuItemId && item.itemId !== menuItemId);
      setCart(updatedCart);
 
      // Calculate total cart price
      const totalCartPrice = updatedCart.reduce((sum, cartItem) => {
        return sum + (cartItem.price * cartItem.quantity);
      }, 0);
 
      // Prepare cart data for backend
      const cartData = {
        customerId: parseInt(customerId) || null,
        restaurantId: parseInt(restaurantId) || null,
        cartItems: updatedCart.map(cartItem => ({
          itemId: cartItem.menuItemId || cartItem.itemId,
          quantity: cartItem.quantity || 1
        })),
        totalCartPrice: totalCartPrice
      };
 
      // Save updated cart to backend
      console.log("💾 Removing item from cart with data:", JSON.stringify(cartData, null, 2));
     
      try {
        const response = await axios.post(
          `/api/cart`,
          cartData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
       
        console.log("✅ Item removed from cart on backend successfully!");
        setCartId(response.data.cartId);
      } catch (backendError) {
        console.warn("⚠️ Backend cart removal failed", backendError.message);
      }
    } catch (error) {
      console.error("❌ Error removing from cart:", error);
    }
  };
 
  const updateQuantity = async (menuItemId, quantity) => {
    try {
      if (quantity <= 0) {
        removeFromCart(menuItemId);
        return;
      }
 
      // Update local state
      const updatedCart = cart.map((item) =>
        (item.menuItemId === menuItemId || item.itemId === menuItemId)
          ? { ...item, quantity }
          : item
      );
     
      setCart(updatedCart);
 
      // Calculate total cart price
      const totalCartPrice = updatedCart.reduce((sum, cartItem) => {
        return sum + (cartItem.price * cartItem.quantity);
      }, 0);
 
      // Prepare cart data for backend
      const cartData = {
        customerId: parseInt(customerId) || null,
        restaurantId: parseInt(restaurantId) || null,
        cartItems: updatedCart.map(cartItem => ({
          itemId: cartItem.menuItemId || cartItem.itemId,
          quantity: cartItem.quantity || 1
        })),
        totalCartPrice: totalCartPrice
      };
 
      // Save updated cart to backend
      console.log("💾 Updating cart quantity with data:", JSON.stringify(cartData, null, 2));
     
      try {
        const response = await axios.post(
          `/api/cart`,
          cartData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
       
        console.log("✅ Cart quantity updated on backend successfully!");
        setCartId(response.data.cartId);
      } catch (backendError) {
        console.warn("⚠️ Backend cart update failed", backendError.message);
      }
    } catch (error) {
      console.error("❌ Error updating quantity:", error);
    }
  };
 
  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
 
      console.log("🔍 Checkout validation - customerId:", customerId, "cartLength:", cart?.length);
 
      if (!customerId || customerId === "undefined" || customerId === "null") {
        console.error("❌ customerId missing:", customerId);
        toast({
          title: "❌ Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive"
        });
        return;
      }
 
      if (!cart || cart.length === 0) {
        toast({
          title: "❌ Empty Cart",
          description: "Please add items to your cart before checkout.",
          variant: "destructive"
        });
        return;
      }
 
      let finalCartId = cartId;
 
      // If cartId is not set, generate a local one
      if (!finalCartId) {
        console.log("⚠️ Cart ID not found, generating local cart ID...");
       
        const totalCartPrice = cart.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
 
        // Generate a local cartId
        finalCartId = `LOCAL_${customerId}_${Date.now()}`;
       
        // Store in localStorage
        localStorage.setItem(
          `cart_${customerId}`,
          JSON.stringify({
            cartId: finalCartId,
            customerId,
            restaurantId,
            items: cart,
            totalPrice: totalCartPrice,
            timestamp: new Date().toISOString()
          })
        );
       
        setCartId(finalCartId);
        console.log("✅ Local cart created with ID:", finalCartId);
      }
 
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
 
      console.log("📤 Navigating to checkout with:", {
        cartId: finalCartId,
        customerId: parseInt(customerId),
        restaurantId: parseInt(restaurantId),
        cartItems: cart,
        totalPrice
      });
 
      // Navigate to CheckoutDetails page with cart data
      navigate("/customer/checkout", {
        state: {
          cartId: finalCartId,
          customerId: parseInt(customerId),
          restaurantId: parseInt(restaurantId),
          cartItems: cart,
          totalPrice
        }
      });
 
      setShowCart(false);
    } catch (error) {
      console.error("❌ Checkout navigation failed:", error);
      toast({
        title: "❌ Checkout Failed",
        description: error.response?.data?.message || "Failed to proceed to checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
 
  const handlePaymentSubmit = async () => {
    try {
      setIsProcessing(true);
 
      // Validate payment method input
      if (paymentMethod === "upi" && !upiId.trim()) {
        toast({
          title: "❌ Invalid UPI ID",
          description: "Please enter a valid UPI ID",
          variant: "destructive"
        });
        return;
      }
 
      if (paymentMethod === "card" && (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv)) {
        toast({
          title: "❌ Invalid Card Details",
          description: "Please fill in all card details",
          variant: "destructive"
        });
        return;
      }
 
      console.log("💳 Processing payment for Order ID:", orderId);
      console.log("Payment Method:", paymentMethod);
 
      // Call payment processing endpoint
      const paymentPayload = {
        orderId: orderId,
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === "upi"
          ? { upiId }
          : { cardNumber: cardDetails.cardNumber, expiryDate: cardDetails.expiryDate, cvv: cardDetails.cvv }
      };
 
      const paymentResponse = await axios.post(
        `/api/payment/process`,
        paymentPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
 
      console.log("✅ Payment processed successfully:", paymentResponse.data);
 
      // Clear cart and show success
      setCart([]);
      setShowPaymentModal(false);
      setUpiId("");
      setCardDetails({ cardNumber: "", expiryDate: "", cvv: "" });
 
      toast({
        title: "✅ Payment Successful",
        description: `Order #${orderId} placed successfully!`,
      });
 
      // Navigate to order tracking or thank you page
      setTimeout(() => {
        navigate(`/customer/orders/${orderId}`);
      }, 1500);
 
    } catch (error) {
      console.error("❌ Payment processing failed:", {
        status: error.response?.status,
        message: error.message,
        responseData: error.response?.data,
      });
 
      toast({
        title: "❌ Payment Failed",
        description: error.response?.data?.message || "Payment processing failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
 
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
 
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading menu...</p>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg max-w-md">
          <p className="text-red-600 font-semibold mb-6 text-lg">❌ {error}</p>
          <button
            onClick={() => navigate("/customer")}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all"
          >
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white via-orange-50 to-yellow-50">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-orange-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/customer")}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
           
            <div className="flex-1 mx-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {restaurant?.restaurantName || "Restaurant Menu"}
              </h1>
            </div>
 
            {/* CART BUTTON */}
            <div className="relative">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR - CATEGORIES & SEARCH */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* SEARCH */}
              <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm border-2 border-orange-200 rounded-lg focus:border-orange-600"
                  />
                </div>
              </div>
 
              {/* CATEGORIES */}
              <div className="bg-white p-4 rounded-xl shadow-md">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchTerm("");
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all text-left ${
                      selectedCategory === null
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.categoryId}
                      onClick={() => setSelectedCategory(category.categoryId)}
                      className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all text-left ${
                        selectedCategory === category.categoryId
                          ? "bg-orange-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {category.categoryName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
 
          {/* MENU ITEMS */}
          <div className="lg:col-span-3">
            {filteredItems.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group"
                  >
                    {/* ITEM IMAGE PLACEHOLDER */}
                    <div className="h-48 bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center relative overflow-hidden">
                      <div className="text-6xl">{String.fromCharCode(127798 + (item.menuItemId % 10))}</div>
                      {!item.isavailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Unavailable</span>
                        </div>
                      )}
                    </div>
 
                    {/* ITEM DETAILS */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{item.itemName}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
 
                      {/* PRICE */}
                      <div className="mb-4">
                        <p className="text-2xl font-bold text-orange-600">₹{item.price.toFixed(2)}</p>
                      </div>
 
                      {/* ADD TO CART BUTTON */}
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.isavailable}
                        className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                          item.isavailable
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transform hover:scale-105"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        <Plus className="h-5 w-5" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-lg text-center">
                <p className="text-2xl text-gray-600 font-semibold mb-4">� No menu items found</p>
                <p className="text-gray-500 mb-6">
                  {selectedCategory !== null
                    ? "No items in this category. Try selecting another category or clearing your search."
                    : "This restaurant hasn't added any menu items yet. Please check back later!"}
                </p>
                {selectedCategory !== null && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all"
                  >
                    View All Items
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* SHOPPING CART SIDEBAR - FULL DARK FILL */}
      {showCart && (
        <>
          {/* DARK OVERLAY BACKGROUND */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md transition-all duration-300"
            onClick={() => setShowCart(false)}
          />
         
          {/* COMPLETE DARK SIDEBAR - FILLS ENTIRE RIGHT SIDE */}
          <div className="fixed right-0 top-0 z-50 h-screen w-96 bg-slate-950 shadow-2xl overflow-hidden flex flex-col" style={{animation: 'slideInRight 0.3s ease-out', maxHeight: '100vh'}}>
           
            {/* HEADER SECTION */}
            <div className="bg-slate-950 text-white px-8 py-8 flex items-center justify-between flex-shrink-0 shadow-2xl border-b-4 border-orange-500">
              <div className="flex-1">
                <h2 className="text-3xl font-black tracking-tight text-orange-400 drop-shadow-lg">🛒 Shopping Cart</h2>
                <p className="text-white text-lg font-bold mt-2">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-3 hover:bg-slate-800 rounded-full transition-all duration-200 hover:scale-110 text-orange-400 hover:text-orange-300 hover:shadow-lg"
              >
                <X className="h-8 w-8" />
              </button>
            </div>
 
            {/* MAIN CONTENT AREA - DARK FILLED */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 min-h-0 bg-slate-950">
              {cart.length > 0 ? (
                <>
                  {cart.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="bg-slate-900 rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-orange-500 hover:border-orange-400 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-black text-white text-lg leading-tight">{item.itemName}</h4>
                          <p className="text-sm text-orange-300 mt-2 font-semibold">₹{item.price.toFixed(2)} per item</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="text-red-400 hover:text-red-200 p-2 rounded-lg transition-all duration-200 ml-3 opacity-0 group-hover:opacity-100"
                          title="Remove from cart"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
 
                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-2 border-2 border-orange-500">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-700 rounded transition-colors duration-150 text-orange-400 font-black text-lg"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <span className="px-3 font-black text-white w-10 text-center text-lg">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-700 rounded transition-colors duration-150 text-orange-400 font-black text-lg"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="font-black text-orange-400 text-xl">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 px-6">
                  <div className="bg-slate-900 rounded-full p-8 mb-4 shadow-lg border-2 border-orange-500">
                    <ShoppingCart className="h-16 w-16 text-orange-400" />
                  </div>
                  <p className="text-white font-black text-2xl text-center">Your cart is empty</p>
                  <p className="text-orange-400 mt-4 text-center text-sm font-semibold">Browse our menu and add items!</p>
                </div>
              )}
            </div>
 
            {/* FOOTER SECTION - DARK FILLED */}
            {cart.length > 0 && (
              <div className="bg-slate-950 border-t-4 border-orange-500 px-6 py-8 space-y-6 flex-shrink-0 shadow-2xl">
               
                {/* PRICING BOX */}
                <div className="bg-slate-900 rounded-lg p-6 space-y-4 border-2 border-orange-500">
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400 font-black text-base">Subtotal</span>
                    <span className="font-black text-white text-xl">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400 font-black text-base">Delivery Fee</span>
                    <span className="font-black text-white text-xl">₹0.00</span>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-white font-black text-lg">TOTAL</span>
                    <span className="text-3xl font-black text-orange-400">
                      ₹{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
               
                {/* BUTTONS */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 uppercase tracking-wider text-base drop-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isProcessing ? "Processing..." : "✓ Proceed to Checkout"}
                  </button>
 
                  <button
                    onClick={() => setShowCart(false)}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-orange-400 font-black rounded-lg transition-all duration-200 border-2 border-orange-500 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 uppercase tracking-wider"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
 
      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <>
          {/* MODAL BACKDROP */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all duration-300"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
          />
         
          {/* PAYMENT MODAL BOX */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-orange-700 via-orange-600 to-orange-700 text-white px-8 py-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black tracking-tight">💳 Payment</h2>
                <button
                  onClick={() => !isProcessing && setShowPaymentModal(false)}
                  className="p-2 hover:bg-orange-600 rounded-full transition-all"
                  disabled={isProcessing}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-amber-200 font-semibold text-sm">Order #{orderId}</p>
            </div>
 
            {/* CONTENT */}
            <div className="p-8 space-y-6">
              {/* TOTAL AMOUNT */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                <p className="text-sm text-gray-600 font-semibold mb-2">Total Amount to Pay</p>
                <p className="text-4xl font-black text-orange-700">
                  ₹{totalPrice.toFixed(2)}
                </p>
              </div>
 
              {/* PAYMENT METHOD SELECTION */}
              <div className="space-y-4">
                <p className="font-bold text-gray-900 text-lg">Select Payment Method</p>
               
                {/* UPI OPTION */}
                <div
                  onClick={() => !isProcessing && setPaymentMethod("upi")}
                  className={`p-4 rounded-2xl border-3 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    paymentMethod === "upi"
                      ? "border-orange-600 bg-orange-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${paymentMethod === "upi" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900">UPI Payment</p>
                      <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                    </div>
                    {paymentMethod === "upi" && <Check className="h-6 w-6 text-orange-600" />}
                  </div>
 
                  {paymentMethod === "upi" && (
                    <div className="mt-4 pt-4 border-t-2 border-orange-200">
                      <Input
                        placeholder="Enter UPI ID (e.g., user@upi)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        disabled={isProcessing}
                        className="border-2 border-orange-300 focus:border-orange-600 rounded-lg font-semibold"
                      />
                    </div>
                  )}
                </div>
 
                {/* CARD OPTION */}
                <div
                  onClick={() => !isProcessing && setPaymentMethod("card")}
                  className={`p-4 rounded-2xl border-3 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    paymentMethod === "card"
                      ? "border-orange-600 bg-orange-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${paymentMethod === "card" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, RuPay</p>
                    </div>
                    {paymentMethod === "card" && <Check className="h-6 w-6 text-orange-600" />}
                  </div>
 
                  {paymentMethod === "card" && (
                    <div className="mt-4 pt-4 border-t-2 border-orange-200 space-y-3">
                      <Input
                        placeholder="Card Number"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                        disabled={isProcessing}
                        maxLength="16"
                        className="border-2 border-orange-300 focus:border-orange-600 rounded-lg font-semibold"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="MM/YY"
                          value={cardDetails.expiryDate}
                          onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                          disabled={isProcessing}
                          maxLength="5"
                          className="border-2 border-orange-300 focus:border-orange-600 rounded-lg font-semibold"
                        />
                        <Input
                          placeholder="CVV"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                          disabled={isProcessing}
                          maxLength="4"
                          className="border-2 border-orange-300 focus:border-orange-600 rounded-lg font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
 
              {/* ACTION BUTTONS */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-700 hover:to-orange-700 text-white font-black rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 uppercase tracking-widest text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? "Processing..." : "💳 Pay Now"}
                </button>
 
                <button
                  onClick={() => !isProcessing && setShowPaymentModal(false)}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-black rounded-xl transition-all duration-200 border-2 border-gray-300 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
 
 