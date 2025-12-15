import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, RefreshCw, Truck, ChefHat, Package, ShoppingCart, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
 
export const CustomerOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState({});
  const [isTabActive, setIsTabActive] = useState(true);
  const tabVisibilityRef = useRef(true);
  const navigate = useNavigate();
 
  // 🚀 Navigate to Feedback Page
  const goToFeedback = (order) => {
    navigate('/feedback', {
      state: {
        orderId: order.orderId,
        restaurantId: order.restaurantId,
        customerId: user.id,
        items: order.items.map(item => ({
          itemId: item.itemId,
          itemName: item.name
        })),
      },
    });
  };
 
  // ⚡ Fetch customer orders
  const fetchCustomerOrders = async () => {
    if (!user || !user.id) return;
 
    setLoading(true);
    try {
      let token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("sessionId");
 
      const response = await axios.get(
        `http://localhost:8083/api/orders/customer/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
 
      let customerOrders = Array.isArray(response.data) ? response.data : [];
 
      customerOrders = customerOrders
        .map(order => {
          const storedStatus = localStorage.getItem(`order_${order.orderId}_status`);
          const displayStatus = storedStatus || order.orderStatus;
 
          // ⭐ FIX: Keep itemId in the mapping
          let itemsWithPrice = [];
          if (order.items && order.items.length > 0) {
            itemsWithPrice = order.items.map(item => {
              const itemPrice = item.unitPrice || item.price || 0;
              const itemTotal = itemPrice * (item.quantity || 1);
              return {
                itemId: item.itemId || item.id || item.menuItemId,
                name: item.itemName || item.name || "Unknown Item",
                quantity: item.quantity || 1,
                price: itemPrice,
                total: itemTotal,
              };
            });
          }
 
          let totalPrice = order.subTotal || order.totalPrice || 0;
          if (totalPrice === 0 && itemsWithPrice.length > 0) {
            totalPrice = itemsWithPrice.reduce((sum, item) => sum + item.total, 0);
          }
 
          return {
            orderId: order.orderId,
            restaurantId: order.restaurantId,
            items: itemsWithPrice,
            totalPrice,
            status: displayStatus || "PLACED",
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
      setOrders(customerOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
 
  // Load on mount
  useEffect(() => {
    if (user && user.id) {
      fetchCustomerOrders();
    }
  }, [user]);
 
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerOrders();
    setRefreshing(false);
  };
 
  // 📦 Status Display
  const getStatusDisplay = (status) => {
    const normalized = status.toUpperCase();
    const map = {
      PLACED: { icon: <Clock />, text: "Order Placed", color: "bg-blue-100 text-blue-800" },
      CONFIRMED: { icon: <CheckCircle />, text: "Confirmed", color: "bg-purple-100 text-purple-800" },
      ACCEPTED: { icon: <ChefHat />, text: "Being Prepared", color: "bg-yellow-100 text-yellow-800" },
      READY: { icon: <Package />, text: "Ready to Collect", color: "bg-green-100 text-green-800" },
      DELIVERED: { icon: <Truck />, text: "Delivered", color: "bg-green-600 text-white" },
      CANCELLED: { icon: <XCircle />, text: "Cancelled", color: "bg-red-100 text-red-800" },
    };
    return map[normalized] || map["PLACED"];
  };
 
  if (loading && orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </CardContent>
      </Card>
    );
  }
 
  return (
    <div className="space-y-4" data-orders-component>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            My Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {orders.length === 0 ? "No orders yet" : `${orders.length} orders`}
          </p>
        </div>
 
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
 
      {orders.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-orange-400" />
            <p className="text-muted-foreground text-lg font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start ordering from your favorite restaurants!
            </p>
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => {
          const statusDisplay = getStatusDisplay(order.status);
 
          return (
            <Card key={order.orderId} className="border-0 shadow-xl bg-white hover:shadow-2xl">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b">
                <div className="flex justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">Order #{order.orderId}</h3>
                  <Badge className={`px-4 py-2 text-base font-semibold ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </Badge>
                </div>
              </div>
 
              <CardContent className="pt-6">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">Items</h4>
 
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500">₹{item.price} × {item.quantity}</p>
                    </div>
 
                    <p className="font-bold text-orange-600">₹{item.total}</p>
                  </div>
                ))}
 
                {/* ⭐ Leave Feedback Button (ONLY FOR DELIVERED ORDERS) */}
                {["DELIVERED", "delivered"].includes(order.status) && (
                  <Button
                    onClick={() => goToFeedback(order)}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white w-full"
                  >
                    Leave Feedback
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
 