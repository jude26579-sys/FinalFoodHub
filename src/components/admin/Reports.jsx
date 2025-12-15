// import { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { DollarSign, TrendingUp, Calendar, Download, Loader2 } from 'lucide-react';
// import axios from 'axios';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

// export const SalesReports = () => {
//   // State for filters
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [restaurants, setRestaurants] = useState([]);
//   const [selectedRestaurants, setSelectedRestaurants] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [loadingRestaurants, setLoadingRestaurants] = useState(false);
//   const [reportData, setReportData] = useState(null);
//   const [error, setError] = useState(null);

//   // Fetch available restaurants on component mount
//   useEffect(() => {
//     fetchRestaurants();
//   }, []);

//   const fetchRestaurants = async () => {
//     try {
//       setLoadingRestaurants(true);
//       const accessToken = localStorage.getItem('accessToken');
//       const response = await axios.get('http://localhost:8182/api/restaurants', {
//         headers: {
//           'Authorization': `Bearer ${accessToken}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       const restaurantList = Array.isArray(response.data) ? response.data : response.data.data || [];
//       setRestaurants(restaurantList);
      
//       // Set all restaurants as selected by default
//       setSelectedRestaurants(restaurantList.map(r => r.restaurantId));
//     } catch (err) {
//       console.error('❌ Failed to fetch restaurants:', err);
//       setError('Failed to load restaurants');
//     } finally {
//       setLoadingRestaurants(false);
//     }
//   };

//   const handleRestaurantToggle = (restaurantId) => {
//     setSelectedRestaurants(prev => 
//       prev.includes(restaurantId)
//         ? prev.filter(id => id !== restaurantId)
//         : [...prev, restaurantId]
//     );
//   };

//   const handleGenerateReport = async () => {
//     if (!startDate || !endDate) {
//       setError('Please select both start and end dates');
//       return;
//     }

//     if (selectedRestaurants.length === 0) {
//       setError('Please select at least one restaurant');
//       return;
//     }

//     if (new Date(startDate) > new Date(endDate)) {
//       setError('Start date must be before end date');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);
      
//       const accessToken = localStorage.getItem('accessToken');
//       const reportRequest = {
//         startDate: startDate,
//         endDate: endDate,
//         restaurantIds: selectedRestaurants,
//       };

//       console.log('📊 Generating report with request:', reportRequest);

//       const response = await axios.post(
//         'http://localhost:8091/api/report',
//         reportRequest,
//         {
//           headers: {
//             'Authorization': `Bearer ${accessToken}`,
//             'Content-Type': 'application/json',
//           },
//           withCredentials: true,
//         }
//       );

//       console.log('✅ Report generated:', response.data);
//       setReportData(response.data);
//     } catch (err) {
//       console.error('❌ Failed to generate report:', err);
      
//       // Better error messages
//       let errorMsg = 'Failed to generate report';
      
//       if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
//         errorMsg = '🔴 CORS Error: Reporting service (port 8091) is NOT running. Please start the Reporting service.';
//       } else if (err.response?.status === 401) {
//         errorMsg = 'Unauthorized - Your session may have expired';
//       } else if (err.response?.status === 403) {
//         errorMsg = 'Access Denied - Admin role required';
//       } else if (err.response?.data?.message) {
//         errorMsg = err.response.data.message;
//       }
      
//       setError(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDownloadPDF = () => {
//     if (!reportData) return;

//     try {
//       const pdf = new jsPDF();
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const margin = 15;
//       let yPosition = margin;

//       // Title
//       pdf.setFontSize(16);
//       pdf.setFont(undefined, 'bold');
//       pdf.text('SALES REPORT', margin, yPosition);
//       yPosition += 10;

//       // Report Header Info
//       pdf.setFontSize(10);
//       pdf.setFont(undefined, 'normal');
//       pdf.text(`Report ID: ${reportData.reportId}`, margin, yPosition);
//       yPosition += 6;
//       pdf.text(
//         `Period: ${reportData.duration?.startDate || startDate} to ${reportData.duration?.endDate || endDate}`,
//         margin,
//         yPosition
//       );
//       yPosition += 6;
//       pdf.text(`Generated: ${new Date(reportData.reportGeneratedAt).toLocaleString()}`, margin, yPosition);
//       yPosition += 10;

//       // Summary Section
//       pdf.setFontSize(12);
//       pdf.setFont(undefined, 'bold');
//       pdf.text('SUMMARY', margin, yPosition);
//       yPosition += 8;

//       pdf.setFontSize(10);
//       pdf.setFont(undefined, 'normal');
//       const summaryData = [
//         ['Total Sales', `₹${(reportData.totalSales || 0).toFixed(2)}`],
//         ['Total Orders', reportData.orderCount || 0],
//         ['Number of Restaurants', reportData.restaurantCount || 0],
//       ];

//       pdf.autoTable({
//         startY: yPosition,
//         head: [['Metric', 'Value']],
//         body: summaryData,
//         margin: { left: margin, right: margin },
//         theme: 'grid',
//         didDrawPage: (data) => {
//           yPosition = data.lastAutoTable.finalY + 10;
//         },
//       });

//       yPosition = pdf.lastAutoTable.finalY + 10;

//       // Restaurant Details Section
//       if (reportData.restaurants && reportData.restaurants.length > 0) {
//         pdf.setFontSize(12);
//         pdf.setFont(undefined, 'bold');
//         pdf.text('RESTAURANT DETAILS', margin, yPosition);
//         yPosition += 8;

//         reportData.restaurants.forEach((restaurant, index) => {
//           // Check if we need a new page
//           if (yPosition > pageHeight - 50) {
//             pdf.addPage();
//             yPosition = margin;
//           }

//           // Restaurant header
//           pdf.setFontSize(11);
//           pdf.setFont(undefined, 'bold');
//           pdf.text(`Restaurant #${index + 1} (ID: ${restaurant.restaurantId})`, margin, yPosition);
//           yPosition += 6;

//           // Restaurant summary
//           pdf.setFontSize(10);
//           pdf.setFont(undefined, 'normal');
//           pdf.text(`Total Orders: ${restaurant.restaurantOrderCount || 0}`, margin + 5, yPosition);
//           yPosition += 6;

//           // Restaurant orders table
//           const orderTableData = (restaurant.orders || []).map((order) => [
//             order.orderId,
//             new Date(order.createdAt).toLocaleDateString(),
//             order.orderStatus,
//             `₹${(order.orderSalesAmt || 0).toFixed(2)}`,
//           ]);

//           if (orderTableData.length > 0) {
//             pdf.autoTable({
//               startY: yPosition,
//               head: [['Order ID', 'Date', 'Status', 'Amount']],
//               body: orderTableData,
//               margin: { left: margin + 5, right: margin },
//               theme: 'striped',
//               didDrawPage: (data) => {
//                 yPosition = data.lastAutoTable.finalY + 6;
//               },
//             });
//           } else {
//             pdf.setFontSize(9);
//             pdf.setFont(undefined, 'italic');
//             pdf.text('No orders for this restaurant in the selected period', margin + 5, yPosition);
//             yPosition += 6;
//           }

//           yPosition += 4;
//         });
//       }

//       // Footer
//       pdf.setFontSize(8);
//       pdf.setFont(undefined, 'italic');
//       pdf.text(
//         `Generated on ${new Date().toLocaleString()}`,
//         margin,
//         pageHeight - 10
//       );

//       // Save PDF
//       const fileName = `sales_report_${startDate}_to_${endDate}.pdf`;
//       pdf.save(fileName);
//       console.log('✅ PDF downloaded successfully');
//     } catch (err) {
//       console.error('❌ Failed to generate PDF:', err);
//       setError('Failed to generate PDF');
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-semibold">Sales Reports</h2>

//       {/* Filters Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Generate Report</CardTitle>
//           <CardDescription>Select date range and restaurants</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Error Message */}
//           {error && (
//             <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
//               <p className="text-sm text-red-700">❌ {error}</p>
//             </div>
//           )}

//           {/* Date Range Section */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Start Date</label>
//               <div className="flex items-center gap-2">
//                 <Calendar className="w-5 h-5 text-gray-500" />
//                 <Input
//                   type="date"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className="flex-1"
//                 />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <label className="text-sm font-medium">End Date</label>
//               <div className="flex items-center gap-2">
//                 <Calendar className="w-5 h-5 text-gray-500" />
//                 <Input
//                   type="date"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   className="flex-1"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Restaurant Selection */}
//           <div className="space-y-3">
//             <label className="text-sm font-medium block">Select Restaurants</label>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
//               {loadingRestaurants ? (
//                 <p className="text-sm text-gray-500 col-span-full">Loading restaurants...</p>
//               ) : restaurants.length > 0 ? (
//                 restaurants.map((restaurant) => (
//                   <label key={restaurant.restaurantId} className="flex items-center gap-2 cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={selectedRestaurants.includes(restaurant.restaurantId)}
//                       onChange={() => handleRestaurantToggle(restaurant.restaurantId)}
//                       className="w-4 h-4 rounded"
//                     />
//                     <span className="text-sm">{restaurant.restaurantName}</span>
//                   </label>
//                 ))
//               ) : (
//                 <p className="text-sm text-gray-500 col-span-full">No restaurants available</p>
//               )}
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-3 justify-end">
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setStartDate('');
//                 setEndDate('');
//                 setReportData(null);
//               }}
//             >
//               Clear
//             </Button>
//             <Button
//               onClick={handleGenerateReport}
//               disabled={loading}
//               className="gap-2"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Generating...
//                 </>
//               ) : (
//                 <>
//                   <TrendingUp className="w-4 h-4" />
//                   Generate Report
//                 </>
//               )}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Report Results */}
//       {reportData && (
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Report Summary</CardTitle>
//               <CardDescription>
//                 {reportData.duration?.startDate} to {reportData.duration?.endDate}
//               </CardDescription>
//             </div>
//             <Button
//               onClick={handleDownloadPDF}
//               className="gap-2"
//             >
//               <Download className="w-4 h-4" />
//               Download PDF
//             </Button>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {/* Summary Stats */}
//             <div className="grid gap-4 md:grid-cols-3">
//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
//                   <DollarSign className="h-4 w-4 text-orange-600" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">₹{(reportData.totalSales || 0).toFixed(2)}</div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
//                   <TrendingUp className="h-4 w-4 text-blue-600" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{reportData.orderCount || 0}</div>
//                 </CardContent>
//               </Card>

//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                   <CardTitle className="text-sm font-medium">Restaurants</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="text-2xl font-bold">{reportData.restaurantCount || 0}</div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Restaurant Details */}
//             {reportData.restaurants && reportData.restaurants.length > 0 && (
//               <div className="space-y-4">
//                 <h3 className="text-lg font-semibold">Restaurant Breakdown</h3>
//                 {reportData.restaurants.map((restaurant) => (
//                   <Card key={restaurant.restaurantId} className="bg-gray-50">
//                     <CardHeader>
//                       <CardTitle className="text-base">
//                         Restaurant ID: {restaurant.restaurantId}
//                       </CardTitle>
//                       <CardDescription>
//                         Total Orders: {restaurant.restaurantOrderCount || 0}
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       {restaurant.orders && restaurant.orders.length > 0 ? (
//                         <div className="overflow-x-auto">
//                           <table className="w-full text-sm">
//                             <thead className="border-b bg-gray-100">
//                               <tr>
//                                 <th className="text-left py-2 px-4">Order ID</th>
//                                 <th className="text-left py-2 px-4">Date</th>
//                                 <th className="text-left py-2 px-4">Status</th>
//                                 <th className="text-right py-2 px-4">Amount</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {restaurant.orders.map((order) => (
//                                 <tr key={order.orderId} className="border-b hover:bg-white">
//                                   <td className="py-2 px-4">{order.orderId}</td>
//                                   <td className="py-2 px-4">
//                                     {new Date(order.createdAt).toLocaleDateString()}
//                                   </td>
//                                   <td className="py-2 px-4">
//                                     <span className={`px-2 py-1 rounded text-xs font-medium ${
//                                       order.orderStatus === 'DELIVERED'
//                                         ? 'bg-green-100 text-green-700'
//                                         : 'bg-blue-100 text-blue-700'
//                                     }`}>
//                                       {order.orderStatus}
//                                     </span>
//                                   </td>
//                                   <td className="py-2 px-4 text-right font-semibold">
//                                     ₹{(order.orderSalesAmt || 0).toFixed(2)}
//                                   </td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         </div>
//                       ) : (
//                         <p className="text-gray-500 text-sm">No orders for this restaurant</p>
//                       )}
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { generatePDF } from "@/components/customer/utils/reportPdfGenerator";
import { format } from "date-fns";
 
export const Reports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
 
  const accessToken = localStorage.getItem("accessToken");
 
  // Fetch restaurants on component mount
  useEffect(() => {
    fetchRestaurants();
  }, []);
 
  const fetchRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      console.log("📋 Fetching restaurants from /api/report/restaurants");
     
      // Call the new endpoint in Reporting Service that fetches from Restaurant Service
      const response = await axios.get(`/api/report/restaurants`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000, // Increased timeout to 15 seconds
      });
 
      console.log("✅ Restaurants response:", response.data);
      
      const restaurantList = Array.isArray(response.data)
        ? response.data
        : response.data.content || response.data.data || [];
 
      console.log("📊 Restaurant list length:", restaurantList.length);
      
      // Map the restaurants to match the expected format
      // Restaurant Service returns restaurantId and restaurantName
      const mappedRestaurants = restaurantList.map(r => ({
        id: r.restaurantId,
        name: r.restaurantName,
        location: r.location,
        status: r.status,
        openTime: r.openTime,
        closeTime: r.closeTime,
        vendorId: r.vendorId,
      }));
 
      console.log("✅ Mapped restaurants:", mappedRestaurants);
      setRestaurants(mappedRestaurants);
 
      if (mappedRestaurants.length === 0) {
        toast({
          title: "ℹ️ No Restaurants",
          description: "No restaurants found. Please add restaurants first.",
          variant: "default",
        });
      } else {
        console.log("✅ Successfully loaded " + mappedRestaurants.length + " restaurants");
      }
    } catch (error) {
      console.error("❌ Error fetching restaurants:", error);
      console.error("   Error message:", error.message);
      console.error("   Error code:", error.code);
      console.error("   Error response:", error.response?.data);
      
      let errorMessage = "Failed to fetch restaurants. ";
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage += "Request timeout - the server is taking too long to respond. Please try again.";
      } else if (error.response?.status === 401) {
        errorMessage += "Unauthorized - please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage += "Access denied - you don't have permission to view restaurants.";
      } else if (error.response?.status === 404) {
        errorMessage += "Endpoint not found - please ensure the reporting service is running.";
      } else if (!error.response) {
        errorMessage += "Network error - please check your connection and ensure the server is running.";
      } else {
        errorMessage += error.response?.data?.message || "Please try again.";
      }
      
      toast({
        title: "❌ Error Loading Restaurants",
        description: errorMessage,
        variant: "destructive",
      });
      setRestaurants([]);
    } finally {
      setLoadingRestaurants(false);
    }
  };
 
  const validateInputs = () => {
    if (!startDate || !endDate) {
      toast({
        title: "❌ Date Required",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return false;
    }
 
    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "❌ Invalid Date Range",
        description: "Start date cannot be after end date",
        variant: "destructive",
      });
      return false;
    }
 
    if (selectedRestaurants.length === 0) {
      toast({
        title: "❌ Restaurant Required",
        description: "Please select at least one restaurant",
        variant: "destructive",
      });
      return false;
    }
 
    return true;
  };
 
  const handleGenerateReport = async () => {
    if (!validateInputs()) return;
 
    try {
      setLoading(true);
      console.log("📊 Generating report...");
 
      const reportRequest = {
        startDate: startDate,
        endDate: endDate,
        restaurantIds: selectedRestaurants.map(r =>
          typeof r === 'object' ? r.id : r
        ),
      };
 
      console.log("📋 Report request:", reportRequest);
 
      const response = await axios.post(
        `/api/report`,
        reportRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // Increased timeout to 30 seconds for report generation
        }
      );
 
      console.log("✅ Report response:", response.data);
      
      if (response.data) {
        setReportData(response.data);
        setShowReportPreview(true);
        toast({
          title: "✅ Report Generated",
          description: "Report generated successfully",
        });
      }
    } catch (error) {
      console.error("❌ Error generating report:", error);
      console.error("   Error message:", error.message);
      console.error("   Error response:", error.response?.data);
      
      let errorMessage = "Failed to generate report. ";
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage += "Request timeout - the server took too long to generate the report. Try with a smaller date range.";
      } else if (error.response?.status === 401) {
        errorMessage += "Unauthorized - please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage += "Access denied - you don't have permission to generate reports.";
      } else if (error.response?.status === 404) {
        errorMessage += "Endpoint not found - please ensure the reporting service is running.";
      } else if (!error.response) {
        errorMessage += "Network error - please check your connection.";
      } else {
        errorMessage += error.response?.data?.message || "Please try again.";
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
  const handleDownloadPDF = async () => {
    if (!reportData) return;
 
    try {
      // Enrich report data with restaurant names
      const enrichedReport = {
        ...reportData,
        restaurantNames: reportData.restaurants.map(r => {
          const restaurantInfo = restaurants.find(
            res => res.id === r.restaurantId
          );
          return {
            ...r,
            restaurantName: restaurantInfo?.name || `Restaurant ${r.restaurantId}`,
          };
        }),
      };
 
      generatePDF(enrichedReport);
 
      toast({
        title: "✅ PDF Downloaded",
        description: "Report PDF has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "❌ Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };
 
  const toggleRestaurantSelection = (restaurantId) => {
    setSelectedRestaurants(prev => {
      if (prev.includes(restaurantId)) {
        return prev.filter(id => id !== restaurantId);
      } else {
        return [...prev, restaurantId];
      }
    });
  };
 
  const selectAllRestaurants = () => {
    if (selectedRestaurants.length === restaurants.length) {
      setSelectedRestaurants([]);
    } else {
      setSelectedRestaurants(restaurants.map(r => r.id));
    }
  };
 
  // Calculate summary statistics
  const calculateSummary = () => {
    if (!reportData) return { totalSales: 0, totalOrders: 0, avgOrderValue: 0 };
 
    const totalOrders = reportData.restaurants.reduce(
      (sum, restaurant) => sum + (restaurant.restaurantOrderCount || 0),
      0
    );
 
    return {
      totalSales: reportData.totalSales || 0,
      totalOrders: reportData.orderCount || totalOrders,
      avgOrderValue:
        reportData.orderCount && reportData.totalSales
          ? (reportData.totalSales / reportData.orderCount).toFixed(2)
          : 0,
    };
  };
 
  const summary = calculateSummary();
 
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Restaurant Sales Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate detailed sales reports for selected restaurants within a date range
        </p>
      </div>
 
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Select date range and restaurants to generate the report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
                disabled={loading}
                className="w-full"
              />
            </div>
 
            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                disabled={loading}
                className="w-full"
              />
            </div>
          </div>
 
          {/* Restaurant Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Restaurants</Label>
              {restaurants.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllRestaurants}
                  disabled={loading || loadingRestaurants}
                >
                  {selectedRestaurants.length === restaurants.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>
 
            {loadingRestaurants ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading restaurants...
              </div>
            ) : restaurants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
                {restaurants.map((restaurant) => (
                  <label
                    key={restaurant.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-background p-2 rounded transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRestaurants.includes(restaurant.id)}
                      onChange={() => toggleRestaurantSelection(restaurant.id)}
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{restaurant.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                No restaurants available
              </div>
            )}
 
            {selectedRestaurants.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedRestaurants.length} restaurant(s) selected
              </p>
            )}
          </div>
 
          {/* Generate Report Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={loading || loadingRestaurants}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </CardContent>
      </Card>
 
      {/* Report Preview and Download */}
      {showReportPreview && reportData && (
        <>
          {/* Detailed Report by Restaurant */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detailed Report</CardTitle>
                  <CardDescription>
                    Sales breakdown by restaurant
                  </CardDescription>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reportData.restaurants.map((restaurant, idx) => {
                  const restaurantInfo = restaurants.find(
                    r => r.id === restaurant.restaurantId
                  );
                  const restaurantSales = restaurant.orders.reduce(
                    (sum, order) => sum + (order.orderSalesAmt || 0),
                    0
                  );
 
                  return (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {restaurantInfo?.name || `Restaurant ${restaurant.restaurantId}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ID: {restaurant.restaurantId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ₹{restaurantSales.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {restaurant.restaurantOrderCount} order(s)
                          </p>
                        </div>
                      </div>
 
                      {/* Orders Table */}
                      {restaurant.orders.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 font-medium">
                                  Order ID
                                </th>
                                <th className="text-left py-2 px-2 font-medium">
                                  Amount (₹)
                                </th>
                                <th className="text-left py-2 px-2 font-medium">
                                  Date
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {restaurant.orders.map((order, orderIdx) => (
                                <tr
                                  key={orderIdx}
                                  className="border-b last:border-b-0 hover:bg-muted/50"
                                >
                                  <td className="py-2 px-2">#{order.orderId}</td>
                                  <td className="py-2 px-2 font-semibold">
                                    ₹{order.orderSalesAmt.toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                  <td className="py-2 px-2 text-muted-foreground">
                                    {format(
                                      new Date(order.createdAt),
                                      "MMM dd, yyyy HH:mm"
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};