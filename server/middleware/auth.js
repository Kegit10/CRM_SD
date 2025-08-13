const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { logActivity } = require('../utils/logger');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información del usuario desde la base de datos
    const userResult = await query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND u.is_active = true`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado o inactivo' 
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    const userRole = req.user.role_name;
    
    if (!allowedRoles.includes(userRole)) {
      logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', 'system', null, {
        attempted_action: req.method + ' ' + req.path,
        user_role: userRole,
        required_roles: allowedRoles
      }, null, req.ip, req.get('User-Agent'));
      
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    const permissions = req.user.permissions;
    
    // Si tiene permisos de administrador completo
    if (permissions.all) {
      return next();
    }

    // Verificar permiso específico
    if (!permissions[permission]) {
      logActivity(req.user.id, 'UNAUTHORIZED_ACCESS', 'system', null, {
        attempted_action: req.method + ' ' + req.path,
        required_permission: permission,
        user_permissions: permissions
      }, null, req.ip, req.get('User-Agent'));
      
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

// Middleware para verificar si el usuario puede acceder a recursos específicos
const requireOwnershipOrRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    const userRole = req.user.role_name;
    const userId = req.user.id;
    
    // Si tiene rol permitido, puede acceder
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Si es comercial, solo puede acceder a sus propios recursos
    if (userRole === 'Comercial') {
      // Verificar ownership basado en el tipo de recurso
      const resourceId = req.params.id;
      const resourceType = req.baseUrl.split('/').pop(); // contacts, deals, activities, etc.
      
      try {
        let ownershipQuery;
        switch (resourceType) {
          case 'contacts':
            ownershipQuery = 'SELECT assigned_to FROM contacts WHERE id = $1';
            break;
          case 'deals':
            ownershipQuery = 'SELECT assigned_to FROM deals WHERE id = $1';
            break;
          case 'activities':
            ownershipQuery = 'SELECT assigned_to FROM activities WHERE id = $1';
            break;
          default:
            return res.status(403).json({ 
              success: false, 
              message: 'Acceso denegado' 
            });
        }

        const result = await query(ownershipQuery, [resourceId]);
        
        if (result.rows.length === 0 || result.rows[0].assigned_to !== userId) {
          return res.status(403).json({ 
            success: false, 
            message: 'No tienes permisos para acceder a este recurso' 
          });
        }
      } catch (error) {
        console.error('Error verificando ownership:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error interno del servidor' 
        });
      }
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireOwnershipOrRole
};