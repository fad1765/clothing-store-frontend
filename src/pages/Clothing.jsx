import { useState, useEffect, useMemo } from "react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import "../styles/category.css";

const PRODUCTS_PER_PAGE = 8;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getImageUrl(path) {
  if (!path) return "";

  const imagePath = String(path).trim();

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  // 舊的前端靜態圖片
  if (imagePath.startsWith("/images")) {
    return imagePath;
  }

  // 後端 uploads 圖片
  if (imagePath.startsWith("/uploads")) {
    return `${API_BASE_URL}${imagePath}`;
  }

  if (imagePath.startsWith("uploads/")) {
    return `${API_BASE_URL}/${imagePath}`;
  }

  return imagePath;
}

export default function Clothing() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        const clothingProducts = data
          .filter((p) => p.category === "clothing")
          .map((p) => ({
            ...p,
            image: getImageUrl(p.image),
            images: Array.isArray(p.images)
              ? p.images.map((img) => getImageUrl(img))
              : [],
          }));

        setProducts(clothingProducts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("取得商品失敗:", err);
        setLoading(false);
      });
  }, []);

  const sortedProducts = useMemo(() => {
    const copiedProducts = [...products];

    switch (sortType) {
      case "price-asc":
        return copiedProducts.sort((a, b) => a.price - b.price);

      case "price-desc":
        return copiedProducts.sort((a, b) => b.price - a.price);

      case "rating-desc":
        return copiedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      case "latest":
      default:
        return copiedProducts.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
    }
  }, [products, sortType]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE),
  );

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage]);

  if (loading) return <p>載入中...</p>;

  return (
    <div className="category-page">
      <h1 className="category-title">衣服</h1>

      <div className="category-topbar">
        <p className="product-count">共 {sortedProducts.length} 件商品</p>

        <div className="sort-box">
          <label htmlFor="clothing-sort">排序方式：</label>
          <select
            id="clothing-sort"
            value={sortType}
            onChange={(e) => {
              setSortType(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="latest">最新商品</option>
            <option value="price-asc">價格低到高</option>
            <option value="price-desc">價格高到低</option>
            <option value="rating-desc">評分高到低</option>
          </select>
        </div>
      </div>

      <div className="product-grid">
        {currentProducts.length > 0 ? (
          currentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={setSelectedProduct}
            />
          ))
        ) : (
          <p className="empty-text">目前沒有商品</p>
        )}
      </div>

      <div className="pagination-wrapper">
        <p className="pagination-info">
          第 {currentPage} 頁 / 共 {totalPages} 頁
        </p>

        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            上一頁
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                className={`page-number ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ),
          )}

          <button
            className="page-btn"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage === totalPages}
          >
            下一頁
          </button>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}