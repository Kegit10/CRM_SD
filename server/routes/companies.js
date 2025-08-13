const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Validaciones para los datos de la empresa
const companyValidation = [
  body('name').notEmpty().withMessage('El nombre de la empresa es requerido'),
  body('industry').optional().notEmpty().withMessage('El sector de la empresa no puede estar vacío'),
  body('website').optional().isURL().withMessage('El sitio web debe ser una URL válida'),
  body('phone').optional().notEmpty().withMessage('El teléfono no puede estar vacío'),
  body('email').optional().isEmail().withMessage('El correo electrónico debe ser una dirección de correo válida'),
  body('nit').optional().notEmpty().withMessage('El NIT de la empresa no puede estar vacío')
];

// GET /api/companies - Obtener lista de empresas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      industry = ''
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtro por búsqueda (nombre de la empresa o NIT)
    if (search) {
      whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.nit ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por sector
    if (industry) {
      whereClause += ` AND c.industry ILIKE $${paramIndex}`;
      params.push(`%${industry}%`);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    // Consulta principal
    const companiesQuery = `
      SELECT
        c.*,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM companies c
      LEFT JOIN users creator ON c.created_by = creator.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Consulta para contar el total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM companies c
      ${whereClause}
    `;
    
    // Ejecutar ambas consultas
    const [companiesResult, countResult] = await Promise.all([
      query(companiesQuery, params),
      query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        companies: companiesResult.rows,
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
    console.error('Error obteniendo empresas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/companies/:id - Obtener empresa por ID
router.get('/:id', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const companyResult = await query(
      `SELECT
        c.*,
        creator.first_name || ' ' || creator.last_name as created_by_name
      FROM companies c
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE c.id = $1`,
      [id]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        company: companyResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/companies - Crear nueva empresa
router.post('/', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), companyValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de la empresa inválidos',
        errors: errors.array()
      });
    }

    const { name, industry, website, phone, email, nit } = req.body;
    
    const newCompanyResult = await query(
      `INSERT INTO companies (name, industry, website, phone, email, nit, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name, industry, website, phone, email, nit, req.user.id]
    );

    const newCompany = newCompanyResult.rows[0];

    await logActivity(
      req.user.id,
      'CREATE',
      'companies',
      newCompany.id,
      null,
      newCompany,
      req.ip,
      req.get('User-Agent')
    );

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      data: {
        company: newCompany
      }
    });
  } catch (error) {
    console.error('Error creando empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/companies/:id - Actualizar empresa
router.put('/:id', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), companyValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de la empresa inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, industry, website, phone, email, nit } = req.body;

    const currentCompanyResult = await query('SELECT * FROM companies WHERE id = $1', [id]);
    if (currentCompanyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }
    const currentCompany = currentCompanyResult.rows[0];

    const updatedCompanyResult = await query(
      `UPDATE companies SET
        name = COALESCE($1, name),
        industry = COALESCE($2, industry),
        website = COALESCE($3, website),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        nit = COALESCE($6, nit),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [name, industry, website, phone, email, nit, id]
    );

    const updatedCompany = updatedCompanyResult.rows[0];

    await logActivity(
      req.user.id,
      'UPDATE',
      'companies',
      parseInt(id),
      currentCompany,
      updatedCompany,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      data: { company: updatedCompany }
    });
  } catch (error) {
    console.error('Error actualizando empresa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// DELETE /api/companies/:id - Eliminar empresa
router.delete('/:id', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { id } = req.params;

    const companyResult = await query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada' });
    }
    const company = companyResult.rows[0];

    // Desvincular contactos de esta empresa
    await query('UPDATE contacts SET company_id = NULL WHERE company_id = $1', [id]);

    await query('DELETE FROM companies WHERE id = $1', [id]);

    await logActivity(
      req.user.id,
      'DELETE',
      'companies',
      parseInt(id),
      company,
      null,
      req.ip,
      req.get('User-Agent')
    );

    res.json({ success: true, message: 'Empresa eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando empresa:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;

