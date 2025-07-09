import React, { useState, useEffect } from 'react';
import LayoutAdmin from './LayoutAdmin.jsx';
import './ListaOrdenes2.css';

const ListaOrdenes2 = () => {
  const [filtro, setFiltro] = useState('');
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordenDetalle, setOrdenDetalle] = useState(null);

  // Verificar autenticación de admin
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "/";
    return null;
  }

  // Cargar órdenes al montar el componente
  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Cargando órdenes...');
      
      const response = await fetch('http://localhost:3001/api/orders');
      const data = await response.json();
      
      console.log('📦 Respuesta de órdenes:', data);
      
      if (data.success) {
        setOrdenes(data.orders);
        console.log(`✅ ${data.orders.length} órdenes cargadas`);
      } else {
        setError('Error al cargar órdenes: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error al cargar órdenes:', error);
      setError('Error de conexión al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoOrden = async (orderId, nuevoEstado) => {
    try {
      console.log(`🔄 Actualizando orden ${orderId} a ${nuevoEstado}`);
      
      // ✅ USAR LA MISMA URL BASE
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nuevoEstado
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local
        setOrdenes(ordenes.map(o =>
          o.id === orderId ? { ...o, status: nuevoEstado } : o
        ));
        
        // Si es la orden que estamos viendo en detalle, actualizar también
        if (ordenDetalle?.id === orderId) {
          setOrdenDetalle({ ...ordenDetalle, status: nuevoEstado });
        }
        
        console.log('✅ Estado actualizado exitosamente');
        alert(`Orden ${nuevoEstado.toLowerCase()} exitosamente`);
      } else {
        alert('Error al actualizar orden: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error al actualizar orden:', error);
      alert('Error de conexión al actualizar orden');
    }
  };

  const cancelarOrden = (id) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta orden?')) {
      actualizarEstadoOrden(id, 'Cancelada');
    }
  };

  const procesarOrden = (id) => {
    if (confirm('¿Marcar esta orden como procesada?')) {
      actualizarEstadoOrden(id, 'Completada');
    }
  };

  const ordenesFiltradas = ordenes.filter((orden) => {
    const termino = filtro.toLowerCase();
    const nombreCliente = `${orden.clientName || ''} ${orden.client_name || ''}`.toLowerCase();
    const emailCliente = (orden.clientEmail || orden.client_email || '').toLowerCase();
    
    return (
      orden.id.toLowerCase().includes(termino) ||
      nombreCliente.includes(termino) ||
      emailCliente.includes(termino) ||
      (orden.user?.nombre && `${orden.user.nombre} ${orden.user.apellido}`.toLowerCase().includes(termino))
    );
  });

  const getEstadoClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completada':
      case 'entregada':
        return 'estado-completado';
      case 'cancelada':
        return 'estado-cancelado';
      case 'procesando':
        return 'estado-procesando';
      default:
        return 'estado-activo';
    }
  };

  const getEstadoTexto = (status) => {
    switch (status?.toLowerCase()) {
      case 'completada':
        return '✅ Completada';
      case 'entregada':
        return '📦 Entregada';
      case 'cancelada':
        return '❌ Cancelada';
      case 'procesando':
        return '⏳ Procesando';
      default:
        return '🔄 Pendiente';
    }
  };

  if (loading) {
    return (
      <>
        <LayoutAdmin />
        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>🔄 Cargando órdenes...</h2>
            <p>Por favor espera mientras cargamos las órdenes</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <LayoutAdmin />
        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            <h2>❌ Error</h2>
            <p>{error}</p>
            <button onClick={fetchOrdenes} className="btn">
              🔄 Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }

  if (ordenDetalle) {
    return (
      <>
        <LayoutAdmin />
        <div className="dashboard-container">
          <div className="table-card">
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => setOrdenDetalle(null)}
                className="btn"
                style={{ background: '#6c757d', color: 'white', marginBottom: '15px' }}
              >
                ← Volver al listado
              </button>
              <h2>📦 Detalle de la Orden</h2>
            </div>
            
            <div className="orden-detalle">
              <div className="detalle-info">
                <h3>📋 Información de la Orden</h3>
                <p><strong>ID:</strong> {ordenDetalle.id}</p>
                <p><strong>Cliente:</strong> {ordenDetalle.clientName || ordenDetalle.client_name}</p>
                <p><strong>Email:</strong> {ordenDetalle.clientEmail || ordenDetalle.client_email}</p>
                <p><strong>Teléfono:</strong> {ordenDetalle.clientPhone || ordenDetalle.client_phone}</p>
                <p><strong>Dirección:</strong> {ordenDetalle.shippingAddress || ordenDetalle.shipping_address}</p>
                <p><strong>Fecha:</strong> {new Date(ordenDetalle.createdAt || ordenDetalle.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><strong>Total:</strong> S/ {parseFloat(ordenDetalle.totalAmount || ordenDetalle.total_amount || 0).toFixed(2)}</p>
                <p><strong>Método de pago:</strong> {ordenDetalle.paymentMethod || ordenDetalle.payment_method || 'No especificado'}</p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={getEstadoClass(ordenDetalle.status)}>
                    {getEstadoTexto(ordenDetalle.status)}
                  </span>
                </p>
              </div>

              {ordenDetalle.items && ordenDetalle.items.length > 0 && (
                <div className="detalle-productos">
                  <h3>🛒 Productos en la Orden</h3>
                  <div className="productos-grid">
                    {ordenDetalle.items.map((item, index) => (
                      <div key={index} className="producto-item">
                        <div className="producto-info">
                          <h4>{item.product?.name || item.product_name || 'Producto sin nombre'}</h4>
                          <p><strong>Cantidad:</strong> {item.quantity}</p>
                          <p><strong>Precio unitario:</strong> S/ {parseFloat(item.price || 0).toFixed(2)}</p>
                          <p><strong>Subtotal:</strong> S/ {(parseFloat(item.price || 0) * parseInt(item.quantity || 0)).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detalle-acciones">
                <h3>🔧 Acciones</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {ordenDetalle.status?.toLowerCase() !== 'cancelada' && ordenDetalle.status?.toLowerCase() !== 'completada' && (
                    <>
                      <button
                        onClick={() => procesarOrden(ordenDetalle.id)}
                        className="btn"
                        style={{ background: '#28a745', color: 'white' }}
                      >
                        ✅ Marcar como Completada
                      </button>
                      <button
                        onClick={() => cancelarOrden(ordenDetalle.id)}
                        className="btn"
                        style={{ background: '#dc3545', color: 'white' }}
                      >
                        ❌ Cancelar Orden
                      </button>
                    </>
                  )}
                  {ordenDetalle.status?.toLowerCase() === 'cancelada' && (
                    <button
                      onClick={() => actualizarEstadoOrden(ordenDetalle.id, 'Procesando')}
                      className="btn"
                      style={{ background: '#007bff', color: 'white' }}
                    >
                      🔄 Reactivar Orden
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <LayoutAdmin />
      <div className="dashboard-container">
        <div className="table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>📦 Listado de Órdenes ({ordenes.length})</h2>
            <button onClick={fetchOrdenes} className="btn" style={{ background: '#28a745', color: 'white' }}>
              🔄 Actualizar
            </button>
          </div>
          
          <input
            type="text"
            placeholder="🔍 Buscar por ID, cliente, email..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ 
              marginBottom: '1rem', 
              padding: '12px', 
              width: '100%',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div><strong>📊 Total órdenes:</strong> {ordenes.length}</div>
              <div><strong>⏳ Procesando:</strong> {ordenes.filter(o => o.status?.toLowerCase() === 'procesando').length}</div>
              <div><strong>✅ Completadas:</strong> {ordenes.filter(o => o.status?.toLowerCase() === 'completada').length}</div>
              <div><strong>❌ Canceladas:</strong> {ordenes.filter(o => o.status?.toLowerCase() === 'cancelada').length}</div>
            </div>
          </div>
          
          {ordenesFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>📦 No se encontraron órdenes</h3>
              <p>{filtro ? 'Prueba con otros términos de búsqueda' : 'No hay órdenes registradas'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tabla-ordenes">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Fecha</th>
                    <th>Total (S/)</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesFiltradas.map((orden) => (
                    <tr key={orden.id}>
                      <td>
                        <strong>{orden.id}</strong>
                      </td>
                      <td>
                        {orden.user ? (
                          <div>
                            <strong>{orden.user.nombre} {orden.user.apellido}</strong>
                            <br />
                            <small style={{ color: '#666' }}>Usuario registrado</small>
                          </div>
                        ) : (
                          <div>
                            <strong>{orden.clientName || orden.client_name}</strong>
                            <br />
                            <small style={{ color: '#666' }}>Cliente invitado</small>
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: '#666' }}>
                          {orden.clientEmail || orden.client_email || (orden.user?.email)}
                        </span>
                      </td>
                      <td>
                        {new Date(orden.createdAt || orden.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td>
                        <strong>S/ {parseFloat(orden.totalAmount || orden.total_amount || 0).toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={getEstadoClass(orden.status)}>
                          {getEstadoTexto(orden.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setOrdenDetalle(orden)}
                            className="btn-tabla primary"
                          >
                            👁️ Ver Detalle
                          </button>
                          {orden.status?.toLowerCase() !== 'cancelada' && orden.status?.toLowerCase() !== 'completada' && (
                            <>
                              <button
                                onClick={() => procesarOrden(orden.id)}
                                className="btn-tabla success"
                                title="Marcar como completada"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => cancelarOrden(orden.id)}
                                className="btn-tabla danger"
                                title="Cancelar orden"
                              >
                                ❌
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ListaOrdenes2;
