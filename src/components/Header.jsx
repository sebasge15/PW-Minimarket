import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ cartCount, onCartClick, onLoginClick, user, isAuthenticated, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Función para buscar productos en la API
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      console.log(`🔍 Buscando: "${query}"`);
      const response = await fetch(`http://localhost:3001/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      console.log('📦 Respuesta de búsqueda:', data);
      
      if (data.success && data.products) {
        console.log(`✅ ${data.products.length} productos encontrados`);
        setSuggestions(data.products.slice(0, 5)); // Limitar a 5 sugerencias
      } else {
        console.log('❌ No se encontraron productos o error en la respuesta');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('❌ Error al buscar productos:', error);
      setSuggestions([]);
    }
    setLoading(false);
  };

  // Buscar con debounce para evitar muchas peticiones
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchProducts(searchTerm);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/productos?search=${encodeURIComponent(searchTerm)}`);
      setShowSuggestions(false);
      setSearchTerm('');
    }
  };

  const handleSuggestionClick = (product) => {
    console.log('🖱️ Click en sugerencia:', product);
    navigate(`/producto/${product.id}`);
    setShowSuggestions(false);
    setSearchTerm('');
  };

  const handleInputBlur = () => {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-container">
          <a href="/" className="mitienda-logo-button">
            Mi Tiendita
          </a>
        </div>
        
        <div className="search-bar-wrapper">
          <form onSubmit={handleSearchSubmit} className="search-bar-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar productos..." 
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button type="submit" className="search-icon-wrapper">
              🔍
            </button>
          </form>
          
          {/* Lista de sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="search-suggestions-list">
              {suggestions.map((product) => (
                <li 
                  key={product.id} 
                  className="search-suggestion-item"
                  onClick={() => handleSuggestionClick(product)}
                >
                  <img 
                    src={`http://localhost:3001${product.imageUrl}`}
                    alt={product.name}
                    className="suggestion-item-image"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/40x40/CCCCCC/FFFFFF?text=IMG';
                    }}
                  />
                  <div className="suggestion-item-info">
                    <div className="suggestion-item-name">{product.name}</div>
                    <div className="suggestion-item-price">
                      S/ {product.price} {product.priceUnit}
                    </div>
                    {product.category && (
                      <div className="suggestion-item-category">{product.category}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {/* Indicador de carga */}
          {loading && (
            <div className="search-loading">
              Buscando...
            </div>
          )}
          
          {/* Mensaje cuando no hay resultados */}
          {showSuggestions && !loading && searchTerm.length >= 2 && suggestions.length === 0 && (
            <div className="search-no-results">
              No se encontraron productos para "{searchTerm}"
            </div>
          )}
        </div>
        
        <div className="header-actions">
          {/* Carrito */}
          <button onClick={onCartClick} className="action-button cart-button">
            🛒
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>
          
          {/* Estado de autenticación */}
          {isAuthenticated ? (
            <>
              <div className="user-display">
                👤 Hola, {user?.nombre || 'Usuario'}
              </div>
              <button onClick={onLogout} className="logout-button">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button onClick={onLoginClick} className="action-button user-button">
              <div className="user-info">
                👤
                <span className="user-label">Iniciar Sesión</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
