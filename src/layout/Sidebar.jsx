import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/sidebar.css";

export default function Sidebar({ onClose, isAdminPage }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role?.trim().toLowerCase() === "admin";

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <aside className="sidebar">
      {isAdminPage ? (
        <>
          <h1 className="sidebar-title">後台管理</h1>
          <ul className="sidebar-list">
            <li className="sidebar-item" onClick={() => handleNavigate("/admin")}>
              後台總覽
            </li>
            <li
              className="sidebar-item"
              onClick={() => handleNavigate("/admin/products")}
            >
              商品管理
            </li>
            <li
              className="sidebar-item"
              onClick={() => handleNavigate("/admin/orders")}
            >
              訂單管理
            </li>
            <li
              className="sidebar-item"
              onClick={() => handleNavigate("/admin/users")}
            >
              使用者管理
            </li>
            <li
                  className="sidebar-item"
                  onClick={() => handleNavigate("/admin/coupons")}
                >
                  商品優惠券
                </li>
            <li className="sidebar-item" onClick={() => handleNavigate("/")}>
              返回前台首頁
            </li>
          </ul>
        </>
      ) : (
        <>
          <h1 className="sidebar-title">商品分類</h1>
          <ul className="sidebar-list">
            <li className="sidebar-item" onClick={() => handleNavigate("/")}>
              首頁
            </li>
            <li
              className="sidebar-item"
              onClick={() => handleNavigate("/clothing")}
            >
              上衣
            </li>
            <li className="sidebar-item" onClick={() => handleNavigate("/pants")}>
              褲子
            </li>
            <li className="sidebar-item" onClick={() => handleNavigate("/socks")}>
              襪子
            </li>
            <li className="sidebar-item" onClick={() => handleNavigate("/wishlist")}>
              收藏商品
            </li>
            <li className="sidebar-item" onClick={() => handleNavigate("/orders")}>
              我的訂單
            </li>
          </ul>

          {isAdmin && (
            <>
              <h1 className="sidebar-title sidebar-admin-title">後台管理</h1>
              <ul className="sidebar-list">
                <li
                  className="sidebar-item"
                  onClick={() => handleNavigate("/admin")}
                >
                  後台總覽
                </li>
                <li
                  className="sidebar-item"
                  onClick={() => handleNavigate("/admin/products")}
                >
                  商品管理
                </li>
                <li
                  className="sidebar-item"
                  onClick={() => handleNavigate("/admin/orders")}
                >
                  訂單管理
                </li>
                <li
                  className="sidebar-item"
                  onClick={() => handleNavigate("/admin/users")}
                >
                  使用者管理
                </li>
                <li
                  className="sidebar-item"
                  onClick={() => handleNavigate("/admin/coupons")}
                >
                  商品優惠券
                </li>
              </ul>
            </>
          )}
        </>
      )}
    </aside>
  );
}