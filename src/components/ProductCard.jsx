import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationCard from './Notification';

function ProductCard({ product, onAddToCart }) {
  const [showNotification, setShowNotification] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  if (!product || !product.id) {
    console.warn("ProductCard recibió un producto inválido:", product);
    return null; 
  }

  // DEBUG: Ver qué datos llegan al ProductCard
  console.log(`🔍 ProductCard para: ${product.name}`);
  console.log(`   - imageUrl: "${product.imageUrl}"`);
  console.log(`   - URL completa que se usará: http://localhost:3001${product.imageUrl}`);

  const handleCardClick = () => {
    navigate(`/producto/${product.id}`); 
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation(); 

    handleAddToCart();

    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleAddToCart = () => {
    // Get the correct image URL
    const imageUrl = product.image_url 
      ? `http://localhost:3001${product.image_url}`
      : product.imageUrl || null;

    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: imageUrl, // Use the processed imageUrl
      quantity: 1
    });
  };

  const ShoppingCartIcon = () => <span role="img" aria-label="Agregar al carrito">🛒</span>;

  // Validate image URL
  const hasValidImageUrl = product.image_url || product.imageUrl;

  // Process image URL
  const imageUrl = useMemo(() => {
    if (!hasValidImageUrl) return null;

    const url = product.image_url || product.imageUrl;
    
    // If it's already a full URL, use it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it starts with /, it's from our backend
    if (url.startsWith('/')) {
      return `http://localhost:3001${url}`;
    }
    
    // Otherwise assume it's in assets
    return `/assets/${url}`;
  }, [product.image_url, product.imageUrl]);

  console.log('🖼️ ProductCard image processing:', {
    productName: product.name,
    originalUrl: product.image_url || product.imageUrl,
    processedUrl: imageUrl
  });

  const handleImageError = () => {
    console.error('❌ Image failed to load:', imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`✅ Imagen cargada correctamente: ${product.imageUrl}`);
    setImageError(false);
  };

  console.log('🎯 Product data:', {
    id: product.id,
    name: product.name,
    image_url: product.image_url,
    imageUrl: product.imageUrl,
    finalImageUrl: imageUrl
  });

  return (
    <div 
      className="product-card" 
      onClick={handleCardClick} 
      style={{ cursor: 'pointer' }}
      role="link" 
      tabIndex={0} 
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
    >
      {showNotification && (
        <div className="notification-container">
          <NotificationCard title={``} message="¡Tu producto ha sido añadido exitosamente!" />
        </div>
      )}

      <div className="product-image-container">
        {hasValidImageUrl && !imageError ? (
          <img 
            src={imageUrl}  // 🔧 USAR LA URL COMPLETA
            alt={product.name}
            className="product-image"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div 
            className="product-image placeholder-image"
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              border: '2px dashed #ddd',
              color: '#999'
            }}
          >
            <div>📷</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {!hasValidImageUrl ? 'Sin imagen configurada' : 'Imagen no disponible'}
            </div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>
              {product.name.substring(0, 20)}
            </div>
            {!hasValidImageUrl && (
              <div style={{ fontSize: '8px', marginTop: '2px', color: '#ccc' }}>
                imageUrl: "{product.imageUrl}"
              </div>
            )}
          </div>
        )}
        
        {product.discount && (
          <span className="product-discount-badge">
            {product.discount} OFF
          </span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name" title={product.name}>{product.name}</h3>

        {product.category && (
          <p className="product-category">{product.category}</p>
        )}

        <div className="product-pricing">
          <p className="product-price">{product.price}</p>
          {product.oldPrice && (
            <p className="product-old-price">{product.oldPrice}</p>
          )}
        </div>

        <button
          className="add-to-cart-button"
          onClick={handleAddToCartClick} 
        >
          <span className="cart-icon-button-inner">
            <ShoppingCartIcon />
          </span>  
          Agregar al Carrito
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
