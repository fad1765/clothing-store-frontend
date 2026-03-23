import { useState, useEffect } from "react";
import Slider from "../components/Slider";
import { SlFire } from "react-icons/sl";
import "../styles/home.css";
import ProductCarousel from "../components/ProductCarousel";
import ProductModal from "../components/ProductModal";
import { MdOutlineTimer } from "react-icons/md";

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hotProducts, setHotProducts] = useState([]);
  const [limitedProducts, setLimitedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/products")
      .then((res) => res.json())
      .then((data) => {
        setHotProducts(data.filter((p) => p.is_hot === true));
        setLimitedProducts(data.filter((p) => p.is_limited === true));
        setLoading(false);
      });
  }, []);

  if (loading) return <p>載入中...</p>;

  return (
    <div className="home">
      <Slider />

      <h1 className="home-title">
        熱門商品
        <SlFire className="fire-icon" />
      </h1>
      <ProductCarousel
        products={hotProducts}
        onProductClick={setSelectedProduct}
      />

      <h1 className="home-title-limited">
        限時商品
        <MdOutlineTimer className="time-icon" />
      </h1>
      <ProductCarousel
        products={limitedProducts}
        onProductClick={setSelectedProduct}
      />

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
