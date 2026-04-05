import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "../components/Slider";
import { SlFire } from "react-icons/sl";
import { MdOutlineTimer } from "react-icons/md";
import { RiCoupon3Line } from "react-icons/ri";
import { GiClothes, GiTrousers, GiSocks } from "react-icons/gi";
import "../styles/home.css";
import ProductCarousel from "../components/ProductCarousel";
import ProductModal from "../components/ProductModal";

const API_BASE_URL = "http://localhost:8000";

export default function Home() {
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hotProducts, setHotProducts] = useState([]);
  const [limitedProducts, setLimitedProducts] = useState([]);
  const [marqueeCoupons, setMarqueeCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [productsRes, marqueeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/coupons/marquee`),
        ]);

        const productsData = await productsRes.json();

        let marqueeData = [];
        if (marqueeRes.ok) {
          marqueeData = await marqueeRes.json();
        }

        setHotProducts(
          Array.isArray(productsData)
            ? productsData.filter((p) => p.is_hot === true)
            : [],
        );

        setLimitedProducts(
          Array.isArray(productsData)
            ? productsData.filter((p) => p.is_limited === true)
            : [],
        );

        setMarqueeCoupons(Array.isArray(marqueeData) ? marqueeData : []);
      } catch (error) {
        console.error("首頁資料載入失敗：", error);
        setHotProducts([]);
        setLimitedProducts([]);
        setMarqueeCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const noticeText = useMemo(() => {
    if (marqueeCoupons.length > 0) {
      return marqueeCoupons[0]?.marquee_text;
    }

    return "優惠活動｜全館滿 NT$ 1000 現折 NT$ 100｜全館適用｜優惠碼 SAVE100";
  }, [marqueeCoupons]);

  const categoryItems = [
    {
      key: "clothing",
      label: "衣服",
      subLabel: "Tops",
      icon: <GiClothes />,
    },
    {
      key: "pant",
      label: "褲子",
      subLabel: "Pant",
      icon: <GiTrousers />,
    },
    {
      key: "sock",
      label: "襪子",
      subLabel: "Sock",
      icon: <GiSocks />,
    },
  ];

  const handleCategoryClick = (category) => {
    if (category === "clothing") navigate("/clothing");
    if (category === "pant") navigate("/pants");
    if (category === "sock") navigate("/socks");
  };
  if (loading) return <p className="home-loading">載入中...</p>;

  return (
    <div className="home">
      <section className="notice-bar-full">
        <div className="notice-bar-simple">
          <div className="notice-bar-simple-content">
            <RiCoupon3Line className="notice-icon" />
            <p className="notice-text">{noticeText}</p>
          </div>
        </div>
      </section>

      <div className="home-slider-wrap">
        <Slider />
      </div>

      <section className="home-category-section">
        <div className="home-category-frame">
          {categoryItems.map((item, index) => (
            <button
              key={item.key}
              className="home-category-card"
              onClick={() => handleCategoryClick(item.key)}
              type="button"
            >
              <div className="home-category-icon">{item.icon}</div>
              <h3>{item.label}</h3>
              <span>{item.subLabel}</span>
              {index !== categoryItems.length - 1 && (
                <div className="home-category-divider" />
              )}
            </button>
          ))}
        </div>
      </section>

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
