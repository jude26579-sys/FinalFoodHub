import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, User } from "lucide-react";
import axios from "axios";
 
const CustomerProfile = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    fetchCustomerProfile();
  }, []);
 
  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const customerId = localStorage.getItem("customerId");
 
      if (!customerId) {
        setError("Customer ID not found");
        return;
      }
 
      const response = await axios.get(
        `http://localhost:8080/customer/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
 
      setCustomer(response.data);
    } catch (err) {
      console.error("Failed to fetch customer profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin mb-6">
              <div className="h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full"></div>
            </div>
            <p className="text-gray-600 font-medium text-lg">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-6 font-semibold text-lg">{error}</p>
            <Button onClick={() => navigate("/customer")}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
 
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* HEADER WITH BACK BUTTON */}
        <div className="flex items-center gap-4 mb-16">
          <button
            onClick={() => navigate("/customer")}
            className="p-3 hover:bg-white rounded-full transition-all duration-200 hover:shadow-lg"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-5xl font-black text-gray-900">My Profile</h1>
            <p className="text-gray-500 text-base mt-2 font-medium">View your account details</p>
          </div>
        </div>
 
        {/* MAIN PROFILE CARD */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
         
          {/* GRADIENT HEADER SECTION */}
          <div className="h-32 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
 
          {/* PROFILE CONTENT */}
          <div className="px-12 pb-12">
           
            {/* AVATAR AND NAME SECTION */}
            <div className="flex flex-col items-center -mt-20 mb-14">
              <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-2xl border-4 border-white mb-6">
                <span className="text-6xl font-black text-white">
                  {customer?.name?.[0]?.toUpperCase() || "C"}
                </span>
              </div>
             
              <h2 className="text-4xl font-black text-gray-900 text-center">
                {customer?.name}
              </h2>
              <p className="text-orange-600 font-bold text-sm mt-3 uppercase tracking-widest">Welcome</p>
            </div>
 
            {/* DIVIDER */}
            <div className="h-1 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 rounded-full mb-12"></div>
 
            {/* PROFILE FIELDS */}
            <div className="space-y-12">
             
              {/* NAME FIELD */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-orange-100 rounded-2xl">
                    <User className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <label className="block text-sm font-black text-gray-600 mb-4 uppercase tracking-widest">
                  Full Name
                </label>
                <p className="text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                  {customer?.name}
                </p>
              </div>
 
              {/* EMAIL FIELD */}
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-orange-100 rounded-2xl">
                    <Mail className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <label className="block text-sm font-black text-gray-600 mb-4 uppercase tracking-widest">
                  Email Address
                </label>
                <p className="text-2xl font-bold text-gray-800 break-all">
                  {customer?.email}
                </p>
              </div>
 
            </div>
 
          </div>
        </div>
 
        {/* FOOTER INFO */}
        <div className="text-center mt-16">
          <p className="text-gray-500 font-medium">
            Secured and encrypted • Your account is protected
          </p>
        </div>
 
      </div>
    </div>
  );
};
 
export default CustomerProfile;
 
 