import { useEffect, useMemo, useState } from "react";
import "../../styles/adminHome.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const EMPTY_ARRAY = [];

export default function AdminHome() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/admin/dashboard`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "載入後台總覽失敗");
      }

      setDashboard(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "載入後台總覽失敗");
    } finally {
      setLoading(false);
    }
  };

  const summary = dashboard?.summary || {};
  const recentOrders = dashboard?.recent_orders || [];
  const lowStockProducts = dashboard?.low_stock_products || [];

  const orderTrend = useMemo(() => {
    return dashboard?.order_trend || EMPTY_ARRAY;
  }, [dashboard?.order_trend]);

  const maxTrendValue = useMemo(() => {
    if (!orderTrend.length) return 1;
    return Math.max(...orderTrend.map((item) => item.orders), 1);
  }, [orderTrend]);

  if (loading) {
    return <div className="admin-home-loading">載入中...</div>;
  }

  if (error) {
    return (
      <div className="admin-home-error-wrap">
        <div className="admin-home-error-card">
          <h2>後台總覽</h2>
          <p>{error}</p>
          <button onClick={fetchDashboard}>重新載入</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-home-page">
      <section className="admin-home-hero">
        <div>
          <h1>後台總覽</h1>
          <p>快速掌握商店營運、訂單處理與庫存風險</p>
        </div>

        <div className="admin-home-hero-side">
          <div className="admin-home-mini-card">
            <span className="admin-home-mini-label">今日訂單</span>
            <strong>{summary.today_orders ?? 0}</strong>
          </div>
          <div className="admin-home-mini-card">
            <span className="admin-home-mini-label">今日營收</span>
            <strong>{formatCurrency(summary.today_revenue ?? 0)}</strong>
          </div>
        </div>
      </section>

      <section className="admin-home-kpi-grid">
        <KpiCard
          title="商品總數"
          value={summary.total_products ?? 0}
          subtext="目前上架商品"
          icon="📦"
        />
        <KpiCard
          title="會員總數"
          value={summary.total_users ?? 0}
          subtext="註冊會員數"
          icon="👤"
        />
        <KpiCard
          title="訂單總數"
          value={summary.total_orders ?? 0}
          subtext="歷史累積訂單"
          icon="🧾"
        />
        <KpiCard
          title="待處理訂單"
          value={summary.pending_orders ?? 0}
          subtext="需要優先處理"
          icon="⏳"
          accent="warning"
        />
        <KpiCard
          title="累積營業額"
          value={formatCurrency(summary.total_revenue ?? 0)}
          subtext="所有有效訂單總額"
          icon="💰"
        />
        <KpiCard
          title="低庫存商品"
          value={summary.low_stock_count ?? 0}
          subtext="庫存 5 件以下"
          icon="⚠️"
          accent="danger"
        />
      </section>

      <section className="admin-home-main-grid">
        <div className="admin-home-panel large">
          <div className="admin-home-panel-header">
            <div>
              <h3>近 7 日訂單趨勢</h3>
              <p>快速查看最近一週訂單起伏</p>
            </div>
          </div>

          <div className="admin-home-trend-chart">
            {orderTrend.length === 0 ? (
              <div className="admin-home-empty-box">目前沒有趨勢資料</div>
            ) : (
              orderTrend.map((item) => (
                <div key={item.label} className="admin-home-trend-item">
                  <div className="admin-home-trend-bar-wrap">
                    <div
                      className="admin-home-trend-bar"
                      style={{
                        height: `${(item.orders / maxTrendValue) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="admin-home-trend-value">{item.orders}</div>
                  <div className="admin-home-trend-label">{item.label}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-home-panel">
          <div className="admin-home-panel-header">
            <div>
              <h3>營運提醒</h3>
              <p>建議優先關注的項目</p>
            </div>
          </div>

          <div className="admin-home-alert-list">
            <AlertItem
              level="warning"
              title={`待處理訂單 ${summary.pending_orders ?? 0} 筆`}
              text="建議優先確認付款與出貨流程。"
            />
            <AlertItem
              level="danger"
              title={`低庫存商品 ${summary.low_stock_count ?? 0} 件`}
              text="請留意熱門商品缺貨風險。"
            />
            <AlertItem
              level="info"
              title={`今日新增訂單 ${summary.today_orders ?? 0} 筆`}
              text="可以搭配訂單管理頁追蹤處理進度。"
            />
          </div>
        </div>
      </section>

      <section className="admin-home-bottom-grid">
        <div className="admin-home-panel">
          <div className="admin-home-panel-header">
            <div>
              <h3>最近訂單</h3>
              <p>最新 5 筆訂單資訊</p>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <div className="admin-home-empty-box">目前沒有訂單資料</div>
          ) : (
            <>
              <div className="admin-home-table-wrap desktop-only">
                <table className="admin-home-table">
                  <thead>
                    <tr>
                      <th>訂單編號</th>
                      <th>收件人</th>
                      <th>金額</th>
                      <th>狀態</th>
                      <th>時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.name}</td>
                        <td>{formatCurrency(order.total_price)}</td>
                        <td>
                          <span
                            className={`admin-home-status-badge ${order.status}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-home-mobile-list mobile-only">
                {recentOrders.map((order) => (
                  <div key={order.id} className="admin-home-mobile-card">
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">訂單編號</span>
                      <span className="admin-home-mobile-value">
                        #{order.id}
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">收件人</span>
                      <span className="admin-home-mobile-value">
                        {order.name}
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">金額</span>
                      <span className="admin-home-mobile-value">
                        {formatCurrency(order.total_price)}
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">狀態</span>
                      <span className="admin-home-mobile-value">
                        <span
                          className={`admin-home-status-badge ${order.status}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">時間</span>
                      <span className="admin-home-mobile-value">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="admin-home-panel">
          <div className="admin-home-panel-header">
            <div>
              <h3>低庫存商品</h3>
              <p>優先補貨清單</p>
            </div>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="admin-home-empty-box">目前沒有低庫存商品</div>
          ) : (
            <>
              <div className="admin-home-table-wrap desktop-only">
                <table className="admin-home-table">
                  <thead>
                    <tr>
                      <th>商品名稱</th>
                      <th>分類</th>
                      <th>庫存</th>
                      <th>價格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{formatCategory(product.category)}</td>
                        <td>
                          <span className="admin-home-stock-danger">
                            {product.stock}
                          </span>
                        </td>
                        <td>{formatCurrency(product.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-home-mobile-list mobile-only">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="admin-home-mobile-card">
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">商品名稱</span>
                      <span className="admin-home-mobile-value">
                        {product.name}
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">分類</span>
                      <span className="admin-home-mobile-value">
                        {formatCategory(product.category)}
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">庫存</span>
                      <span className="admin-home-mobile-value">
                        <span className="admin-home-stock-danger">
                          {product.stock}
                        </span>
                      </span>
                    </div>
                    <div className="admin-home-mobile-card-row">
                      <span className="admin-home-mobile-label">價格</span>
                      <span className="admin-home-mobile-value">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ title, value, subtext, icon, accent = "" }) {
  return (
    <div className={`admin-home-kpi-card ${accent}`}>
      <div className="admin-home-kpi-card-top">
        <span className="admin-home-kpi-icon">{icon}</span>
        <span className="admin-home-kpi-title">{title}</span>
      </div>
      <div className="admin-home-kpi-value">{value}</div>
      <div className="admin-home-kpi-subtext">{subtext}</div>
    </div>
  );
}

function AlertItem({ level, title, text }) {
  return (
    <div className={`admin-home-alert-item ${level}`}>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}

function formatCurrency(value) {
  return `NT$ ${Number(value || 0).toLocaleString("zh-TW")}`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  const map = {
    pending: "待處理",
    shipped: "已出貨",
    completed: "已完成",
    cancelled: "已取消",
  };
  return map[status] || status;
}

function formatCategory(category) {
  const map = {
    clothing: "上衣",
    pant: "褲子",
    sock: "襪子",
  };
  return map[category] || category;
}
