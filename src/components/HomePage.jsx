import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import CategoryCard from './CategoryCard';
import { useAuth } from './autenticacion';
import './HomePage.css';

import bannerPrincipal from '../assets/bannerpromocional.png';

const bannerImages = [
  bannerPrincipal,
  "https://placehold.co/1200x400/A8D8C0/FFFFFF?text=Ofertas+Frescas+de+Verano", 
  "https://placehold.co/1200x400/FFDAB9/8B4513?text=Descuentos+Especiales", 
  "https://placehold.co/1200x400/E6E6FA/483D8B?text=Novedades+del+Mes", 
];

const PRODUCTS_PER_PAGE = 3; 

function HomePage({ addToCart }) {
  const { user, isAuthenticated } = useAuth();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentProductPage, setCurrentProductPage] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar productos destacados desde la API
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        console.log('Cargando productos destacados...');
        const response = await fetch('http://localhost:3001/api/products/featured');
        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Productos destacados cargados:', data.products.length);
          setFeaturedProducts(data.products);
        } else {
          console.error('Error al cargar productos destacados:', data.message);
          setError('Error al cargar productos destacados');
        }
      } catch (error) {
        console.error('Error al cargar productos destacados:', error);
        setError('Error de conexión al cargar productos destacados');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Cargar categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log('🔍 Iniciando carga de categorías...');
        
        const response = await fetch('http://localhost:3001/api/categories');
        console.log('📡 Status de respuesta:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Datos de categorías recibidos:', data);
        
        if (data.success && data.categories) {
          console.log(`✅ ${data.categories.length} categorías cargadas exitosamente`);
          setCategories(data.categories);
        } else {
          console.error('❌ Error en respuesta de categorías:', data.message);
          setError(data.message || 'Error al cargar categorías');
        }
      } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        setError('Error de conexión al cargar categorías');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Rotación automática del banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => 
        (prevIndex + 1) % bannerImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Paginación de productos
  const totalPages = Math.ceil(featuredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = featuredProducts.slice(
    currentProductPage * PRODUCTS_PER_PAGE,
    (currentProductPage + 1) * PRODUCTS_PER_PAGE
  );

  const nextPage = () => {
    setCurrentProductPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentProductPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToBannerSlide = (index) => {
    setCurrentBannerIndex(index);
  };

  if (loading && categoriesLoading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Banner Principal con Mensaje Personalizado */}
      <section className="banner-section">
        <div className="banner-container">
          <div className="banner-image-wrapper">
            <img 
              src={bannerImages[currentBannerIndex]}
              alt="Banner promocional"
              className="banner-image"
            />
            <div className="banner-overlay">
              <div className="banner-content">
                <h1 className="banner-title">
                  {isAuthenticated() && user ? 
                    `¡Bienvenido, ${user.nombre}!` : 
                    '¡Las Mejores Ofertas!'
                  }
                </h1>
                <p className="banner-subtitle">Encuentra todo lo que necesitas al mejor precio</p>
                <button className="banner-button">Ver Ofertas</button>
              </div>
            </div>
          </div>
          
          {/* Indicadores del banner */}
          <div className="banner-indicators">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentBannerIndex ? 'active' : ''}`}
                onClick={() => goToBannerSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN DE PRODUCTOS DESTACADOS (PRIMERO) */}
      <section className="products-section">
        <div className="container">
          <div className="products-header">
            <h2 className="section-title">
              {isAuthenticated() && user ? 
                `Productos Destacados para ti, ${user.nombre}` : 
                'Productos Destacados'
              }
            </h2>
            
            {featuredProducts.length > PRODUCTS_PER_PAGE && (
              <div className="pagination-controls">
                <button onClick={prevPage} className="pagination-button">‹</button>
                <span className="pagination-info">
                  {currentProductPage + 1} de {totalPages}
                </span>
                <button onClick={nextPage} className="pagination-button">›</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="products-loading">
              <div className="loading-spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : currentProducts.length > 0 ? (
            <div className="products-grid">
              {currentProducts.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          ) : (
            <div className="products-error">
              <p>No hay productos destacados disponibles</p>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN DE CATEGORÍAS (SEGUNDO) */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Explora por Categorías</h2>
          
          {categoriesLoading ? (
            <div className="categories-loading">
              <div className="loading-spinner"></div>
              <p>Cargando categorías...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="categories-grid">
              {categories.map(category => (
                <CategoryCard 
                  key={category.id}
                  category={category}
                />
              ))}
            </div>
          ) : (
            <div className="categories-error">
              <p>No se pudieron cargar las categorías</p>
              <button onClick={() => window.location.reload()}>Reintentar</button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

export default HomePage;