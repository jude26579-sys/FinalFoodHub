import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateInventoryAfterOrderConfirmed } from "@/lib/inventoryService";
import axios from "axios";

/**
 * OrderTracker Component
 * 
 * Displays real-time order status updates and notifications
 * Polls the Order Service every 5 seconds to check for status changes
 * 
 * Status Flow:
 * PLACED → CONFIRMED → ACCEPTED → READY → DELIVERED
 */
export const OrderTracker = ({ orderId, customerId, onOrderDelivered }) => {
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [inventoryUpdated, setInventoryUpdated] = useState(false);

  // Status colors and icons
  const statusConfig = {
    PLACED: {
      color: "bg-blue-500",
      label: "Order Placed",
      icon: "📋",
      description: "Your order has been placed",
    },
    CONFIRMED: {
      color: "bg-purple-500",
      label: "Confirmed",
      icon: "✅",
      description: "Payment confirmed, vendor notified",
    },
    ACCEPTED: {
      color: "bg-orange-500",
      label: "Accepted",
      icon: "👨‍🍳",
      description: "Vendor is preparing your order",
    },
    READY: {
      color: "bg-green-500",
      label: "Ready to Collect",
      icon: "🎉",
      description: "Your order is ready!",
    },
    DELIVERED: {
      color: "bg-emerald-500",
      label: "Delivered",
      icon: "✨",
      description: "Order collected",
    },
    CANCELLED: {
      color: "bg-red-500",
      label: "Cancelled",
      icon: "❌",
      description: "Order has been cancelled",
    },
  };

  // Fetch order status
  const fetchOrderStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("❌ No authentication token");
        return;
      }

      const response = await axios.get(
        `http://localhost:8083/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      const fetchedOrder = response.data;
      console.log("📍 Order status fetched:", fetchedOrder.orderStatus);

      // Check if status has changed
      if (previousStatus && previousStatus !== fetchedOrder.orderStatus) {
        console.log(`🔔 Status changed: ${previousStatus} → ${fetchedOrder.orderStatus}`);
        
        // Show notification for status change
        const config = statusConfig[fetchedOrder.orderStatus];
        if (config) {
          toast({
            title: `${config.icon} ${config.label}`,
            description: config.description,
            variant: fetchedOrder.orderStatus === "CANCELLED" ? "destructive" : "default",
          });
        }

        // If order status is CONFIRMED, update inventory
        if (
          fetchedOrder.orderStatus === "CONFIRMED" &&
          !inventoryUpdated &&
          fetchedOrder.items &&
          fetchedOrder.items.length > 0
        ) {
          console.log(
            "📦 Order is now CONFIRMED! Triggering inventory update..."
          );
          try {
            const accessToken = localStorage.getItem("accessToken");
            if (accessToken) {
              await updateInventoryAfterOrderConfirmed(
                fetchedOrder.items,
                accessToken
              );
              setInventoryUpdated(true);
              console.log("✅ Inventory updated successfully after order confirmation");
              toast({
                title: "📦 Inventory Updated",
                description: "Stock levels have been updated for ordered items",
              });
            }
          } catch (inventoryError) {
            console.error(
              "⚠️ Failed to update inventory:",
              inventoryError
            );
            toast({
              title: "⚠️ Inventory Update Notice",
              description:
                "Could not update inventory automatically, but order was confirmed.",
              variant: "destructive",
            });
          }
        }

        // If order is ready, show special notification
        if (fetchedOrder.orderStatus === "READY") {
          toast({
            title: "🎉 Your Order is Ready!",
            description: "Please collect your order from the restaurant",
          });
        }

        // If order is delivered, notify parent
        if (fetchedOrder.orderStatus === "DELIVERED" && onOrderDelivered) {
          onOrderDelivered(orderId);
        }
      }

      setPreviousStatus(fetchedOrder.orderStatus);
      setOrder(fetchedOrder);
      setLoading(false);
    } catch (error) {
      console.error("❌ Failed to fetch order status:", error.message);
      if (error.response?.status === 404) {
        console.warn("⚠️ Order not found");
      }
    }
  };

  // Poll for status updates
  useEffect(() => {
    if (!orderId) return;

    // Fetch immediately
    fetchOrderStatus();

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(() => {
      if (pollingActive) {
        fetchOrderStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, pollingActive]);

  // Stop polling when order is delivered
  useEffect(() => {
    if (order?.orderStatus === "DELIVERED") {
      setPollingActive(false);
    }
  }, [order?.orderStatus]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500">
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Loading your order status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-red-500">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-slate-300">Could not load order details</p>
        </CardContent>
      </Card>
    );
  }

  const currentConfig = statusConfig[order.orderStatus] || statusConfig.PLACED;
  const isCompleted = order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED";

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Order #{order.orderId}</CardTitle>
              <CardDescription>Order Status Updates</CardDescription>
            </div>
            <Badge className={`${currentConfig.color} text-white text-lg px-4 py-2`}>
              {currentConfig.icon} {currentConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Timeline */}
          <div className="space-y-4">
            {Object.entries(statusConfig).map(([status, config], index) => {
              const statusOrder = ["PLACED", "CONFIRMED", "ACCEPTED", "READY", "DELIVERED"];
              if (!statusOrder.includes(status)) return null;

              const isActive = order.orderStatus === status;
              const isPast = statusOrder.indexOf(order.orderStatus) >= statusOrder.indexOf(status);

              return (
                <div key={status} className="flex items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      isPast ? "bg-green-500 text-white" : "bg-slate-700 text-slate-400"
                    } ${isActive ? "ring-2 ring-amber-400 scale-110" : ""}`}
                  >
                    {isPast ? "✓" : config.icon[0]}
                  </div>
                  <div className="flex-grow">
                    <p
                      className={`font-semibold ${
                        isPast ? "text-green-400" : isActive ? "text-amber-400" : "text-slate-400"
                      }`}
                    >
                      {config.label}
                    </p>
                    <p className="text-sm text-slate-400">{config.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Details */}
          <div className="border-t border-slate-700 pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">Customer ID</p>
                <p className="text-white font-semibold">{order.customerId}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Restaurant ID</p>
                <p className="text-white font-semibold">{order.restaurantId}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Amount</p>
                <p className="text-white font-semibold">₹{order.subTotal?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Order Time</p>
                <p className="text-white font-semibold text-xs">
                  {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "N/A"}
                </p>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-2">Items</p>
                <div className="bg-slate-700/50 rounded p-3 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-sm text-slate-300 flex justify-between">
                      <span>{item.itemName}</span>
                      <span className="text-slate-400">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ready/Delivered Message */}
          {order.orderStatus === "READY" && (
            <div className="bg-green-500/20 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-300 font-semibold">🎉 Your order is ready!</p>
              <p className="text-green-200 text-sm mt-1">Please collect from the restaurant counter</p>
            </div>
          )}

          {order.orderStatus === "DELIVERED" && (
            <div className="bg-emerald-500/20 border-l-4 border-emerald-500 p-4 rounded">
              <p className="text-emerald-300 font-semibold">✨ Order completed!</p>
              <p className="text-emerald-200 text-sm mt-1">Thank you for ordering with us</p>
            </div>
          )}

          {/* Auto-refresh indicator */}
          {!isCompleted && (
            <div className="text-center text-xs text-slate-500">
              <Clock className="inline h-3 w-3 mr-1 animate-spin" />
              Auto-refreshing every 5 seconds...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderTracker;
