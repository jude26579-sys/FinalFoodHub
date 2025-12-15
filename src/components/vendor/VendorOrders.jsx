import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
 
export const VendorOrders = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
 
  // Fetch orders for vendor's restaurants from the backend
  const fetchVendorOrders = async () => {
    if (!user || !user.id) {
      console.warn("❌ User not authenticated");
      return;
    }
 
    console.log("🔄 Fetching orders for vendor:", user.id);
    setLoading(true);
   
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
        toast({
          title: "⚠️ Authentication Error",
          description: "Please login again to view orders.",
          variant: "destructive",
        });
        return;
      }
 
      // Fetch orders confirmed status (CONFIRMED or later) for vendor's restaurants
      const response = await axios.get(
        "http://localhost:8083/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
     
      console.log("✅ Orders response:", response.data);
     
      // Filter orders for this vendor's restaurants and map to vendor format
      let vendorOrders = Array.isArray(response.data) ? response.data : [];
     
      // Map order statuses to vendor-friendly statuses
      vendorOrders = vendorOrders
        .filter(order => order.orderStatus &&
                         (order.orderStatus === 'CONFIRMED' ||
                          order.orderStatus === 'ACCEPTED' ||
                          order.orderStatus === 'READY' ||
                          order.orderStatus === 'DELIVERED'))
        .map(order => ({
          orderId: order.orderId,
          customerId: order.customerId,
          restaurantId: order.restaurantId,
          cartId: order.cartId,
          items: order.items && order.items.length > 0
            ? order.items.map(item => {
                const itemName = item.itemName || item.name || item.menuItemName || 'Unknown Item';
                const quantity = item.quantity || 1;
                return `${itemName} x${quantity}`;
              }).join(', ')
            : 'No items information',
          itemsList: order.items && order.items.length > 0
            ? order.items.map(item => ({
                name: item.itemName || item.name || item.menuItemName || 'Unknown Item',
                quantity: item.quantity || 1,
                price: item.price || 0
              }))
            : [],
          totalPrice: order.subTotal || 0,
          status: mapOrderStatus(order.orderStatus),
          createdAt: order.createdAt,
          orderStatus: order.orderStatus,
        }));
     
      console.log("📋 Processed vendor orders:", vendorOrders);
      setOrders(vendorOrders);
      toast({
        title: "✅ Orders Loaded",
        description: `Found ${vendorOrders.length} orders. Click Refresh to check for new orders.`,
      });
    } catch (error) {
      console.error("❌ Failed to fetch orders:", error);
      toast({
        title: "⚠️ Error Loading Orders",
        description: "Could not fetch orders. Please try again.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
 
  // Map order status from database format to vendor format
  const mapOrderStatus = (dbStatus) => {
    const statusMap = {
      'PLACED': 'pending',
      'CONFIRMED': 'pending',
      'ACCEPTED': 'accepted',
      'READY': 'ready',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
    };
    return statusMap[dbStatus] || 'pending';
  };
 
  // Map vendor status to database format
  const mapToDBStatus = (vendorStatus) => {
    const statusMap = {
      'pending': 'CONFIRMED',
      'accepted': 'ACCEPTED',
      'ready': 'READY',
      'delivered': 'DELIVERED',
      'cancelled': 'CANCELLED',
    };
    return statusMap[vendorStatus] || 'CONFIRMED';
  };
 
  // Update order status (Frontend Only - No Backend Call)
  const updateStatus = async (orderId, newStatus) => {
    if (!user || !user.id) {
      toast({
        title: "⚠️ Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }
 
    try {
      console.log("🔄 Updating order", orderId, "to status:", newStatus);
 
      // Update local state immediately
      setOrders(orders.map((order) =>
        order.orderId === orderId ? { ...order, status: newStatus } : order
      ));
 
      // Store order status in localStorage for customer to see
      const orderStatusKey = `order_${orderId}_status`;
      localStorage.setItem(orderStatusKey, newStatus);
     
      // Also store a notification for the customer
      const customerNotificationKey = `order_${orderId}_notification`;
      let notificationMessage = '';
     
      if (newStatus === 'accepted') {
        notificationMessage = '✅ Order Accepted! Your food is being prepared.';
      } else if (newStatus === 'ready') {
        notificationMessage = '🍱 Order Ready! Please come and collect your food.';
      } else if (newStatus === 'delivered') {
        notificationMessage = '📦 Order Completed! Thank you for your order.';
      }
     
      localStorage.setItem(customerNotificationKey, notificationMessage);
      localStorage.setItem(`order_${orderId}_notification_time`, new Date().toISOString());
 
      toast({
        title: "✅ Status Updated",
        description: `Order #${orderId} updated to ${newStatus}`,
      });
 
      console.log("✅ Order status updated successfully (Frontend Only)");
      console.log("📢 Notification stored for customer:", notificationMessage);
    } catch (error) {
      console.error("❌ Failed to update order status:", error);
      toast({
        title: "⚠️ Error Updating Order",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };
 
  // Load orders on component mount only - NO automatic polling
  useEffect(() => {
    if (user && user.id) {
      fetchVendorOrders();
      // Removed automatic polling - vendor must manually refresh to see new orders
    }
  }, [user]);
 
  // Enhanced storage event listener to detect order status changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.includes('order_') && e.key.includes('_status')) {
        console.log("📝 Order status updated in localStorage:", e.key, "=", e.newValue);
        // Re-fetch orders to get latest status
        if (user && user.id) {
          fetchVendorOrders();
        }
      }
    };
 
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);
 
  // Auto-save order statuses to localStorage when orders are loaded or changed
  useEffect(() => {
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        const statusKey = `order_${order.orderId}_status`;
        localStorage.setItem(statusKey, order.status);
        console.log(`💾 Saved order ${order.orderId} status to localStorage: ${order.status}`);
      });
    }
  }, [orders]);
 
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVendorOrders();
    setRefreshing(false);
  };
 
  const handleAcceptOrder = (orderId) => {
    updateStatus(orderId, 'accepted');
  };
 
  const handleMarkReady = (orderId) => {
    updateStatus(orderId, 'ready');
    // Notify customer via WebSocket/polling (customer dashboard will check status)
  };
 
  const handleMarkDelivered = (orderId) => {
    updateStatus(orderId, 'delivered');
  };
 
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Incoming Orders</h2>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
     
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading your orders...</p>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No pending orders at the moment</p>
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => {
          // Read status from localStorage FIRST, fallback to backend status
          const storedStatus = localStorage.getItem(`order_${order.orderId}_status`);
          const displayStatus = storedStatus || order.status || mapOrderStatus(order.orderStatus);
         
          return (
            <Card key={order.orderId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Order #{order.orderId}</CardTitle>
                  <CardDescription>Customer ID: {order.customerId} | Restaurant: {order.restaurantId}</CardDescription>
                  <CardDescription className="text-xs mt-1">
                    Order Date: {new Date(order.createdAt).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge
                  variant={displayStatus === 'pending' ? 'secondary' : displayStatus === 'ready' ? 'default' : 'outline'}
                  className="gap-1 capitalize"
                >
                  <Clock className="h-4 w-4" />
                  {displayStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Items:</p>
                  {order.itemsList && order.itemsList.length > 0 ? (
                    <div className="bg-gray-50 rounded p-2 space-y-1">
                      {order.itemsList.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name} <span className="text-gray-500">x{item.quantity}</span>
                          </span>
                          {item.price > 0 && <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">{order.items}</p>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Total: ₹{order.totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {displayStatus === 'pending' && (
                  <Button
                    onClick={() => handleAcceptOrder(order.orderId)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ✅ Accept Order
                  </Button>
                )}
                {displayStatus === 'accepted' && (
                  <Button
                    onClick={() => handleMarkReady(order.orderId)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    🍱 Order Ready
                  </Button>
                )}
                {displayStatus === 'ready' && (
                  <Button
                    onClick={() => handleMarkDelivered(order.orderId)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    📦 Delivered
                  </Button>
                )}
                {displayStatus === 'delivered' && (
                  <Badge variant="default" className="bg-green-600">
                    ✓ Completed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })
      )}
    </div>
  );
};
 
 