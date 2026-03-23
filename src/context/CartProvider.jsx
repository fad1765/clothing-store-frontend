import { useState } from "react";
import { CartContext } from "./CartContext";

const CART_STORAGE_KEY = "guest_cart";

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 從 localStorage 讀取訪客購物車
  const getLocalCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  // 儲存訪客購物車到 localStorage
  const saveLocalCart = (items) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  };

  // 從資料庫載入購物車
  const loadCartFromDB = async (userId) => {
    const res = await fetch(`http://localhost:8000/cart/${userId}`);
    const data = await res.json();
    setCartItems(data);
  };

  // 登入後呼叫，把 localStorage 購物車合併到資料庫
  const mergeLocalCartToDB = async (userId) => {
    const localCart = getLocalCart();
    for (const item of localCart) {
      await fetch("http://localhost:8000/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_id: item.id,
          quantity: item.quantity,
          size: item.size,
        }),
      });
    }
    localStorage.removeItem(CART_STORAGE_KEY);
    await loadCartFromDB(userId);
  };

  // 加入購物車
  const addToCart = async (product, quantity, size, userId = null) => {
    if (userId) {
      // 已登入 → 存到資料庫
      await fetch("http://localhost:8000/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          product_id: product.id,
          quantity,
          size,
        }),
      });
      await loadCartFromDB(userId);
    } else {
      // 未登入 → 存到 localStorage
      const localCart = getLocalCart();
      const existing = localCart.find(
        (item) => item.id === product.id && item.size === size,
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        localCart.push({ ...product, quantity, size });
      }
      saveLocalCart(localCart);
      setCartItems([...localCart]);
    }
    setIsCartOpen(true);
  };

  // 移除購物車商品
  const removeFromCart = async (id, size, userId = null) => {
    if (userId) {
      // 已登入 → 從資料庫刪除
      const item = cartItems.find(
        (i) => i.product_id === id && i.size === size,
      );
      if (item) {
        await fetch(`http://localhost:8000/cart/${item.id}`, {
          method: "DELETE",
        });
        await loadCartFromDB(userId);
      }
    } else {
      // 未登入 → 從 localStorage 刪除
      const localCart = getLocalCart().filter(
        (item) => !(item.id === id && item.size === size),
      );
      saveLocalCart(localCart);
      setCartItems(localCart);
    }
  };

  // 更新數量
  const updateQuantity = async (id, size, quantity, userId = null) => {
    if (userId) {
      // 已登入 → 更新資料庫
      const item = cartItems.find(
        (i) => i.product_id === id && i.size === size,
      );
      if (item) {
        await fetch(`http://localhost:8000/cart/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        await loadCartFromDB(userId);
      }
    } else {
      // 未登入 → 更新 localStorage
      const localCart = getLocalCart().map((item) =>
        item.id === id && item.size === size ? { ...item, quantity } : item,
      );
      saveLocalCart(localCart);
      setCartItems(localCart);
    }
  };

  // 登出時清空購物車狀態
  const clearCart = () => {
    setCartItems([]);
  };

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        loadCartFromDB,
        mergeLocalCartToDB,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
