import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
 
const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
 
  const [form, setForm] = useState({ email: "", password: "" });
 
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
 
    try {
      console.log("=== Step 1: Authenticating with AuthServer ===");
      console.log("Email:", form.email);
     
      // Step 1: Try generic login endpoint first, which will determine the actual role
      // This works for all user types: customer, vendor, admin
      let authResponse;
      try {
        // Try generic login endpoint (should work for all roles)
        authResponse = await axios.post(
          "http://localhost:9001/auth/login",
          {
            email: form.email,
            password: form.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
      } catch (genericError) {
        // Fallback: try customer endpoint (for backwards compatibility)
        console.log("Generic endpoint failed, trying customer endpoint...");
        authResponse = await axios.post(
          "http://localhost:9001/auth/login/customer",
          {
            email: form.email,
            password: form.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
      }
 
      console.log("=== Step 1 Success ===", authResponse.data);
 
      if (authResponse.data.status === "success") {
        // Get the actual role from response (IMPORTANT: This will be admin, vendor, or customer based on the user)
        const userRole = authResponse.data.role || "customer";
        const userEmail = authResponse.data.email || form.email;
       
        console.log("User role from server:", userRole);
       
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("sessionId", authResponse.data.sessionId);
 
        toast({
          title: "Authenticated",
          description: `Welcome, ${userEmail}!`,
        });
 
        console.log("=== Step 2: Redirecting to OAuth2 Authorization Endpoint ===");
 
        // Step 2: Use the appropriate client based on the actual role received from server
        // This is CRITICAL: We must use the right client (adminclient, vendorclient, or customerclient)
        const clientId = `${userRole.toLowerCase()}client`; // e.g., adminclient, vendorclient, customerclient
       
        const authorizeUrl = `http://localhost:9001/oauth2/authorize?client_id=${clientId}&response_type=code&scope=read%20write&redirect_uri=http://localhost:8084/auth/callback&state=xyz`;
        console.log("Redirecting to authorize endpoint with client:", clientId);
        console.log("Authorization URL:", authorizeUrl);
        window.location.href = authorizeUrl;
      }
    } catch (error) {
      console.error("Login error details:", error);
      let errorMessage = "Login failed";
     
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.response?.status === 403) {
        errorMessage = "User does not have required role";
      } else if (error.message === "Network Error") {
        errorMessage = "Cannot connect to services. Please check if UserService and AuthServer are running.";
      } else if (error.message) {
        errorMessage = error.message;
      }
 
      toast({
        title: "Login failed",
        description: errorMessage || "Please try again",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
 
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{
        backgroundImage: "url('/bg.jpg')",
      }}
    >
      <Navbar />
 
      {/* Overlay to darken background for better contrast. Use pointer-events-none so it doesn't block clicks. */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>
 
      <div className="relative container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card
          className="
            w-full max-w-md
            min-h-[480px]
            bg-white
            shadow-2xl
            border-0
            rounded-2xl
            overflow-hidden
          "
        >
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-8">
            <CardHeader className="text-center p-0">
              <CardTitle className="text-4xl font-bold text-white">
                Sign In
              </CardTitle>
            </CardHeader>
          </div>
 
          <CardContent className="space-y-6 p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-800"
                />
              </div>
 
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-800"
                />
              </div>
 
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all duration-200"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
 
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have an account?
              </p>
              <Button
                variant="link"
                className="text-orange-600 hover:text-orange-700 font-semibold"
                onClick={() => navigate("/register")}
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
 
export default Auth;
 
 