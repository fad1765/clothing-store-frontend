import { useState } from "react";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import "../styles/productmodal.css";

const SIZES = ["S", "M", "L", "XL"];
const SIZE_CATEGORIES = ["clothing", "pant"];

export default function ProductModal({ product, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth(); // 取得目前登入的使用者

  if (!product) return null;

  const hasSize = SIZE_CATEGORIES.includes(product.category);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(rating))
        return (
          <span key={i} className="star full">
            ★
          </span>
        );
      if (i < rating)
        return (
          <span key={i} className="star half">
            ★
          </span>
        );
      return (
        <span key={i} className="star empty">
          ☆
        </span>
      );
    });
  };

  const handleAddToCart = () => {
    if (hasSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    // 傳入user.id沒登入為 null
    addToCart(product, quantity, hasSize ? selectedSize : "固定尺寸", user?.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-body">
          <div className="modal-image-wrapper">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="modal-info">
            <h2 className="modal-name">{product.name}</h2>

            <div className="modal-rating">
              {renderStars(product.rating)}
              <span className="rating-count">({product.reviews} 則評價)</span>
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
                      className={`size-btn ${selectedSize === size ? "active" : ""}`}
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
    </div>
  );
}
