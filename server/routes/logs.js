const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getLogs, exportLogsToCSV, cleanOldLogs, getActivityStats } = require('../utils/logger');

const router = express.Router();

// GET /api/logs - Obtener logs del sistema (solo administradores)
router.get('/', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action = '',
      table_name = '',
      user_id = '',
      start_date = '',
      end_date = '',
      ip_address = ''
    } = req.query;

    const filters = {
      action: action || null,
      table_name: table_name || null,
      user_id: user_id || null,
      start_date: start_date || null,
      end_date: end_date || null,
      ip_address: ip_address || null
    };

    const result = await getLogs(parseInt(page), parseInt(limit), filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/logs/export - Exportar logs a CSV (solo administradores)
router.get('/export', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const {
      action = '',
      table_name = '',
      user_id = '',
      start_date = '',
      end_date = '',
      ip_address = ''
    } = req.query;

    const filters = {
      action: action || null,
      table_name: table_name || null,
      user_id: user_id || null,
      start_date: start_date || null,
      end_date: end_date || null,
      ip_address: ip_address || null
    };

    const csvContent = await exportLogsToCSV(filters);
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `system_logs_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exportando logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/logs/stats - Obtener estadísticas de actividad del sistema
router.get('/stats', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const stats = await getActivityStats(parseInt(period));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/logs/recent - Obtener actividad reciente del sistema
router.get('/recent', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentLogsResult = await query(
      `SELECT 
        sl.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
      LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: {
        recentActivity: recentLogsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/logs/user/:userId - Obtener logs de un usuario específico
router.get('/user/:userId', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, period = '30' } = req.query;

    const offset = (page - 1) * limit;

    // Verificar que el usuario existe
    const userResult = await query('SELECT id, first_name, last_name, email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];

    // Obtener logs del usuario
    const logsQuery = `
      SELECT *
      FROM system_logs
      WHERE user_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM system_logs
      WHERE user_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    `;

    const [logsResult, countResult] = await Promise.all([
      query(logsQuery, [userId, limit, offset]),
      query(countQuery, [userId])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        user: user,
        logs: logsResult.rows,
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
    console.error('Error obteniendo logs del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/logs/cleanup - Limpiar logs antiguos (solo administradores)
router.delete('/cleanup', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const { days = 90 } = req.body;

    if (days < 30) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden eliminar logs de menos de 30 días'
      });
    }

    const deletedCount = await cleanOldLogs(parseInt(days));

    res.json({
      success: true,
      message: `Se eliminaron ${deletedCount} registros de logs antiguos`,
      data: {
        deletedCount
      }
    });
  } catch (error) {
    console.error('Error limpiando logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/logs/actions - Obtener lista de acciones disponibles para filtrar
router.get('/actions', authenticateToken, requireRole(['Administrador del CRM']), async (req, res) => {
  try {
    const actionsResult = await query(
      'SELECT DISTINCT action FROM system_logs ORDER BY action'
    );

    const tablesResult = await query(
      'SELECT DISTINCT table_name FROM system_logs WHERE table_name IS NOT NULL ORDER BY table_name'
    );

    res.json({
      success: true,
      data: {
        actions: actionsResult.rows.map(row => row.action),
        tables: tablesResult.rows.map(row => row.table_name)
      }
    });
  } catch (error) {
    console.error('Error obteniendo acciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/logs/dashboard - Obtener datos para el dashboard de logs
router.get('/dashboard', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);

    // Estadísticas generales
    const generalStatsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) FILTER (WHERE action = 'LOGIN') as total_logins,
        COUNT(*) FILTER (WHERE action = 'CREATE') as total_creates,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as total_updates,
        COUNT(*) FILTER (WHERE action = 'DELETE') as total_deletes
      FROM system_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;

    // Actividad por día
    const dailyActivityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activity_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM system_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Top usuarios más activos
    const topUsersQuery = `
      SELECT 
        u.first_name || ' ' || u.last_name as user_name,
        u.email,
        COUNT(sl.id) as activity_count,
        MAX(sl.created_at) as last_activity
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE sl.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY activity_count DESC
      LIMIT 10
    `;

    // Actividad por tabla/módulo
    const moduleActivityQuery = `
      SELECT 
        COALESCE(table_name, 'Sistema') as module_name,
        COUNT(*) as activity_count,
        COUNT(*) FILTER (WHERE action = 'CREATE') as creates,
        COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE action = 'DELETE') as deletes
      FROM system_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY table_name
      ORDER BY activity_count DESC
    `;

    const [generalStats, dailyActivity, topUsers, moduleActivity] = await Promise.all([
      query(generalStatsQuery),
      query(dailyActivityQuery),
      query(topUsersQuery),
      query(moduleActivityQuery)
    ]);

    res.json({
      success: true,
      data: {
        generalStats: generalStats.rows[0],
        dailyActivity: dailyActivity.rows,
        topUsers: topUsers.rows,
        moduleActivity: moduleActivity.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;