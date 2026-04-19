import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import RouteCustomerLogin from "./pages/RouteCustomerLogin.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Categories from "./pages/Categories.jsx";
import PriceTiers from "./pages/PriceTiers.jsx";
import ProductForm from "./pages/ProductForm.jsx";
import Customers from "./pages/Customers.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import BuyingCustomers from "./pages/BuyingCustomers.jsx";
import SalesReps from "./pages/SalesReps.jsx";
import SalesRepDetail from "./pages/SalesRepDetail.jsx";
import SalesRepTrack from "./pages/SalesRepTrack.jsx";
import SalesRepsLiveMap from "./pages/SalesRepsLiveMap.jsx";
import Orders from "./pages/Orders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import Payments from "./pages/Payments.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Regions from "./pages/Regions.jsx";
import RegionDetail from "./pages/RegionDetail.jsx";
import Locations from "./pages/Locations.jsx";
import Inventory from "./pages/Inventory.jsx";
import AdminManagement from "./pages/AdminManagement.jsx";

import RouteCustomerDashboard from "./pages/RouteCustomerDashboard.jsx";
import RouteCustomerApply from "./pages/RouteCustomerApply.jsx";
import RouteCustomerApplications from "./pages/RouteCustomerApplications.jsx";
import RouteCustomerAccess from "./pages/RouteCustomerAccess.jsx";

import { useAuth } from "./context/AuthContext.jsx";
import { useRouteCustomerAuth } from "./context/RouteCustomerAuthContext.jsx";
import AdminLayout from "./layout/AdminLayout.jsx";

function AdminProtected({ children }) {
  const { isAuthed, user, token, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!isAuthed || !token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RouteCustomerProtected({ children }) {
  const {
    isRouteCustomerAuthed,
    routeCustomerToken,
    routeCustomerUser,
    loading,
  } = useRouteCustomerAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  if (!isRouteCustomerAuthed || !routeCustomerToken || !routeCustomerUser) {
    return <Navigate to="/route-login" replace />;
  }

  return children;
}

function Shell({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <Routes>
      {/* Login routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/route-login" element={<RouteCustomerLogin />} />
      <Route path="/customer/login" element={<Navigate to="/route-login" replace />} />

      {/* New route customer application flow */}
      <Route path="/customer/apply" element={<RouteCustomerApply />} />

      {/* Approved route customer portal */}
      <Route
        path="/customer/dashboard"
        element={
          <RouteCustomerProtected>
            <RouteCustomerDashboard />
          </RouteCustomerProtected>
        }
      />

      {/* Safety redirect in case older code still points here */}
      <Route path="/route-customer-dashboard" element={<Navigate to="/customer/dashboard" replace />} />

      {/* Admin routes */}
      <Route
        path="/"
        element={
          <AdminProtected>
            <Shell>
              <Dashboard />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/products"
        element={
          <AdminProtected>
            <Shell>
              <Products />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/products/new"
        element={
          <AdminProtected>
            <Shell>
              <ProductForm />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/products/:id/edit"
        element={
          <AdminProtected>
            <Shell>
              <ProductForm />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/categories"
        element={
          <AdminProtected>
            <Shell>
              <Categories />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/suppliers"
        element={
          <AdminProtected>
            <Shell>
              <Suppliers />
            </Shell>
          </AdminProtected>
        }
      />

      <Route path="/departments" element={<Navigate to="/suppliers" replace />} />

      <Route
        path="/regions"
        element={
          <AdminProtected>
            <Shell>
              <Regions />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/regions/:id"
        element={
          <AdminProtected>
            <Shell>
              <RegionDetail />
            </Shell>
          </AdminProtected>
        }
      />

      <Route path="/routes" element={<Navigate to="/regions" replace />} />

      <Route
        path="/locations"
        element={
          <AdminProtected>
            <Shell>
              <Locations />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/customers"
        element={
          <AdminProtected>
            <Shell>
              <Customers />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/customers/:id"
        element={
          <AdminProtected>
            <Shell>
              <CustomerDetail />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/route-customer-applications"
        element={
          <AdminProtected>
            <Shell>
              <RouteCustomerApplications />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/route-customer-access"
        element={
          <AdminProtected>
            <Shell>
              <RouteCustomerAccess />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/buying-customers"
        element={
          <AdminProtected>
            <Shell>
              <BuyingCustomers />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/sales-reps"
        element={
          <AdminProtected>
            <Shell>
              <SalesReps />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/sales-reps/live-map"
        element={
          <AdminProtected>
            <Shell>
              <SalesRepsLiveMap />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/sales-reps/:id"
        element={
          <AdminProtected>
            <Shell>
              <SalesRepDetail />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/sales-reps/:id/track"
        element={
          <AdminProtected>
            <Shell>
              <SalesRepTrack />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/price-tiers"
        element={
          <AdminProtected>
            <Shell>
              <PriceTiers />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/admin-management"
        element={
          <AdminProtected>
            <Shell>
              <AdminManagement />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/orders"
        element={
          <AdminProtected>
            <Shell>
              <Orders />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/orders/:id"
        element={
          <AdminProtected>
            <Shell>
              <OrderDetails />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/payments"
        element={
          <AdminProtected>
            <Shell>
              <Payments />
            </Shell>
          </AdminProtected>
        }
      />

      <Route
        path="/inventory"
        element={
          <AdminProtected>
            <Shell>
              <Inventory />
            </Shell>
          </AdminProtected>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}