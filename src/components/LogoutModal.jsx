import "../styles/logout.css";

export default function LogoutModal({ onConfirm, onCancel, isLoading = false }) {
  return (
    <div
      className="logout-overlay"
      onClick={() => {
        if (isLoading) return;
        onCancel();
      }}
    >
      <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
        <h2>確認登出</h2>
        <p>您確定要登出帳號嗎？</p>

        <div className="logout-btns">
          <button
            className="logout-cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </button>

          <button
            className="logout-confirm-btn"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "登出中..." : "確認登出"}
          </button>
        </div>
      </div>
    </div>
  );
}