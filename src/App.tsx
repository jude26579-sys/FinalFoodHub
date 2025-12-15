

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import AuthDemo from "./pages/AuthDemo";
import AuthCallback from "./pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CustomerDashboard from "./pages/CustomerDashboard";
import { RestaurantMenu } from "@/components/customer/RestaurantMenu";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Cart from "./pages/Cart";
import CheckoutDetails from "./pages/customer/CheckoutDetails";
import OrderConfirmation from "./pages/customer/OrderConfirmation";
import Payment from "./pages/customer/Payment";
import CustomerProfile from "./pages/customer/CustomerProfile";
import NotFound from "./pages/NotFound";
import RestaurantsList from "./pages/RestaurantsList";
import { AuthProvider } from "@/context/AuthContext";
import FeedbackForm from "@/components/customer/FeedbackForm";
import VendorFeedback from "@/components/vendor/VendorFeedback";
 
const queryClient = new QueryClient();
 
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
 
            {/* Customer Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/restaurants"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <RestaurantsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/cart"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/checkout"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <CheckoutDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/order-confirmation/:orderId"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <OrderConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/payment/:orderId"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <Payment />
                </ProtectedRoute>
              }
            />
            {/* Restaurant Menu - Accessible via /customer/restaurant/:id or /api/restaurants/:id */}
            <Route
              path="/customer/restaurant/:restaurantId"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <RestaurantMenu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api/restaurants/:id"
              element={
                <ProtectedRoute requiredRole={"customer"}>
                  <RestaurantMenu />
                </ProtectedRoute>
              }
            />
              <Route path="/feedback" element={<FeedbackForm />} />
 
            {/* Vendor Routes */}
            <Route
              path="/vendor"
              element={
                <ProtectedRoute requiredRole={"vendor"}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
 
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole={"admin"}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
 
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
 
export default App;
