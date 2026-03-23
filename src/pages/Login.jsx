import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import SuccessModal from "../components/SuccessModal";

export default function Login() {
  const { login, register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setAuthError("");
  };

  const handleSubmit = async () => {
    if (isRegister) {
      if (!form.name || !form.email || !form.password) {
        setAuthError("請填寫所有欄位");
        return;
      }
      const success = await register(form.name, form.email, form.password);
      if (success) {
        setSuccessMessage("註冊成功！");
      }
    } else {
      if (!form.email || !form.password) {
        setAuthError("請填寫所有欄位");
        return;
      }
      const success = await login(form.email, form.password);
      if (success) {
        setSuccessMessage("登入成功！");
      }
    }
  };

  const handleModalDone = () => {
    setSuccessMessage("");
    if (isRegister) {
      // 註冊成功 → 切換到登入頁
      setIsRegister(false);
      setForm({ name: "", email: "", password: "" });
    } else {
      // 登入成功 → 跳轉首頁
      navigate("/");
    }
  };

  return (
    <div className="login-page">
      {successMessage && (
        <SuccessModal message={successMessage} onDone={handleModalDone} />
      )}

      <div className="login-card">
        <h1 className="login-title">{isRegister ? "註冊帳號" : "登入"}</h1>

        {isRegister && (
          <div className="login-group">
            <label>姓名</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="請輸入姓名"
            />
          </div>
        )}

        <div className="login-group">
          <label>信箱</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="請輸入信箱"
          />
        </div>

        <div className="login-group">
          <label>密碼</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="請輸入密碼"
          />
        </div>

        {authError && <p className="login-error">{authError}</p>}

        <button className="login-btn" onClick={handleSubmit}>
          {isRegister ? "註冊" : "登入"}
        </button>

        <p className="login-switch">
          {isRegister ? "已有帳號？" : "還沒有帳號？"}
          <span
            onClick={() => {
              setIsRegister((prev) => !prev);
              setAuthError("");
              setForm({ name: "", email: "", password: "" });
            }}
          >
            {isRegister ? "前往登入" : "立即註冊"}
          </span>
        </p>

        {!isRegister && (
          <p className="login-hint">測試帳號：ming@test.com ／ 密碼：123456</p>
        )}
      </div>
    </div>
  );
}
