import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import "../styles/cartdrawer.css";

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
            cartItems.map((item, i) => (
              <div className="cart-item" key={i}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-size">尺寸：{item.size}</p>
                  <p className="cart-item-qty">數量：{item.quantity}</p>
                  <p className="cart-item-price">
                    NT$ {item.price * item.quantity}
                  </p>
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.id, item.size, user?.id)}
                >
                  ✕
                </button>
              </div>
            ))
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
