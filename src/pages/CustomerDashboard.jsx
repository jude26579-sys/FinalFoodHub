import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantsList } from "@/components/customer/RestaurantsList";
import { OrdersList } from "@/components/customer/OrdersList";
 
 
 
const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("restaurants");
 
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
 
      {/* WIDER LAYOUT — NOT TIGHT CONTAINER */}
      <div className="mx-auto px-4 py-8 max-w-screen-xl">
        <h1 className="mb-6 text-3xl font-bold text-center">
          Customer Dashboard
        </h1>
 
        <Tabs
          defaultValue="restaurants"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-5"
        >
          {/* TAB HEADERS */}
          <TabsList className="flex gap-2 justify-center">
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
          </TabsList>
 
          {/* RESTAURANTS */}
          <TabsContent value="restaurants" className="pt-4">
            <RestaurantsList />
          </TabsContent>
 
          {/* ORDERS */}
          <TabsContent value="orders" className="pt-4">
            <OrdersList />
          </TabsContent>
 
         
        </Tabs>
      </div>
    </div>
  );
};
 
export default CustomerDashboard;