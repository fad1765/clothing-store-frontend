import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Clothing from "./pages/Clothing";
import Pants from "./pages/Pants";
import Socks from "./pages/Socks";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Wishlist from "./pages/Wishlist";
import Products from "./pages/Products";
import MyOrders from "./pages/MyOrders";

import AdminHome from "./pages/admin/AdminHome";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";

import { CartProvider } from "./context/CartProvider";
import { AuthProvider } from "./context/AuthProvider";
import RequireAdmin from "./components/RequireAdmin";
import IntroLogo from "./components/IntroLogo";

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("hasSeenIntro");
  });

  const handleFinishIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem("hasSeenIntro", "true");
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <IntroLogo show={showIntro} onFinish={handleFinishIntro} />

          <div
            style={{
              opacity: showIntro ? 0 : 1,
              transition: "opacity 0.6s ease",
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <Layout>
                    <Home />
                  </Layout>
                }
              />
              <Route
                path="/clothing"
                element={
                  <Layout>
                    <Clothing />
                  </Layout>
                }
              />
              <Route
                path="/pants"
                element={
                  <Layout>
                    <Pants />
                  </Layout>
                }
              />
              <Route
                path="/socks"
                element={
                  <Layout>
                    <Socks />
                  </Layout>
                }
              />
              <Route
                path="/cart"
                element={
                  <Layout>
                    <Cart />
                  </Layout>
                }
              />
              <Route
                path="/login"
                element={
                  <Layout>
                    <Login />
                  </Layout>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <Layout>
                    <Wishlist />
                  </Layout>
                }
              />
              <Route
                path="/products"
                element={
                  <Layout>
                    <Products />
                  </Layout>
                }
              />
              <Route
                path="/orders"
                element={
                  <Layout>
                    <MyOrders />
                  </Layout>
                }
              />

              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <Layout>
                      <AdminHome />
                    </Layout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <RequireAdmin>
                    <Layout>
                      <AdminProducts />
                    </Layout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <RequireAdmin>
                    <Layout>
                      <AdminOrders />
                    </Layout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <RequireAdmin>
                    <Layout>
                      <AdminCoupons />
                    </Layout>
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RequireAdmin>
                    <Layout>
                      <AdminUsers />
                    </Layout>
                  </RequireAdmin>
                }
              />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
