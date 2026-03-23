import { useEffect } from "react";
import "../styles/logoutSuccessModal.css";

export default function SuccessModal({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="success-overlay">
      <div className="success-modal">
        <div className="success-check">✓</div>
        <p>{message}</p>
      </div>
    </div>
  );
}
