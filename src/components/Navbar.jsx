import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() { 
  const location = useLocation();
  
  const categories = ['Inicio', 'Nosotros', 'Productos', 'Categorías'];

  const routes = {
    'Inicio'      : '/',
    'Nosotros'   : '/nosotros',
    'Productos'   : '/productos',
    'Categorías'  : '/categorias',
  };

  // Función para verificar si la ruta está activa
  const isActiveRoute = (route) => {
    if (route === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(route) && route !== '/';
  };

  return (
    <nav className="main-navbar">
      <div className="container">
        <ul className="nav-list">
          {categories.map((category) => (
            <li key={category} className="nav-item">
              <Link 
                to={routes[category]} 
                className={`nav-link ${isActiveRoute(routes[category]) ? 'active' : ''}`}
              >
                {category}
              </Link>
            </li>
          ))}
          <li className="nav-item">
            <Link 
              to="/productos?ofertas=true" 
              className={`nav-link offers-link ${location.search.includes('ofertas=true') ? 'active' : ''}`}
            >
              Ofertas
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;