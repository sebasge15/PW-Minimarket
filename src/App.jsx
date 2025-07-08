import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link as RouterLink } from 'react-router-dom';
import { AuthProvider } from './components/autenticacion';

import UserLayout from './components/UserLayout';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Registro from "./components/Registro"; 
import Recuperar from './components/Recuperar';   
import Carrito from './components/Carrito';
import Checkout from './components/Checkout';
import ProductDetailPage from './components/ProductDetailPage'; 

import DetalleOrdenUsuario from './components/usuario/DetalleOrdenUsuario';
import DatosUsuario from './components/usuario/DatosUsuario';
import CambiarContrasena from './components/usuario/CambiarContrasena'; 
import ListaOrdenesUsuario from './components/usuario/ListaOrdenesUsuario'; 
import ListadoCategoriasAdmin from './components/admin/ListadoCategoriasAdmin';
import AgregarCategoriaAdmin from './components/admin/AgregarCategoriaAdmin';
import ListaOrdenesAdmin from './components/admin/ListaOrdenesAdmin';
import ListaOrdenes2 from './components/admin/ListaOrdenes2';
import DashboardAdmin from './components/admin/DashboardAdmin';
import AgregarproductoAdmi from './components/admin/AgregarproductoAdmi';
import ListaProductos from './components/admin/ListaProductos';
import ListaUsuarios from './components/admin/ListaUsuario';
import DetalleUsuario from './components/admin/DetalleUsuario';
import CategoriesPage from './components/CategoriesPage';
import ProtectedRoute from './components/ProtectedRoute';
import ProductsPage from './components/ProductsPage'; // Cambiar de ProductsPagePlaceholder

function AppContent() {
  const [cartItems, setCartItems] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const navigate = useNavigate();

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const goToHome = () => navigate('/');
  const goToCart = () => navigate('/carrito');
  const goToCheckout = () => navigate('/checkout');
  const goToLogin = () => navigate('/login');
  const goToRegister = () => navigate('/registro');
  const goToRecover = () => navigate('/recuperar');
  const goToProducts = () => navigate('/productos');

  const changeQuantityInCart = (productId, delta) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const totalCartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCompleteOrder = async (orderData) => {
    try {
      console.log('📦 Creando nueva orden:', orderData);
      
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la orden');
      }

      if (data.success && data.order) {
        setCartItems([]);
        // Update the navigation path to match the route
        navigate(`/usuario/ordenes/${data.order.id}`);
        return data.order;
      }

      console.error('❌ Orden no creada:', data.message || 'Error desconocido');
      throw new Error(data.message || 'Error al crear la orden');

    } catch (error) {
      console.error('❌ Error al crear orden:', error);
      throw error;
    }
  };

  // Update getOrderById to include API fallback
  const getOrderById = async (orderId) => {
    try {
      console.log('🔍 Buscando orden:', orderId);
      
      // First try to get from local state
      const localOrder = completedOrders.find(order => order.id === orderId);
      if (localOrder) {
        console.log('✅ Orden encontrada en estado local:', localOrder);
        return localOrder;
      }

      // If not found locally, try API
      console.log('🔄 Buscando orden en API:', orderId);
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}`);
      const data = await response.json();

      if (data.success && data.order) {
        console.log('✅ Orden encontrada en API:', data.order);
        return data.order;
      }

      console.error('❌ Orden no encontrada');
      return null;
    } catch (error) {
      console.error('❌ Error al buscar orden:', error);
      return null;
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setCompletedOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, estado: newStatus } : order
      )
    );
  };
  
  const userLayoutProps = {
    cartCount: totalCartItemCount,
    onCartClick: goToCart,
  };

  return (
    <div className="App">
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<UserLayout {...userLayoutProps}><HomePage addToCart={handleAddToCart} /></UserLayout>}/>
        <Route path="/login" element={<UserLayout {...userLayoutProps}><Login onRegisterClick={goToRegister} onRecoverClick={goToRecover} onBack={goToHome} /></UserLayout>}/>
        <Route path="/registro" element={<UserLayout {...userLayoutProps}><Registro onLoginClick={goToLogin} /></UserLayout>}/>
        <Route path="/recuperar" element={<UserLayout {...userLayoutProps}><Recuperar onLoginClick={goToLogin} /></UserLayout>}/>
        <Route path="/productos" element={<UserLayout {...userLayoutProps}><ProductsPage addToCart={handleAddToCart} /></UserLayout>}/>
        <Route path="/categorias" element={<UserLayout {...userLayoutProps}><CategoriesPage addToCart={handleAddToCart} /></UserLayout>}/>
        
        {/* AGREGAR ESTA RUTA PARA CATEGORÍAS INDIVIDUALES */}
        <Route path="/categoria/:categoryName" element={<UserLayout {...userLayoutProps}><CategoriesPage addToCart={handleAddToCart} /></UserLayout>}/>
        
        <Route 
          path="/producto/:id"
          element={
            <UserLayout {...userLayoutProps}>
              <ProductDetailPage addToCart={handleAddToCart} />
            </UserLayout>
          }
        />

        {/* Rutas protegidas para usuarios autenticados */}
        <Route path="/carrito" element={
          <ProtectedRoute>
            <UserLayout {...userLayoutProps}>
              <Carrito cartItems={cartItems} onBack={goToHome} onQuantityChange={changeQuantityInCart} onRemoveItem={removeFromCart} onCheckout={goToCheckout} />
            </UserLayout>
          </ProtectedRoute>
        }/>
        <Route path="/checkout" element={
          <ProtectedRoute>
            <UserLayout {...userLayoutProps}>
              <Checkout cartItems={cartItems} onBackToCart={goToCart} onOrderComplete={handleCompleteOrder}/>
            </UserLayout>
          </ProtectedRoute>
        }/>
        <Route path="/usuario/ordenes" element={
          <ProtectedRoute>
            <UserLayout {...userLayoutProps}>
              <ListaOrdenesUsuario orders={completedOrders} />
            </UserLayout>
          </ProtectedRoute>
        }/>
        <Route path="/usuario/ordenes/:orderId" element={
          <ProtectedRoute>
            <UserLayout {...userLayoutProps}>
              <DetalleOrdenUsuario />
            </UserLayout>
          </ProtectedRoute>
        }/>
        <Route path="/usuario/datos" element={
          <ProtectedRoute>
            <UserLayout {...userLayoutProps}>
              <DatosUsuario />
            </UserLayout>
          </ProtectedRoute>
        }/>
        <Route path="/usuario/cambiar-contrasena" element={
          <ProtectedRoute>
            <UserLayout {...userLayoutProps}>
              <CambiarContrasena />
            </UserLayout>
          </ProtectedRoute>
        }/>

        {/* Rutas protegidas para administradores */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><DashboardAdmin /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><DashboardAdmin /></ProtectedRoute>} />
        <Route path="/admin/categorias" element={<ProtectedRoute requireAdmin><ListadoCategoriasAdmin /></ProtectedRoute>} />
        <Route path="/admin/categorias/nueva" element={<ProtectedRoute requireAdmin><AgregarCategoriaAdmin /></ProtectedRoute>} />
        <Route path="/admin/ordenes" element={<ProtectedRoute requireAdmin><ListaOrdenesAdmin allOrders={completedOrders} updateOrderStatus={updateOrderStatus} /></ProtectedRoute>}/> 
        <Route path="/admin/productos" element={<ProtectedRoute requireAdmin><ListaProductos /></ProtectedRoute>} />
        <Route path="/admin/productos/nuevo" element={<ProtectedRoute requireAdmin><AgregarproductoAdmi /></ProtectedRoute>} />
        <Route path="/admin/productos/editar" element={<ProtectedRoute requireAdmin><AgregarproductoAdmi /></ProtectedRoute>} />
        <Route path="/admin/ordenes2" element={<ProtectedRoute requireAdmin><ListaOrdenes2 /></ProtectedRoute>} /> 
        <Route path="/admin/usuarios/:id" element={<ProtectedRoute requireAdmin><DetalleUsuario /></ProtectedRoute>} />
        <Route path="/admin/ListaUsuario" element={<ProtectedRoute requireAdmin><ListaUsuarios /></ProtectedRoute>} /> 

        {/* Ruta 404 */}
        <Route path="*" element={
          <UserLayout {...userLayoutProps}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h2>Página no encontrada (404)</h2>
              <p>Lo sentimos, la página que buscas no existe.</p>
              <RouterLink to="/" style={{ color: '#007bff', textDecoration: 'underline' }}>
                Volver a la página de inicio
              </RouterLink>
            </div>
          </UserLayout>
        }/>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
