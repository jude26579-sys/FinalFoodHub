import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth session (OAuth2 token or legacy auth)
    const accessToken = localStorage.getItem('accessToken');
    const authToken = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    let userRole = localStorage.getItem('userRole');
    const userData = localStorage.getItem('userData');
    
    // Normalize role to lowercase
    if (userRole) {
      userRole = userRole.toLowerCase();
      console.log("🔑 Normalized userRole from storage:", userRole);
    }
    
    if (accessToken && userEmail && userRole) {
      // OAuth2 flow - decode JWT to extract vendor ID
      try {
        const decodedToken = jwtDecode(accessToken);
        console.log("🔐 Decoded token in AuthContext init:", decodedToken);
        
        const vendorId = decodedToken.id || decodedToken.vendorId || decodedToken.sub;
        console.log("🎯 Extracted vendor ID:", vendorId);
        
        setUser({ 
          email: userEmail, 
          role: userRole,
          id: vendorId
        });
        console.log("✅ User initialized from storage:", { email: userEmail, role: userRole });
      } catch (err) {
        console.warn("Could not decode JWT token:", err);
        setUser({ email: userEmail, role: userRole });
      }
    } else if (authToken && userData) {
      // Legacy flow
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = (emailOrUserData, roleOrToken, accessToken = null) => {
    // Support both old and new login signature
    if (typeof emailOrUserData === 'object') {
      // Old signature: login(userData, token)
      const userData = emailOrUserData;
      const token = roleOrToken;
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } else {
      // New signature: login(email, role, accessToken)
      const email = emailOrUserData;
      let role = roleOrToken;
      
      // Normalize role to lowercase
      role = role?.toLowerCase() || 'customer';
      console.log("🔑 Login called with role:", roleOrToken, "-> normalized to:", role);
      
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', role);
      localStorage.setItem('accessToken', accessToken);
      
      // Decode JWT to extract customer/vendor/admin ID
      try {
        const decodedToken = jwtDecode(accessToken);
        console.log("🔐 Decoded token in login:", decodedToken);
        
        // Extract ID from various possible field names
        const userId = decodedToken.id || decodedToken.vendorId || decodedToken.customerId || decodedToken.sub;
        console.log("🎯 Extracted user ID from token:", userId);
        
        // Store customerId/vendorId based on role
        if (role === 'customer') {
          localStorage.setItem('customerId', userId);
          console.log("✅ Stored customerId:", userId);
        } else if (role === 'vendor') {
          localStorage.setItem('vendorId', userId);
          console.log("✅ Stored vendorId:", userId);
        } else if (role === 'admin') {
          localStorage.setItem('userId', userId);
          console.log("✅ Stored userId (admin):", userId);
        }
        
        setUser({ 
          email, 
          role,
          id: userId
        });
        console.log("✅ User state updated:", { email, role, id: userId });
      } catch (err) {
        console.warn("Could not decode JWT token:", err);
        setUser({ email, role });
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('customerId');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('userId');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toLowerCase() === 'admin' || user?.role === 'ADMIN',
    isVendor: user?.role?.toLowerCase() === 'vendor' || user?.role === 'VENDOR',
    isCustomer: user?.role?.toLowerCase() === 'customer' || user?.role === 'CUSTOMER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



 
