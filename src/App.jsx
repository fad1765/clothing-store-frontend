import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import IntroLogo from "./components/IntroLogo";

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("hasSeenIntro");
  });

  const handleFinishIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem("hasSeenIntro", "true");
  };

  return (
    <BrowserRouter>
      {showIntro ? (
        <IntroLogo show={showIntro} onFinish={handleFinishIntro} />
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <div
                style={{
                  minHeight: "100vh",
                  background: "yellow",
                  color: "#000",
                  padding: "40px 20px",
                  fontSize: "24px",
                }}
              >
                手機測試頁面
              </div>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;