import { useState } from "react";
import { useCart } from "../context/useCart";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/cart.css";

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    totalPrice,
    setCartItems,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: "",
    email: user?.email || "",
    delivery: "home",
    city: "",
    district: "",
    address: "",
    payment: "credit",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 切換寄送方式清掉地址欄位
    if (name === "delivery") {
      setForm((prev) => ({
        ...prev,
        delivery: value,
        city: "",
        district: "",
        address: "",
      }));
      setErrors({});
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "請填寫姓名";
    if (!form.phone) newErrors.phone = "請填寫電話";
    if (!form.email) newErrors.email = "請填寫信箱";
    if (form.delivery === "home") {
      if (!form.city) newErrors.city = "請填寫城市";
      if (!form.district) newErrors.district = "請填寫區域";
      if (!form.address) newErrors.address = "請填寫地址";
    }
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 把購物車商品整理成 API 需要的格式
    const items = cartItems.map((item) => ({
      product_id: item.product_id || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
    }));

    try {
      const res = await fetch("http://localhost:8000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || null,
          name: form.name,
          phone: form.phone,
          email: form.email,
          delivery: form.delivery,
          city: form.city || null,
          district: form.district || null,
          address: form.address || null,
          payment: form.payment,
          total_price: totalPrice,
          items,
        }),
      });

      if (res.ok) {
        // 清空前端購物車
        setCartItems([]);
        // 如果未登入，清空 localStorage
        if (!user) {
          localStorage.removeItem("guest_cart");
        }
        setSubmitted(true);
      } else {
        alert("訂單送出失敗，請再試一次");
      }
    } catch {
      alert("伺服器連線失敗，請再試一次");
    }
  };

  if (submitted) {
    return (
      <div className="cart-success">
        <div className="success-icon">✓</div>
        <h2>訂單已送出！</h2>
        <p>我們將盡快為您處理，謝謝您的購買。</p>
        <button onClick={() => navigate("/")}>回到首頁</button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-page">
        <p>購物車是空的</p>
        <button onClick={() => navigate("/")}>繼續購物</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-page-title">購物車</h1>

      <div className="cart-page-body">
        {/* 左側：商品列表 */}
        <div className="cart-page-left">
          <h2>商品明細</h2>
          {cartItems.map((item, i) => (
            <div className="cart-page-item" key={i}>
              <img src={item.image} alt={item.name} />
              <div className="cart-page-item-info">
                <p className="cart-page-item-name">{item.name}</p>
                <p className="cart-page-item-size">尺寸：{item.size}</p>
                <p className="cart-page-item-price">NT$ {item.price}</p>
                <div className="cart-page-item-qty">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.size,
                        Math.max(1, item.quantity - 1),
                        user?.id,
                      )
                    }
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.size,
                        item.quantity + 1,
                        user?.id,
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="cart-page-item-right">
                <p className="cart-page-item-total">
                  NT$ {item.price * item.quantity}
                </p>
                <button
                  className="cart-page-remove"
                  onClick={() => removeFromCart(item.id, item.size, user?.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div className="cart-page-total">
            <span>總計</span>
            <span className="total-price">NT$ {totalPrice}</span>
          </div>
        </div>

        {/* 右側：填寫資料 */}
        <div className="cart-page-right">
          <h2>填寫資料</h2>
          {/* 個人資料 */}
          <div className="form-section">
            <h3>個人資料</h3>
            <div className="form-group">
              <label>姓名</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="請輸入姓名"
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label>電話</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="請輸入電話"
              />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>
            <div className="form-group">
              <label>信箱</label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="請輸入信箱"
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
          </div>

          {/* 寄送方式 */}
          <div className="form-section">
            <h3>寄送方式</h3>
            <div className="delivery-options">
              <label
                className={`delivery-option ${form.delivery === "home" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value="home"
                  checked={form.delivery === "home"}
                  onChange={handleChange}
                />
                宅配到府
              </label>
              <label
                className={`delivery-option ${form.delivery === "store" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value="store"
                  checked={form.delivery === "store"}
                  onChange={handleChange}
                />
                超商取貨
              </label>
            </div>
          </div>

          {/* 地址 */}
          {form.delivery === "home" && (
            <div className="form-section">
              <h3>寄送地址</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>城市</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="台北市"
                  />
                  {errors.city && <p className="form-error">{errors.city}</p>}
                </div>
                <div className="form-group">
                  <label>區域</label>
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    placeholder="信義區"
                  />
                  {errors.district && (
                    <p className="form-error">{errors.district}</p>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>詳細地址</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="請輸入詳細地址"
                />
                {errors.address && (
                  <p className="form-error">{errors.address}</p>
                )}
              </div>
            </div>
          )}

          {form.delivery === "store" && (
            <div className="form-section">
              <h3>超商門市</h3>
              <div className="store-options">
                {["7-11", "全家", "萊爾富", "OK"].map((store) => (
                  <label
                    key={store}
                    className={`delivery-option ${form.city === store ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="city"
                      value={store}
                      checked={form.city === store}
                      onChange={handleChange}
                    />
                    {store}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 付款方式 */}
          <div className="form-section">
            <h3>付款方式</h3>
            <div className="delivery-options">
              <label
                className={`delivery-option ${form.payment === "credit" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="credit"
                  checked={form.payment === "credit"}
                  onChange={handleChange}
                />
                信用卡
              </label>
              <label
                className={`delivery-option ${form.payment === "transfer" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="transfer"
                  checked={form.payment === "transfer"}
                  onChange={handleChange}
                />
                銀行轉帳
              </label>
              <label
                className={`delivery-option ${form.payment === "cod" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={form.payment === "cod"}
                  onChange={handleChange}
                />
                貨到付款
              </label>
            </div>
          </div>

          <button className="submit-btn" onClick={handleSubmit}>
            確認送出訂單
          </button>
        </div>
      </div>
    </div>
  );
}
