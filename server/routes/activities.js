const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireOwnershipOrRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Validaciones para la creación y actualización de actividades
const activityValidation = [
  body('title').notEmpty().withMessage('El título es requerido'),
  // Se ha cambiado la validación para usar sub_task_id en lugar de activity_type_id
  body('sub_task_id').isInt({ min: 1 }).withMessage('Sub-tarea es requerida'),
  body('start_date').isISO8601().withMessage('Fecha de inicio inválida'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duración debe ser un número positivo'),
  body('contact_id').optional().isInt({ min: 1 }).withMessage('ID de contacto inválido'),
  body('company_id').optional().isInt({ min: 1 }).withMessage('ID de empresa inválido'),
  body('deal_id').optional().isInt({ min: 1 }).withMessage('ID de negocio inválido')
];

// -----------------------------------------------------------
// Rutas para obtener la jerarquía de actividades
// -----------------------------------------------------------

// GET /api/activities/types - Obtener tipos de actividades
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const typesResult = await query(
      'SELECT id, name, icon, color FROM activity_types WHERE is_active = true ORDER BY name'
    );
    res.json({
      success: true,
      data: { activityTypes: typesResult.rows }
    });
  } catch (error) {
    console.error('Error obteniendo tipos de actividades:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/activities/tasks - Obtener tareas (con filtro por tipo de actividad)
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { activity_type_id } = req.query;
    let taskQuery = 'SELECT id, name, activity_type_id FROM tasks WHERE is_active = true';
    const params = [];
    if (activity_type_id) {
      taskQuery += ' AND activity_type_id = $1';
      params.push(activity_type_id);
    }
    taskQuery += ' ORDER BY name';
    const tasksResult = await query(taskQuery, params);
    res.json({
      success: true,
      data: { tasks: tasksResult.rows }
    });
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/activities/sub-tasks - Obtener sub-tareas (con filtro por tarea)
router.get('/sub-tasks', authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.query;
    let subTaskQuery = 'SELECT id, name, description, task_id FROM sub_tasks WHERE is_active = true';
    const params = [];
    if (task_id) {
      subTaskQuery += ' AND task_id = $1';
      params.push(task_id);
    }
    subTaskQuery += ' ORDER BY name';
    const subTasksResult = await query(subTaskQuery, params);
    res.json({
      success: true,
      data: { subTasks: subTasksResult.rows }
    });
  } catch (error) {
    console.error('Error obteniendo sub-tareas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});


// -----------------------------------------------------------
// Rutas CRUD de Actividades (modificadas)
// -----------------------------------------------------------

// GET /api/activities - Obtener lista de actividades (adaptado a la nueva jerarquía)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      task_id = '',
      status = '',
      assigned_to = '',
      start_date = '',
      end_date = '',
      contact_id = '',
      deal_id = ''
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Si es comercial, solo puede ver sus actividades asignadas
    if (req.user.role_name === 'Comercial') {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else if (assigned_to) {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filtro por búsqueda (título, descripción)
    if (search) {
      whereClause += ` AND (a.title ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por tipo de actividad (usando el JOIN)
    if (type) {
      whereClause += ` AND at.name = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Nuevo filtro por tarea
    if (task_id) {
      whereClause += ` AND t.id = $${paramIndex}`;
      params.push(task_id);
      paramIndex++;
    }

    // Filtro por estado
    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filtro por fecha de inicio
    if (start_date) {
      whereClause += ` AND DATE(a.start_date) >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    // Filtro por fecha de fin
    if (end_date) {
      whereClause += ` AND DATE(a.start_date) <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    // Filtro por contacto
    if (contact_id) {
      whereClause += ` AND a.contact_id = $${paramIndex}`;
      params.push(contact_id);
      paramIndex++;
    }

    // Filtro por negocio
    if (deal_id) {
      whereClause += ` AND a.deal_id = $${paramIndex}`;
      params.push(deal_id);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    // Consulta principal con JOINS a las nuevas tablas
    const activitiesQuery = `
      SELECT
        a.*,
        st.id AS sub_task_id, st.name AS sub_task_name,
        t.id AS task_id, t.name AS task_name,
        at.id AS activity_type_id, at.name AS activity_type_name, at.icon AS activity_type_icon, at.color AS activity_type_color,
        c.first_name || ' ' || c.last_name AS contact_name,
        comp.name AS company_name,
        d.title AS deal_title,
        u.first_name || ' ' || u.last_name AS assigned_to_name,
        creator.first_name || ' ' || creator.last_name AS created_by_name
      FROM activities a
      LEFT JOIN sub_tasks st ON a.sub_task_id = st.id
      LEFT JOIN tasks t ON st.task_id = t.id
      LEFT JOIN activity_types at ON t.activity_type_id = at.id
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies comp ON a.company_id = comp.id
      LEFT JOIN deals d ON a.deal_id = d.id
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN users creator ON a.created_by = creator.id
      ${whereClause}
      ORDER BY a.start_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Consulta para contar el total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activities a
      LEFT JOIN sub_tasks st ON a.sub_task_id = st.id
      LEFT JOIN tasks t ON st.task_id = t.id
      LEFT JOIN activity_types at ON t.activity_type_id = at.id
      ${whereClause}
    `;

    const [activitiesResult, countResult] = await Promise.all([
      query(activitiesQuery, params),
      query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        activities: activitiesResult.rows,
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
    console.error('Error obteniendo actividades:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/activities/calendar - Obtener actividades para el calendario (adaptado)
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, assigned_to = '' } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Si es comercial, solo puede ver sus actividades
    if (req.user.role_name === 'Comercial') {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else if (assigned_to) {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filtro por rango de fechas
    if (start_date) {
      whereClause += ` AND a.start_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND a.start_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const calendarQuery = `
      SELECT
        a.id, a.title, a.description, a.start_date, a.end_date, a.duration, a.status, a.location,
        st.id AS sub_task_id, st.name AS sub_task_name,
        t.id AS task_id, t.name AS task_name,
        at.name as activity_type_name, at.icon as activity_type_icon, at.color as activity_type_color,
        c.first_name || ' ' || c.last_name as contact_name,
        comp.name as company_name,
        d.title as deal_title,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM activities a
      LEFT JOIN sub_tasks st ON a.sub_task_id = st.id
      LEFT JOIN tasks t ON st.task_id = t.id
      LEFT JOIN activity_types at ON t.activity_type_id = at.id
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies comp ON a.company_id = comp.id
      LEFT JOIN deals d ON a.deal_id = d.id
      LEFT JOIN users u ON a.assigned_to = u.id
      ${whereClause}
      ORDER BY a.start_date ASC
    `;

    const activitiesResult = await query(calendarQuery, params);

    const calendarEvents = activitiesResult.rows.map(activity => ({
      id: activity.id,
      title: activity.title,
      start: activity.start_date,
      end: activity.end_date || new Date(new Date(activity.start_date).getTime() + (activity.duration || 60) * 60000),
      backgroundColor: activity.activity_type_color,
      borderColor: activity.activity_type_color,
      extendedProps: {
        description: activity.description,
        status: activity.status,
        location: activity.location,
        activityType: activity.activity_type_name,
        subTask: activity.sub_task_name,
        task: activity.task_name,
        activityIcon: activity.activity_type_icon,
        contactName: activity.contact_name,
        companyName: activity.company_name,
        dealTitle: activity.deal_title,
        assignedToName: activity.assigned_to_name
      }
    }));

    res.json({ success: true, data: { events: calendarEvents } });
  } catch (error) {
    console.error('Error obteniendo actividades del calendario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/activities/:id - Obtener actividad por ID (adaptado)
router.get('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    const activityResult = await query(
      `SELECT
        a.*,
        st.id AS sub_task_id, st.name AS sub_task_name, st.description AS sub_task_description,
        t.id AS task_id, t.name AS task_name,
        at.id AS activity_type_id, at.name AS activity_type_name, at.icon AS activity_type_icon, at.color AS activity_type_color,
        c.first_name || ' ' || c.last_name as contact_name,
        c.email as contact_email,
        comp.name as company_name,
        d.title as deal_title,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM activities a
      LEFT JOIN sub_tasks st ON a.sub_task_id = st.id
      LEFT JOIN tasks t ON st.task_id = t.id
      LEFT JOIN activity_types at ON t.activity_type_id = at.id
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies comp ON a.company_id = comp.id
      LEFT JOIN deals d ON a.deal_id = d.id
      LEFT JOIN users u ON a.assigned_to = u.id
      LEFT JOIN users creator ON a.created_by = creator.id
      WHERE a.id = $1`,
      [id]
    );

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    }

    res.json({ success: true, data: { activity: activityResult.rows[0] } });
  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/activities - Crear nueva actividad (adaptado)
router.post('/', authenticateToken, activityValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: errors.array() });
    }

    const {
      title, description, sub_task_id, start_date, end_date, duration = 60,
      status = 'planned', contact_id, company_id, deal_id, assigned_to,
      location, notes
    } = req.body;

    // Verificar que la sub-tarea existe
    const subTaskResult = await query(
      'SELECT st.id, t.activity_type_id FROM sub_tasks st JOIN tasks t ON st.task_id = t.id WHERE st.id = $1 AND st.is_active = true',
      [sub_task_id]
    );
    if (subTaskResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Sub-tarea no encontrada o inactiva' });
    }

    // Se eliminó la validación redundante de activity_type_id
    // Los siguientes bloques de verificación se mantienen
    if (contact_id) {
      const contactResult = await query('SELECT id, company_id FROM contacts WHERE id = $1', [contact_id]);
      if (contactResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Contacto no encontrado' });
      if (!company_id && contactResult.rows[0].company_id) req.body.company_id = contactResult.rows[0].company_id;
    }

    if (company_id || req.body.company_id) {
      const companyResult = await query('SELECT id FROM companies WHERE id = $1', [company_id || req.body.company_id]);
      if (companyResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Empresa no encontrada' });
    }

    if (deal_id) {
      const dealResult = await query('SELECT id, contact_id, company_id FROM deals WHERE id = $1', [deal_id]);
      if (dealResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Negocio no encontrado' });
      if (!contact_id && dealResult.rows[0].contact_id) req.body.contact_id = dealResult.rows[0].contact_id;
      if (!company_id && !req.body.company_id && dealResult.rows[0].company_id) req.body.company_id = dealResult.rows[0].company_id;
    }

    if (assigned_to) {
      const userResult = await query('SELECT id FROM users WHERE id = $1 AND is_active = true', [assigned_to]);
      if (userResult.rows.length === 0) return res.status(400).json({ success: false, message: 'Usuario asignado no encontrado o inactivo' });
    }

    const finalAssignedTo = req.user.role_name === 'Comercial' ? req.user.id : (assigned_to || req.user.id);
    let finalEndDate = end_date;
    if (!end_date && duration) {
      const startDateTime = new Date(start_date);
      finalEndDate = new Date(startDateTime.getTime() + duration * 60000);
    }

    // Se ha modificado el INSERT para usar sub_task_id
    const newActivityResult = await query(
      `INSERT INTO activities (
        title, description, sub_task_id, start_date, end_date, duration,
        status, contact_id, company_id, deal_id, assigned_to, location, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        title, description, sub_task_id, start_date, finalEndDate, duration,
        status, req.body.contact_id || contact_id, req.body.company_id || company_id,
        deal_id, finalAssignedTo, location, notes, req.user.id
      ]
    );

    const newActivity = newActivityResult.rows[0];
    await logActivity(req.user.id, 'CREATE', 'activities', newActivity.id, null, newActivity, req.ip, req.get('User-Agent'));
    res.status(201).json({ success: true, message: 'Actividad creada exitosamente', data: { activity: newActivity } });
  } catch (error) {
    console.error('Error creando actividad:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// PUT /api/activities/:id - Actualizar actividad (adaptado)
router.put('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), activityValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: errors.array() });
    }

    const { id } = req.params;
    const {
      title, description, sub_task_id, start_date, end_date, duration, status,
      contact_id, company_id, deal_id, assigned_to, location, notes
    } = req.body;

    const currentActivityResult = await query('SELECT * FROM activities WHERE id = $1', [id]);
    if (currentActivityResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    }
    const currentActivity = currentActivityResult.rows[0];

    // Verificar que la sub-tarea existe si se proporciona
    if (sub_task_id && sub_task_id !== currentActivity.sub_task_id) {
      const subTaskResult = await query('SELECT id FROM sub_tasks WHERE id = $1 AND is_active = true', [sub_task_id]);
      if (subTaskResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Sub-tarea no encontrada o inactiva' });
      }
    }

    let finalEndDate = end_date;
    if (!end_date && duration && start_date) {
      const startDateTime = new Date(start_date);
      finalEndDate = new Date(startDateTime.getTime() + duration * 60000);
    } else if (!end_date && duration && !start_date) {
      const startDateTime = new Date(currentActivity.start_date);
      finalEndDate = new Date(startDateTime.getTime() + duration * 60000);
    }

    // Se ha modificado el UPDATE para usar sub_task_id
    const updatedActivityResult = await query(
      `UPDATE activities SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        sub_task_id = COALESCE($3, sub_task_id), start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date), duration = COALESCE($6, duration),
        status = COALESCE($7, status), contact_id = COALESCE($8, contact_id),
        company_id = COALESCE($9, company_id), deal_id = COALESCE($10, deal_id),
        assigned_to = COALESCE($11, assigned_to), location = COALESCE($12, location),
        notes = COALESCE($13, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 RETURNING *`,
      [
        title, description, sub_task_id, start_date, finalEndDate, duration,
        status, contact_id, company_id, deal_id, assigned_to, location, notes, id
      ]
    );

    const updatedActivity = updatedActivityResult.rows[0];
    await logActivity(req.user.id, 'UPDATE', 'activities', parseInt(id), currentActivity, updatedActivity, req.ip, req.get('User-Agent'));
    res.json({ success: true, message: 'Actividad actualizada exitosamente', data: { activity: updatedActivity } });
  } catch (error) {
    console.error('Error actualizando actividad:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// DELETE /api/activities/:id - Eliminar actividad
router.delete('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    const activityResult = await query('SELECT * FROM activities WHERE id = $1', [id]);
    if (activityResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
    }
    const activity = activityResult.rows[0];

    await query('DELETE FROM activities WHERE id = $1', [id]);
    await logActivity(req.user.id, 'DELETE', 'activities', parseInt(id), activity, null, req.ip, req.get('User-Agent'));
    res.json({ success: true, message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando actividad:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /api/activities/stats/summary - Obtener estadísticas de actividades (adaptado)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { assigned_to = '', period = '30' } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Si es comercial, solo puede ver sus estadísticas
    if (req.user.role_name === 'Comercial') {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else if (assigned_to) {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filtro por período
    if (period !== 'all') {
      whereClause += ` AND a.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'`;
    }

    const statsQuery = `
      SELECT
        COUNT(*) as total_activities,
        COUNT(*) FILTER (WHERE a.status = 'planned') as planned_activities,
        COUNT(*) FILTER (WHERE a.status = 'completed') as completed_activities,
        COUNT(*) FILTER (WHERE a.status = 'cancelled') as cancelled_activities,
        COUNT(*) FILTER (WHERE a.start_date < CURRENT_TIMESTAMP AND a.status = 'planned') as overdue_activities,
        COUNT(*) FILTER (WHERE DATE(a.start_date) = CURRENT_DATE) as today_activities,
        COUNT(*) FILTER (WHERE a.start_date > CURRENT_TIMESTAMP AND a.status = 'planned') as future_activities
      FROM activities a
      ${whereClause}
    `;

    // Consulta para distribución por tipo de actividad (adaptada a la nueva jerarquía)
    const typeStatsQuery = `
      SELECT
        at.name as activity_type_name,
        at.color as activity_type_color,
        COUNT(a.id) as activity_count
      FROM activity_types at
      LEFT JOIN tasks t ON at.id = t.activity_type_id
      LEFT JOIN sub_tasks st ON t.id = st.task_id
      LEFT JOIN activities a ON st.id = a.sub_task_id ${whereClause.replace('WHERE 1=1', 'AND 1=1')}
      WHERE at.is_active = true
      GROUP BY at.id, at.name, at.color
      ORDER BY activity_count DESC
    `;

    const [statsResult, typeStatsResult] = await Promise.all([
      query(statsQuery, params),
      query(typeStatsQuery, params)
    ]);

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        typeDistribution: typeStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de actividades:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
