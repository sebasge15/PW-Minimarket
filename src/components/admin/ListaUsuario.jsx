import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LayoutAdmin from './LayoutAdmin.jsx';
import './ListaUsuarios.css';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticación de admin
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "/";
    return null;
  }

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Cargando usuarios...');
      
      const response = await fetch('http://localhost:3001/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.users);
        console.log(`✅ ${data.users.length} usuarios cargados`);
      } else {
        setError('Error al cargar usuarios: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const desactivarUsuario = async (id) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      return;
    }

    try {
      console.log(`🚫 Desactivando usuario ID: ${id}`);
      
      const response = await fetch(`http://localhost:3001/api/users/${id}/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local
        setUsuarios(usuarios.map(u =>
          u.id === id ? { ...u, is_active: false } : u
        ));
        console.log('✅ Usuario desactivado exitosamente');
        alert('Usuario desactivado exitosamente');
      } else {
        alert('Error al desactivar usuario: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error al desactivar usuario:', error);
      alert('Error de conexión al desactivar usuario');
    }
  };

  const reactivarUsuario = async (id) => {
    if (!confirm('¿Estás seguro de que quieres reactivar este usuario?')) {
      return;
    }

    try {
      console.log(`✅ Reactivando usuario ID: ${id}`);
      
      const response = await fetch(`http://localhost:3001/api/users/${id}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local
        setUsuarios(usuarios.map(u =>
          u.id === id ? { ...u, is_active: true } : u
        ));
        console.log('✅ Usuario reactivado exitosamente');
        alert('Usuario reactivado exitosamente');
      } else {
        alert('Error al reactivar usuario: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error al reactivar usuario:', error);
      alert('Error de conexión al reactivar usuario');
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.id.toString().includes(filtro.toLowerCase()) ||
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.apellido.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase()) ||
    u.dni.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <LayoutAdmin />
        <div className="dashboard-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h2>🔄 Cargando usuarios...</h2>
            <p>Por favor espera mientras cargamos la información</p>
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
            <button onClick={fetchUsuarios} className="btn">
              🔄 Reintentar
            </button>
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
            <h2>📋 Lista de Usuarios ({usuarios.length})</h2>
            <button onClick={fetchUsuarios} className="btn" style={{ background: '#28a745', color: 'white' }}>
              🔄 Actualizar
            </button>
          </div>
          
          <input
            type="text"
            placeholder="🔍 Buscar por ID, nombre, apellido, email o DNI"
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
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
              <div>
                <strong>📊 Total usuarios:</strong> {usuarios.length}
              </div>
              <div>
                <strong>✅ Activos:</strong> {usuarios.filter(u => u.is_active).length}
              </div>
              <div>
                <strong>❌ Inactivos:</strong> {usuarios.filter(u => !u.is_active).length}
              </div>
              <div>
                <strong>👑 Administradores:</strong> {usuarios.filter(u => u.role === 'admin').length}
              </div>
            </div>
          </div>
          
          {usuariosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>🔍 No se encontraron usuarios</h3>
              <p>{filtro ? 'Prueba con otros términos de búsqueda' : 'No hay usuarios registrados'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Email</th>
                    <th>DNI</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id}>
                      <td>
                        <strong>#{usuario.id}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{usuario.nombre} {usuario.apellido}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#666' }}>{usuario.email}</span>
                      </td>
                      <td>
                        {usuario.dni}
                      </td>
                      <td>
                        <span className={`role ${usuario.role}`}>
                          {usuario.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                        </span>
                      </td>
                      <td>
                        <span className={usuario.is_active ? 'activo' : 'inactivo'}>
                          {usuario.is_active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                      <td>
                        {new Date(usuario.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {usuario.is_active ? (
                            <button
                              className="btn-tabla danger"
                              onClick={() => desactivarUsuario(usuario.id)}
                              disabled={usuario.role === 'admin' || usuario.id === currentUser.id}
                              title={
                                usuario.role === 'admin' 
                                  ? 'No se puede desactivar un admin' 
                                  : usuario.id === currentUser.id
                                  ? 'No puedes desactivarte a ti mismo'
                                  : 'Desactivar usuario'
                              }
                            >
                              🚫 Desactivar
                            </button>
                          ) : (
                            <button
                              className="btn-tabla success"
                              onClick={() => reactivarUsuario(usuario.id)}
                              title="Reactivar usuario"
                            >
                              ✅ Reactivar
                            </button>
                          )}
                          
                          <Link 
                            to={`/admin/usuarios/${usuario.id}`} 
                            className="btn-tabla primary"
                            title="Ver detalles del usuario"
                          >
                            👁️ Ver
                          </Link>
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

export default ListaUsuarios;
