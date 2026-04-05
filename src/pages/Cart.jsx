import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart } from "../context/useCart";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "../styles/cart.css";

const API_BASE_URL = "http://localhost:8000";
const CART_ITEMS_PER_PAGE = 3;
const COUPONS_PER_PAGE = 3;

function getImageUrl(path) {
  if (!path) return "";

  const imagePath = String(path).trim();

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("/uploads/") || imagePath.startsWith("uploads/")) {
    const cleanPath = imagePath.replace(/^\/+/, "");
    return `${API_BASE_URL}/${cleanPath}`;
  }

  return imagePath;
}

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

    // 信用卡
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",

    // 銀行轉帳
    bankName: "",
    bankAccountLast5: "",
    transferName: "",

    // 貨到付款
    codNote: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [couponList, setCouponList] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const [cartPage, setCartPage] = useState(1);
  const [couponPage, setCouponPage] = useState(1);

  const paymentTextMap = {
    credit: "信用卡",
    transfer: "銀行轉帳",
    cod: "貨到付款",
  };

  const deliveryTextMap = {
    home: "宅配到府",
    store: "超商取貨",
  };

  const normalizedCartItems = useMemo(() => {
    return cartItems.map((item) => ({
      product_id: item.product_id || item.id,
      name: item.name,
      category: item.category || item.product_category || item.type || null,
      price: Number(item.price),
      quantity: Number(item.quantity),
      size: item.size,
      image: item.image || null,
    }));
  }, [cartItems]);

  const subtotalPrice = Number(totalPrice || 0);
  const discountAmount = Number(appliedCoupon?.discount_amount || 0);
  const finalPrice = Math.max(0, subtotalPrice - discountAmount);

  const totalCartPages = Math.max(
    1,
    Math.ceil(cartItems.length / CART_ITEMS_PER_PAGE),
  );
  const totalCouponPages = Math.max(
    1,
    Math.ceil(couponList.length / COUPONS_PER_PAGE),
  );

  const paginatedCartItems = useMemo(() => {
    const start = (cartPage - 1) * CART_ITEMS_PER_PAGE;
    return cartItems.slice(start, start + CART_ITEMS_PER_PAGE);
  }, [cartItems, cartPage]);

  const paginatedCoupons = useMemo(() => {
    const start = (couponPage - 1) * COUPONS_PER_PAGE;
    return couponList.slice(start, start + COUPONS_PER_PAGE);
  }, [couponList, couponPage]);

  useEffect(() => {
    if (cartPage > totalCartPages) {
      setCartPage(totalCartPages);
    }
  }, [cartPage, totalCartPages]);

  useEffect(() => {
    if (couponPage > totalCouponPages) {
      setCouponPage(totalCouponPages);
    }
  }, [couponPage, totalCouponPages]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "delivery") {
      setForm((prev) => ({
        ...prev,
        delivery: value,
        city: "",
        district: "",
        address: "",
      }));
      setErrors((prev) => ({
        ...prev,
        city: "",
        district: "",
        address: "",
      }));
      return;
    }

    if (name === "payment") {
      setForm((prev) => ({
        ...prev,
        payment: value,
        cardNumber: "",
        cardHolder: "",
        cardExpiry: "",
        cardCvv: "",
        bankName: "",
        bankAccountLast5: "",
        transferName: "",
        codNote: "",
      }));

      setErrors((prev) => ({
        ...prev,
        cardNumber: "",
        cardHolder: "",
        cardExpiry: "",
        cardCvv: "",
        bankName: "",
        bankAccountLast5: "",
        transferName: "",
        codNote: "",
      }));
      return;
    }

    let nextValue = value;

    if (name === "cardNumber") {
      nextValue = value.replace(/\D/g, "").slice(0, 16);
    }

    if (name === "cardExpiry") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 4);
      if (onlyDigits.length >= 3) {
        nextValue = `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2)}`;
      } else {
        nextValue = onlyDigits;
      }
    }

    if (name === "cardCvv") {
      nextValue = value.replace(/\D/g, "").slice(0, 3);
    }

    if (name === "bankAccountLast5") {
      nextValue = value.replace(/\D/g, "").slice(0, 5);
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "請填寫姓名";
    if (!form.phone.trim()) newErrors.phone = "請填寫電話";
    if (!form.email.trim()) newErrors.email = "請填寫信箱";

    if (form.delivery === "home") {
      if (!form.city.trim()) newErrors.city = "請填寫城市";
      if (!form.district.trim()) newErrors.district = "請填寫區域";
      if (!form.address.trim()) newErrors.address = "請填寫地址";
    }

    if (form.delivery === "store" && !form.city.trim()) {
      newErrors.city = "請選擇超商門市";
    }

    if (form.payment === "credit") {
      if (!form.cardNumber.trim()) newErrors.cardNumber = "請輸入卡號";
      else if (form.cardNumber.replace(/\s/g, "").length !== 16) {
        newErrors.cardNumber = "卡號需為 16 碼";
      }

      if (!form.cardHolder.trim()) newErrors.cardHolder = "請輸入持卡人姓名";

      if (!form.cardExpiry.trim()) newErrors.cardExpiry = "請輸入到期日";
      else if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry)) {
        newErrors.cardExpiry = "格式需為 MM/YY";
      }

      if (!form.cardCvv.trim()) newErrors.cardCvv = "請輸入 CVV";
      else if (!/^\d{3}$/.test(form.cardCvv)) {
        newErrors.cardCvv = "CVV 需為 3 碼";
      }
    }

    if (form.payment === "transfer") {
      if (!form.bankName.trim()) newErrors.bankName = "請輸入銀行名稱";
      if (!form.bankAccountLast5.trim()) {
        newErrors.bankAccountLast5 = "請輸入帳號後五碼";
      } else if (!/^\d{5}$/.test(form.bankAccountLast5)) {
        newErrors.bankAccountLast5 = "帳號後五碼需為 5 碼";
      }
      if (!form.transferName.trim()) newErrors.transferName = "請輸入戶名";
    }

    return newErrors;
  };

  const fetchCoupons = useCallback(async () => {
    if (normalizedCartItems.length === 0) {
      setCouponList([]);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/coupons/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.id || null,
          email: form.email || null,
          cart_items: normalizedCartItems,
        }),
      });

      const data = await res.json();
      setCouponList(Array.isArray(data) ? data : []);
    } catch {
      setCouponList([]);
    }
  }, [normalizedCartItems, user?.id, form.email]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCartPage(1);
  }, [cartItems]);

  useEffect(() => {
    setCouponPage(1);
  }, [couponList.length]);

  const handleApplyCoupon = async (code = couponCode) => {
    if (!code.trim()) {
      setCouponMessage("請先輸入優惠碼");
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");

    try {
      const res = await fetch("http://localhost:8000/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          user_id: user?.id || null,
          email: form.email || null,
          cart_items: normalizedCartItems,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setAppliedCoupon(null);
        setCouponMessage(data.message || "優惠券不可使用");
        return;
      }

      setAppliedCoupon(data);
      setCouponCode(data.coupon_code);
      setCouponMessage(`已套用優惠券 ${data.coupon_code}`);
    } catch {
      setAppliedCoupon(null);
      setCouponMessage("伺服器連線失敗，請稍後再試");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const items = normalizedCartItems;

    try {
      const res = await fetch("http://localhost:8000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || null,
          name: form.name,
          phone: form.phone,
          email: form.email,
          delivery: deliveryTextMap[form.delivery] || form.delivery,
          city: form.city || null,
          district: form.district || null,
          address: form.address || null,
          payment: paymentTextMap[form.payment] || form.payment,

          payment_info: {
            card_number: form.payment === "credit" ? form.cardNumber : null,
            card_holder: form.payment === "credit" ? form.cardHolder : null,
            card_expiry: form.payment === "credit" ? form.cardExpiry : null,
            card_cvv: form.payment === "credit" ? form.cardCvv : null,

            bank_name: form.payment === "transfer" ? form.bankName : null,
            bank_account_last5:
              form.payment === "transfer" ? form.bankAccountLast5 : null,
            transfer_name:
              form.payment === "transfer" ? form.transferName : null,

            cod_note: form.payment === "cod" ? form.codNote : null,
          },

          subtotal_price: subtotalPrice,
          discount_amount: discountAmount,
          total_price: finalPrice,
          coupon_code: appliedCoupon?.coupon_code || null,
          items,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCartItems([]);
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponMessage("");

        if (!user) {
          localStorage.removeItem("guest_cart");
        }

        setSubmitted(true);
      } else {
        alert(data.detail || "訂單送出失敗，請再試一次");
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
        <div className="cart-page-left">
          <div className="cart-section-card">
            <div className="cart-section-header">
              <h2>商品明細</h2>
              <span className="section-count">
                共 {cartItems.length} 件商品
              </span>
            </div>

            {paginatedCartItems.map((item, i) => {
              const productId = item?.product_id ?? item?.id;
              const imageUrl = getImageUrl(item?.image);

              return (
                <div
                  className="cart-page-item"
                  key={`${productId}-${item?.size || "no-size"}-${i}`}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt={item?.name} />
                  ) : (
                    <div className="cart-page-image-placeholder">無圖片</div>
                  )}

                  <div className="cart-page-item-info">
                    <p className="cart-page-item-name">{item?.name}</p>
                    <p className="cart-page-item-size">
                      尺寸：{item?.size || "固定尺寸"}
                    </p>
                    <p className="cart-page-item-price">NT$ {item?.price}</p>

                    <div className="cart-page-item-qty">
                      <button
                        onClick={() => {
                          if (!productId) return;
                          updateQuantity(
                            productId,
                            item?.size,
                            Math.max(1, item.quantity - 1),
                            user?.id,
                          );
                        }}
                        disabled={item?.quantity <= 1 || !productId}
                      >
                        −
                      </button>

                      <span>{item?.quantity}</span>

                      <button
                        onClick={() => {
                          if (!productId) return;
                          updateQuantity(
                            productId,
                            item?.size,
                            item.quantity + 1,
                            user?.id,
                          );
                        }}
                        disabled={!productId}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-page-item-right">
                    <p className="cart-page-item-total">
                      NT$ {(item?.price || 0) * (item?.quantity || 0)}
                    </p>

                    <button
                      className="cart-page-remove"
                      onClick={() => {
                        if (!productId) return;
                        removeFromCart(productId, item?.size, user?.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {totalCartPages > 1 && (
              <div className="cart-pagination">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setCartPage((prev) => Math.max(1, prev - 1))}
                  disabled={cartPage === 1}
                >
                  上一頁
                </button>

                <div className="page-number-group">
                  {Array.from({ length: totalCartPages }, (_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        type="button"
                        className={`page-number ${
                          cartPage === page ? "active" : ""
                        }`}
                        onClick={() => setCartPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="page-btn"
                  onClick={() =>
                    setCartPage((prev) => Math.min(totalCartPages, prev + 1))
                  }
                  disabled={cartPage === totalCartPages}
                >
                  下一頁
                </button>
              </div>
            )}

            <div className="cart-page-total">
              <span>商品小計</span>
              <span className="total-price">NT$ {subtotalPrice}</span>
            </div>
          </div>

          <div className="cart-section-card">
            <div className="cart-section-header">
              <h2>優惠券</h2>
              <span className="section-count">
                共 {couponList.length} 張優惠券
              </span>
            </div>

            {couponList.length === 0 ? (
              <p className="coupon-empty">目前沒有優惠券</p>
            ) : (
              <>
                <div className="coupon-list">
                  {paginatedCoupons.map((coupon) => (
                    <div
                      className={`coupon-card ${
                        coupon.usable ? "usable" : "disabled"
                      }`}
                      key={coupon.coupon_id}
                    >
                      <div className="coupon-card-left">
                        <p className="coupon-code">{coupon.coupon_code}</p>
                        <p className="coupon-name">{coupon.coupon_name}</p>

                        <p className="coupon-desc">
                          {coupon.discount_type === "fixed"
                            ? `折 NT$ ${coupon.discount_value}`
                            : `折 ${coupon.discount_value}%`}
                          {coupon.applicable_category
                            ? `｜限 ${coupon.applicable_category}`
                            : "｜全館適用"}
                        </p>

                        <p
                          className={`coupon-status ${
                            coupon.usable ? "ok" : "no"
                          }`}
                        >
                          {coupon.usable
                            ? `可使用，可折 NT$ ${coupon.discount_amount}`
                            : coupon.reason}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="coupon-use-btn"
                        disabled={!coupon.usable}
                        onClick={() => handleApplyCoupon(coupon.coupon_code)}
                      >
                        {coupon.usable ? "套用" : "不可用"}
                      </button>
                    </div>
                  ))}
                </div>

                {totalCouponPages > 1 && (
                  <div className="cart-pagination">
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() =>
                        setCouponPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={couponPage === 1}
                    >
                      上一頁
                    </button>

                    <div className="page-number-group">
                      {Array.from({ length: totalCouponPages }, (_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            type="button"
                            className={`page-number ${
                              couponPage === page ? "active" : ""
                            }`}
                            onClick={() => setCouponPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="page-btn"
                      onClick={() =>
                        setCouponPage((prev) =>
                          Math.min(totalCouponPages, prev + 1),
                        )
                      }
                      disabled={couponPage === totalCouponPages}
                    >
                      下一頁
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="cart-page-right">
          <h2>填寫資料</h2>

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

          <div className="form-section">
            <h3>寄送方式</h3>
            <div className="delivery-options">
              <label
                className={`delivery-option ${
                  form.delivery === "home" ? "active" : ""
                }`}
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
                className={`delivery-option ${
                  form.delivery === "store" ? "active" : ""
                }`}
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
                    className={`delivery-option ${
                      form.city === store ? "active" : ""
                    }`}
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
              {errors.city && <p className="form-error">{errors.city}</p>}
            </div>
          )}

          <div className="form-section">
            <h3>付款方式</h3>
            <div className="delivery-options">
              <label
                className={`delivery-option ${
                  form.payment === "credit" ? "active" : ""
                }`}
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
                className={`delivery-option ${
                  form.payment === "transfer" ? "active" : ""
                }`}
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
                className={`delivery-option ${
                  form.payment === "cod" ? "active" : ""
                }`}
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

            {form.payment === "credit" && (
              <div className="payment-detail-box">
                <div className="form-group">
                  <label>卡號</label>
                  <input
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    placeholder="請輸入 16 碼卡號"
                    inputMode="numeric"
                  />
                  {errors.cardNumber && (
                    <p className="form-error">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>持卡人姓名</label>
                  <input
                    name="cardHolder"
                    value={form.cardHolder}
                    onChange={handleChange}
                    placeholder="請輸入持卡人姓名"
                  />
                  {errors.cardHolder && (
                    <p className="form-error">{errors.cardHolder}</p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>到期日</label>
                    <input
                      name="cardExpiry"
                      value={form.cardExpiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                    />
                    {errors.cardExpiry && (
                      <p className="form-error">{errors.cardExpiry}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      name="cardCvv"
                      value={form.cardCvv}
                      onChange={handleChange}
                      placeholder="3 碼"
                      inputMode="numeric"
                    />
                    {errors.cardCvv && (
                      <p className="form-error">{errors.cardCvv}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {form.payment === "transfer" && (
              <div className="payment-detail-box">
                <div className="form-group">
                  <label>銀行名稱</label>
                  <input
                    name="bankName"
                    value={form.bankName}
                    onChange={handleChange}
                    placeholder="例如：中國信託、玉山銀行"
                  />
                  {errors.bankName && (
                    <p className="form-error">{errors.bankName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>帳號後五碼</label>
                  <input
                    name="bankAccountLast5"
                    value={form.bankAccountLast5}
                    onChange={handleChange}
                    placeholder="請輸入帳號後五碼"
                    inputMode="numeric"
                  />
                  {errors.bankAccountLast5 && (
                    <p className="form-error">{errors.bankAccountLast5}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>戶名</label>
                  <input
                    name="transferName"
                    value={form.transferName}
                    onChange={handleChange}
                    placeholder="請輸入轉帳戶名"
                  />
                  {errors.transferName && (
                    <p className="form-error">{errors.transferName}</p>
                  )}
                </div>
              </div>
            )}

            {form.payment === "cod" && (
              <div className="payment-detail-box">
                <div className="form-group">
                  <label>備註（選填）</label>
                  <input
                    name="codNote"
                    value={form.codNote}
                    onChange={handleChange}
                    placeholder="例如：白天方便收件、請先來電"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>輸入優惠碼</h3>

            <div className="coupon-input-row">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="請輸入優惠碼"
                className="coupon-input"
              />
              <button
                type="button"
                className="coupon-apply-btn"
                onClick={() => handleApplyCoupon()}
                disabled={couponLoading}
              >
                {couponLoading ? "套用中..." : "套用"}
              </button>
            </div>

            {couponMessage && <p className="coupon-message">{couponMessage}</p>}

            {appliedCoupon && (
              <div className="applied-coupon-box">
                <div>
                  <p className="applied-coupon-title">已套用優惠券</p>
                  <p className="applied-coupon-code">
                    {appliedCoupon.coupon_code}｜{appliedCoupon.coupon_name}
                  </p>
                </div>
                <button
                  type="button"
                  className="remove-coupon-btn"
                  onClick={handleRemoveCoupon}
                >
                  取消
                </button>
              </div>
            )}
          </div>

          <div className="price-summary">
            <div className="summary-row">
              <span>商品小計</span>
              <span>NT$ {subtotalPrice}</span>
            </div>

            <div className="summary-row">
              <span>優惠折扣</span>
              <span>- NT$ {discountAmount}</span>
            </div>

            <div className="summary-row final-row">
              <span>應付總額</span>
              <span>NT$ {finalPrice}</span>
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
