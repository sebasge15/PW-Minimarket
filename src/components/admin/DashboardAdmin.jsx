import React, { useState, useEffect } from 'react';
import LayoutAdmin from './LayoutAdmin.jsx';
import './dashboardAdmin.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    newUsers: 0,
    totalRevenue: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "/";
    return null;
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando datos del dashboard...');

      // Obtener estadísticas generales
      try {
        const statsResponse = await fetch('http://localhost:3001/api/admin/stats');
        const statsData = await statsResponse.json();
        
        console.log('📊 Respuesta de estadísticas:', statsData);
        
        if (statsData.success) {
          setStats(statsData.stats);
          console.log('✅ Estadísticas cargadas:', statsData.stats);
        } else {
          console.warn('⚠️ Error en estadísticas:', statsData.message);
        }
      } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
      }

      // Obtener usuarios recientes
      try {
        const usersResponse = await fetch('http://localhost:3001/api/admin/users/recent');
        const usersData = await usersResponse.json();
        
        console.log('👥 Respuesta de usuarios:', usersData);
        
        if (usersData.success) {
          setRecentUsers(usersData.users);
          if (usersData.users.length > 0) {
            setUsuarioSeleccionado(usersData.users[0]);
          }
          console.log('✅ Usuarios cargados:', usersData.users.length);
          
          // Debug: mostrar estructura de usuarios
          if (usersData.debug) {
            console.log('🔍 DEBUG Usuarios - Columnas disponibles:', usersData.debug.columns);
            console.log('🔍 DEBUG Usuarios - Estructura muestra:', usersData.debug.sampleStructure);
          }
        } else {
          console.warn('⚠️ Error en usuarios:', usersData.message);
        }
      } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
      }

      // Obtener órdenes recientes
      try {
        const ordersResponse = await fetch('http://localhost:3001/api/admin/orders/recent');
        const ordersData = await ordersResponse.json();
        
        console.log('📋 Respuesta de órdenes:', ordersData);
        
        if (ordersData.success) {
          setRecentOrders(ordersData.orders);
          console.log('✅ Órdenes cargadas:', ordersData.orders.length);
          
          // Debug: mostrar estructura de órdenes
          if (ordersData.debug) {
            console.log('🔍 DEBUG Órdenes - Columnas disponibles:', ordersData.debug.columns);
            console.log('🔍 DEBUG Órdenes - Estructura muestra:', ordersData.debug.sampleStructure);
          }
        } else {
          console.warn('⚠️ Error en órdenes:', ordersData.message);
        }
      } catch (error) {
        console.error('❌ Error al obtener órdenes:', error);
      }

      console.log('✅ Proceso de carga del dashboard completado');

    } catch (error) {
      console.error('❌ Error general al cargar dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <LayoutAdmin />
        <div className="admin-dashboard dashboard-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div className="loading-spinner"></div>
            <h2>Cargando dashboard...</h2>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <LayoutAdmin />
        <div className="admin-dashboard dashboard-container">
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="btn">
              Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LayoutAdmin />
      <div className="admin-dashboard dashboard-container">
        <h1>📊 Panel de Administración</h1>

        {/* Métricas principales */}
        <div className="metric-cards">
          <div className="metric-card">
            <h3>Órdenes</h3>
            <span>{stats.totalOrders}</span>
          </div>
          <div className="metric-card">
            <h3>Usuarios nuevos</h3>
            <span>{stats.newUsers}</span>
          </div>
          <div className="metric-card">
            <h3>Ingresos totales</h3>
            <span>S/ {stats.totalRevenue?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Panel principal */}
        <div className="panel-flex">
          {/* Usuarios registrados - VERSIÓN CORREGIDA */}
          <div className="panel-left table-card">
            <div className="tabla-header">
              <h2>👥 Usuarios registrados ({recentUsers.length})</h2>
              <button className="btn" onClick={() => window.location.href = '/admin/ListaUsuario'}>
                📋 Ver todos los usuarios
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.nombre}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>{user.email}</span>
                      </td>
                      <td>
                        <span className={`role ${user.role}`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                        </span>
                      </td>
                      <td>
                        {/* ✅ MOSTRAR ESTADO REAL BASADO EN is_active */}
                        <span className={user.is_active ? 'activo' : 'inactivo'}>
                          {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            onClick={() => setUsuarioSeleccionado(user)} 
                            className="btn-small primary"
                            title="Ver detalle"
                          >
                            👁️ Ver
                          </button>
                          {user.is_active ? (
                            <button 
                              className="btn-small danger"
                              onClick={() => desactivarUsuario(user.id)}
                              disabled={user.role === 'admin'}
                              title={user.role === 'admin' ? 'No se puede desactivar admin' : 'Desactivar usuario'}
                            >
                              🚫
                            </button>
                          ) : (
                            <button 
                              className="btn-small success"
                              onClick={() => reactivarUsuario(user.id)}
                              title="Reactivar usuario"
                            >
                              ✅
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No hay usuarios recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detalle del usuario */}
          <div className="panel-right user-detail">
            <h2>Detalle del usuario</h2>
            {usuarioSeleccionado ? (
              <>
                <div className="user-avatar">
                  {usuarioSeleccionado.foto ? (
                    <img src={usuarioSeleccionado.foto} alt="Perfil" />
                  ) : (
                    <div className="default-avatar">
                      {usuarioSeleccionado.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <p><strong>Nombre:</strong> {usuarioSeleccionado.nombre}</p>
                <p><strong>Email:</strong> {usuarioSeleccionado.email}</p>
                <p><strong>Rol:</strong> {usuarioSeleccionado.role || 'user'}</p>
                <p><strong>Fecha de registro:</strong> {
                  new Date(usuarioSeleccionado.created_at).toLocaleDateString('es-ES')
                }</p>
                <p><strong>Estado:</strong> {usuarioSeleccionado.is_active ? 'Activo' : 'Inactivo'}</p>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Selecciona un usuario para ver sus detalles
              </p>
            )}
          </div>
        </div>

        {/* Listado de órdenes */}
        <div className="table-card">
          <div className="tabla-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Listado de órdenes</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" onClick={() => window.location.href = '/admin/productos'}>
                📦 Ver productos
              </button>
              <button className="btn" onClick={() => window.location.href = '/admin/ordenes2'}>
                📋 Ver todas las órdenes
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="id">#{order.id}</td>
                    <td>{order.user_name || order.usuario || 'Usuario desconocido'}</td>
                    <td>{new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                    <td>S/ {parseFloat(order.total || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status ${order.status?.toLowerCase() || 'pendiente'}`}>
                        {order.status || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No hay órdenes recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
