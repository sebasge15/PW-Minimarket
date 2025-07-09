const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../models');

// Ruta de registro
router.post('/register', async (req, res) => {
  try {
    const { nombre, apellido, email, dni, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !apellido || !email || !dni || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email no es válido'
      });
    }

    // Validar longitud de la contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar DNI (solo números y longitud apropiada)
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe tener 8 dígitos'
      });
    }

    // Verificar si el email ya existe
    const existingUserByEmail = await db.user.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Verificar si el DNI ya existe
    const existingUserByDni = await db.user.findOne({
      where: { dni }
    });

    if (existingUserByDni) {
      return res.status(400).json({
        success: false,
        message: 'El DNI ya está registrado'
      });
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const newUser = await db.user.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      dni: dni.trim(),
      password: hashedPassword,
      role: 'user'
    });

    // Responder sin incluir la contraseña
    const { password: _, ...userResponse } = newUser.toJSON();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('Error en el registro:', error);

    // Manejar errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        details: error.errors.map(err => err.message)
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'El email o DNI ya están registrados'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Intento de login para: ${email}`);

    // Validar que se envíen email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario por email
    const user = await db.user.findOne({
      where: {
        email: email.toLowerCase().trim()
      }
    });

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas o usuario inexistente'
      });
    }

    // ✅ VERIFICAR SI EL USUARIO ESTÁ ACTIVO
    if (!user.is_active) {
      console.log(`🚫 Usuario desactivado intentó login: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log(`❌ Contraseña incorrecta para: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    console.log(`✅ Login exitoso para: ${email} (${user.role})`);

    // Respuesta exitosa (sin enviar la contraseña)
    const { password: _, ...userResponse } = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Ruta para obtener todos los usuarios (solo para admin)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Obteniendo todos los usuarios...');
    
    const users = await db.user.findAll({
      attributes: ['id', 'nombre', 'apellido', 'email', 'dni', 'role', 'is_active', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ ${users.length} usuarios encontrados`);

    res.status(200).json({
      success: true,
      users: users
    });

  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

// Ruta para obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Obteniendo usuario con ID: ${id}`);

    const user = await db.user.findByPk(id, {
      attributes: ['id', 'nombre', 'apellido', 'email', 'dni', 'role', 'is_active', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log(`✅ Usuario encontrado: ${user.nombre} ${user.apellido}`);

    res.status(200).json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
});

// Ruta para actualizar un usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, dni, role } = req.body;

    const user = await db.user.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el nuevo email ya existe (excluyendo el usuario actual)
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await db.user.findOne({
        where: { 
          email: email.toLowerCase(),
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        });
      }
    }

    // Verificar si el nuevo DNI ya existe (excluyendo el usuario actual)
    if (dni && dni !== user.dni) {
      const existingUser = await db.user.findOne({
        where: { 
          dni,
          id: { [db.Sequelize.Op.ne]: id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El DNI ya está en uso por otro usuario'
        });
      }
    }

    // Actualizar usuario
    await user.update({
      nombre: nombre || user.nombre,
      apellido: apellido || user.apellido,
      email: email ? email.toLowerCase() : user.email,
      dni: dni || user.dni,
      role: role || user.role
    });

    // Responder sin incluir la contraseña
    const { password: _, ...userResponse } = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para cambiar contraseña
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual y nueva son obligatorias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await db.user.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await user.update({ password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para eliminar un usuario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.user.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
  
});

// ✅ AGREGAR ESTAS RUTAS ANTES DEL module.exports = router;

// Ruta para desactivar usuario (soft delete)
router.put('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🚫 Desactivando usuario con ID: ${id}`);

    const user = await db.user.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya está desactivado'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No se puede desactivar un usuario administrador'
      });
    }

    await user.update({ is_active: false });

    console.log(`✅ Usuario ${user.nombre} ${user.apellido} desactivado`);

    const { password: _, ...userResponse } = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Error al desactivar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar usuario',
      error: error.message
    });
  }
});

// Ruta para reactivar usuario
router.put('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Reactivando usuario con ID: ${id}`);

    const user = await db.user.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (user.is_active) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya está activo'
      });
    }

    await user.update({ is_active: true });

    console.log(`✅ Usuario ${user.nombre} ${user.apellido} reactivado`);

    const { password: _, ...userResponse } = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Usuario reactivado exitosamente',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Error al reactivar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al reactivar usuario',
      error: error.message
    });
  }
});

module.exports = router;