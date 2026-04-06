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
          {showIntro ? (
            <IntroLogo show={showIntro} onFinish={handleFinishIntro} />
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <div
                    style={{
                      minHeight: "100vh",
                      background: "yellow",
                      color: "#000",
                      padding: "40px 20px",
                      fontSize: "24px",
                    }}
                  >
                    手機測試頁面
                  </div>
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
          )}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;