const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Validaciones
const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('username').optional().isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),
  body('first_name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('last_name').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('role_id').optional().isInt({ min: 1 }).withMessage('Rol inválido')
];

// --- RUTAS ESPECÍFICAS Y ESTÁTICAS (deben ir PRIMERO) ---

// GET /api/users/stats/summary - Obtener estadísticas de usuarios generales
router.get('/stats/summary', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE last_login >= CURRENT_DATE - INTERVAL '30 days') as active_last_30_days,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_last_30_days
      FROM users
    `;

    const roleStatsQuery = `
      SELECT 
        r.name as role_name,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = true
      GROUP BY r.id, r.name
      ORDER BY user_count DESC
    `;

    const [statsResult, roleStatsResult] = await Promise.all([
      query(statsQuery),
      query(roleStatsQuery)
    ]);

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        roleDistribution: roleStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/users/my-preferences - Obtener preferencias del usuario autenticado
router.get('/my-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const preferencesResult = await query(
      `SELECT settings FROM user_preferences WHERE user_id = $1`, 
      [userId]
    );

    if (preferencesResult.rows.length === 0) {
      return res.json({ success: true, data: { preferences: {} }, message: 'Preferencias no encontradas para este usuario.' });
    }

    res.json({
      success: true,
      data: {
        preferences: preferencesResult.rows[0].settings
      }
    });
  } catch (error) {
    console.error('Error obteniendo preferencias del usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al obtener preferencias.' });
  }
});

// GET /api/users/my-activities - Obtener actividades del usuario autenticado
router.get('/my-activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activitiesResult = await query(
      `SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, 
      [userId]
    );

    res.json({
      success: true,
      data: {
        activities: activitiesResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo actividades del usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al obtener actividades.' });
  }
});

// --- RUTAS PRINCIPALES DE GESTIÓN DE USUARIOS ---

// GET /api/users - Obtener lista de usuarios con filtros y paginación
router.get('/', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereClause += ` AND r.name = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status) {
      const isActive = status === 'active';
      whereClause += ` AND u.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    const usersQuery = `
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.is_active, u.last_login, u.created_at, u.updated_at,
        r.id as role_id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `;

    const [usersResult, countResult] = await Promise.all([
      query(usersQuery, params),
      query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/users - Crear nuevo usuario
router.post('/', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const { username, first_name, last_name, email, role_id, is_active, password } = req.body;

    // Validaciones básicas
    if (!username || !first_name || !last_name || !email || !role_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: username, first_name, last_name, email, role_id, password'
      });
    }

    // Verificar si el email o username ya existen
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email o nombre de usuario ya está en uso'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Usa un nombre de variable diferente para la consulta SQL
    const insertUserQuery = `
      INSERT INTO users (username, first_name, last_name, email, role_id, is_active, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, username, first_name, last_name, email, role_id, is_active, created_at, updated_at
    `;
    
    const values = [username, first_name, last_name, email, role_id, is_active || true, hashedPassword];

    const result = await query(insertUserQuery, values);

    // Log de la creación de usuario
    await logActivity(
      req.user.id,
      'CREATE',
      'users',
      result.rows[0].id,
      null,
      result.rows[0],
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- RUTAS CON PARÁMETROS DINÁMICOS (deben ir DESPUÉS de las estáticas) ---

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    const userIdInt = parseInt(id, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido. Debe ser un número.'
      });
    }

    const userResult = await query(
      `SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, u.is_active, u.last_login, u.created_at, u.updated_at,
        r.id as role_id, r.name as role_name, r.permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1`,
      [userIdInt]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: userResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, requireRole(['Administrador del CRM']), updateUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { email, username, first_name, last_name, role_id, is_active } = req.body;

    const userIdInt = parseInt(id, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido para actualización.'
      });
    }

    const currentUserResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userIdInt]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const currentUser = currentUserResult.rows[0];

    // Verificar si el email o username ya existen (excluyendo el usuario actual)
    if (email || username) {
      const existingUserResult = await query(
        'SELECT id FROM users WHERE (email = $1 OR username = $2) AND id != $3',
        [email || currentUser.email, username || currentUser.username, userIdInt]
      );

      if (existingUserResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email o nombre de usuario ya existe'
        });
      }
    }

    if (role_id) {
      const roleResult = await query('SELECT id FROM roles WHERE id = $1', [role_id]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (email !== undefined) { updateFields.push(`email = $${paramIndex}`); updateValues.push(email); paramIndex++; }
    if (username !== undefined) { updateFields.push(`username = $${paramIndex}`); updateValues.push(username); paramIndex++; }
    if (first_name !== undefined) { updateFields.push(`first_name = $${paramIndex}`); updateValues.push(first_name); paramIndex++; }
    if (last_name !== undefined) { updateFields.push(`last_name = $${paramIndex}`); updateValues.push(last_name); paramIndex++; }
    if (role_id !== undefined) { updateFields.push(`role_id = $${paramIndex}`); updateValues.push(role_id); paramIndex++; }
    if (is_active !== undefined) { updateFields.push(`is_active = $${paramIndex}`); updateValues.push(is_active); paramIndex++; }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(userIdInt); 

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, first_name, last_name, role_id, is_active, updated_at
    `;

    const updatedUserResult = await query(updateQuery, updateValues);
    const updatedUser = updatedUserResult.rows[0];

    await logActivity(
      req.user.id, 
      'UPDATE', 
      'users', 
      userIdInt, 
      currentUser, 
      updatedUser, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario (soft delete)
router.delete('/:id', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const { id } = req.params;

    const userIdInt = parseInt(id, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido para eliminación.'
      });
    }

    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userIdInt]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];

    if (userIdInt === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userIdInt]
    );

    await logActivity(
      req.user.id, 
      'DELETE', 
      'users', 
      userIdInt, 
      user, 
      { is_active: false }, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/users/:id/activate - Reactivar usuario
router.put('/:id/activate', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const { id } = req.params;

    const userIdInt = parseInt(id, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido para activación.'
      });
    }

    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userIdInt]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];

    await query(
      'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userIdInt]
    );

    await logActivity(
      req.user.id, 
      'ACTIVATE', 
      'users', 
      userIdInt, 
      { is_active: user.is_active }, 
      { is_active: true }, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Usuario activado exitosamente'
    });
  } catch (error) {
    console.error('Error activando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;