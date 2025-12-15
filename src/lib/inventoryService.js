import axios from "axios";

/**
 * Monitor order status and update inventory when order is confirmed
 * @param {string} orderId - Order ID to monitor
 * @param {string} customerId - Customer ID
 * @param {Array} orderItems - Array of items in the order
 * @param {string} token - Authentication token
 * @param {Function} onStatusChanged - Callback when status changes
 * @returns {Function} Cleanup function to stop polling
 */
export const monitorOrderStatusAndUpdateInventory = (
  orderId,
  customerId,
  orderItems,
  token,
  onStatusChanged
) => {
  let pollCount = 0;
  const maxPolls = 60; // Poll for max 5 minutes (60 * 5 seconds)
  let inventoryUpdated = false;

  const pollInterval = setInterval(async () => {
    pollCount++;

    try {
      console.log(
        `� Polling order status (attempt ${pollCount}/${maxPolls})...`
      );

      // Fetch current order status
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

      const orderData = response.data;
      const currentStatus = orderData.orderStatus || orderData.status || "UNKNOWN";

      console.log(`� Current order status: ${currentStatus}`);

      // Notify about status change
      if (onStatusChanged) {
        onStatusChanged(currentStatus);
      }

      // If order is CONFIRMED and inventory not yet updated, update it now
      if (
        currentStatus === "CONFIRMED" &&
        !inventoryUpdated &&
        orderItems &&
        orderItems.length > 0
      ) {
        console.log(
          "✅ Order confirmed! Now updating inventory for ordered items..."
        );

        try {
          await updateInventoryAfterOrderConfirmed(orderItems, token);
          inventoryUpdated = true;
          console.log("✅ Inventory updated successfully after order confirmation");
        } catch (inventoryError) {
          console.error(
            "⚠️ Failed to update inventory after order confirmation:",
            inventoryError
          );
          // Don't stop polling if inventory update fails
        }
      }

      // Stop polling if order reaches a terminal state
      if (
        currentStatus === "CONFIRMED" ||
        currentStatus === "ACCEPTED" ||
        currentStatus === "READY" ||
        currentStatus === "DELIVERED" ||
        currentStatus === "CANCELLED"
      ) {
        if (inventoryUpdated || currentStatus !== "CONFIRMED") {
          console.log(
            `✅ Order reached terminal status: ${currentStatus}. Stopping polling.`
          );
          clearInterval(pollInterval);
        }
      }

      // Stop if max polls reached
      if (pollCount >= maxPolls) {
        console.warn("⚠️ Max polling attempts reached");
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error(
        `❌ Error polling order status (attempt ${pollCount}):`,
        error.message
      );

      // Stop polling after too many errors
      if (pollCount >= maxPolls) {
        console.warn("⚠️ Stopped polling due to repeated errors");
        clearInterval(pollInterval);
      }
    }
  }, 5000); // Poll every 5 seconds

  // Return cleanup function
  return () => {
    clearInterval(pollInterval);
    console.log("🛑 Order status polling stopped");
  };
};

/**
 * Update inventory when order is confirmed
 * Reduces quantity available for each item in the order
 * @param {Array} orderItems - Array of items ordered
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export const updateInventoryAfterOrderConfirmed = async (
  orderItems,
  token
) => {
  try {
    if (!orderItems || orderItems.length === 0) {
      console.log("⚠️ No items to update in inventory");
      return;
    }

    console.log(
      "📦 Starting inventory update for confirmed order items:",
      orderItems
    );

    // Process each item in the order
    for (const item of orderItems) {
      try {
        const itemId = item.itemId || item.id;
        const quantityOrdered = item.quantity || 1;

        console.log(
          `🔄 Reducing inventory for item ${itemId} by ${quantityOrdered}...`
        );

        // Prepare inventory update request
        const updateRequest = {
          itemId: itemId,
          quantityOrdered: quantityOrdered,
          restaurantId: item.restaurantId,
          categoryId: item.categoryId,
        };

        console.log("� Inventory update request:", updateRequest);

        // Call inventory service to reduce quantity
        const response = await axios.post(
          `http://localhost:8084/api/inventory/reduce`,
          updateRequest,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );

        console.log(
          `✅ Inventory reduced for item ${itemId}:`,
          response.data
        );
      } catch (error) {
        console.error(
          `❌ Failed to update inventory for item ${item.itemId || item.id}:`,
          error
        );
        // Continue with next item even if one fails
      }
    }

    console.log("✅ Inventory update completed for all items");
  } catch (error) {
    console.error(
      "❌ Error in updateInventoryAfterOrderConfirmed:",
      error
    );
    throw error;
  }
};

/**
 * Update inventory when order is successfully placed (for backward compatibility)
 * @param {Array} orderItems - Array of items ordered
 * @param {string} token - Authentication token
 * @returns {Promise<void>}
 */
export const updateInventoryAfterOrder = async (orderItems, token) => {
  // This is kept for backward compatibility but now just logs
  // The actual inventory update happens when order status becomes CONFIRMED
  console.log(
    "📝 updateInventoryAfterOrder called - actual update will happen when order is confirmed"
  );
  console.log("📦 Order items:", orderItems);
};
