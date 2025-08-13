const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireOwnershipOrRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Validaciones
const contactValidation = [
  body('first_name').notEmpty().withMessage('El nombre es requerido'),
  body('last_name').notEmpty().withMessage('El apellido es requerido'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('company_id').optional().isInt({ min: 1 }).withMessage('ID de empresa inválido'),
  body('assigned_to').optional().isInt({ min: 1 }).withMessage('ID de usuario asignado inválido')
];

// GET /api/contacts - Obtener lista de contactos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      company = '', 
      assigned_to = '', 
      status = '',
      source = ''
    } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Si es comercial, solo puede ver sus contactos asignados
    if (req.user.role_name === 'Comercial') {
      whereClause += ` AND c.assigned_to = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    // Filtro por búsqueda (nombre, apellido, email)
    if (search) {
      whereClause += ` AND (c.first_name ILIKE $${paramIndex} OR c.last_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por empresa
    if (company) {
      whereClause += ` AND comp.name ILIKE $${paramIndex}`;
      params.push(`%${company}%`);
      paramIndex++;
    }

    // Filtro por usuario asignado
    if (assigned_to) {
      whereClause += ` AND c.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    // Filtro por estado
    if (status) {
      whereClause += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Filtro por fuente
    if (source) {
      whereClause += ` AND c.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    // Calcular offset
    const offset = (page - 1) * limit;

    // Consulta principal
    const contactsQuery = `
      SELECT 
        c.*,
        comp.name as company_name,
        comp.industry as company_industry,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM contacts c
      LEFT JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN users creator ON c.created_by = creator.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Consulta para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contacts c
      LEFT JOIN companies comp ON c.company_id = comp.id
      ${whereClause}
    `;

    const [contactsResult, countResult] = await Promise.all([
      query(contactsQuery, params),
      query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        contacts: contactsResult.rows,
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
    console.error('Error obteniendo contactos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/contacts/:id - Obtener contacto por ID
router.get('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    const contactResult = await query(
      `SELECT 
        c.*,
        comp.name as company_name,
        comp.industry as company_industry,
        comp.website as company_website,
        comp.phone as company_phone,
        comp.email as company_email,
        comp.address as company_address,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM contacts c
      LEFT JOIN companies comp ON c.company_id = comp.id
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE c.id = $1`,
      [id]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
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
      WHERE a.contact_id = $1
      ORDER BY a.start_date DESC
      LIMIT 10`,
      [id]
    );

    // Obtener negocios relacionados
    const dealsResult = await query(
      `SELECT 
        d.*,
        dp.name as phase_name,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      LEFT JOIN users u ON d.assigned_to = u.id
      WHERE d.contact_id = $1
      ORDER BY d.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        contact: contactResult.rows[0],
        activities: activitiesResult.rows,
        deals: dealsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/contacts - Crear nuevo contacto
router.post('/', authenticateToken, contactValidation, async (req, res) => {
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
      first_name,
      last_name,
      email,
      phone,
      mobile,
      position,
      company_id,
      assigned_to,
      source,
      status = 'active',
      notes
    } = req.body;

    // Verificar que la empresa existe si se proporciona
    if (company_id) {
      const companyResult = await query('SELECT id FROM companies WHERE id = $1', [company_id]);
      if (companyResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }
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

    // Crear contacto
    const newContactResult = await query(
      `INSERT INTO contacts (
        first_name, last_name, email, phone, mobile, position, 
        company_id, assigned_to, source, status, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        first_name, last_name, email, phone, mobile, position,
        company_id, finalAssignedTo, source, status, notes, req.user.id
      ]
    );

    const newContact = newContactResult.rows[0];

    // Log contact creation
    await logActivity(
      req.user.id, 
      'CREATE', 
      'contacts', 
      newContact.id, 
      null, 
      newContact, 
      req.ip, 
      req.get('User-Agent')
    );

    res.status(201).json({
      success: true,
      message: 'Contacto creado exitosamente',
      data: {
        contact: newContact
      }
    });
  } catch (error) {
    console.error('Error creando contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/contacts/:id - Actualizar contacto
router.put('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), contactValidation, async (req, res) => {
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
      first_name,
      last_name,
      email,
      phone,
      mobile,
      position,
      company_id,
      assigned_to,
      source,
      status,
      notes
    } = req.body;

    // Obtener datos actuales del contacto
    const currentContactResult = await query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );

    if (currentContactResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    const currentContact = currentContactResult.rows[0];

    // Verificaciones similares a la creación
    if (company_id && company_id !== currentContact.company_id) {
      const companyResult = await query('SELECT id FROM companies WHERE id = $1', [company_id]);
      if (companyResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }
    }

    if (assigned_to && assigned_to !== currentContact.assigned_to) {
      const userResult = await query('SELECT id FROM users WHERE id = $1 AND is_active = true', [assigned_to]);
      if (userResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Usuario asignado no encontrado o inactivo'
        });
      }
    }

    // Actualizar contacto
    const updatedContactResult = await query(
      `UPDATE contacts SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        mobile = COALESCE($5, mobile),
        position = COALESCE($6, position),
        company_id = COALESCE($7, company_id),
        assigned_to = COALESCE($8, assigned_to),
        source = COALESCE($9, source),
        status = COALESCE($10, status),
        notes = COALESCE($11, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        first_name, last_name, email, phone, mobile, position,
        company_id, assigned_to, source, status, notes, id
      ]
    );

    const updatedContact = updatedContactResult.rows[0];

    // Log contact update
    await logActivity(
      req.user.id, 
      'UPDATE', 
      'contacts', 
      parseInt(id), 
      currentContact, 
      updatedContact, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Contacto actualizado exitosamente',
      data: {
        contact: updatedContact
      }
    });
  } catch (error) {
    console.error('Error actualizando contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/contacts/:id - Eliminar contacto
router.delete('/:id', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el contacto existe
    const contactResult = await query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    const contact = contactResult.rows[0];

    // Verificar si tiene negocios asociados
    const dealsResult = await query(
      'SELECT COUNT(*) as count FROM deals WHERE contact_id = $1',
      [id]
    );

    if (parseInt(dealsResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el contacto porque tiene negocios asociados'
      });
    }

    // Eliminar contacto
    await query('DELETE FROM contacts WHERE id = $1', [id]);

    // Log contact deletion
    await logActivity(
      req.user.id, 
      'DELETE', 
      'contacts', 
      parseInt(id), 
      contact, 
      null, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Contacto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/contacts/:id/transfer - Transferir contacto a otro usuario
router.post('/:id/transfer', authenticateToken, requireOwnershipOrRole(['Administrador del CRM', 'Gerente de Ventas']), [
  body('to_user_id').isInt({ min: 1 }).withMessage('ID de usuario destino requerido'),
  body('reason').optional().isLength({ max: 500 }).withMessage('La razón no puede exceder 500 caracteres')
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

    const { id } = req.params;
    const { to_user_id, reason } = req.body;

    // Verificar que el contacto existe
    const contactResult = await query(
      'SELECT * FROM contacts WHERE id = $1',
      [id]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contacto no encontrado'
      });
    }

    const contact = contactResult.rows[0];

    // Verificar que el usuario destino existe y está activo
    const toUserResult = await query(
      'SELECT id, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
      [to_user_id]
    );

    if (toUserResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Usuario destino no encontrado o inactivo'
      });
    }

    // Registrar la transferencia
    await query(
      `INSERT INTO client_transfers (
        contact_id, from_user_id, to_user_id, reason, 
        approved_by, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, 'approved', $6)`,
      [id, contact.assigned_to, to_user_id, reason, req.user.id, req.user.id]
    );

    // Actualizar el contacto
    await query(
      'UPDATE contacts SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [to_user_id, id]
    );

    // Transferir también todos los negocios asociados
    await query(
      'UPDATE deals SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE contact_id = $2',
      [to_user_id, id]
    );

    // Transferir actividades futuras
    await query(
      `UPDATE activities SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE contact_id = $2 AND start_date > CURRENT_TIMESTAMP`,
      [to_user_id, id]
    );

    // Log transfer
    await logActivity(
      req.user.id, 
      'TRANSFER', 
      'contacts', 
      parseInt(id), 
      { assigned_to: contact.assigned_to }, 
      { assigned_to: to_user_id, reason }, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Contacto transferido exitosamente'
    });
  } catch (error) {
    console.error('Error transfiriendo contacto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;