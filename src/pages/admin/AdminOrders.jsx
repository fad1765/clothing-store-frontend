import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import "../../styles/adminOrders.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const statusMap = {
  all: "全部狀態",
  pending: "待出貨",
  shipped: "已出貨",
  completed: "已完成",
  cancelled: "已取消",
};

function getOrderTotal(order) {
  if (typeof order.totalPrice === "number") {
    return order.totalPrice;
  }

  if (!Array.isArray(order.items)) return 0;

  return order.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );
}

function getOrderItemCount(order) {
  if (!Array.isArray(order.items)) return 0;

  return order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function formatAddress(order) {
  return (
    `${order.city || ""}${order.district || ""}${order.address || ""}` || "無"
  );
}

function formatDateTime(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatOrderNumber(order) {
  const date = new Date(order.createdAt);
  if (Number.isNaN(date.getTime())) {
    return `ORD-${String(order.id).padStart(6, "0")}`;
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `ORD-${y}${m}${d}-${String(order.id).padStart(4, "0")}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }

      setToast({
        show: true,
        message,
        type,
      });

      toastTimerRef.current = setTimeout(() => {
        setToast({
          show: false,
          message: "",
          type: "success",
        });
        toastTimerRef.current = null;
      }, duration);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const loadOrders = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);

        const res = await fetch(`${API_BASE_URL}/orders`);
        if (!res.ok) throw new Error("載入訂單失敗");

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("載入訂單失敗:", error);
        setOrders([]);
        showToast("訂單載入失敗", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  const stats = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      completed: orders.filter((o) => o.status === "completed").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return orders
      .filter((order) => {
        const orderIdText = String(order.id).toLowerCase();
        const formattedOrderNoText = formatOrderNumber(order).toLowerCase();
        const customerNameText = String(order.customerName || "").toLowerCase();
        const customerEmailText = String(
          order.customerEmail || "",
        ).toLowerCase();

        const matchStatus =
          selectedStatus === "all" || order.status === selectedStatus;

        const matchKeyword =
          keyword === "" ||
          orderIdText.includes(keyword) ||
          formattedOrderNoText.includes(keyword) ||
          customerNameText.includes(keyword) ||
          customerEmailText.includes(keyword);

        return matchStatus && matchKeyword;
      })
      .sort((a, b) => b.id - a.id);
  }, [orders, searchKeyword, selectedStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) {
        throw new Error("更新訂單狀態失敗");
      }

      const completedAtValue =
        newStatus === "completed" ? new Date().toISOString() : null;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                completedAt: completedAtValue,
              }
            : order,
        ),
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          status: newStatus,
          completedAt: completedAtValue,
        }));
      }

      showToast("訂單狀態更新成功", "success");
    } catch (error) {
      console.error("更新狀態失敗:", error);
      showToast("訂單狀態更新失敗", "error");
    }
  };

  const openOrderDetail = async (order) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/detail/${order.id}`,
      );

      if (!res.ok) {
        throw new Error("取得訂單詳情失敗");
      }

      const data = await res.json();
      setSelectedOrder(data);
    } catch (error) {
      console.error("取得訂單詳情失敗:", error);
      showToast("取得訂單詳情失敗", "error");
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="admin-header">
        <div>
          <h1 className="admin-title">訂單管理</h1>
          <p className="admin-subtitle">查看訂單狀態、搜尋訂單與管理出貨流程</p>
        </div>
      </div>

      <div className="admin-order-stats">
        <div className="admin-order-stat-card">
          <p className="admin-order-stat-label">全部訂單</p>
          <h3>{stats.all}</h3>
        </div>
        <div className="admin-order-stat-card pending">
          <p className="admin-order-stat-label">待出貨</p>
          <h3>{stats.pending}</h3>
        </div>
        <div className="admin-order-stat-card shipped">
          <p className="admin-order-stat-label">已出貨</p>
          <h3>{stats.shipped}</h3>
        </div>
        <div className="admin-order-stat-card completed">
          <p className="admin-order-stat-label">已完成</p>
          <h3>{stats.completed}</h3>
        </div>
        <div className="admin-order-stat-card cancelled">
          <p className="admin-order-stat-label">已取消</p>
          <h3>{stats.cancelled}</h3>
        </div>
      </div>

      <div className="admin-order-toolbar">
        <div className="admin-order-search">
          <input
            type="text"
            placeholder="搜尋訂單編號 / 顧客姓名 / Email"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="admin-order-filter">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">全部狀態</option>
            <option value="pending">待出貨</option>
            <option value="shipped">已出貨</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="admin-table-wrapper desktop-order-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>顧客資訊</th>
              <th>金額</th>
              <th>商品數量</th>
              <th>訂單狀態</th>
              <th>建立時間</th>
              <th>完成時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="admin-order-id">{formatOrderNumber(order)}</td>
                <td>
                  <div className="admin-order-customer">
                    <strong>{order.customerName || "—"}</strong>
                    <span>{order.customerEmail || "—"}</span>
                  </div>
                </td>
                <td>NT$ {getOrderTotal(order)}</td>
                <td>{getOrderItemCount(order)}</td>
                <td>
                  <span className={`order-status-badge ${order.status}`}>
                    {statusMap[order.status]}
                  </span>
                </td>
                <td>{formatDateTime(order.createdAt)}</td>
                <td>{formatDateTime(order.completedAt)}</td>
                <td>
                  <div className="admin-order-actions">
                    <button
                      type="button"
                      className="admin-btn-edit"
                      onClick={() => openOrderDetail(order)}
                    >
                      查看詳情
                    </button>

                    <select
                      className="admin-order-status-select"
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                    >
                      <option value="pending">待出貨</option>
                      <option value="shipped">已出貨</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="8" className="admin-empty">
                  目前沒有符合條件的訂單
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mobile-order-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div className="mobile-order-card" key={`mobile-${order.id}`}>
              <div className="mobile-order-card-top">
                <div>
                  <p className="mobile-order-label">訂單編號</p>
                  <h3 className="mobile-order-number">
                    {formatOrderNumber(order)}
                  </h3>
                </div>
                <span className={`order-status-badge ${order.status}`}>
                  {statusMap[order.status]}
                </span>
              </div>

              <div className="mobile-order-info-grid">
                <div className="mobile-order-info-item full">
                  <span className="mobile-order-info-label">顧客資訊</span>
                  <div className="mobile-order-customer">
                    <strong>{order.customerName || "—"}</strong>
                    <span>{order.customerEmail || "—"}</span>
                  </div>
                </div>

                <div className="mobile-order-info-item">
                  <span className="mobile-order-info-label">金額</span>
                  <strong>NT$ {getOrderTotal(order)}</strong>
                </div>

                <div className="mobile-order-info-item">
                  <span className="mobile-order-info-label">商品數量</span>
                  <strong>{getOrderItemCount(order)}</strong>
                </div>

                <div className="mobile-order-info-item">
                  <span className="mobile-order-info-label">建立時間</span>
                  <strong>{formatDateTime(order.createdAt)}</strong>
                </div>

                <div className="mobile-order-info-item">
                  <span className="mobile-order-info-label">完成時間</span>
                  <strong>{formatDateTime(order.completedAt)}</strong>
                </div>
              </div>

              <div className="mobile-order-actions">
                <button
                  type="button"
                  className="admin-btn-edit"
                  onClick={() => openOrderDetail(order)}
                >
                  查看詳情
                </button>

                <select
                  className="admin-order-status-select"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  <option value="pending">待出貨</option>
                  <option value="shipped">已出貨</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="mobile-order-empty">目前沒有符合條件的訂單</div>
        )}
      </div>

      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={closeOrderDetail}>
          <div
            className="admin-order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-order-modal-header">
              <div>
                <h2>訂單詳情</h2>
                <p className="admin-order-modal-id">
                  {formatOrderNumber(selectedOrder)}
                </p>
              </div>
              <button
                type="button"
                className="admin-order-modal-close"
                onClick={closeOrderDetail}
              >
                ✕
              </button>
            </div>

            <div className="admin-order-detail-grid">
              <div className="admin-order-detail-card">
                <h3>顧客資訊</h3>
                <p>
                  <strong>姓名：</strong>
                  {selectedOrder.customerName || "—"}
                </p>
                <p>
                  <strong>Email：</strong>
                  {selectedOrder.customerEmail || "—"}
                </p>
                <p>
                  <strong>電話：</strong>
                  {selectedOrder.phone || "—"}
                </p>
                <p>
                  <strong>地址：</strong>
                  {selectedOrder.fullAddress || formatAddress(selectedOrder)}
                </p>
              </div>

              <div className="admin-order-detail-card">
                <h3>訂單資訊</h3>
                <p>
                  <strong>狀態：</strong>
                  <span
                    className={`order-status-badge ${selectedOrder.status}`}
                  >
                    {statusMap[selectedOrder.status]}
                  </span>
                </p>
                <p>
                  <strong>建立時間：</strong>
                  {formatDateTime(selectedOrder.createdAt)}
                </p>
                <p>
                  <strong>完成時間：</strong>
                  {formatDateTime(selectedOrder.completedAt)}
                </p>
                <p>
                  <strong>配送方式：</strong>
                  {selectedOrder.delivery || "—"}
                </p>
                <p>
                  <strong>付款方式：</strong>
                  {selectedOrder.paymentMethod || "—"}
                </p>
              </div>
            </div>

            <div className="admin-order-product-section">
              <h3>商品清單</h3>

              <div className="admin-order-product-list">
                {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <div
                      className="admin-order-product-item"
                      key={item.id || `${item.name}-${index}`}
                    >
                      <img
                        src={
                          item.image ||
                          "https://placehold.co/120x120?text=Product"
                        }
                        alt={item.name}
                      />
                      <div className="admin-order-product-info">
                        <h4>{item.name}</h4>
                        <p>單價：NT$ {item.price}</p>
                        <p>數量：{item.quantity}</p>
                        <p>尺寸：{item.size || "—"}</p>
                      </div>
                      <div className="admin-order-product-subtotal">
                        NT$ {Number(item.price) * Number(item.quantity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="admin-empty">此訂單沒有商品資料</p>
                )}
              </div>
            </div>

            <div className="admin-order-modal-footer">
              <div className="admin-order-total">
                訂單總金額：
                <strong> NT$ {getOrderTotal(selectedOrder)}</strong>
              </div>

              <div className="admin-order-footer-actions">
                <select
                  className="admin-order-status-select"
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder.id, e.target.value)
                  }
                >
                  <option value="pending">待出貨</option>
                  <option value="shipped">已出貨</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>

                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={closeOrderDetail}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
