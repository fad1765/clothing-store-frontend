import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

const API_BASE_URL = "http://localhost:8000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("讀取 user 失敗", err);
      return null;
    }
  });

  const [authError, setAuthError] = useState("");

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error("同步 user 到 localStorage 失敗", err);
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const loggedInUser = {
          id: data.id,
          name: data.username,
          email: data.email,
          role: data.role,
        };

        setUser(loggedInUser);
        setAuthError("");

        // 購物車合併不在這裡做，改由 CartProvider 偵測 user 後自動處理
        return loggedInUser;
      } else {
        setAuthError(data.detail || "帳號或密碼錯誤");
        return null;
      }
    } catch (err) {
      console.error("登入失敗", err);
      setAuthError("伺服器連線失敗");
      return null;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthError("");
        return true;
      } else {
        setAuthError(data.detail || "註冊失敗");
        return false;
      }
    } catch (err) {
      console.error("註冊失敗", err);
      setAuthError("伺服器連線失敗");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthError("");

    // 會員登出後，CartProvider 會因為 user 變成 null
    // 自動把畫面購物車切回 guest_cart（若沒有則為空）
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authError,
        setAuthError,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
