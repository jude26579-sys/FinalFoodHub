import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, User, Settings, LogOut } from "lucide-react";
import { NavLink } from "./NavLink";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
 
export const Navbar = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  let auth = null;
  try {
    auth = useAuth();
  } catch (e) {
    // If AuthProvider not yet mounted, skip auth usage
  }
 
  const isAuthenticated = auth?.isAuthenticated;
  const isCustomer = auth?.isCustomer;
  const isVendor = auth?.isVendor;
  const isAdmin = auth?.isAdmin;
 
  const handleLogout = () => {
    auth?.logout();
    navigate("/auth");
  };
 
  const handleSettings = () => {
    navigate("/customer/profile");
    setShowProfileMenu(false);
  };
 
  const logoTo = isAuthenticated
    ? isAdmin
      ? "/admin"
      : isVendor
      ? "/vendor"
      : "/customer"
    : "/";
 
  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to={logoTo}
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          <UtensilsCrossed className="h-6 w-6" />
          FoodHub
        </Link>
 
        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <>
              <NavLink to="/auth">Sign In</NavLink>
              <NavLink to="/register">Sign Up</NavLink>
              {/* <NavLink to="/demo-auth">Demo Auth</NavLink> */}
            </>
          )}
 
          {isAuthenticated && isCustomer && (
            <>
              <NavLink to="/customer">Customer</NavLink>
            </>
          )}
 
          {isAuthenticated && isVendor && (
            <>
              <NavLink to="/vendor">Vendor</NavLink>
            </>
          )}
 
          {isAuthenticated && isAdmin && (
            <>
              <NavLink to="/admin">Admin</NavLink>
            </>
          )}
 
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                title="Profile"
              >
                <User className="h-6 w-6 text-gray-700" />
              </button>
 
              {/* PROFILE DROPDOWN MENU */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {/* SETTINGS OPTION */}
                  {isCustomer && (
                    <button
                      onClick={handleSettings}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors text-left border-b border-gray-200"
                    >
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-700">Settings</span>
                    </button>
                  )}
 
                  {/* LOGOUT OPTION */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
 
 