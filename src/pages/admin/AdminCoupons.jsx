import { useEffect, useState, useCallback } from "react";
import "../../styles/adminCoupons.css";

const initialForm = {
  code: "",
  name: "",
  discount_type: "fixed",
  discount_value: "",
  min_spend: 0,
  applicable_category: "",
  min_category_qty: 0,
  usage_limit: 1,
  is_active: true,
};

const initialModal = {
  open: false,
  type: "info",
  title: "",
  message: "",
  onConfirm: null,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(initialModal);

  const openInfoModal = (title, message) => {
    setModal({
      open: true,
      type: "info",
      title,
      message,
      onConfirm: null,
    });
  };

  const openConfirmModal = (title, message, onConfirm) => {
    setModal({
      open: true,
      type: "confirm",
      title,
      message,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal(initialModal);
  };

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/admin/coupons");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      openInfoModal("取得失敗", "取得優惠券列表失敗，請稍後再試。");
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
            ? value.toUpperCase()
            : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      discount_value: Number(form.discount_value),
      min_spend: Number(form.min_spend),
      min_category_qty: Number(form.min_category_qty),
      usage_limit: Number(form.usage_limit),
      applicable_category: form.applicable_category || null,
    };

    try {
      const url = editingId
        ? `http://localhost:8000/admin/coupons/${editingId}`
        : "http://localhost:8000/admin/coupons";

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        openInfoModal("操作失敗", data.detail || "操作失敗，請再試一次。");
        return;
      }

      openInfoModal(
        editingId ? "修改成功" : "新增成功",
        editingId ? "優惠券已成功修改。" : "優惠券已成功新增。",
      );

      resetForm();
      fetchCoupons();
    } catch {
      openInfoModal("連線失敗", "伺服器連線失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || "",
      name: coupon.name || "",
      discount_type: coupon.discount_type || "fixed",
      discount_value: coupon.discount_value ?? "",
      min_spend: coupon.min_spend ?? 0,
      applicable_category: coupon.applicable_category || "",
      min_category_qty: coupon.min_category_qty ?? 0,
      usage_limit: coupon.usage_limit ?? 1,
      is_active: coupon.is_active ?? true,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = (coupon) => {
    openConfirmModal(
      coupon.is_active ? "停用優惠券" : "啟用優惠券",
      coupon.is_active
        ? `確定要停用優惠券「${coupon.code}」嗎？`
        : `確定要啟用優惠券「${coupon.code}」嗎？`,
      async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/admin/coupons/${coupon.id}/toggle`,
            { method: "PATCH" },
          );

          const data = await res.json();

          if (!res.ok) {
            openInfoModal("更新失敗", data.detail || "狀態更新失敗。");
            return;
          }

          closeModal();
          fetchCoupons();
          openInfoModal(
            "更新成功",
            coupon.is_active ? "優惠券已成功停用。" : "優惠券已成功啟用。",
          );
        } catch {
          openInfoModal("連線失敗", "伺服器連線失敗，請稍後再試。");
        }
      },
    );
  };

  const handleDelete = (coupon) => {
    openConfirmModal(
      "刪除優惠券",
      `確定要刪除優惠券「${coupon.code}」嗎？此操作無法復原。`,
      async () => {
        try {
          const res = await fetch(
            `http://localhost:8000/admin/coupons/${coupon.id}`,
            { method: "DELETE" },
          );

          const data = await res.json();

          if (!res.ok) {
            openInfoModal("刪除失敗", data.detail || "刪除失敗。");
            return;
          }

          closeModal();
          fetchCoupons();
          openInfoModal("刪除成功", "優惠券已成功刪除。");
        } catch {
          openInfoModal("連線失敗", "伺服器連線失敗，請稍後再試。");
        }
      },
    );
  };

  const getCategoryText = (category) => {
    if (!category) return "不限";
    if (category === "clothing") return "衣服";
    if (category === "pant") return "褲子";
    if (category === "sock") return "襪子";
    return category;
  };

  return (
    <div className="admin-coupons-page">
      <div className="admin-coupons-form-card">
        <div className="admin-coupons-form-header">
          <h2>{editingId ? "修改優惠券" : "新增優惠券"}</h2>

          <div className="coupon-top-switch">
            <label className="switch-wrapper">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              <span className="switch-slider"></span>
            </label>

            <span className="switch-text">
              {form.is_active ? "上架後立即啟用" : "先建立但暫不啟用"}
            </span>
          </div>
        </div>

        <form className="admin-coupons-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>優惠碼</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="例如 SAVE100"
              />
            </div>

            <div className="form-group">
              <label>優惠券名稱</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="例如 滿千折百"
              />
            </div>

            <div className="form-group">
              <label>折扣類型</label>
              <select
                name="discount_type"
                value={form.discount_type}
                onChange={handleChange}
              >
                <option value="fixed">固定金額</option>
                <option value="percent">百分比折扣</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                折扣值
                {form.discount_type === "fixed" ? "（金額）" : "（百分比）"}
              </label>
              <input
                type="number"
                name="discount_value"
                value={form.discount_value}
                onChange={handleChange}
                placeholder={form.discount_type === "fixed" ? "100" : "20"}
              />
            </div>

            <div className="form-group">
              <label>最低消費金額</label>
              <input
                type="number"
                name="min_spend"
                value={form.min_spend}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>適用分類</label>
              <select
                name="applicable_category"
                value={form.applicable_category}
                onChange={handleChange}
              >
                <option value="">不限分類</option>
                <option value="clothing">衣服</option>
                <option value="pant">褲子</option>
                <option value="sock">襪子</option>
              </select>
            </div>

            <div className="form-group">
              <label>分類最低件數</label>
              <input
                type="number"
                name="min_category_qty"
                value={form.min_category_qty}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>使用上限</label>
              <input
                type="number"
                name="usage_limit"
                value={form.usage_limit}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? "處理中..." : editingId ? "儲存修改" : "新增優惠券"}
            </button>

            {editingId && (
              <button type="button" className="cancel-btn" onClick={resetForm}>
                取消編輯
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-coupons-list-card">
        <h2>優惠券列表</h2>

        <div className="admin-coupons-table-wrap">
          <table className="admin-coupons-table">
            <thead>
              <tr>
                <th>優惠碼</th>
                <th>名稱</th>
                <th>類型</th>
                <th>折扣值</th>
                <th>分類</th>
                <th>條件</th>
                <th>使用量</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    目前沒有優惠券
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>{coupon.code}</td>
                    <td>{coupon.name}</td>
                    <td>
                      {coupon.discount_type === "fixed"
                        ? "固定金額"
                        : "百分比折扣"}
                    </td>
                    <td>
                      {coupon.discount_type === "fixed"
                        ? `NT$ ${coupon.discount_value}`
                        : `${coupon.discount_value}%`}
                    </td>
                    <td>{getCategoryText(coupon.applicable_category)}</td>
                    <td>
                      最低消費 NT$ {coupon.min_spend}
                      <br />
                      分類件數 {coupon.min_category_qty}
                    </td>
                    <td>
                      {coupon.used_count} / {coupon.usage_limit}
                    </td>
                    <td>
                      <span
                        className={
                          coupon.is_active
                            ? "status-badge active"
                            : "status-badge inactive"
                        }
                      >
                        {coupon.is_active ? "啟用中" : "已停用"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(coupon)}
                        >
                          修改
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(coupon)}
                        >
                          {coupon.is_active ? "停用" : "啟用"}
                        </button>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(coupon)}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-coupons-mobile-list">
          {coupons.length === 0 ? (
            <div className="mobile-empty-card">目前沒有優惠券</div>
          ) : (
            coupons.map((coupon) => (
              <div className="coupon-mobile-card" key={`mobile-${coupon.id}`}>
                <div className="coupon-mobile-card-header">
                  <div className="coupon-mobile-main">
                    <h3>{coupon.name}</h3>
                    <p>{coupon.code}</p>
                  </div>

                  <span
                    className={
                      coupon.is_active
                        ? "status-badge active"
                        : "status-badge inactive"
                    }
                  >
                    {coupon.is_active ? "啟用中" : "已停用"}
                  </span>
                </div>

                <div className="coupon-mobile-grid">
                  <div className="coupon-mobile-item">
                    <span className="coupon-mobile-label">類型</span>
                    <span className="coupon-mobile-value">
                      {coupon.discount_type === "fixed"
                        ? "固定金額"
                        : "百分比折扣"}
                    </span>
                  </div>

                  <div className="coupon-mobile-item">
                    <span className="coupon-mobile-label">折扣值</span>
                    <span className="coupon-mobile-value">
                      {coupon.discount_type === "fixed"
                        ? `NT$ ${coupon.discount_value}`
                        : `${coupon.discount_value}%`}
                    </span>
                  </div>

                  <div className="coupon-mobile-item">
                    <span className="coupon-mobile-label">適用分類</span>
                    <span className="coupon-mobile-value">
                      {getCategoryText(coupon.applicable_category)}
                    </span>
                  </div>

                  <div className="coupon-mobile-item">
                    <span className="coupon-mobile-label">使用量</span>
                    <span className="coupon-mobile-value">
                      {coupon.used_count} / {coupon.usage_limit}
                    </span>
                  </div>

                  <div className="coupon-mobile-item coupon-mobile-item-full">
                    <span className="coupon-mobile-label">條件</span>
                    <span className="coupon-mobile-value coupon-mobile-multiline">
                      最低消費 NT$ {coupon.min_spend}
                      <br />
                      分類件數 {coupon.min_category_qty}
                    </span>
                  </div>
                </div>

                <div className="coupon-mobile-actions">
                  <button type="button" onClick={() => handleEdit(coupon)}>
                    修改
                  </button>
                  <button type="button" onClick={() => handleToggle(coupon)}>
                    {coupon.is_active ? "停用" : "啟用"}
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(coupon)}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modal.open && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>

            <div
              className={`custom-modal-actions ${
                modal.type === "info" ? "single-action" : ""
              }`}
            >
              {modal.type === "confirm" ? (
                <>
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={closeModal}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="modal-confirm-btn"
                    onClick={modal.onConfirm}
                  >
                    確定
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="modal-confirm-btn"
                  onClick={closeModal}
                >
                  確認
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
