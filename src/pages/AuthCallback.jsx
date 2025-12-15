import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL immediately
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        console.log("=== OAuth2 Callback ===");
        console.log("Authorization Code:", code);
        console.log("State:", state);

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Get stored session info
        const userEmail = localStorage.getItem("userEmail");
        const userRole = localStorage.getItem("userRole");
        const sessionId = localStorage.getItem("sessionId");

        console.log("Retrieved from localStorage:");
        console.log("Email:", userEmail);
        console.log("Role:", userRole);
        console.log("SessionId:", sessionId);

        if (!userEmail || !userRole) {
          throw new Error("Session info missing. Please login again.");
        }

        // Exchange authorization code for access token IMMEDIATELY (no delays)
        console.log("=== Exchanging code for token ===");
        
        const clientId = `${userRole}client`; // e.g., customerclient, vendorclient, adminclient
        const clientSecret = userRole; // e.g., customer, vendor, admin
        
        // Try both Basic Auth and form parameter approaches
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', 'http://localhost:8084/auth/callback');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        
        console.log("Sending token request with:");
        console.log("Client ID:", clientId);
        console.log("Redirect URI: http://localhost:8084/auth/callback");
        console.log("Authorization Code:", code);
        
        // Try with client credentials in request body (form parameters) first
        const tokenResponse = await axios.post(
          "http://localhost:9001/oauth2/token",
          params.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            withCredentials: true, // Include session cookies
          }
        );

        console.log("Token response received:", {
          access_token: tokenResponse.data.access_token ? "***" : "missing",
          token_type: tokenResponse.data.token_type,
          expires_in: tokenResponse.data.expires_in,
        });

        // Decode JWT token to extract customer ID
        const decodedToken = jwtDecode(tokenResponse.data.access_token);
        console.log("🔍 Decoded JWT Token:", decodedToken);
        const customerId = decodedToken.id;
        
        if (!customerId) {
          console.warn("⚠️ Customer ID not found in JWT token");
        } else {
          console.log("✅ Customer ID extracted from token:", customerId);
        }

        // Store the access token
        localStorage.setItem("accessToken", tokenResponse.data.access_token);
        if (tokenResponse.data.refresh_token) {
          localStorage.setItem("refreshToken", tokenResponse.data.refresh_token);
        }
        
        // Store customer ID from JWT token
        if (customerId) {
          localStorage.setItem("customerId", customerId.toString());
          console.log("✅ Customer ID stored in localStorage:", customerId);
        }

        console.log("=== Token stored in localStorage ===");

        // Call login context to update auth state
        if (login) {
          login(userEmail, userRole, tokenResponse.data.access_token);
        }

        toast({
          title: "Login Successful",
          description: `Welcome back, ${userEmail}!`,
        });

        console.log("=== Redirecting to dashboard ===");

        // Redirect to appropriate dashboard based on role (no delay needed)
        const role = userRole?.toLowerCase() || "customer";
        console.log("Redirecting to:", `/${role}`);
        navigate(`/${role}`);
      } catch (error) {
        console.error("=== Callback Error ===", error);
        let errorMessage = "Authentication failed";

        if (axios.isAxiosError(error)) {
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.error_description) {
            errorMessage = error.response.data.error_description;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });

        // Redirect back to login
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Completing authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we process your login</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800">Redirecting...</h2>
        <p className="text-gray-600 mt-2">If you are not redirected, <a href="/auth" className="text-orange-500 hover:underline">click here</a></p>
      </div>
    </div>
  );
};

export default AuthCallback;
