import { useRef, useMemo, useState } from "react";
import "../styles/header.css";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { BsLayoutTextSidebar } from "react-icons/bs";
import { ImSearch } from "react-icons/im";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import LogoutModal from "../components/LogoutModal";
import LogoutSuccessModal from "../components/LogoutSuccessModal";
import { IoPerson } from "react-icons/io5";

export default function Header({ toggleSidebar, isAdminPage }) {
  const { totalCount, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = user?.role?.trim().toLowerCase() === "admin";

  const currentKeyword = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("keyword") || "";
  }, [location.search]);

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      await logout();

      setShowLogoutModal(false);
      setShowSuccess(true);
    } catch (error) {
      console.error("登出失敗：", error);
      alert("登出失敗，請稍後再試");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccess(false);
    navigate("/");
  };

  const handleSearch = () => {
    const inputValue = searchInputRef.current?.value || "";
    const trimmedKeyword = inputValue.trim();

    if (!trimmedKeyword) return;

    navigate(`/products?keyword=${encodeURIComponent(trimmedKeyword)}`);
  };

  return (
    <header className="header">
      <BsLayoutTextSidebar
        size={24}
        className="menu-icon"
        onClick={toggleSidebar}
      />

      <div className="header-left">
        <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          CLOTHING STORE
        </h1>
      </div>

      <div className="header-spacer" />

      <div className="header-right">
        {!isAdminPage && (
          <div className="search-box" key={location.search}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜尋商品"
              className="search-input"
              defaultValue={currentKeyword}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <ImSearch className="search-icon" onClick={handleSearch} />
          </div>
        )}

        {user ? (
          <>
            <span className="header-username">
              <IoPerson className="user-icon" />
              <span className="username-text">{user.name}</span>

              {isAdmin && <span className="admin-badge"></span>}
            </span>

            {isAdmin && (
              <button
                className="admin-btn"
                onClick={() => navigate(isAdminPage ? "/" : "/admin")}
              >
                {isAdminPage ? "返回前台" : "後台管理"}
              </button>
            )}

            <button
              className="logout-btn"
              onClick={() => setShowLogoutModal(true)}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "登出中..." : "登出"}
            </button>
          </>
        ) : (
          <button className="login-link-btn" onClick={() => navigate("/login")}>
            登入
          </button>
        )}

        {!user?.role?.trim?.() ||
        user?.role?.trim().toLowerCase() !== "admin" ? (
          <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
            購物車 <PiShoppingCartSimpleBold />
            {totalCount > 0 && <span className="cart-count">{totalCount}</span>}
          </button>
        ) : null}
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => {
            if (isLoggingOut) return;
            setShowLogoutModal(false);
          }}
          isLoading={isLoggingOut}
        />
      )}

      {showSuccess && <LogoutSuccessModal onDone={handleSuccessDone} />}
    </header>
  );
}
