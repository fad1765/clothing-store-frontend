import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { useCart } from "./useCart";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const { mergeLocalCartToDB, clearCart } = useCart();

  const login = async (email, password) => {
    try {
      const res = await fetch("http://localhost:8000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser({
          id: data.id,
          name: data.username,
          email: data.email,
          role: data.role,
        });
        setAuthError("");
        // 登入後把 localStorage 購物車合併到資料庫
        await mergeLocalCartToDB(data.id);
        return true;
      } else {
        setAuthError(data.detail || "帳號或密碼錯誤");
        return false;
      }
    } catch {
      setAuthError("伺服器連線失敗");
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch("http://localhost:8000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthError("");
        return true;
      } else {
        setAuthError(data.detail || "註冊失敗");
        return false;
      }
    } catch {
      setAuthError("伺服器連線失敗");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthError("");
    clearCart(); // 登出時清空購物車狀態
  };

  return (
    <AuthContext.Provider
      value={{ user, authError, setAuthError, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
