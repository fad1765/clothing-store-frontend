import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import "../styles/category.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PRODUCTS_PER_PAGE = 8;

export default function Products() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const keyword = params.get("keyword") || "";

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState("latest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("取得商品失敗:", err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    if (!lowerKeyword) return products;

    return products.filter((p) => {
      const categoryTextMap = {
        clothing: "衣服 上衣 服飾 clothing",
        pant: "褲子 長褲 短褲 牛仔褲 褲 pant",
        sock: "襪子 襪 短襪 長襪 sock",
      };

      const searchText = `
        ${p.name || ""}
        ${p.description || ""}
        ${p.category || ""}
        ${categoryTextMap[p.category] || ""}
      `.toLowerCase();

      return searchText.includes(lowerKeyword);
    });
  }, [products, keyword]);

  const sortedProducts = useMemo(() => {
    const copiedProducts = [...filteredProducts];

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
  }, [filteredProducts, sortType]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE),
  );

  const safePage = currentPage > totalPages ? 1 : currentPage;

  const currentProducts = useMemo(() => {
    const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, safePage]);

  if (loading) return <p>載入中...</p>;

  return (
    <div className="category-page">
      <h1 className="category-title">搜尋結果</h1>

      <div className="category-topbar">
        <p className="product-count">
          關鍵字：{keyword || "全部"}，共 {sortedProducts.length} 件商品
        </p>

        <div className="sort-box">
          <label htmlFor="products-sort">排序方式：</label>
          <select
            id="products-sort"
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
          <p className="empty-text">找不到符合條件的商品</p>
        )}
      </div>

      <div className="pagination-wrapper">
        <p className="pagination-info">
          第 {safePage} 頁 / 共 {totalPages} 頁
        </p>

        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={safePage === 1}
          >
            上一頁
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                className={`page-number ${safePage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ),
          )}

          <button
            className="page-btn"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={safePage === totalPages}
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
