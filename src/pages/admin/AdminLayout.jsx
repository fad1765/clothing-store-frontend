import { Link } from "react-router-dom";

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: "200px",
          background: "#1a1a1a",
          color: "white",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h2 style={{ marginBottom: "24px" }}>後台管理</h2>
        <Link to="/admin" style={{ color: "white", textDecoration: "none" }}>
          📊 總覽
        </Link>
        <Link to="/admin/products" style={{ color: "white", textDecoration: "none" }}>
          👕 商品管理
        </Link>
        <Link to="/admin/orders" style={{ color: "white", textDecoration: "none" }}>
          📦 訂單管理
        </Link>
        <Link to="/admin/users" style={{ color: "white", textDecoration: "none" }}>
          👤 使用者管理
        </Link>
        <Link to="/" style={{ color: "#aaa", textDecoration: "none", marginTop: "auto" }}>
          ← 回到前台
        </Link>
      </aside>

      <main style={{ flex: 1, padding: "32px", background: "#f5f5f5" }}>
        {children}
      </main>
    </div>
  );
}