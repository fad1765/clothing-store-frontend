import { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import CartDrawer from "../components/CartDrawer";
import "../styles/layout.css";
import Footer from "../components/Footer";

export default function Layout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/";

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      <Header toggleSidebar={toggleSidebar} isAdminPage={isAdminPage} />

      {isSidebarOpen && (
        <>
          <div className="overlay" onClick={closeSidebar} />
          <Sidebar onClose={closeSidebar} isAdminPage={isAdminPage} />
        </>
      )}

      {!isAdminPage && <CartDrawer />}

      <main className={`main-content ${isHomePage ? "home-main-content" : ""}`}>
        {children}
      </main>

      <Footer />
    </div>
  );
}