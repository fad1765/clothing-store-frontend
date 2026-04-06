import { useState, useEffect, useCallback, useMemo } from "react";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import "../styles/productmodal.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SIZES = ["S", "M", "L", "XL"];
const SIZE_CATEGORIES = ["clothing", "pant"];

export default function ProductModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [selectedRating, setSelectedRating] = useState(5);
  const [sortType, setSortType] = useState("latest");
  const [loadingComments, setLoadingComments] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const { addToCart } = useCart();
  const { user } = useAuth();

  const hasSize = product ? SIZE_CATEGORIES.includes(product.category) : false;

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2200);
  };

  const renderStars = (rating, interactive = false, onClick = null) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const filled = starValue <= rating;

      return (
        <span
          key={i}
          className={`star ${filled ? "full" : "empty"} ${
            interactive ? "clickable-star" : ""
          }`}
          onClick={
            interactive && onClick ? () => onClick(starValue) : undefined
          }
        >
          ★
        </span>
      );
    });
  };

  const productImages = useMemo(() => {
    if (!product) return [];

    let images = [];

    if (Array.isArray(product.images)) {
      images = product.images.map((img) => {
        if (typeof img === "string") return img;
        return img?.image_url || img?.url || img?.image || "";
      });
    } else if (Array.isArray(product.image_urls)) {
      images = product.image_urls;
    } else if (Array.isArray(product.product_images)) {
      images = product.product_images.map(
        (img) => img?.image_url || img?.url || img?.image || "",
      );
    } else if (product.image) {
      images = [product.image];
    }

    return images.filter(Boolean);
  }, [product]);

  const currentImage = productImages[currentImageIndex] || product?.image || "";

  const sortedComments = useMemo(() => {
    const copiedComments = [...comments];

    switch (sortType) {
      case "popular":
        return copiedComments.sort(
          (a, b) => (b.like_count || 0) - (a.like_count || 0),
        );

      case "rating-high":
        return copiedComments.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      case "rating-low":
        return copiedComments.sort((a, b) => (a.rating || 0) - (b.rating || 0));

      case "latest":
      default:
        return copiedComments.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
    }
  }, [comments, sortType]);

  const fetchComments = useCallback(async () => {
    if (!product) return;

    try {
      setLoadingComments(true);

      const res = await fetch(
        `${API_BASE_URL}/products/${product.id}/comments`,
      );

      if (!res.ok) {
        throw new Error("留言載入失敗");
      }

      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error("載入留言失敗：", error);
      setComments([]);
      showToast("留言載入失敗", "error");
    } finally {
      setLoadingComments(false);
    }
  }, [product]);

  const fetchFavoriteStatus = useCallback(async () => {
    if (!product || !user) {
      setIsFavorite(false);
      return;
    }

    try {
      setFavoriteLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/wishlist/check?user_id=${user.id}&product_id=${product.id}`,
      );

      if (!res.ok) {
        throw new Error("收藏狀態讀取失敗");
      }

      const data = await res.json();
      setIsFavorite(Boolean(data.is_favorite));
    } catch (error) {
      console.error("讀取收藏狀態失敗：", error);
      setIsFavorite(false);
    } finally {
      setFavoriteLoading(false);
    }
  }, [product, user]);

  useEffect(() => {
    if (!product) return;

    setQuantity(1);
    setSelectedSize(null);
    setSizeError(false);
    setCommentText("");
    setSelectedRating(5);
    setConfirmDeleteId(null);
    setIsFavorite(false);
    setCurrentImageIndex(0);
    setShowImagePreview(false);

    fetchComments();
    fetchFavoriteStatus();
  }, [product, fetchComments, fetchFavoriteStatus]);

  const handlePrevImage = () => {
    if (productImages.length <= 1) return;

    setCurrentImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    if (productImages.length <= 1) return;

    setCurrentImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1,
    );
  };

  const openImagePreview = () => {
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (hasSize && !selectedSize) {
      setSizeError(true);
      return;
    }

    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
    };

    addToCart(
      cartProduct,
      quantity,
      hasSize ? selectedSize : "固定尺寸",
      user?.id || null,
    );

    showToast("已加入購物車", "success");

    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleToggleFavorite = async () => {
    if (!product) return;

    if (!user) {
      showToast("請先登入才能收藏商品", "warning");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        const res = await fetch(
          `${API_BASE_URL}/wishlist?user_id=${user.id}&product_id=${product.id}`,
          {
            method: "DELETE",
          },
        );

        const data = await res.json();

        if (!res.ok) {
          showToast(data.detail || "取消收藏失敗", "error");
          return;
        }

        setIsFavorite(false);
        showToast("已取消收藏", "success");
      } else {
        const res = await fetch(`${API_BASE_URL}/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            product_id: product.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.detail || "收藏失敗", "error");
          return;
        }

        setIsFavorite(true);
        showToast("已加入收藏", "success");
      }
    } catch (error) {
      console.error("收藏切換失敗：", error);
      showToast("伺服器連線失敗", "error");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!product) return;

    if (!user) {
      showToast("請先登入才能留言", "warning");
      return;
    }

    if (!commentText.trim()) {
      showToast("請輸入留言內容", "warning");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/products/${product.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            content: commentText,
            rating: selectedRating,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "留言失敗", "error");
        return;
      }

      setCommentText("");
      setSelectedRating(5);
      await fetchComments();
      showToast("留言送出成功", "success");
    } catch (error) {
      console.error("送出留言失敗：", error);
      showToast("伺服器連線失敗", "error");
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      showToast("請先登入才能按讚", "warning");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/comments/${commentId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "按讚失敗", "error");
        return;
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, like_count: data.like_count }
            : comment,
        ),
      );

      showToast("按讚成功", "success");
    } catch (error) {
      console.error("按讚失敗：", error);
      showToast("伺服器連線失敗", "error");
    }
  };

  const openDeleteConfirm = (commentId) => {
    setConfirmDeleteId(commentId);
  };

  const closeDeleteConfirm = () => {
    setConfirmDeleteId(null);
  };

  const handleDeleteComment = async () => {
    if (!user || !confirmDeleteId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/comments/${confirmDeleteId}?user_id=${user.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "刪除失敗", "error");
        return;
      }

      setComments((prev) =>
        prev.filter((comment) => comment.id !== confirmDeleteId),
      );
      setConfirmDeleteId(null);
      showToast("留言已刪除", "success");
    } catch (error) {
      console.error("刪除留言失敗：", error);
      showToast("伺服器連線失敗", "error");
    }
  };

  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-scroll">
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>

          <div className="modal-body">
            <div className="modal-image-wrapper">
              <button
                className={`favorite-btn ${isFavorite ? "active" : ""}`}
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                title={isFavorite ? "取消收藏" : "加入收藏"}
              >
                <span className="favorite-btn-icon">
                  {isFavorite ? "❤" : "♡"}
                </span>
              </button>

              <div className="modal-image-slider">
                <img
                  src={currentImage}
                  alt={product.name}
                  onClick={openImagePreview}
                  className="zoomable-image"
                />

                {productImages.length > 1 && (
                  <>
                    <button
                      className="image-nav-btn prev"
                      onClick={handlePrevImage}
                      type="button"
                    >
                      ‹
                    </button>
                    <button
                      className="image-nav-btn next"
                      onClick={handleNextImage}
                      type="button"
                    >
                      ›
                    </button>

                    <div className="image-indicator">
                      {currentImageIndex + 1} / {productImages.length}
                    </div>
                  </>
                )}
              </div>

              <p className="image-preview-tip">點擊圖片可放大查看</p>

              {productImages.length > 1 && (
                <div className="image-thumbnails">
                  {productImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      className={`thumb-btn ${
                        currentImageIndex === index ? "active" : ""
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                      type="button"
                    >
                      <img src={img} alt={`${product.name}-${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-info">
              <h2 className="modal-name">{product.name}</h2>

              <div className="modal-rating">
                {renderStars(Math.round(product.rating || 0))}
                <span className="rating-count">
                  {product.rating || 0} 分 / {comments.length} 則留言
                </span>
              </div>

              <p className="modal-price">NT$ {product.price}</p>
              <p className="modal-description">{product.description}</p>

              <p className="modal-stock">
                庫存：
                <span className={product.stock > 0 ? "in-stock" : "out-stock"}>
                  {product.stock > 0 ? `${product.stock} 件` : "已售完"}
                </span>
              </p>

              {hasSize && (
                <div className="modal-size">
                  <span>尺寸：</span>
                  <div className="size-options">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        className={`size-btn ${
                          selectedSize === size ? "active" : ""
                        }`}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {sizeError && <p className="size-error">請選擇尺寸</p>}
                </div>
              )}

              {product.stock > 0 && (
                <div className="modal-quantity">
                  <span>數量：</span>
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="qty-number">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((prev) => Math.min(product.stock, prev + 1))
                    }
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              )}

              <div className="modal-action-group">
                <button
                  className={`modal-favorite-btn ${isFavorite ? "active" : ""}`}
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                >
                  <span className="modal-favorite-icon">
                    {isFavorite ? "❤" : "♡"}
                  </span>
                  <span>{isFavorite ? "已收藏" : "加入收藏"}</span>
                </button>

                <button
                  className="modal-cart-btn"
                  disabled={product.stock === 0}
                  onClick={handleAddToCart}
                >
                  {product.stock === 0 ? "已售完" : "加入購物車"}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-comments-section">
            <div className="comments-topbar">
              <h3 className="comments-title">商品留言</h3>

              <div className="comment-sort desktop-sort">
                <button
                  className={
                    sortType === "latest" ? "sort-btn active" : "sort-btn"
                  }
                  onClick={() => setSortType("latest")}
                >
                  最新
                </button>
                <button
                  className={
                    sortType === "popular" ? "sort-btn active" : "sort-btn"
                  }
                  onClick={() => setSortType("popular")}
                >
                  最熱門
                </button>
                <button
                  className={
                    sortType === "rating-high" ? "sort-btn active" : "sort-btn"
                  }
                  onClick={() => setSortType("rating-high")}
                >
                  評分高到低
                </button>
                <button
                  className={
                    sortType === "rating-low" ? "sort-btn active" : "sort-btn"
                  }
                  onClick={() => setSortType("rating-low")}
                >
                  評分低到高
                </button>
              </div>

              <div className="comment-sort-mobile">
                <select
                  className="comment-sort-select"
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                >
                  <option value="latest">最新</option>
                  <option value="popular">最熱門</option>
                  <option value="rating-high">評分高到低</option>
                  <option value="rating-low">評分低到高</option>
                </select>
              </div>
            </div>

            {user ? (
              <div className="comment-input-box">
                <div className="comment-rating-box">
                  <span>評分：</span>
                  <div>
                    {renderStars(selectedRating, true, setSelectedRating)}
                  </div>
                </div>

                <textarea
                  className="comment-textarea"
                  placeholder="歡迎留下你對這項商品的想法..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />

                <button
                  className="comment-submit-btn"
                  onClick={handleSubmitComment}
                >
                  送出留言
                </button>
              </div>
            ) : (
              <p className="comment-login-tip">請先登入才能留言與按讚</p>
            )}

            <div className="comment-list">
              {loadingComments ? (
                <p className="no-comments">留言載入中...</p>
              ) : sortedComments.length === 0 ? (
                <p className="no-comments">
                  目前還沒有留言，成為第一位留言的人吧！
                </p>
              ) : (
                sortedComments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div>
                        <span className="comment-user">
                          {comment.user_name}
                        </span>
                        <div className="comment-stars">
                          {renderStars(comment.rating || 0)}
                        </div>
                      </div>

                      <span className="comment-time">
                        {new Date(comment.created_at).toLocaleString("zh-TW")}
                      </span>
                    </div>

                    <p className="comment-content">{comment.content}</p>

                    <div className="comment-actions">
                      <button
                        className="like-btn"
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        👍 {comment.like_count || 0}
                      </button>

                      {user?.id === comment.user_id && (
                        <button
                          className="delete-comment-btn"
                          onClick={() => openDeleteConfirm(comment.id)}
                          title="刪除留言"
                        >
                          <span className="delete-icon">✕</span>
                          <span>刪除</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {confirmDeleteId && (
            <div
              className="confirm-delete-overlay"
              onClick={closeDeleteConfirm}
            >
              <div
                className="confirm-delete-box"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="confirm-delete-icon">!</div>
                <h4 className="confirm-delete-title">確認刪除留言？</h4>
                <p className="confirm-delete-text">
                  刪除後將無法恢復，確定要刪除這則留言嗎？
                </p>

                <div className="confirm-delete-actions">
                  <button
                    className="confirm-cancel-btn"
                    onClick={closeDeleteConfirm}
                  >
                    取消
                  </button>
                  <button
                    className="confirm-delete-btn"
                    onClick={handleDeleteComment}
                  >
                    確認刪除
                  </button>
                </div>
              </div>
            </div>
          )}

          {toast.show && (
            <div className={`custom-toast ${toast.type}`}>
              <span className="toast-dot"></span>
              <span>{toast.message}</span>
            </div>
          )}

          {showImagePreview && (
            <div className="image-preview-overlay" onClick={closeImagePreview}>
              <div
                className="image-preview-box"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="image-preview-close"
                  onClick={closeImagePreview}
                  type="button"
                >
                  ✕
                </button>

                {productImages.length > 1 && (
                  <>
                    <button
                      className="preview-nav-btn prev"
                      onClick={handlePrevImage}
                      type="button"
                    >
                      ‹
                    </button>
                    <button
                      className="preview-nav-btn next"
                      onClick={handleNextImage}
                      type="button"
                    >
                      ›
                    </button>
                  </>
                )}

                <img
                  src={currentImage}
                  alt={product.name}
                  className="image-preview-large"
                />

                {productImages.length > 1 && (
                  <div className="preview-indicator">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
