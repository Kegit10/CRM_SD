const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Validaciones
const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('username').isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('first_name').notEmpty().withMessage('El nombre es requerido'),
  body('last_name').notEmpty().withMessage('El apellido es requerido'),
  body('role_id').isInt({ min: 1 }).withMessage('Rol inválido')
];

// POST /api/auth/login - Iniciar sesión
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const userResult = await query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      await logActivity(null, 'LOGIN_FAILED', 'users', null, null, { email, reason: 'user_not_found' }, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = userResult.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      await logActivity(user.id, 'LOGIN_FAILED', 'users', user.id, null, { reason: 'user_inactive' }, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await logActivity(user.id, 'LOGIN_FAILED', 'users', user.id, null, { reason: 'invalid_password' }, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Log successful login
    await logActivity(user.id, 'LOGIN_SUCCESS', 'users', user.id, null, null, req.ip, req.get('User-Agent'));

    // Remover información sensible
    const { password_hash, ...userInfo } = user;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/register - Registrar nuevo usuario (solo administradores)
router.post('/register', authenticateToken, requireRole(['Administrador del CRM']), registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { email, password, username, first_name, last_name, role_id } = req.body;

    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email o nombre de usuario ya existe'
      });
    }

    // Verificar que el rol existe
    const roleResult = await query('SELECT id FROM roles WHERE id = $1', [role_id]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const newUserResult = await query(
      `INSERT INTO users (email, password_hash, username, first_name, last_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, first_name, last_name, role_id, is_active, created_at`,
      [email, password_hash, username, first_name, last_name, role_id]
    );

    const newUser = newUserResult.rows[0];

    // Log user creation
    await logActivity(req.user.id, 'CREATE', 'users', newUser.id, null, newUser, req.ip, req.get('User-Agent'));

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: newUser
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { password_hash, ...userInfo } = req.user;
    
    res.json({
      success: true,
      data: {
        user: userInfo
      }
    });
  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log logout
    await logActivity(req.user.id, 'LOGOUT', 'users', req.user.id, null, null, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Obtener contraseña actual
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      await logActivity(userId, 'PASSWORD_CHANGE_FAILED', 'users', userId, null, { reason: 'invalid_current_password' }, req.ip, req.get('User-Agent'));
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Log password change
    await logActivity(userId, 'PASSWORD_CHANGED', 'users', userId, null, null, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/verify-token - Verificar si el token es válido
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    data: {
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role_name
      }
    }
  });
});

module.exports = router;