import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/adminUsers.css";

const API_BASE = "http://localhost:8000";

const defaultForm = {
  username: "",
  email: "",
  role: "user",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2500);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/admin/users`);

      if (!res.ok) {
        throw new Error("載入使用者失敗");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setUsers([]);
      showToast(error.message || "載入使用者失敗", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, roleFilter]);

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setForm({
      username: user.username || "",
      email: user.email || "",
      role: user.role || "user",
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditUser(null);
    setForm(defaultForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.email.trim()) {
      showToast("請填寫使用者名稱與 Email", "error");
      return;
    }

    if (!editUser) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          role: form.role,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "儲存失敗");
      }

      showToast("使用者更新成功");
      handleCloseForm();
      await fetchUsers();
    } catch (error) {
      console.error(error);
      showToast(error.message || "儲存失敗", "error");
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteTarget(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "刪除失敗");
      }

      showToast("使用者刪除成功");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (error) {
      console.error(error);
      showToast(error.message || "刪除失敗", "error");
    }
  };

  const handleViewOrders = async (user) => {
    try {
      setSelectedUser(user);
      setShowOrdersModal(true);
      setOrdersLoading(true);
      setUserOrders([]);

      const res = await fetch(`${API_BASE}/admin/users/${user.id}/orders`);
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        throw new Error(data?.detail || "載入訂單紀錄失敗");
      }

      setUserOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showToast(error.message || "載入訂單紀錄失敗", "error");
    } finally {
      setOrdersLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const lowerKeyword = keyword.toLowerCase();

      const matchKeyword =
        user.username?.toLowerCase().includes(lowerKeyword) ||
        user.email?.toLowerCase().includes(lowerKeyword);

      const matchRole = roleFilter === "all" ? true : user.role === roleFilter;

      return matchKeyword && matchRole;
    });
  }, [users, keyword, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>使用者管理</h2>
          <p>管理會員資料、角色與消費紀錄</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="搜尋使用者名稱 / Email"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="admin-search"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">全部角色</option>
          <option value="user">一般會員</option>
          <option value="admin">管理員</option>
        </select>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-empty">載入中...</div>
        ) : paginatedUsers.length === 0 ? (
          <div className="admin-empty">查無使用者資料</div>
        ) : (
          <>
            <div className="admin-table-wrap desktop-only">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>使用者名稱</th>
                    <th>Email</th>
                    <th>角色</th>
                    <th>歷史訂單數</th>
                    <th>累積消費金額</th>
                    <th>最近下單時間</th>
                    <th>建立時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`role-badge ${
                            user.role === "admin" ? "admin" : "user"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{user.total_orders ?? 0}</td>
                      <td>
                        NT${" "}
                        {Number(user.total_spent ?? 0).toLocaleString("zh-TW")}
                      </td>
                      <td>{formatDate(user.last_order_at)}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className="admin-action-group">
                          <button
                            className="view-btn"
                            onClick={() => handleViewOrders(user)}
                          >
                            訂單紀錄
                          </button>
                          <button
                            className="edit-btn"
                            onClick={() => handleOpenEdit(user)}
                          >
                            編輯
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteClick(user)}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-user-list mobile-only">
              {paginatedUsers.map((user) => (
                <div className="mobile-user-card" key={user.id}>
                  <div className="mobile-card-header">
                    <div className="mobile-card-title-wrap">
                      <p className="mobile-card-label">使用者名稱</p>
                      <h3>{user.username}</h3>
                    </div>
                    <span
                      className={`role-badge ${
                        user.role === "admin" ? "admin" : "user"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="mobile-user-rows">
                    <div className="mobile-data-row">
                      <span className="mobile-data-key">ID：</span>
                      <span className="mobile-data-value">{user.id}</span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-key">Email：</span>
                      <span className="mobile-data-value">{user.email}</span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-key">歷史訂單數：</span>
                      <span className="mobile-data-value">
                        {user.total_orders ?? 0}
                      </span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-key">累積消費：</span>
                      <span className="mobile-data-value strong">
                        NT${" "}
                        {Number(user.total_spent ?? 0).toLocaleString("zh-TW")}
                      </span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-key">最近下單時間：</span>
                      <span className="mobile-data-value">
                        {formatDate(user.last_order_at)}
                      </span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-key">建立時間：</span>
                      <span className="mobile-data-value">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-user-actions">
                    <button
                      className="view-btn"
                      onClick={() => handleViewOrders(user)}
                    >
                      訂單紀錄
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleOpenEdit(user)}
                    >
                      編輯
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(user)}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              上一頁
            </button>

            <span>
              第 {currentPage} / {totalPages} 頁
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              下一頁
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={handleCloseForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>編輯使用者</h3>
              <button className="modal-close-btn" onClick={handleCloseForm}>
                ×
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>使用者名稱</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="請輸入使用者名稱"
                />
              </div>

              <div className="admin-form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="請輸入 Email"
                />
              </div>

              <div className="admin-form-group">
                <label>角色</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="user">一般會員</option>
                  <option value="admin">管理員</option>
                </select>
              </div>

              <div className="admin-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseForm}
                >
                  取消
                </button>
                <button type="submit" className="save-btn">
                  儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
        >
          <div
            className="admin-modal small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>刪除確認</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="delete-confirm-box">
              <p>
                確定要刪除使用者 <strong>{deleteTarget.username}</strong> 嗎？
              </p>
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={handleDeleteConfirm}
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrdersModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowOrdersModal(false)}
        >
          <div
            className="admin-modal orders-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>{selectedUser?.username} 的訂單紀錄</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowOrdersModal(false)}
              >
                ×
              </button>
            </div>

            {ordersLoading ? (
              <div className="admin-empty">載入中...</div>
            ) : userOrders.length === 0 ? (
              <div className="admin-empty">此會員目前沒有訂單紀錄</div>
            ) : (
              <>
                <div className="admin-table-wrap desktop-only">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>訂單編號</th>
                        <th>收件人</th>
                        <th>電話</th>
                        <th>Email</th>
                        <th>配送方式</th>
                        <th>付款方式</th>
                        <th>訂單金額</th>
                        <th>狀態</th>
                        <th>下單時間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userOrders.map((order) => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.name}</td>
                          <td>{order.phone}</td>
                          <td>{order.email}</td>
                          <td>{formatDelivery(order.delivery)}</td>
                          <td>{formatPayment(order.payment)}</td>
                          <td>
                            NT${" "}
                            {Number(order.total_price ?? 0).toLocaleString(
                              "zh-TW",
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${order.status}`}>
                              {formatStatus(order.status)}
                            </span>
                          </td>
                          <td>{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-order-list mobile-only">
                  {userOrders.map((order) => (
                    <div className="mobile-order-card" key={order.id}>
                      <div className="mobile-card-header">
                        <div className="mobile-card-title-wrap">
                          <p className="mobile-card-label">訂單編號</p>
                          <h3>#{order.id}</h3>
                        </div>
                        <span className={`status-badge ${order.status}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>

                      <div className="mobile-order-rows">
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">收件人：</span>
                          <span className="mobile-data-value">
                            {order.name}
                          </span>
                        </div>
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">電話：</span>
                          <span className="mobile-data-value">
                            {order.phone}
                          </span>
                        </div>
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">Email：</span>
                          <span className="mobile-data-value">
                            {order.email}
                          </span>
                        </div>
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">配送方式：</span>
                          <span className="mobile-data-value">
                            {formatDelivery(order.delivery)}
                          </span>
                        </div>
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">付款方式：</span>
                          <span className="mobile-data-value">
                            {formatPayment(order.payment)}
                          </span>
                        </div>
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">訂單金額：</span>
                          <span className="mobile-data-value strong">
                            NT${" "}
                            {Number(order.total_price ?? 0).toLocaleString(
                              "zh-TW",
                            )}
                          </span>
                        </div>
                        <div className="mobile-data-row">
                          <span className="mobile-data-key">下單時間：</span>
                          <span className="mobile-data-value">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("zh-TW", {
    year: "numeric",
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

function formatPayment(payment) {
  const map = {
    credit_card: "信用卡",
    cod: "貨到付款",
  };
  return map[payment] || payment;
}

function formatDelivery(delivery) {
  const map = {
    home: "宅配",
    store: "超商取貨",
  };
  return map[delivery] || delivery;
}
