import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const CheckoutDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const accessToken = localStorage.getItem("accessToken");
  const storedCustomerId = localStorage.getItem("customerId");

  // Get cart and restaurant data from location state
  const { cartId, restaurantId, cartItems = [], totalPrice = 0, customerId: stateCustomerId } = location.state || {};
  
  // Use customerId from state first, then from localStorage, then from context
  const customerId = stateCustomerId || storedCustomerId;

  useEffect(() => {
    console.log("🔍 CheckoutDetails - Data Check:");
    console.log("  cartId:", cartId);
    console.log("  restaurantId:", restaurantId);
    console.log("  customerId:", customerId);
    console.log("  cartItems:", cartItems?.length);
    console.log("  totalPrice:", totalPrice);

    if (!cartId || !restaurantId || !customerId) {
      console.error("❌ Missing required data for checkout!");
      toast({
        title: "❌ Missing Information",
        description: "Please start from the restaurant menu.",
        variant: "destructive",
      });
      setTimeout(() => {
        navigate("/customer/restaurants");
      }, 2000);
      return;
    }
    console.log("✅ All checkout data available!");
    setLoading(false);
  }, [cartId, restaurantId, customerId, navigate, toast]);

  const handlePlaceOrder = async () => {
    try {
      setCreatingOrder(true);

      console.log("📤 Creating order with:", {
        cartId,
        customerId: parseInt(customerId),
        restaurantId: parseInt(restaurantId),
      });

      const orderResponse = await axios.post(
        `http://localhost:8083/api/orders`,
        {
          cartId: parseInt(cartId),
          customerId: parseInt(customerId),
          restaurantId: parseInt(restaurantId),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Order created successfully:", orderResponse.data);

      const orderId = orderResponse.data.orderId;
      const subTotal = orderResponse.data.subTotal;

      // Store restaurantId in localStorage for payment processing
      localStorage.setItem("restaurantId", restaurantId);

      toast({
        title: "✅ Order Created",
        description: `Order #${orderId} created successfully.`,
      });

      // Navigate to order confirmation page with order details
      navigate(`/customer/order-confirmation/${orderId}`, {
        state: {
          orderId,
          orderItems: orderResponse.data.items || cartItems,
          subTotal: subTotal || totalPrice,
          customerId,
        },
      });
    } catch (error) {
      console.error("❌ Failed to create order:", {
        status: error.response?.status,
        message: error.message,
        responseData: error.response?.data,
      });

      toast({
        title: "❌ Order Creation Failed",
        description:
          error.response?.data?.message ||
          "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-400 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-amber-400 to-amber-300 border-b-2 border-amber-300">
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              Checkout Details
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-8">
            {/* Order Summary Section */}
            <div className="space-y-6">
              {/* Cart Items */}
              <div className="border-b-2 border-slate-700 pb-6">
                <h3 className="text-xl font-bold text-white mb-4">Order Items</h3>
                <div className="space-y-3">
                  {cartItems && cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-slate-700/50 p-4 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-white font-semibold">
                            {item.itemName || item.name || `Item ${index + 1}`}
                          </p>
                          <p className="text-slate-300 text-sm">
                            Qty: {item.quantity || 1}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-bold">
                            ₹{(
                              (item.price || item.unitPrice || 0) *
                              (item.quantity || 1)
                            ).toFixed(2)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {item.quantity || 1} × ₹
                            {(item.price || item.unitPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                      <AlertCircle className="h-5 w-5" />
                      <span>No items in order</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary */}
              <div className="space-y-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 p-6 rounded-lg border border-slate-600">
                <div className="flex justify-between items-center text-white">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{(totalPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span>Delivery Fee:</span>
                  <span className="font-semibold">₹0.00</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span>Tax:</span>
                  <span className="font-semibold">₹{((totalPrice || 0) * 0.05).toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-500 pt-3 flex justify-between items-center text-amber-400">
                  <span className="font-bold text-lg">Total Amount:</span>
                  <span className="font-bold text-2xl">
                    ₹{((totalPrice || 0) * 1.05).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Next Step:</strong> Click "Place Order" to proceed to payment
                  selection and order confirmation.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handlePlaceOrder}
                  disabled={creatingOrder}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-orange-900 font-black rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 uppercase tracking-widest text-lg drop-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {creatingOrder ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "✓ Place Order"
                  )}
                </button>

                <button
                  onClick={() => navigate(-1)}
                  disabled={creatingOrder}
                  className="w-full py-4 bg-white hover:bg-gray-100 text-orange-800 font-black rounded-xl transition-all duration-200 border-3 border-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 uppercase tracking-widest disabled:opacity-50"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutDetails;
