const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireOwnershipOrRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Validaciones
const dealValidation = [
  body('title').notEmpty().withMessage('El título es requerido'),
  body('value').optional().isFloat({ min: 0 }).withMessage('El valor debe ser un número positivo'),
  body('contact_id').isInt({ min: 1 }).withMessage('ID de contacto requerido'),
  body('company_id').optional().isInt({ min: 1 }).withMessage('ID de empresa inválido'),
  body('phase_id').isInt({ min: 1 }).withMessage('ID de fase requerido'),
  body('expected_close_date').optional().isISO8601().withMessage('Fecha de cierre esperada inválida')
];

// GET /api/deals - Obtener lista de negocios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      phase = '', 
      assigned_to = '', 
      status = req.query.status || '',
      min_value = '',
      max_value = '',
      source = ''
    } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Si es comercial, solo puede ver sus negocios asignados
    if (req.user.role_name === 'Comercial') {
      whereClause += ` AND d.assigned_to = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    // Filtro por búsqueda (título, descripción)
    if (search) {
      whereClause += ` AND (d.title ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por fase
    if (phase) {
      whereClause += ` AND dp.name = $${paramIndex}`;
      params.push(phase);
      paramIndex++;
    }

    // Filtro por usuario asignado
    if (assigned_to) {
      whereClause += ` AND d.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filtro por estado
    if (status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filtro por valor mínimo
    if (min_value) {
      whereClause += ` AND d.value >= $${paramIndex}`;
      params.push(parseFloat(min_value));
      paramIndex++;
    }

    // Filtro por valor máximo
    if (max_value) {
      whereClause += ` AND d.value <= $${paramIndex}`;
      params.push(parseFloat(max_value));
      paramIndex++;
    }

    // Filtro por fuente
    if (source) {
      whereClause += ` AND d.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    // Calcular offset
    const offset = (page - 1) * limit;

    // Consulta principal
    const dealsQuery = `
      SELECT 
        d.*,
        dp.name as phase_name,
        dp.probability as phase_probability,
        c.first_name || ' ' || c.last_name as contact_name,
        c.email as contact_email,
        comp.name as company_name,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies comp ON d.company_id = comp.id
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN users creator ON d.created_by = creator.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Consulta para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies comp ON d.company_id = comp.id
      ${whereClause}
    `;

    const [dealsResult, countResult] = await Promise.all([
      query(dealsQuery, params),
      query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        deals: dealsResult.rows,
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
    console.error('Error obteniendo negocios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/deals/:id - Obtener negocio por ID
router.get('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    const dealResult = await query(
      `SELECT 
        d.*,
        dp.name as phase_name,
        dp.probability as phase_probability,
        c.first_name || ' ' || c.last_name as contact_name,
        c.email as contact_email,
        c.phone as contact_phone,
        comp.name as company_name,
        comp.industry as company_industry,
        comp.website as company_website,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      LEFT JOIN contacts c ON d.contact_id = c.id
      LEFT JOIN companies comp ON d.company_id = comp.id
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN users creator ON d.created_by = creator.id
      WHERE d.id = $1`,
      [id]
    );

    if (dealResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    // Obtener actividades relacionadas
    const activitiesResult = await query(
      `SELECT 
        a.*,
        at.name as activity_type_name,
        at.icon as activity_type_icon,
        at.color as activity_type_color,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM activities a
      LEFT JOIN activity_types at ON a.activity_type_id = at.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.deal_id = $1
      ORDER BY a.start_date DESC
      LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        deal: dealResult.rows[0],
        activities: activitiesResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/deals - Crear nuevo negocio
router.post('/', authenticateToken, dealValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      value,
      currency = 'USD',
      contact_id,
      company_id,
      assigned_to,
      phase_id,
      source,
      expected_close_date,
      probability,
      notes
    } = req.body;

    // Verificar que el contacto existe
    const contactResult = await query('SELECT id, company_id FROM contacts WHERE id = $1', [contact_id]);
    if (contactResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    // Si no se proporciona company_id, usar el de la empresa del contacto
    const finalCompanyId = company_id || contactResult.rows[0].company_id;

    // Verificar que la fase existe
    const phaseResult = await query('SELECT id, probability FROM deal_phases WHERE id = $1', [phase_id]);
    if (phaseResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fase no encontrada'
      });
    }

    // Verificar que el usuario asignado existe si se proporciona
    if (assigned_to) {
      const userResult = await query('SELECT id FROM users WHERE id = $1 AND is_active = true', [assigned_to]);
      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Usuario asignado no encontrado o inactivo'
        });
      }
    }

    // Si es comercial, se asigna automáticamente a sí mismo
    const finalAssignedTo = req.user.role_name === 'Comercial' ? req.user.id : (assigned_to || req.user.id);
    
    // Usar la probabilidad de la fase si no se proporciona una específica
    const finalProbability = probability !== undefined ? probability : phaseResult.rows[0].probability;

    // Crear negocio
    const newDealResult = await query(
      `INSERT INTO deals (
        title, description, value, currency, contact_id, company_id,
        assigned_to, phase_id, source, expected_close_date, probability, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title, description, value, currency, contact_id, finalCompanyId,
        finalAssignedTo, phase_id, source, expected_close_date, finalProbability, notes, req.user.id
      ]
    );

    const newDeal = newDealResult.rows[0];

    // Log deal creation
    await logActivity(
      req.user.id, 
      'CREATE', 
      'deals', 
      newDeal.id, 
      null, 
      newDeal, 
      req.ip, 
      req.get('User-Agent')
    );

    res.status(201).json({
      success: true,
      message: 'Negocio creado exitosamente',
      data: {
        deal: newDeal
      }
    });
  } catch (error) {
    console.error('Error creando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/deals/:id - Actualizar negocio
router.put('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), dealValidation, async (req, res) => {
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
    const {
      title,
      description,
      value,
      currency,
      contact_id,
      company_id,
      assigned_to,
      phase_id,
      source,
      expected_close_date,
      actual_close_date,
      probability,
      status,
      notes
    } = req.body;

    // Obtener datos actuales del negocio
    const currentDealResult = await query(
      'SELECT * FROM deals WHERE id = $1',
      [id]
    );

    if (currentDealResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    const currentDeal = currentDealResult.rows[0];

    // Verificaciones similares a la creación
    if (contact_id && contact_id !== currentDeal.contact_id) {
      const contactResult = await query('SELECT id FROM contacts WHERE id = $1', [contact_id]);
      if (contactResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Contacto no encontrado'
        });
      }
    }

    if (phase_id && phase_id !== currentDeal.phase_id) {
      const phaseResult = await query('SELECT id, probability FROM deal_phases WHERE id = $1', [phase_id]);
      if (phaseResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Fase no encontrada'
        });
      }
      
      // Si se cambia la fase y no se proporciona probabilidad, usar la de la nueva fase
      if (probability === undefined) {
        req.body.probability = phaseResult.rows[0].probability;
      }
    }

    if (assigned_to && assigned_to !== currentDeal.assigned_to) {
      const userResult = await query('SELECT id FROM users WHERE id = $1 AND is_active = true', [assigned_to]);
      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Usuario asignado no encontrado o inactivo'
        });
      }
    }

    // Actualizar negocio
    const updatedDealResult = await query(
      `UPDATE deals SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        value = COALESCE($3, value),
        currency = COALESCE($4, currency),
        contact_id = COALESCE($5, contact_id),
        company_id = COALESCE($6, company_id),
        assigned_to = COALESCE($7, assigned_to),
        phase_id = COALESCE($8, phase_id),
        source = COALESCE($9, source),
        expected_close_date = COALESCE($10, expected_close_date),
        actual_close_date = COALESCE($11, actual_close_date),
        probability = COALESCE($12, probability),
        status = COALESCE($13, status),
        notes = COALESCE($14, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
      [
        title, description, value, currency, contact_id, company_id,
        assigned_to, phase_id, source, expected_close_date, actual_close_date,
        req.body.probability || probability, status, notes, id
      ]
    );

    const updatedDeal = updatedDealResult.rows[0];

    // Log deal update
    await logActivity(
      req.user.id, 
      'UPDATE', 
      'deals', 
      parseInt(id), 
      currentDeal, 
      updatedDeal, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Negocio actualizado exitosamente',
      data: {
        deal: updatedDeal
      }
    });
  } catch (error) {
    console.error('Error actualizando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/deals/:id - Eliminar negocio
router.delete('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el negocio existe
    const dealResult = await query(
      'SELECT * FROM deals WHERE id = $1',
      [id]
    );

    if (dealResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    const deal = dealResult.rows[0];

    // Eliminar actividades asociadas
    await query('DELETE FROM activities WHERE deal_id = $1', [id]);

    // Eliminar negocio
    await query('DELETE FROM deals WHERE id = $1', [id]);

    // Log deal deletion
    await logActivity(
      req.user.id, 
      'DELETE', 
      'deals', 
      parseInt(id), 
      deal, 
      null, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Negocio eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/deals/stats/summary - Obtener estadísticas de negocios
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { assigned_to = '', period = '30' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Si es comercial, solo puede ver sus estadísticas
    if (req.user.role_name === 'Comercial') {
      whereClause += ` AND assigned_to = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    } else if (assigned_to) {
      whereClause += ` AND assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filtro por período
    if (period !== 'all') {
      whereClause += ` AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'`;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE status = 'open') as open_deals,
        COUNT(*) FILTER (WHERE status = 'won') as won_deals,
        COUNT(*) FILTER (WHERE status = 'lost') as lost_deals,
        COALESCE(SUM(value) FILTER (WHERE status = 'open'), 0) as open_value,
        COALESCE(SUM(value) FILTER (WHERE status = 'won'), 0) as won_value,
        COALESCE(SUM(value) FILTER (WHERE status = 'lost'), 0) as lost_value,
        COALESCE(AVG(value), 0) as avg_deal_value
      FROM deals
      ${whereClause}
    `;

    const phaseStatsQuery = `
      SELECT 
        dp.name as phase_name,
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.value), 0) as total_value
      FROM deal_phases dp
      LEFT JOIN deals d ON dp.id = d.phase_id ${whereClause.replace('WHERE 1=1', 'AND 1=1')}
      GROUP BY dp.id, dp.name, dp.order_index
      ORDER BY dp.order_index
    `;

    const [statsResult, phaseStatsResult] = await Promise.all([
      query(statsQuery, params),
      query(phaseStatsQuery, params)
    ]);

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        phaseDistribution: phaseStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de negocios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/deals/phases - Obtener fases de negocios
router.get('/phases', authenticateToken, async (req, res) => {
  try {
    const phasesResult = await query(
      'SELECT * FROM deal_phases WHERE is_active = true ORDER BY order_index'
    );

    res.json({
      success: true,
      data: {
        phases: phasesResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo fases:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;