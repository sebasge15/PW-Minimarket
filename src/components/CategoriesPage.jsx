import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CategoryCard from './CategoryCard';
import ProductCard from './ProductCard';
import './CategoriesPage.css';

function CategoriesPage({ addToCart }) {
  const { categoryName } = useParams(); // Obtener categoría de la URL
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determinar si estamos viendo todas las categorías o una específica
  const isViewingAllCategories = !categoryName;
  const isViewingSpecificCategory = !!categoryName;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isViewingAllCategories) {
          // Cargar todas las categorías
          console.log('🔍 Cargando todas las categorías...');
          
          const response = await fetch('http://localhost:3001/api/categories');
          const data = await response.json();
          
          console.log('📂 Respuesta de categorías:', data);
          
          if (data.success && data.categories) {
            setCategories(data.categories);
            console.log(`✅ ${data.categories.length} categorías cargadas`);
          } else {
            setError('No se pudieron cargar las categorías');
          }
        } else {
          // Cargar productos de la categoría específica usando el endpoint correcto
          console.log(`🔍 Cargando productos de la categoría: "${categoryName}"`);
          
          // ✅ USAR EL ENDPOINT CORRECTO
          const response = await fetch(`http://localhost:3001/api/categories/${encodeURIComponent(categoryName)}`);
          const data = await response.json();
          
          console.log('📦 Respuesta de productos por categoría:', data);
          
          if (data.success) {
            setProducts(data.products || []);
            setCategoryInfo(data.categoryInfo);
            console.log(`✅ ${(data.products || []).length} productos encontrados para "${categoryName}"`);
            
            if (data.products && data.products.length > 0) {
              console.log('📦 Primeros productos encontrados:');
              data.products.slice(0, 3).forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name} - ${product.category}`);
              });
            }
          } else {
            setError(data.message || `No se encontraron productos para la categoría "${categoryName}"`);
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        setError('Error de conexión al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryName, isViewingAllCategories]); // Recargar cuando cambie la categoría

  const getPageTitle = () => {
    if (isViewingAllCategories) {
      return 'Todas las Categorías';
    }
    return categoryInfo?.name || categoryName || 'Productos de Categoría';
  };

  const getPageSubtitle = () => {
    if (isViewingAllCategories) {
      return `Explora nuestras ${categories.length} categorías disponibles`;
    }
    if (categoryInfo?.description) {
      return categoryInfo.description;
    }
    return `${products.length} producto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="categories-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <h2>Cargando {isViewingAllCategories ? 'categorías' : 'productos'}...</h2>
            <p>Por favor espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="container">
        {/* Header de la página */}
        <div className="page-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <p className="page-subtitle">{getPageSubtitle()}</p>
          
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <button 
              className="breadcrumb-link"
              onClick={() => window.location.href = '/'}
            >
              Inicio
            </button>
            <span className="separator">{'>'}</span>
            <button 
              className="breadcrumb-link"
              onClick={() => window.location.href = '/categorias'}
            >
              Categorías
            </button>
            {isViewingSpecificCategory && (
              <>
                <span className="separator">{'>'}</span>
                <span className="current">{categoryName}</span>
              </>
            )}
          </div>
        </div>

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
              {isViewingSpecificCategory && (
                <button 
                  className="back-button"
                  onClick={() => window.location.href = '/categorias'}
                >
                  Volver a Categorías
                </button>
              )}
            </div>
          </div>
        ) : isViewingAllCategories ? (
          // Vista de todas las categorías
          categories.length > 0 ? (
            <>
              <div className="categories-controls">
                <div className="results-info">
                  <span>{categories.length} categoría{categories.length !== 1 ? 's' : ''} disponible{categories.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="categories-grid">
                {categories.map(category => (
                  <CategoryCard 
                    key={category.id}
                    category={category}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-content-container">
              <div className="no-content-icon">📂</div>
              <h3>No hay categorías disponibles</h3>
              <p>Nuestras categorías están siendo actualizadas. Por favor, vuelve más tarde.</p>
            </div>
          )
        ) : (
          // Vista de productos de categoría específica
          products.length > 0 ? (
            <>
              <div className="products-controls">
                <div className="results-info">
                  <span>{products.length} producto{products.length !== 1 ? 's' : ''} en esta categoría</span>
                </div>
                <button 
                  className="back-to-categories-button"
                  onClick={() => window.location.href = '/categorias'}
                >
                  ← Volver a Categorías
                </button>
              </div>

              <div className="products-grid">
                {products.map(product => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-content-container">
              <div className="no-content-icon">📦</div>
              <h3>No hay productos en esta categoría</h3>
              <p>La categoría "{categoryName}" no tiene productos disponibles en este momento.</p>
              <div className="no-content-actions">
                <button 
                  className="view-all-button"
                  onClick={() => window.location.href = '/categorias'}
                >
                  Ver todas las categorías
                </button>
                <button 
                  className="debug-button"
                  onClick={() => {
                    window.open(`http://localhost:3001/api/categories/debug/products/${encodeURIComponent(categoryName)}`, '_blank');
                  }}
                >
                  🔍 Debug (Ver datos)
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;
