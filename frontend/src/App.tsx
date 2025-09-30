import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { CartProvider } from "./contexts/CartContext";
import { AvailabilityProvider } from "./contexts/AvailabilityContext";
import { SocketProvider } from "./contexts/SocketContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthWrapper from "./components/AuthWrapper";
import TokenExpirationWarning from "./components/TokenExpirationWarning";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChangePassword from "./pages/ChangePassword";
import FoodDetail from "./pages/FoodDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import NotFound from "./pages/NotFound";
import AdminOrders from './pages/AdminOrders';
import AdminDeliverymen from './pages/AdminDeliverymen';
import AdminFeedbacks from './pages/AdminFeedbacks';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminFoodManagement from './pages/AdminAddFood';
import UserOrders from './pages/UserOrders';
import DeliveryStats from './pages/DeliveryStats';
import UserOrdersHistory from './pages/UserOrdersHistory';
import Profile from './pages/Profile';
import AdminOrdersHistory from './pages/AdminOrdersHistory';
import DeliveryHistory from './pages/DeliveryHistory';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SocketProvider>
          <AvailabilityProvider>
            <CartProvider>
              <AppProvider>
                <AuthWrapper>
                <Toaster />
                <Sonner />
                <TokenExpirationWarning />
                <BrowserRouter>
                  <div className="min-h-screen bg-gray-50">
                    <Navbar />
                    <main>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/change-password" element={<ChangePassword />} />
                        <Route path="/food/:id" element={<FoodDetail />} />
                        <Route path="/cart" element={<ProtectedRoute requireAuth><Cart /></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute requireAuth><Checkout /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute requireAuth requireAdmin><Dashboard /></ProtectedRoute>} />
                        <Route path="/delivery" element={<ProtectedRoute requireAuth requireDelivery><DeliveryDashboard /></ProtectedRoute>} />
                        <Route path="/delivery-stats" element={<ProtectedRoute requireAuth requireDelivery><DeliveryStats /></ProtectedRoute>} />
                        <Route path="/delivery-history" element={<ProtectedRoute requireAuth requireDelivery><DeliveryHistory /></ProtectedRoute>} />
                        <Route path="/admin/orders" element={<ProtectedRoute requireAuth requireAdmin><AdminOrders /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute requireAuth requireAdmin><AdminUsers /></ProtectedRoute>} />
                        <Route path="/admin/deliverymen" element={<ProtectedRoute requireAuth requireAdmin><AdminDeliverymen /></ProtectedRoute>} />
                        <Route path="/admin/feedbacks" element={<ProtectedRoute requireAuth requireAdmin><AdminFeedbacks /></ProtectedRoute>} />
                        <Route path="/admin/analytics" element={<ProtectedRoute requireAuth requireAdmin><AdminAnalytics /></ProtectedRoute>} />
                        <Route path="/admin/add-food" element={<ProtectedRoute requireAuth requireAdmin><AdminFoodManagement /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute requireAuth requireUser><UserOrders /></ProtectedRoute>} />
                        <Route path="/orders/history" element={<ProtectedRoute requireAuth requireUser><UserOrdersHistory /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute requireAuth requireUser><Profile /></ProtectedRoute>} />
                        <Route path="/admin/ordershistory" element={<ProtectedRoute requireAuth requireAdmin><AdminOrdersHistory /></ProtectedRoute>} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </BrowserRouter>
                </AuthWrapper>
              </AppProvider>
            </CartProvider>
          </AvailabilityProvider>
        </SocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
