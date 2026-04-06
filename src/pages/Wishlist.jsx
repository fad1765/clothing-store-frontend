import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import ProductModal from "../components/ProductModal";
import "../styles/wishlist.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Wishlist() {
  const { user } = useAuth();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2200);
  };

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/wishlist/${user.id}`);
      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "收藏清單載入失敗", "error");
        setWishlistItems([]);
        return;
      }

      setWishlistItems(data);
    } catch (error) {
      console.error("收藏清單載入失敗：", error);
      setWishlistItems([]);
      showToast("伺服器連線失敗", "error");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemoveFavorite = async (productId) => {
    if (!user) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/wishlist?user_id=${user.id}&product_id=${productId}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "取消收藏失敗", "error");
        return;
      }

      setWishlistItems((prev) => prev.filter((item) => item.id !== productId));

      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }

      showToast("已取消收藏", "success");
    } catch (error) {
      console.error("取消收藏失敗：", error);
      showToast("伺服器連線失敗", "error");
    }
  };

  if (!user) {
    return (
      <section className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-empty-box">
            <h2>我的收藏</h2>
            <p>請先登入後查看收藏商品。</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wishlist-page">
      <div className="wishlist-container">
        <div className="wishlist-header">
          <div>
            <h1 className="wishlist-title">我的收藏</h1>
            <p className="wishlist-subtitle">
              收藏清單共 {wishlistItems.length} 件商品
            </p>
          </div>
        </div>

        {loading ? (
          <div className="wishlist-empty-box">
            <p>收藏清單載入中...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="wishlist-empty-box">
            <h3>目前還沒有收藏商品</h3>
            <p>快去挑幾件喜歡的商品加入收藏吧！</p>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistItems.map((item) => (
              <div key={item.id} className="wishlist-card">
                <button
                  className="wishlist-remove-btn"
                  onClick={() => handleRemoveFavorite(item.id)}
                  title="取消收藏"
                >
                  ❤
                </button>

                <div
                  className="wishlist-image-wrap"
                  onClick={() => setSelectedProduct(item)}
                >
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="wishlist-card-body">
                  <h3
                    className="wishlist-product-name"
                    onClick={() => setSelectedProduct(item)}
                  >
                    {item.name}
                  </h3>

                  <div className="wishlist-rating-row">
                    <span className="wishlist-rating">
                      ★ {item.rating || 0}
                    </span>
                    <span className="wishlist-reviews">
                      / {item.reviews || 0} 則評價
                    </span>
                  </div>

                  <p className="wishlist-price">NT$ {item.price}</p>

                  <p className="wishlist-stock">
                    庫存：
                    <span
                      className={
                        item.stock > 0
                          ? "wishlist-stock-in"
                          : "wishlist-stock-out"
                      }
                    >
                      {item.stock > 0 ? `${item.stock} 件` : "已售完"}
                    </span>
                  </p>

                  <div className="wishlist-actions">
                    <button
                      className="wishlist-detail-btn"
                      onClick={() => setSelectedProduct(item)}
                    >
                      查看商品
                    </button>

                    <button
                      className="wishlist-delete-btn"
                      onClick={() => handleRemoveFavorite(item.id)}
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => {
              setSelectedProduct(null);
              fetchWishlist();
            }}
          />
        )}

        {toast.show && (
          <div className={`wishlist-toast ${toast.type}`}>
            <span className="wishlist-toast-dot"></span>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </section>
  );
}
