import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CheckCircle2, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const { toast } = useToast();
  const { customerId } = useAuth();

  const { orderItems = [], subTotal = 0 } = location.state || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");

  const tax = subTotal * 0.05;
  const total = (subTotal + tax).toFixed(2);

  const handleProceedToPayment = () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "❌ Payment Method Required",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    // Get restaurantId from localStorage (set during checkout)
    const restaurantId = localStorage.getItem("restaurantId");

    // Navigate to payment page with order and payment method info
    navigate(`/customer/payment/${orderId}`, {
      state: {
        orderId,
        paymentMethod: selectedPaymentMethod,
        totalAmount: parseFloat(total),
        orderItems,
        subTotal,
        restaurantId,  // Pass restaurantId to payment page
        customerId,     // Pass customerId as well
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-400 border-b-2 border-green-400">
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8" />
              Order Confirmation
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Order ID Section */}
              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-l-4 border-green-500 p-6 rounded">
                <p className="text-slate-300 text-sm mb-2">Order Number</p>
                <p className="text-4xl font-bold text-green-400">#{orderId}</p>
                <p className="text-slate-400 text-xs mt-2">Order confirmed and ready for payment</p>
              </div>

              {/* Order Summary */}
              <div className="border-b-2 border-slate-700 pb-6">
                <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>
                <div className="space-y-2">
                  {orderItems && orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg"
                      >
                        <span className="text-slate-200">
                          {item.itemName || item.name || `Item ${index + 1}`} (×
                          {item.quantity || 1})
                        </span>
                        <span className="text-amber-400 font-semibold">
                          ₹{(
                            (item.price || item.unitPrice || 0) *
                            (item.quantity || 1)
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">No items in order</div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 bg-gradient-to-r from-slate-700/50 to-slate-600/50 p-6 rounded-lg border border-slate-600">
                <div className="flex justify-between items-center text-slate-200">
                  <span>Subtotal:</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>Delivery Fee:</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span>Tax (5%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-500 pt-3 flex justify-between items-center">
                  <span className="font-bold text-white">Total Amount:</span>
                  <span className="font-bold text-2xl text-green-400">₹{total}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="border-b-2 border-slate-700 pb-6">
                <h3 className="text-xl font-bold text-white mb-4">Select Payment Method</h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* UPI Option */}
                  <div
                    onClick={() => setSelectedPaymentMethod("upi")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === "upi"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className="h-6 w-6 text-blue-400" />
                      <span className="font-bold text-white">UPI</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Pay via UPI (Google Pay, PhonePe, Paytm)
                    </p>
                  </div>

                  {/* Card Option */}
                  <div
                    onClick={() => setSelectedPaymentMethod("card")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === "card"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-6 w-6 text-blue-400" />
                      <span className="font-bold text-white">Card</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Credit/Debit Card Payment
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Next Step:</strong> Click "Proceed to Payment" to enter your {selectedPaymentMethod === "upi" ? "UPI ID" : "card details"} and
                  complete the transaction.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-black rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 uppercase tracking-widest text-lg drop-shadow flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Proceed to Payment
                </button>

                <button
                  onClick={() => navigate("/customer/restaurants")}
                  className="w-full py-4 bg-white hover:bg-gray-100 text-slate-900 font-black rounded-xl transition-all duration-200 border-3 border-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 uppercase tracking-widest"
                >
                  Back to Restaurants
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmation;
