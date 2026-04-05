import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import "../styles/myorders.css";

const STATUS_TEXT = {
  pending: "處理中",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_STEP = {
  pending: 1,
  shipped: 2,
  completed: 3,
  cancelled: 0,
};

function formatOrderNumber(order) {
  const date = new Date(order?.createdAt || order?.created_at);

  if (Number.isNaN(date.getTime())) {
    return `ORD-${String(order?.id || "").padStart(6, "0")}`;
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `ORD-${y}${m}${d}-${String(order?.id || "").padStart(4, "0")}`;
}

function OrderDetailInline({ orderId, status }) {
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch(`http://localhost:8000/orders/detail/${orderId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("取得訂單明細失敗");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setDetail(data);
        setDetailError("");
        setDetailLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setDetailError("無法取得訂單明細");
        setDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("zh-TW");
  };

  const formatPrice = (price) => {
    return `NT$ ${Number(price || 0).toLocaleString()}`;
  };

  const currentStep = STATUS_STEP[status] ?? 0;
  const isCancelled = status === "cancelled";

  if (detailLoading) {
    return <div className="order-detail-inline">明細載入中...</div>;
  }

  if (detailError) {
    return (
      <div className="order-detail-inline">
        <p className="detail-error">{detailError}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="order-detail-inline">
        <p className="detail-error">找不到訂單明細</p>
      </div>
    );
  }

  return (
    <div className="order-detail-inline">
      <div className="order-progress-card">
        <h3 className="detail-section-title">訂單進度</h3>

        {isCancelled ? (
          <div className="cancelled-box">此訂單已取消</div>
        ) : (
          <div className="order-progress">
            <div className="progress-line">
              <div className={`progress-line-fill step-${currentStep}`} />
            </div>

            <div className="progress-steps">
              <div
                className={`progress-step ${currentStep >= 1 ? "active" : ""}`}
              >
                <div className="step-dot" />
                <span>處理中</span>
              </div>

              <div
                className={`progress-step ${currentStep >= 2 ? "active" : ""}`}
              >
                <div className="step-dot" />
                <span>已出貨</span>
              </div>

              <div
                className={`progress-step ${currentStep >= 3 ? "active" : ""}`}
              >
                <div className="step-dot" />
                <span>已完成</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3 className="detail-section-title">收件資訊</h3>
          <div className="detail-row">
            <span>收件人</span>
            <strong>{detail.customerName || detail.name || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>電話</span>
            <strong>{detail.phone || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>Email</span>
            <strong>{detail.customerEmail || detail.email || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>配送方式</span>
            <strong>{detail.delivery || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>地址</span>
            <strong>{detail.fullAddress || "—"}</strong>
          </div>
        </div>

        <div className="detail-card">
          <h3 className="detail-section-title">訂單資訊</h3>
          <div className="detail-row">
            <span>訂單編號</span>
            <strong>{formatOrderNumber(detail)}</strong>
          </div>
          <div className="detail-row">
            <span>付款方式</span>
            <strong>{detail.paymentMethod || detail.payment || "—"}</strong>
          </div>
          <div className="detail-row">
            <span>下單時間</span>
            <strong>
              {formatDateTime(detail.createdAt || detail.created_at)}
            </strong>
          </div>
          <div className="detail-row">
            <span>完成時間</span>
            <strong>
              {formatDateTime(detail.completedAt || detail.completed_at)}
            </strong>
          </div>
          <div className="detail-row total-row">
            <span>總金額</span>
            <strong>
              {formatPrice(detail.totalPrice ?? detail.total_price)}
            </strong>
          </div>
        </div>
      </div>

      <div className="detail-card items-card">
        <h3 className="detail-section-title">商品明細</h3>

        <div className="detail-items">
          {detail.items?.map((item, index) => (
            <div className="detail-item" key={item.id || `${item.name}-${index}`}>
              <div className="detail-item-image-wrap">
                <img
                  src={item.image || "/placeholder.png"}
                  alt={item.name}
                  className="detail-item-image"
                />
              </div>

              <div className="detail-item-info">
                <h4>{item.name}</h4>
                <p>尺寸：{item.size || "—"}</p>
                <p>單價：{formatPrice(item.price)}</p>
                <p>數量：{item.quantity}</p>
              </div>

              <div className="detail-item-subtotal">
                {formatPrice(Number(item.price) * Number(item.quantity))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    fetch(`http://localhost:8000/orders/user/${user.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("取得訂單失敗");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setOrders(Array.isArray(data) ? data : []);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setError("無法取得訂單資料");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return `NT$ ${Number(price || 0).toLocaleString()}`;
  };

  const handleToggleDetail = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (!user) {
    return (
      <div className="my-orders-page">
        <h1 className="my-orders-title">我的訂單</h1>
        <p className="my-orders-empty">請先登入後查看訂單。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-orders-page">
        <h1 className="my-orders-title">我的訂單</h1>
        <p className="my-orders-loading">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-page">
        <h1 className="my-orders-title">我的訂單</h1>
        <p className="my-orders-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <h1 className="my-orders-title">我的訂單</h1>

      {orders.length === 0 ? (
        <div className="my-orders-empty-box">
          <p className="my-orders-empty">目前還沒有任何訂單</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-card-top">
                <div>
                  <p className="order-label">訂單編號</p>
                  <p className="order-value">{formatOrderNumber(order)}</p>
                </div>

                <span className={`order-status status-${order.status}`}>
                  {STATUS_TEXT[order.status] || order.status}
                </span>
              </div>

              <div className="order-card-body">
                <div className="order-info-item">
                  <span className="order-info-label">下單日期</span>
                  <span className="order-info-value">
                    {formatDate(order.createdAt || order.created_at)}
                  </span>
                </div>

                <div className="order-info-item">
                  <span className="order-info-label">配送方式</span>
                  <span className="order-info-value">
                    {order.delivery || "—"}
                  </span>
                </div>

                <div className="order-info-item">
                  <span className="order-info-label">付款方式</span>
                  <span className="order-info-value">
                    {order.paymentMethod || order.payment || "—"}
                  </span>
                </div>

                <div className="order-info-item">
                  <span className="order-info-label">訂單金額</span>
                  <span className="order-info-value total">
                    {formatPrice(order.totalPrice ?? order.total_price)}
                  </span>
                </div>
              </div>

              <div className="order-card-actions">
                <button
                  className="order-detail-btn"
                  onClick={() => handleToggleDetail(order.id)}
                >
                  {expandedOrderId === order.id ? "收合明細" : "查看明細"}
                </button>
              </div>

              {expandedOrderId === order.id && (
                <OrderDetailInline
                  key={order.id}
                  orderId={order.id}
                  status={order.status}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}