import "../styles/productcard.css";

export default function ProductCard({ product, onClick }) {
  return (
    <div className="product-card" onClick={() => onClick && onClick(product)}>
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} />
        <div className="product-overlay">
          <span className="view-detail">查看詳情</span>
        </div>
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">NT$ {product.price}</p>
      </div>
    </div>
  );
}
