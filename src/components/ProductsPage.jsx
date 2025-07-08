import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import './ProductsPage.css';

function ProductsPage({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Analizar parámetros de URL
  const searchParams = new URLSearchParams(location.search);
  const isOffers = searchParams.get('ofertas') === 'true';
  const searchQuery = searchParams.get('q');
  const category = searchParams.get('category');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Cargando productos...', { isOffers, searchQuery, category });
        
        let url = 'http://localhost:3001/api/products';
        
        // Determinar qué endpoint usar
        if (searchQuery) {
          // Si hay una consulta de búsqueda, usar la API de búsqueda
          url = `http://localhost:3001/api/products/search?q=${encodeURIComponent(searchQuery)}`;
        } else if (category) {
          // Si hay una categoría específica
          url = `http://localhost:3001/api/products?category=${encodeURIComponent(category)}`;
        }
        
        console.log('📡 URL de request:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Respuesta de productos:', data);
        
        if (data.success && data.products) {
          let productsToShow = data.products;
          
          // Filtrar ofertas si es necesario (solo si no hay búsqueda o categoría específica)
          if (isOffers && !searchQuery && !category) {
            productsToShow = productsToShow.filter(product => {
              const discount = parseFloat(product.discount || 0);
              return discount > 0;
            });
            console.log(`🔥 ${productsToShow.length} productos con ofertas encontrados`);
          }
          
          setProducts(productsToShow);
          console.log(`✅ ${productsToShow.length} productos cargados para mostrar`);
        } else {
          console.error('❌ Respuesta no exitosa:', data);
          setError(data.message || 'No se pudieron cargar los productos');
        }
      } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        setError('Error de conexión al cargar productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isOffers, searchQuery, category]); // Recargar cuando cambien estos parámetros

  const getPageTitle = () => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (category) return `Productos de ${category}`;
    if (isOffers) return '🔥 Ofertas Especiales';
    return 'Todos los Productos';
  };

  const getPageSubtitle = () => {
    if (searchQuery) return `${products.length} producto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`;
    if (category) return `Explora todos los productos de ${category}`;
    if (isOffers) return '¡No te pierdas estas increíbles ofertas!';
    return `Descubre nuestros ${products.length} productos disponibles`;
  };

  const getBreadcrumb = () => {
    const breadcrumbs = [
      { label: 'Inicio', path: '/' }
    ];

    if (searchQuery) {
      breadcrumbs.push({ label: 'Búsqueda', path: null });
    } else if (category) {
      breadcrumbs.push({ label: 'Categorías', path: '/categorias' });
      breadcrumbs.push({ label: category, path: null });
    } else if (isOffers) {
      breadcrumbs.push({ label: 'Ofertas', path: null });
    } else {
      breadcrumbs.push({ label: 'Productos', path: null });
    }

    return breadcrumbs;
  };

  const clearFilters = () => {
    navigate('/productos');
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h2>Cargando productos...</h2>
            <p>Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="container">
        {/* Header de la página */}
        <div className="page-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <p className="page-subtitle">{getPageSubtitle()}</p>
          
          {/* Breadcrumb */}
          <div className="breadcrumb">
            {getBreadcrumb().map((crumb, index) => (
              <React.Fragment key={index}>
                {crumb.path ? (
                  <button 
                    className="breadcrumb-link"
                    onClick={() => navigate(crumb.path)}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={index === getBreadcrumb().length - 1 ? 'current' : ''}>
                    {crumb.label}
                  </span>
                )}
                {index < getBreadcrumb().length - 1 && (
                  <span className="separator">{'>'}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Filtros activos */}
        {(isOffers || searchQuery || category) && (
          <div className="active-filters">
            <div className="filters-header">
              <span>Filtros activos:</span>
            </div>
            <div className="filters-list">
              {isOffers && (
                <span className="filter-tag offers">
                  🔥 Ofertas
                  <button onClick={() => navigate('/productos')}>×</button>
                </span>
              )}
              {searchQuery && (
                <span className="filter-tag search">
                  🔍 "{searchQuery}"
                  <button onClick={() => navigate('/productos')}>×</button>
                </span>
              )}
              {category && (
                <span className="filter-tag category">
                  📂 {category}
                  <button onClick={() => navigate('/productos')}>×</button>
                </span>
              )}
              <button className="clear-all-filters" onClick={clearFilters}>
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {error ? (
          <div className="error-container">
            <div className="error-icon">😕</div>
            <h3>Oops! Algo salió mal</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button 
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                Intentar de nuevo
              </button>
              {(searchQuery || category || isOffers) && (
                <button 
                  className="view-all-button"
                  onClick={clearFilters}
                >
                  Ver todos los productos
                </button>
              )}
            </div>
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Controles de productos */}
            <div className="products-controls">
              <div className="results-info">
                <span>
                  {products.length} producto{products.length !== 1 ? 's' : ''} 
                  {isOffers && ' en oferta'}
                  {category && ` en ${category}`}
                  {searchQuery && ` encontrado${products.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              
              {/* Ordenamiento (para futuro) */}
              <div className="sort-controls">
                <select className="sort-select" defaultValue="relevance">
                  <option value="relevance">Más relevantes</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>
            </div>

            {/* Grid de productos */}
            <div className="products-grid">
              {products.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>

            {/* Pagination (para futuro) */}
            {products.length >= 20 && (
              <div className="pagination-container">
                <p>Mostrando {products.length} productos</p>
                {/* Aquí se puede agregar paginación en el futuro */}
              </div>
            )}
          </>
        ) : (
          <div className="no-products-container">
            <div className="no-products-icon">
              {isOffers ? '🏷️' : searchQuery ? '🔍' : category ? '📂' : '📦'}
            </div>
            <h3>
              {isOffers 
                ? 'No hay ofertas disponibles' 
                : searchQuery 
                  ? 'No se encontraron productos'
                  : category
                    ? `No hay productos en ${category}`
                    : 'No hay productos disponibles'
              }
            </h3>
            <p>
              {isOffers 
                ? 'En este momento no tenemos ofertas especiales, pero vuelve pronto para ver las últimas promociones.' 
                : searchQuery 
                  ? `No encontramos productos que coincidan con "${searchQuery}". Intenta con otros términos de búsqueda.`
                  : category
                    ? `La categoría "${category}" no tiene productos disponibles en este momento.`
                    : 'Nuestro catálogo está siendo actualizado. Por favor, vuelve más tarde.'
              }
            </p>
            
            <div className="no-products-actions">
              {(searchQuery || isOffers || category) && (
                <button 
                  className="view-all-button"
                  onClick={clearFilters}
                >
                  Ver todos los productos
                </button>
              )}
              <button 
                className="back-home-button"
                onClick={() => navigate('/')}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;