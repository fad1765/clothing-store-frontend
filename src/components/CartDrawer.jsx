import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import "../styles/cartdrawer.css";

const API_BASE_URL = "http://localhost:8000";

function getImageUrl(path) {
  if (!path) return "";

  const imagePath = String(path).trim();

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // 後端 uploads 圖片
  if (imagePath.startsWith("/uploads/") || imagePath.startsWith("uploads/")) {
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
  }
  return imagePath;
}

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, totalPrice } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />

      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <h2>購物車</h2>
          <button onClick={() => setIsCartOpen(false)}>✕</button>
        </div>

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <p className="cart-empty">購物車是空的</p>
          ) : (
            cartItems.map((item, i) => {
              const productId = item?.product_id ?? item?.id;
              const imageUrl = getImageUrl(item?.image);

              return (
                <div
                  className="cart-item"
                  key={`${productId || "no-id"}-${item?.size || "no-size"}-${i}`}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={item?.name} />
                  ) : (
                    <div className="cart-item-image-placeholder">無圖片</div>
                  )}

                  <div className="cart-item-info">
                    <p className="cart-item-name">{item?.name}</p>
                    <p className="cart-item-size">尺寸：{item?.size}</p>
                    <p className="cart-item-qty">數量：{item?.quantity}</p>
                    <p className="cart-item-price">
                      NT$ {(item?.price || 0) * (item?.quantity || 0)}
                    </p>
                  </div>

                  <button
                    className="cart-item-remove"
                    onClick={() => {
                      if (!productId) {
                        console.error("刪除失敗，找不到 productId", item);
                        return;
                      }
                      removeFromCart(productId, item?.size, user?.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-drawer-footer">
          <p className="cart-total">
            總計：<span>NT$ {totalPrice}</span>
          </p>

          <button
            className="cart-checkout-btn"
            onClick={() => {
              setIsCartOpen(false);
              navigate("/cart");
            }}
          >
            查看購物車
          </button>
        </div>
      </div>
    </>
  );
}
