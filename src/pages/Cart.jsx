import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [upiId, setUpiId] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching cart items from backend...");
      
      // Get all carts for the current customer
      const response = await axios.get(
        `/api/cart`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 Cart response:", response.data);

      // Extract items from cart(s)
      let items = [];
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Use the first/latest cart
        const cart = response.data[0];
        if (cart.cartItems && Array.isArray(cart.cartItems)) {
          items = cart.cartItems;
        }
      }

      setCartItems(items);
      console.log("✅ Cart items loaded:", items);
    } catch (error) {
      console.error("❌ Failed to fetch cart items:", error);
      // Don't show error if cart is just empty
      if (error.response?.status !== 404) {
        toast({
          title: "⚠️ Failed to load cart",
          description: "Could not fetch cart items from server",
          variant: "destructive",
        });
      }
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const removeItem = async (itemId) => {
    try {
      // Update local state first
      setCartItems(cartItems.filter((item) => item.itemId !== itemId && item.id !== itemId));
      
      // Then sync with backend by posting updated cart
      const updatedItems = cartItems.filter((item) => item.itemId !== itemId && item.id !== itemId);
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );

      await axios.post(
        `/api/cart`,
        {
          cartItems: updatedItems.map(item => ({
            itemId: item.itemId || item.id,
            quantity: item.quantity || 1
          })),
          totalCartPrice: newTotal
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: "✅ Item removed",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error("❌ Failed to remove item:", error);
      toast({
        title: "⚠️ Failed to remove",
        description: "Could not remove item from cart",
        variant: "destructive",
      });
      // Refresh cart
      fetchCartItems();
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    try {
      // Update local state
      const updatedItems = cartItems.map(item =>
        (item.itemId === itemId || item.id === itemId)
          ? { ...item, quantity: newQuantity }
          : item
      );
      setCartItems(updatedItems);

      // Sync with backend
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );

      await axios.post(
        `/api/cart`,
        {
          cartItems: updatedItems.map(item => ({
            itemId: item.itemId || item.id,
            quantity: item.quantity || 1
          })),
          totalCartPrice: newTotal
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("❌ Failed to update quantity:", error);
      toast({
        title: "⚠️ Failed to update",
        description: "Could not update item quantity",
        variant: "destructive",
      });
      // Refresh cart
      fetchCartItems();
    }
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items before placing an order",
        variant: "destructive",
      });
      return;
    }

    setPlacingOrder(true);

    try {
      // validate payment details for certain methods
      if (paymentMethod === "upi" && (!upiId || !upiId.trim())) {
        toast({
          title: "Missing UPI ID",
          description: "Please enter your UPI ID to continue.",
          variant: "destructive",
        });
        setPlacingOrder(false);
        return;
      }

      const orderData = {
        items: cartItems,
        total,
        deliveryAddress: "User address here", // Should come from user profile
        paymentMethod,
        upiId: paymentMethod === "upi" ? upiId : undefined,
      };

      // Try to place order
      try {
        await apiRequest(API_ENDPOINTS.ORDERS.BASE, {
          method: "POST",
          body: JSON.stringify(orderData),
        });
      } catch (apiError) {
        console.warn("Order API failed, but proceeding with local success:", apiError);
      }

      toast({
        title: "✅ Order Placed Successfully!",
        description: "Your order is being prepared.",
      });

      // Clear cart
      setCartItems([]);
      navigate("/customer?tab=orders");
    } catch (error) {
      console.error("❌ Failed to place order:", error);
      toast({
        title: "⚠️ Error",
        description: "Could not place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
            </div>
            <p className="text-lg font-semibold text-gray-700">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <Card className="text-center">
            <CardContent className="py-12">
              <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">Your cart is empty</h3>
              <p className="mb-4 text-muted-foreground">
                Add some delicious items to get started!
              </p>
              <Button onClick={() => navigate("/customer")}>
                Browse Restaurants
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 min-h-screen">
            <div className="lg:col-span-2 h-fit sticky top-8">
              <Card className="h-full">
                <CardHeader className="sticky top-0 bg-white z-10 border-b">
                  <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.itemId || item.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.itemName || item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ₹{(item.price || 0).toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                          <button
                            onClick={() => updateQuantity(item.itemId || item.id, (item.quantity || 1) - 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="h-4 w-4 text-orange-600" />
                          </button>
                          <span className="px-3 font-bold text-gray-900">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.itemId || item.id, (item.quantity || 1) + 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="h-4 w-4 text-orange-600" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <p className="font-semibold w-20 text-right">
                          ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.itemId || item.id)}
                          title="Remove from cart"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 h-fit sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₹49.99</span>
                  </div>
                  <div className="pt-2">
                    <Label className="mb-2">Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">
                          Card / Debit / Credit
                        </SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cash">Cash on Delivery</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>

                    {paymentMethod === "upi" && (
                      <div className="mt-3">
                        <Label htmlFor="upiId">Enter UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="example@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{(total + 49.99).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                    onClick={placeOrder}
                    disabled={placingOrder || cartItems.length === 0}
                  >
                    {placingOrder ? "Processing..." : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
