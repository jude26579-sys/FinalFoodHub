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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

// Default demo credentials (no backend)
const DEFAULT_USERS = [
  {
    id: "demo-1",
    name: "Demo Customer",
    email: "demo@customer.com",
    password: "demo123",
    role: "customer",
  },
  {
    id: "demo-2",
    name: "Vendor User",
    email: "vendor@vendor.com",
    password: "vendor123",
    role: "vendor",
  },
  {
    id: "demo-3",
    name: "Admin User",
    email: "admin@admin.com",
    password: "admin123",
    role: "admin",
  },
];

const STORAGE_KEY = "demo_users_v1";

const loadDemoUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : [];

    // Merge stored users with defaults and dedupe by email (stored users take precedence)
    const map = new Map();
    if (Array.isArray(stored)) {
      stored.forEach((u) => map.set(u.email, u));
    }
    DEFAULT_USERS.forEach((u) => {
      if (!map.has(u.email)) map.set(u.email, u);
    });

    return Array.from(map.values());
  } catch (e) {
    return DEFAULT_USERS;
  }
};

const saveDemoUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    // ignore
  }
};

const AuthDemo = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const users = loadDemoUsers();

      const found = users.find(
        (u) => u.email === loginForm.email && u.password === loginForm.password
      );

      if (!found) {
        toast({
          title: "Login failed",
          description: "Invalid credentials for demo user",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Remove password before storing in context
      const { password, ...userSafe } = found;
      login(userSafe, "demo-token");
      toast({
        title: "Signed in",
        description: `Welcome back, ${userSafe.name}`,
      });
      setLoading(false);
      // Redirect by role
      if (userSafe.role === "vendor") {
        navigate("/vendor");
      } else if (userSafe.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/customer");
      }
    }, 500);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const users = loadDemoUsers();
      const exists = users.find((u) => u.email === regForm.email);
      if (exists) {
        toast({
          title: "Registration failed",
          description: "Email already used",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const newUser = {
        id: `demo-${Date.now()}`,
        name: regForm.name || "Demo Customer",
        email: regForm.email,
        password: regForm.password,
        role: "customer",
      };

      const next = [
        newUser,
        ...users.filter((u) => u.email !== HARDCODED_USER.email),
      ];
      saveDemoUsers(next);

      toast({
        title: "Registration successful",
        description: "You can now sign in with your credentials",
      });
      setLoading(false);
      setMode("login");
      setLoginForm({ email: newUser.email, password: newUser.password });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Demo Authentication</CardTitle>
            <CardDescription>
              This is a frontend-only demo. Use the hardcoded user or register
              locally.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex gap-2 justify-center">
              <Button
                variant={mode === "login" ? "default" : "ghost"}
                onClick={() => setMode("login")}
              >
                Sign In
              </Button>
              <Button
                variant={mode === "register" ? "default" : "ghost"}
                onClick={() => setMode("register")}
              >
                Register
              </Button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-sm text-muted-foreground">
                  Try the demo user:{" "}
                  <strong>demo@customer.com / demo123</strong>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={regForm.name}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={regForm.email}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={regForm.password}
                    onChange={handleRegChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDemo;
