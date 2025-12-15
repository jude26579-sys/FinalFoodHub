import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorRegistration } from "@/components/admin/VendorRegistration";
import { RestaurantRegistration } from "@/components/admin/RestaurantRegistration";
import { Reports } from "@/components/admin/Reports";
 
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("vendors");
 
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
 
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
 
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Use flex for tab list so triggers stay inline and don't drop below content */}
          <TabsList className="flex gap-2 flex-wrap w-full lg:w-[450px]">
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
 
          <TabsContent value="vendors" className="space-y-4">
            <VendorRegistration />
          </TabsContent>
 
          <TabsContent value="restaurants" className="space-y-4">
            {/* admin restaurant registration and assignment to vendor */}
            <RestaurantRegistration />
          </TabsContent>
 
          <TabsContent value="reports" className="space-y-4">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
 
export default AdminDashboard;