// import { useNavigate } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Navbar } from '@/components/Navbar';
// import { UtensilsCrossed, ShoppingBag, Store, Shield } from 'lucide-react';

// const Index = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />

//       {/* Hero Section */}
//       <section className="container mx-auto px-4 py-20 text-center">
//         <div className="mx-auto max-w-3xl">
//           <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
//             <UtensilsCrossed className="h-12 w-12 text-primary" />
//           </div>

//           <h1 className="mb-6 text-5xl font-bold tracking-tight">
//             Delicious Food, <span className="text-primary">Delivered Fast</span>
//           </h1>

//           <p className="mb-8 text-xl text-muted-foreground">
//             Order from your favorite restaurants and get it delivered right to your doorstep
//           </p>

//           <div className="flex flex-wrap items-center justify-center gap-4">
//             <Button size="lg" onClick={() => navigate('/customer')} className="text-lg">
//               Customer Demo
//             </Button>
//             <Button size="lg" variant="secondary" onClick={() => navigate('/vendor')} className="text-lg">
//               Vendor Demo
//             </Button>
//             <Button size="lg" variant="outline" onClick={() => navigate('/admin')} className="text-lg">
//               Admin Demo
//             </Button>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="border-t bg-muted/30 py-20">
//         <div className="container mx-auto px-4">
//           <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>

//           <div className="grid gap-8 md:grid-cols-3">
//             <div className="rounded-xl border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md">
//               <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
//                 <ShoppingBag className="h-8 w-8 text-primary" />
//               </div>
//               <h3 className="mb-3 text-xl font-semibold">For Customers</h3>
//               <p className="text-muted-foreground">
//                 Browse restaurants, add items to cart, place orders, and provide feedback
//               </p>
//             </div>

//             <div className="rounded-xl border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md">
//               <div className="mb-4 inline-flex items-center justify-center rounded-full bg-secondary/10 p-4">
//                 <Store className="h-8 w-8 text-secondary" />
//               </div>
//               <h3 className="mb-3 text-xl font-semibold">For Vendors</h3>
//               <p className="text-muted-foreground">
//                 Manage your restaurants, update menu items, and track orders in real-time
//               </p>
//             </div>

//             <div className="rounded-xl border bg-card p-8 text-center shadow-sm transition-shadow hover:shadow-md">
//               <div className="mb-4 inline-flex items-center justify-center rounded-full bg-accent/10 p-4">
//                 <Shield className="h-8 w-8 text-accent" />
//               </div>
//               <h3 className="mb-3 text-xl font-semibold">For Admins</h3>
//               <p className="text-muted-foreground">
//                 Register vendors, monitor platform activity, and view comprehensive reports
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Index;
