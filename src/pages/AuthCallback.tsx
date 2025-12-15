import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
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

        // Exchange authorization code for access token
        console.log("=== Exchanging code for token ===");
        
        const tokenResponse = await axios.post(
          "http://localhost:9001/oauth2/token",
          new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "http://localhost:8084/auth/callback",
            client_id: `${userRole}client`, // e.g., customerclient, vendorclient, adminclient
            client_secret: userRole, // e.g., customer, vendor, admin
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        console.log("Token response received:", {
          access_token: tokenResponse.data.access_token ? "***" : "missing",
          token_type: tokenResponse.data.token_type,
          expires_in: tokenResponse.data.expires_in,
        });

        // Store the access token
        localStorage.setItem("accessToken", tokenResponse.data.access_token);
        if (tokenResponse.data.refresh_token) {
          localStorage.setItem("refreshToken", tokenResponse.data.refresh_token);
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

        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          const role = userRole?.toLowerCase() || "customer";
          console.log("Redirecting to:", `/${role}`);
          navigate(`/${role}`);
        }, 1500);
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
