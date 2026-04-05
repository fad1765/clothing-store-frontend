import { useState, useEffect, useCallback } from "react";
import { CartContext } from "./CartContext";
import { useAuth } from "./useAuth";

const CART_STORAGE_KEY = "guest_cart";
const API_BASE_URL = "http://localhost:8000";

function getProductId(product) {
  return product?.product_id ?? product?.id ?? null;
}

function getMainImage(product) {
  if (product?.image) return product.image;

  if (Array.isArray(product?.images) && product.images.length > 0) {
    const firstImage = product.images[0];
    if (typeof firstImage === "string") return firstImage;
    if (firstImage?.image_url) return firstImage.image_url;
  }

  return null;
}

function normalizeCartItem(product, quantity, size) {
  const productId = getProductId(product);

  return {
    product_id: productId,
    id: productId,
    name: product?.name || "",
    price: Number(product?.price || 0),
    quantity: Number(quantity || 1),
    size: size || "",
    image: getMainImage(product),
    category: product?.category || product?.product_category || null,
  };
}

function dedupeCartItems(items) {
  const dedupedMap = new Map();

  items.forEach((item) => {
    const productId = item?.product_id ?? item?.id;
    const key = `${productId}-${item?.size || ""}`;

    if (!productId) return;

    if (dedupedMap.has(key)) {
      const existing = dedupedMap.get(key);
      dedupedMap.set(key, {
        ...existing,
        quantity: Number(existing.quantity || 0) + Number(item.quantity || 0),
      });
    } else {
      dedupedMap.set(key, {
        ...item,
        quantity: Number(item?.quantity || 0),
        price: Number(item?.price || 0),
      });
    }
  });

  return Array.from(dedupedMap.values());
}

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
      const deduped = dedupeCartItems(raw);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(deduped));
      return deduped;
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  const getLocalCart = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
      return dedupeCartItems(raw);
    } catch {
      return [];
    }
  }, []);

  const saveLocalCart = useCallback((items) => {
    const deduped = dedupeCartItems(items);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(deduped));
  }, []);

  const loadCartFromDB = useCallback(async (userId) => {
    if (!userId) return [];

    try {
      const res = await fetch(`${API_BASE_URL}/cart/${userId}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        return data.map((item) => ({
          ...item,
          price: Number(item?.price || 0),
          quantity: Number(item?.quantity || 0),
        }));
      }

      return [];
    } catch (error) {
      console.error("讀取會員購物車失敗:", error);
      return [];
    }
  }, []);

  const mergeLocalCartToDB = useCallback(
    async (userId) => {
      if (!userId) return [];

      const localCart = getLocalCart();

      if (!localCart.length) {
        return await loadCartFromDB(userId);
      }

      try {
        for (const item of localCart) {
          const productId = item?.product_id ?? item?.id;
          if (!productId) continue;

          await fetch(`${API_BASE_URL}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              product_id: productId,
              quantity: Number(item.quantity || 1),
              size: item.size || "",
            }),
          });
        }

        localStorage.removeItem(CART_STORAGE_KEY);
        return await loadCartFromDB(userId);
      } catch (error) {
        console.error("合併訪客購物車到會員購物車失敗:", error);
        return await loadCartFromDB(userId);
      }
    },
    [getLocalCart, loadCartFromDB],
  );

  useEffect(() => {
    let ignore = false;

    const syncCart = async () => {
      let nextCart = [];

      if (user?.id) {
        const localCart = getLocalCart();

        if (localCart.length > 0) {
          nextCart = await mergeLocalCartToDB(user.id);
        } else {
          nextCart = await loadCartFromDB(user.id);
        }
      } else {
        nextCart = getLocalCart();
      }

      if (!ignore) {
        setCartItems(nextCart);
      }
    };

    syncCart();

    return () => {
      ignore = true;
    };
  }, [user, getLocalCart, loadCartFromDB, mergeLocalCartToDB]);

  const addToCart = useCallback(
    async (product, quantity, size, userId = null) => {
      const productId = getProductId(product);

      if (!productId) {
        console.error("加入購物車失敗：找不到 productId", product);
        return;
      }

      if (userId) {
        try {
          const res = await fetch(`${API_BASE_URL}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              product_id: productId,
              quantity: Number(quantity || 1),
              size: size || "",
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            console.error("加入會員購物車失敗:", data);
            return;
          }

          const latestCart = await loadCartFromDB(userId);
          setCartItems(latestCart);
        } catch (error) {
          console.error("加入會員購物車失敗:", error);
        }
      } else {
        const localCart = getLocalCart();

        const existingIndex = localCart.findIndex(
          (item) =>
            (item?.product_id ?? item?.id) === productId &&
            item?.size === (size || ""),
        );

        if (existingIndex !== -1) {
          localCart[existingIndex] = {
            ...localCart[existingIndex],
            quantity:
              Number(localCart[existingIndex].quantity || 0) +
              Number(quantity || 1),
          };
        } else {
          localCart.push(normalizeCartItem(product, quantity, size));
        }

        const deduped = dedupeCartItems(localCart);
        saveLocalCart(deduped);
        setCartItems(deduped);
      }

      setIsCartOpen(true);
    },
    [getLocalCart, loadCartFromDB, saveLocalCart],
  );

  const removeFromCart = useCallback(
    async (id, size, userId = null) => {
      if (userId) {
        const item = cartItems.find(
          (i) => (i?.product_id ?? i?.id) === id && i?.size === size,
        );

        if (!item) return;

        try {
          const res = await fetch(`${API_BASE_URL}/cart/${item.id}`, {
            method: "DELETE",
          });

          const data = await res.json();

          if (!res.ok) {
            console.error("刪除會員購物車商品失敗:", data);
            return;
          }

          const latestCart = await loadCartFromDB(userId);
          setCartItems(latestCart);
        } catch (error) {
          console.error("刪除會員購物車商品失敗:", error);
        }
      } else {
        const localCart = getLocalCart().filter(
          (item) =>
            !((item?.product_id ?? item?.id) === id && item?.size === size),
        );

        saveLocalCart(localCart);
        setCartItems(localCart);
      }
    },
    [cartItems, getLocalCart, loadCartFromDB, saveLocalCart],
  );

  const updateQuantity = useCallback(
    async (id, size, quantity, userId = null) => {
      if (userId) {
        const item = cartItems.find(
          (i) => (i?.product_id ?? i?.id) === id && i?.size === size,
        );

        if (!item) return;

        try {
          const res = await fetch(`${API_BASE_URL}/cart/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: Number(quantity) }),
          });

          const data = await res.json();

          if (!res.ok) {
            console.error("更新會員購物車數量失敗:", data);
            return;
          }

          const latestCart = await loadCartFromDB(userId);
          setCartItems(latestCart);
        } catch (error) {
          console.error("更新會員購物車數量失敗:", error);
        }
      } else {
        const localCart = getLocalCart().map((item) =>
          (item?.product_id ?? item?.id) === id && item?.size === size
            ? { ...item, quantity: Number(quantity) }
            : item,
        );

        saveLocalCart(localCart);
        setCartItems(localCart);
      }
    },
    [cartItems, getLocalCart, loadCartFromDB, saveLocalCart],
  );

  const clearCart = useCallback(async () => {
    if (user?.id) {
      try {
        const res = await fetch(`${API_BASE_URL}/cart/clear/${user.id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("清空會員購物車失敗:", data);
          return;
        }

        setCartItems([]);
      } catch (error) {
        console.error("清空會員購物車失敗:", error);
      }
    } else {
      setCartItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [user]);

  const totalCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
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
