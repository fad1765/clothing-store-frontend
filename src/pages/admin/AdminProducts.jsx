import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MdDeleteForever } from "react-icons/md";
import { FaCheck } from "react-icons/fa6";
import { ImCross } from "react-icons/im";
import "../../styles/admin.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const previewUrlsRef = useRef([]);
  const toastTimerRef = useRef(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "clothing",
    description: "",
    stock: "",
    is_hot: false,
    is_limited: false,
  });

  useEffect(() => {
    previewUrlsRef.current = imagePreviews;
  }, [imagePreviews]);

  const showToast = (message, type = "success", duration = 3000) => {
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
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const clearPreviewUrls = (previews = previewUrlsRef.current) => {
    previews.forEach((item) => {
      if (!item.isExisting && item.url) {
        URL.revokeObjectURL(item.url);
      }
    });
  };

  const resetForm = useCallback(() => {
    clearPreviewUrls();

    setForm({
      name: "",
      price: "",
      category: "clothing",
      description: "",
      stock: "",
      is_hot: false,
      is_limited: false,
    });

    setImageFiles([]);
    setImagePreviews([]);
    setPreviewImage(null);
    setEditProduct(null);
  }, []);

  const loadProducts = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error("載入商品失敗");

      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("載入商品失敗:", err);
      setProducts([]);
      showToast("商品載入失敗", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(true);
  }, [loadProducts]);

  useEffect(() => {
    return () => {
      clearPreviewUrls(previewUrlsRef.current);
    };
  }, []);

  const openDeleteModal = (product) => {
    setDeleteTarget(product);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setImageFiles([]);
    setPreviewImage(null);

    setImagePreviews(
      product.image ? [{ url: product.image, isExisting: true }] : [],
    );

    setForm({
      name: product.name || "",
      price: product.price ? String(product.price) : "",
      category: product.category || "clothing",
      description: product.description || "",
      stock: product.stock ? String(product.stock) : "",
      is_hot: !!product.is_hot,
      is_limited: !!product.is_limited,
    });

    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/products/${deleteTarget.id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error("刪除失敗");
      }

      setProducts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      closeDeleteModal();
      showToast("商品已成功刪除", "success", 3000);
    } catch (error) {
      console.error("刪除商品失敗:", error);
      closeDeleteModal();
      showToast("刪除失敗，請稍後再試", "error", 3000);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      isExisting: false,
      file,
    }));

    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    e.target.value = "";
  };

  const handleRemoveImage = (index) => {
    const removed = imagePreviews[index];
    if (!removed) return;

    if (!removed.isExisting && removed.url) {
      URL.revokeObjectURL(removed.url);
    }

    if (!removed.isExisting) {
      const newFileIndex = imagePreviews
        .slice(0, index)
        .filter((p) => !p.isExisting).length;

      setImageFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    if (previewImage === removed.url) {
      setPreviewImage(null);
    }
  };

  const handleNumberInput = (e, key) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      showToast("請輸入商品名稱", "error");
      return false;
    }

    if (!form.category) {
      showToast("請選擇商品分類", "error");
      return false;
    }

    if (!form.price.trim()) {
      showToast("請輸入商品價格", "error");
      return false;
    }

    if (Number(form.price) <= 0) {
      showToast("商品價格需大於 0", "error");
      return false;
    }

    if (!form.stock.trim()) {
      showToast("請輸入商品庫存", "error");
      return false;
    }

    if (Number(form.stock) < 0) {
      showToast("商品庫存不可小於 0", "error");
      return false;
    }

    if (!form.description.trim()) {
      showToast("請輸入商品描述", "error");
      return false;
    }

    if (!editProduct && imageFiles.length === 0) {
      showToast("請至少選擇一張商品圖片", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (editProduct) {
        const res = await fetch(
          `${API_BASE_URL}/products/${editProduct.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: form.name.trim(),
              price: parseFloat(form.price),
              category: form.category,
              description: form.description.trim(),
              stock: parseInt(form.stock, 10),
              is_hot: form.is_hot,
              is_limited: form.is_limited,
            }),
          },
        );

        if (!res.ok) throw new Error("修改失敗");

        setProducts((prev) =>
          prev.map((item) =>
            item.id === editProduct.id
              ? {
                  ...item,
                  name: form.name.trim(),
                  price: parseFloat(form.price),
                  category: form.category,
                  description: form.description.trim(),
                  stock: parseInt(form.stock, 10),
                  is_hot: form.is_hot,
                  is_limited: form.is_limited,
                }
              : item,
          ),
        );

        setShowForm(false);
        setPreviewImage(null);
        showToast("商品已成功修改", "success", 3000);
        resetForm();
      } else {
        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("price", form.price);
        formData.append("category", form.category);
        formData.append("description", form.description.trim());
        formData.append("stock", form.stock);
        formData.append("is_hot", String(form.is_hot));
        formData.append("is_limited", String(form.is_limited));

        imageFiles.forEach((file) => formData.append("images", file));

        const res = await fetch(`${API_BASE_URL}/products`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("新增失敗");

        setShowForm(false);
        setPreviewImage(null);
        showToast("商品已成功新增", "success", 3000);
        resetForm();
        await loadProducts(false);
      }
    } catch (error) {
      console.error("儲存商品失敗:", error);
      showToast(editProduct ? "商品修改失敗" : "商品新增失敗", "error", 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredProducts = useMemo(() => {
    return selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

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
        <h1 className="admin-title">商品管理</h1>

        <div className="admin-header-actions">
          <select
            className="admin-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">全部顯示</option>
            <option value="clothing">衣服</option>
            <option value="pant">褲子</option>
            <option value="sock">襪子</option>
          </select>

          <button
            className="admin-btn-primary admin-add-product-btn"
            onClick={handleAdd}
          >
            新增商品
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper desktop-only">
        <table className="admin-table">
          <thead>
            <tr>
              {[
                "圖片",
                "商品名稱",
                "分類",
                "價格",
                "庫存",
                "熱門",
                "限時",
                "操作",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    src={p.image}
                    alt={p.name}
                    className="admin-table-img"
                    loading="lazy"
                  />
                </td>
                <td className="admin-table-name">{p.name}</td>
                <td className="admin-table-category">
                  {formatCategoryLabel(p.category)}
                </td>
                <td>NT$ {p.price}</td>
                <td>
                  <span
                    className={`stock-badge ${
                      p.stock > 0 ? "in-stock" : "out-stock"
                    }`}
                  >
                    {p.stock > 0 ? p.stock : "售完"}
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-table-status-icon ${
                      p.is_hot ? "yes" : "no"
                    }`}
                  >
                    {p.is_hot ? <FaCheck /> : <ImCross />}
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-table-status-icon ${
                      p.is_limited ? "yes" : "no"
                    }`}
                  >
                    {p.is_limited ? <FaCheck /> : <ImCross />}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button
                      className="admin-btn-edit"
                      onClick={() => handleEdit(p)}
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      className="admin-btn-delete"
                      onClick={() => openDeleteModal(p)}
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="8" className="admin-empty">
                  目前沒有符合分類的商品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-product-mobile-list mobile-only">
        {filteredProducts.length === 0 ? (
          <div className="admin-mobile-empty">目前沒有符合分類的商品</div>
        ) : (
          filteredProducts.map((p) => (
            <div key={p.id} className="admin-product-card">
              <div className="admin-product-card-top">
                <img
                  src={p.image}
                  alt={p.name}
                  className="admin-product-card-img"
                  loading="lazy"
                />

                <div className="admin-product-card-main">
                  <h3 className="admin-product-card-name">{p.name}</h3>
                  <p className="admin-product-card-category">
                    {formatCategoryLabel(p.category)}
                  </p>
                  <p className="admin-product-card-price">NT$ {p.price}</p>
                </div>
              </div>

              <div className="admin-product-card-meta">
                <div className="admin-product-meta-row">
                  <span className="admin-product-meta-label">庫存</span>
                  <span
                    className={`stock-badge ${
                      p.stock > 0 ? "in-stock" : "out-stock"
                    }`}
                  >
                    {p.stock > 0 ? p.stock : "售完"}
                  </span>
                </div>

                <div className="admin-product-meta-status-row">
                  <div className="admin-product-status-item">
                    <span className="admin-product-meta-label">熱門</span>
                    <span
                      className={`admin-product-icon-badge ${
                        p.is_hot ? "yes" : "no"
                      }`}
                    >
                      {p.is_hot ? <FaCheck /> : <ImCross />}
                    </span>
                  </div>

                  <div className="admin-product-status-item">
                    <span className="admin-product-meta-label">限時</span>
                    <span
                      className={`admin-product-icon-badge ${
                        p.is_limited ? "yes" : "no"
                      }`}
                    >
                      {p.is_limited ? <FaCheck /> : <ImCross />}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-product-card-actions">
                <button
                  className="admin-btn-edit admin-mobile-action-btn"
                  onClick={() => handleEdit(p)}
                >
                  編輯
                </button>
                <button
                  type="button"
                  className="admin-btn-delete admin-mobile-action-btn"
                  onClick={() => openDeleteModal(p)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>{editProduct ? "編輯商品" : "新增商品"}</h2>

            <p className="admin-required-hint">
              <span className="admin-required-star">*</span> 為必填欄位
            </p>

            <div className="admin-form-grid">
              <div>
                <label>
                  商品名稱
                  <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="請輸入商品名稱"
                />
              </div>

              <div>
                <label>
                  分類
                  <span className="admin-required-star">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  <option value="clothing">衣服</option>
                  <option value="pant">褲子</option>
                  <option value="sock">襪子</option>
                </select>
              </div>

              <div>
                <label>
                  價格（NT$）
                  <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => handleNumberInput(e, "price")}
                  placeholder="請輸入數字，例如 990"
                />
                <p className="admin-input-hint">⚠ 只能輸入正整數</p>
              </div>

              <div>
                <label>
                  庫存（件）
                  <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => handleNumberInput(e, "stock")}
                  placeholder="請輸入數字，例如 10"
                />
                <p className="admin-input-hint">⚠ 只能輸入正整數</p>
              </div>
            </div>

            <div className="admin-form-group">
              <label>
                商品描述
                <span className="admin-required-star">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="請輸入商品描述"
              />
            </div>

            <div className="admin-form-group">
              <label>
                商品圖片
                {!editProduct && <span className="admin-required-star">*</span>}
                {editProduct && "（可新增或刪除圖片）"}
              </label>

              <label className="admin-upload-label">
                📁 選擇圖片（可多選）
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>

              {imagePreviews.length > 0 && (
                <div className="admin-image-list">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`${preview.url}-${index}`}
                      className="admin-image-item"
                    >
                      <img
                        src={preview.url}
                        alt={`圖片 ${index + 1}`}
                        loading="lazy"
                        onClick={() => setPreviewImage(preview.url)}
                      />
                      <button
                        type="button"
                        className="admin-image-delete-btn"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <MdDeleteForever size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="admin-image-hint">
                點擊圖片可放大預覽，點垃圾桶可刪除
              </p>
            </div>

            <div className="admin-checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_hot}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_hot: e.target.checked,
                    }))
                  }
                />
                熱門商品
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.is_limited}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_limited: e.target.checked,
                    }))
                  }
                />
                限時商品
              </label>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "處理中..." : editProduct ? "儲存" : "新增"}
              </button>
            </div>
          </div>

          {previewImage && (
            <div
              className="admin-image-lightbox"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="admin-image-lightbox-content"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="admin-image-lightbox-close"
                  onClick={() => setPreviewImage(null)}
                >
                  ✕
                </button>
                <img src={previewImage} alt="預覽大圖" />
              </div>
            </div>
          )}
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="admin-modal-overlay" onClick={closeDeleteModal}>
          <div
            className="admin-delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-delete-title">確認刪除商品</h3>
            <p className="admin-delete-text">
              你確定要刪除
              <span className="admin-delete-name">「{deleteTarget.name}」</span>
              嗎？
            </p>
            <p className="admin-delete-subtext">刪除後將無法復原。</p>

            <div className="admin-delete-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={closeDeleteModal}
              >
                取消
              </button>
              <button
                type="button"
                className="admin-btn-delete-confirm"
                onClick={handleDelete}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCategoryLabel(category) {
  const map = {
    clothing: "衣服",
    pant: "褲子",
    sock: "襪子",
  };
  return map[category] || category;
}
