import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleOAuthLogin = async () => {
    setLoading(true);

    try {
      // TODO: Implement OAuth flow with your Java backend
      // This is a placeholder - replace with actual OAuth implementation

      toast({
        title: "OAuth Configuration Required",
        description: "Please configure your OAuth provider credentials.",
        variant: "destructive",
      });

      // Example of successful login (remove this when implementing real OAuth):
      // const userData = { id: '1', name: 'John Doe', role: 'customer', email: 'john@example.com' };
      // const token = 'your-jwt-token';
      // login(userData, token);
      // navigate('/customer');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account using OAuth
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={handleOAuthLogin}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? "Connecting..." : "Sign in with OAuth"}
            </Button>

            <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
              <p className="text-sm text-warning-foreground">
                <strong>Setup Required:</strong> Configure your OAuth provider
                in the API configuration.
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/register")}
                >
                  Register as Customer
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
