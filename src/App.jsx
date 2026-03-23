import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Clothing from "./pages/Clothing";
import Pants from "./pages/Pants";
import Socks from "./pages/Socks";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import { CartProvider } from "./context/CartProvider";
import { AuthProvider } from "./context/AuthProvider";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/clothing" element={<Clothing />} />
              <Route path="/pants" element={<Pants />} />
              <Route path="/socks" element={<Socks />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
