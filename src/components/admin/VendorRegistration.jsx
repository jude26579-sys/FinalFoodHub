import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Vendor registration component that saves to backend database
export const VendorRegistration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isFetchingVendors, setIsFetchingVendors] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If editing, call handleUpdate instead
    if (editingVendor) {
      return handleUpdate(e);
    }

    setLoading(true);

    try {
      // Validation
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error("All fields are required");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      console.log("=== Registering vendor ===");
      console.log("Email:", formData.email);

      // Get JWT token from localStorage (try multiple key names)
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }
      
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Call backend vendor registration endpoint with Authorization header
      const response = await axios.post(
        "http://localhost:8080/vendor/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Registration response:", response.data);
      console.log("Registration status:", response.status);

      if (response.status === 201 || response.status === 200) {
        toast({
          title: "✅ Vendor Registered Successfully",
          description: `${formData.name} has been registered with email ${formData.email}`,
        });

        // Reset form
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        setShowRegistrationForm(false);

        // Refresh vendor list after a short delay to ensure DB is updated
        setTimeout(() => {
          fetchVendors();
        }, 500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";

      // Handle different error types
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Invalid input. Please check your data.";
        } else if (error.response.status === 401) {
          errorMessage = "Unauthorized. Your session may have expired. Please login again.";
        } else if (error.response.status === 403) {
          errorMessage = "Forbidden. You don't have permission to register vendors.";
        } else if (error.response.status === 409) {
          errorMessage = error.response.data?.message || "Vendor with this email already exists.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        errorMessage = "No response from server. Please check your connection.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      setIsFetchingVendors(true);
      console.log("Fetching vendors...");
      
      // Get JWT token from localStorage (try multiple key names)
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }
      
      if (!token) {
        console.warn("No auth token found, cannot fetch vendors");
        toast({
          title: "⚠️ Authentication Required",
          description: "Please login again to view vendors.",
          variant: "destructive",
        });
        setVendors([]);
        return;
      }

      console.log("Token found, fetching vendors from API...");
      
      // Try fetching from the UserService directly
      const response = await axios.get(
        "http://localhost:8080/vendor/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
      
      console.log("Vendors fetch response status:", response.status);
      console.log("Vendors fetch response data:", response.data);
      console.log("Response data type:", typeof response.data);
      
      // Handle both array response and object with data property
      let vendorList = [];
      if (Array.isArray(response.data)) {
        vendorList = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        vendorList = response.data.data;
      } else if (typeof response.data === 'object') {
        // Try to extract array from response object
        vendorList = Object.values(response.data).filter(item => Array.isArray(item))[0] || [];
      }
      
      setVendors(vendorList);
      console.log(`✅ Successfully fetched ${vendorList.length} vendors`);
      
      if (vendorList.length === 0) {
        console.info("No vendors found in database");
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      if (error.response) {
        console.error("Fetch error status:", error.response.status);
        console.error("Fetch error data:", error.response.data);
        
        if (error.response.status === 401) {
          toast({
            title: "🔐 Unauthorized",
            description: "Your session has expired. Please login again.",
            variant: "destructive",
          });
        } else if (error.response.status === 403) {
          toast({
            title: "🚫 Forbidden",
            description: "You don't have permission to view vendors.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "❌ Error Loading Vendors",
            description: `Server error: ${error.response.status}`,
            variant: "destructive",
          });
        }
      } else if (error.request) {
        console.error("No response received for vendor fetch:", error.request);
        toast({
          title: "❌ Connection Error",
          description: "Could not reach the server. Please check your connection.",
          variant: "destructive",
        });
      } else {
        console.error("Error:", error.message);
      }
      // Don't clear vendors list on error - keep showing previously fetched data
    } finally {
      setIsFetchingVendors(false);
    }
  };

  // Fetch vendors on component mount
  useEffect(() => {
    console.log("VendorRegistration component mounted, fetching vendors...");
    fetchVendors();
  }, []);

  // Handle Edit
  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      password: "",
      confirmPassword: "",
    });
    setShowRegistrationForm(true);
  };

  // Handle Delete
  const handleDelete = async (vendorId) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) {
      return;
    }

    setIsDeleting(vendorId);
    try {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      const response = await axios.delete(
        `http://localhost:8080/vendor/${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast({
          title: "✅ Vendor Deleted",
          description: "The vendor has been successfully deleted.",
        });
        fetchVendors();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "❌ Delete Failed",
        description: error.response?.data?.message || "Failed to delete vendor",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        token = localStorage.getItem("authToken");
      }
      if (!token) {
        token = localStorage.getItem("sessionId");
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.put(
        `http://localhost:8080/vendor/${editingVendor.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "✅ Vendor Updated Successfully",
          description: `${formData.name} has been updated.`,
        });

        setEditingVendor(null);
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        setShowRegistrationForm(false);

        setTimeout(() => {
          fetchVendors();
        }, 500);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "❌ Update Failed",
        description: error.response?.data?.message || "Failed to update vendor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Vendor Management</h2>
        <Button
          onClick={() => {
            setEditingVendor(null);
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
            setShowRegistrationForm(!showRegistrationForm);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showRegistrationForm ? "Cancel" : "➕ Register New Vendor"}
        </Button>
      </div>

      {/* Registration/Edit Form */}
      {showRegistrationForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>{editingVendor ? "Edit Vendor" : "Register New Vendor"}</CardTitle>
            <CardDescription>
              {editingVendor ? "Update vendor information" : "Create a new vendor account that will be saved to the database"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input
                  id="vendor-name"
                  name="name"
                  placeholder="e.g., Gourmet Pizzeria"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-email">Email Address</Label>
                <Input
                  id="vendor-email"
                  name="email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-password">Password</Label>
                <Input
                  id="vendor-password"
                  name="password"
                  type="password"
                  placeholder={editingVendor ? "Leave blank to keep current password" : "Minimum 8 characters"}
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingVendor}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-confirm-password">Confirm Password</Label>
                <Input
                  id="vendor-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder={editingVendor ? "Leave blank to keep current password" : "Re-enter password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!editingVendor}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (editingVendor ? "Updating..." : "Registering...") : (editingVendor ? "Update Vendor" : "Register Vendor")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vendors List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Registered Vendors</h3>
          <Button 
            onClick={fetchVendors}
            disabled={isFetchingVendors}
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            {isFetchingVendors ? "Loading..." : "🔄 Refresh"}
          </Button>
        </div>
        {vendors.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No vendors registered yet. Click "Register New Vendor" to add one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <div 
                key={vendor.id}
                className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-5 border-b-4 border-orange-700">
                  <h3 className="text-2xl font-bold text-white">{vendor.name}</h3>
                  <p className="text-orange-100 text-sm font-semibold mt-1">🏪 Vendor</p>
                </div>

                {/* Content Section */}
                <div className="p-6 bg-white space-y-4">
                  {/* Email Box */}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-600">
                    <p className="text-xs uppercase font-bold text-orange-700 tracking-widest">📧 Email</p>
                    <p className="text-gray-800 font-bold text-lg mt-1 break-all">{vendor.email}</p>
                  </div>

                  {/* ID Box */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-600">
                    <p className="text-xs uppercase font-bold text-blue-700 tracking-widest">🔑 Vendor ID</p>
                    <p className="text-gray-800 font-bold text-lg mt-1 font-mono">{vendor.id}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t-2 border-orange-200 flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(vendor)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all duration-200"
                    >
                      ✏️ Edit
                    </Button>
                    <Button 
                      size="sm" 
                      disabled={isDeleting === vendor.id}
                      onClick={() => handleDelete(vendor.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all duration-200"
                    >
                      {isDeleting === vendor.id ? "Deleting..." : "🗑️ Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
