import { useState, useRef, useEffect } from "react";
import ProductCard from "./ProductCard";
import "../styles/ProductCarousel.css";

const VISIBLE_COUNT = 6;

export default function ProductCarousel({ products, onProductClick }) {
  const [index, setIndex] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!trackRef.current) return;
    const firstItem = trackRef.current.children[0];
    if (!firstItem) return;
    setItemWidth(firstItem.offsetWidth + 20);
  }, [products]);

  const maxIndex = Math.max(0, products.length - VISIBLE_COUNT);
  const next = () => setIndex((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setIndex((prev) => Math.max(prev - 1, 0));
  const translateX = index * itemWidth;

  return (
    <div className="carousel">
      <button onClick={prev} disabled={index === 0} className="arrow left">
        ‹
      </button>

      <div className="carousel-window">
        <div
          className="carousel-track"
          ref={trackRef}
          style={{
            transform: `translateX(-${translateX}px)`,
            transition: "transform 0.4s ease",
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={onProductClick}
            />
          ))}
        </div>
      </div>

      <button
        onClick={next}
        disabled={index >= maxIndex}
        className="arrow right"
      >
        ›
      </button>
    </div>
  );
}
