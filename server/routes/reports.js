const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/sales-performance - Reporte de rendimiento de ventas
router.get('/sales-performance', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { period = '30', user_id = '' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtro por período
    if (period !== 'all') {
      whereClause += ` AND d.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'`;
    }

    // Filtro por usuario
    if (user_id) {
      whereClause += ` AND d.assigned_to = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    // Estadísticas generales de ventas
    const salesStatsQuery = `
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE dp.name = 'Cerrada-Ganada') as won_deals,
        COUNT(*) FILTER (WHERE dp.name = 'Cerrada-Perdida') as lost_deals,
        COUNT(*) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')) as open_deals,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name = 'Cerrada-Ganada'), 0) as won_value,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name = 'Cerrada-Perdida'), 0) as lost_value,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')), 0) as pipeline_value,
        COALESCE(AVG(d.value) FILTER (WHERE dp.name = 'Cerrada-Ganada'), 0) as avg_deal_value
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      ${whereClause}
    `;

    // Rendimiento por usuario
    const userPerformanceQuery = `
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as user_name,
        u.email,
        COUNT(d.id) as total_deals,
        COUNT(d.id) FILTER (WHERE dp.name = 'Cerrada-Ganada') as won_deals,
        COUNT(d.id) FILTER (WHERE dp.name = 'Cerrada-Perdida') as lost_deals,
        COUNT(d.id) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')) as open_deals,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name = 'Cerrada-Ganada'), 0) as won_value,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name = 'Cerrada-Perdida'), 0) as lost_value,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')), 0) as pipeline_value,
        CASE 
          WHEN COUNT(d.id) FILTER (WHERE dp.name IN ('Cerrada-Ganada', 'Cerrada-Perdida')) > 0 
          THEN ROUND((COUNT(d.id) FILTER (WHERE dp.name = 'Cerrada-Ganada')::decimal / COUNT(d.id) FILTER (WHERE dp.name IN ('Cerrada-Ganada', 'Cerrada-Perdida'))) * 100, 2)
          ELSE 0
        END as win_rate
      FROM users u
      LEFT JOIN deals d ON u.id = d.assigned_to ${whereClause.replace('WHERE 1=1', 'AND 1=1')}
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      WHERE u.role_id IN (SELECT id FROM roles WHERE name IN ('Comercial', 'Gerente de Ventas'))
        AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY won_value DESC
    `;

    // Tendencia de ventas por mes
    const salesTrendQuery = `
      SELECT 
        DATE_TRUNC('month', d.created_at) as month,
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE dp.name = 'Cerrada-Ganada') as won_deals,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name = 'Cerrada-Ganada'), 0) as won_value
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      ${whereClause}
      GROUP BY DATE_TRUNC('month', d.created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    const [salesStats, userPerformance, salesTrend] = await Promise.all([
      query(salesStatsQuery, params),
      query(userPerformanceQuery, params),
      query(salesTrendQuery, params)
    ]);

    res.json({
      success: true,
      data: {
        salesStats: salesStats.rows[0],
        userPerformance: userPerformance.rows,
        salesTrend: salesTrend.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte de rendimiento de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/pipeline-analysis - Análisis del pipeline de ventas
router.get('/pipeline-analysis', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { user_id = '' } = req.query;
    
    let whereClause = 'WHERE dp.name NOT IN (\'Cerrada-Ganada\', \'Cerrada-Perdida\')';
    const params = [];
    let paramIndex = 1;

    // Filtro por usuario
    if (user_id) {
      whereClause += ` AND d.assigned_to = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    // Distribución por fases
    const phaseDistributionQuery = `
      SELECT 
        dp.id,
        dp.name as phase_name,
        dp.order_index,
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.value), 0) as total_value,
        COALESCE(AVG(d.value), 0) as avg_value
      FROM deal_phases dp
      LEFT JOIN deals d ON dp.id = d.phase_id ${whereClause.replace('WHERE', 'AND')}
      WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')
      GROUP BY dp.id, dp.name, dp.order_index
      ORDER BY dp.order_index
    `;

    // Negocios por actividad
    const activityAnalysisQuery = `
      SELECT 
        CASE 
          WHEN activity_count = 0 THEN 'Sin Actividades'
          WHEN overdue_count > 0 THEN 'Actividades Atrasadas'
          WHEN today_count > 0 THEN 'Actividades de Hoy'
          ELSE 'Actividades Futuras'
        END as activity_status,
        COUNT(*) as deal_count,
        ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM deals WHERE phase_id IN (SELECT id FROM deal_phases WHERE name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')))) * 100, 1) as percentage
      FROM (
        SELECT 
          d.id,
          COUNT(a.id) as activity_count,
          COUNT(a.id) FILTER (WHERE a.start_date < CURRENT_TIMESTAMP AND a.status = 'planned') as overdue_count,
          COUNT(a.id) FILTER (WHERE DATE(a.start_date) = CURRENT_DATE AND a.status = 'planned') as today_count
        FROM deals d
        LEFT JOIN activities a ON d.id = a.deal_id
        WHERE d.phase_id IN (SELECT id FROM deal_phases WHERE name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida'))
        ${user_id ? 'AND d.assigned_to = $' + paramIndex : ''}
        GROUP BY d.id
      ) deal_activities
      GROUP BY 
        CASE 
          WHEN activity_count = 0 THEN 'Sin Actividades'
          WHEN overdue_count > 0 THEN 'Actividades Atrasadas'
          WHEN today_count > 0 THEN 'Actividades de Hoy'
          ELSE 'Actividades Futuras'
        END
      ORDER BY deal_count DESC
    `;

    // Tiempo promedio en cada fase
    const phaseTimeQuery = `
      SELECT 
        dp.name as phase_name,
        AVG(EXTRACT(EPOCH FROM (COALESCE(d.updated_at, CURRENT_TIMESTAMP) - d.created_at))/86400) as avg_days_in_phase
      FROM deals d
      JOIN deal_phases dp ON d.phase_id = dp.id
      ${whereClause}
      GROUP BY dp.id, dp.name, dp.order_index
      ORDER BY dp.order_index
    `;

    const [phaseDistribution, activityAnalysis, phaseTime] = await Promise.all([
      query(phaseDistributionQuery, params),
      query(activityAnalysisQuery, user_id ? params : []),
      query(phaseTimeQuery, params)
    ]);

    res.json({
      success: true,
      data: {
        phaseDistribution: phaseDistribution.rows,
        activityAnalysis: activityAnalysis.rows,
        phaseTime: phaseTime.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo análisis del pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/activity-metrics - Métricas de actividades
router.get('/activity-metrics', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { period = '30', user_id = '' } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtro por período
    if (period !== 'all') {
      whereClause += ` AND a.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'`;
    }

    // Filtro por usuario
    if (user_id) {
      whereClause += ` AND a.assigned_to = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    // Métricas por usuario
    const userMetricsQuery = `
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as user_name,
        COUNT(a.id) as total_activities,
        COUNT(CASE WHEN at.name = 'Reunión' THEN 1 END) as meetings,
        COUNT(d.id) FILTER (WHERE d.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as deals_created,
        COUNT(d.id) FILTER (WHERE dp.name = 'Cerrada-Ganada' AND d.updated_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as deals_won,
        COUNT(d.id) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')) as deals_pending,
        COUNT(d.id) FILTER (WHERE dp.name = 'Cerrada-Perdida' AND d.updated_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as deals_lost
      FROM users u
      LEFT JOIN activities a ON u.id = a.assigned_to ${whereClause.replace('WHERE 1=1', 'AND 1=1')}
      LEFT JOIN activity_types at ON a.activity_type_id = at.id
      LEFT JOIN deals d ON u.id = d.assigned_to
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      WHERE u.role_id IN (SELECT id FROM roles WHERE name IN ('Comercial', 'Gerente de Ventas'))
        AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_activities DESC
    `;

    // Distribución de tipos de actividades
    const activityTypesQuery = `
      SELECT 
        at.name as activity_type,
        at.color,
        COUNT(a.id) as activity_count,
        ROUND((COUNT(a.id)::decimal / (SELECT COUNT(*) FROM activities ${whereClause})) * 100, 1) as percentage
      FROM activity_types at
      LEFT JOIN activities a ON at.id = a.activity_type_id ${whereClause.replace('WHERE 1=1', 'AND 1=1')}
      WHERE at.is_active = true
      GROUP BY at.id, at.name, at.color
      ORDER BY activity_count DESC
    `;

    // Actividades por estado
    const activityStatusQuery = `
      SELECT 
        a.status,
        COUNT(*) as count,
        ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM activities ${whereClause})) * 100, 1) as percentage
      FROM activities a
      ${whereClause}
      GROUP BY a.status
      ORDER BY count DESC
    `;

    const [userMetrics, activityTypes, activityStatus] = await Promise.all([
      query(userMetricsQuery, params),
      query(activityTypesQuery, params),
      query(activityStatusQuery, params)
    ]);

    res.json({
      success: true,
      data: {
        userMetrics: userMetrics.rows,
        activityTypes: activityTypes.rows,
        activityStatus: activityStatus.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas de actividades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/customer-analysis - Análisis de clientes
router.get('/customer-analysis', authenticateToken, requireRole(['Administrador del CRM', 'Gerente de Ventas']), async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Estadísticas generales de clientes
    const customerStatsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_contacts,
        COUNT(DISTINCT c.id) FILTER (WHERE c.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as new_contacts,
        COUNT(DISTINCT comp.id) as total_companies,
        COUNT(DISTINCT comp.id) FILTER (WHERE comp.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as new_companies,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_contacts,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'inactive') as inactive_contacts
      FROM contacts c
      LEFT JOIN companies comp ON c.company_id = comp.id
    `;

    // Distribución por fuente
    const sourceDistributionQuery = `
      SELECT 
        COALESCE(c.source, 'No especificado') as source,
        COUNT(*) as contact_count,
        ROUND((COUNT(*)::decimal / (SELECT COUNT(*) FROM contacts)) * 100, 1) as percentage
      FROM contacts c
      GROUP BY c.source
      ORDER BY contact_count DESC
    `;

    // Top empresas por número de contactos
    const topCompaniesQuery = `
      SELECT 
        comp.name as company_name,
        comp.industry,
        COUNT(c.id) as contact_count,
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.value) FILTER (WHERE dp.name = 'Cerrada-Ganada'), 0) as total_revenue
      FROM companies comp
      LEFT JOIN contacts c ON comp.id = c.company_id
      LEFT JOIN deals d ON c.id = d.contact_id
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      GROUP BY comp.id, comp.name, comp.industry
      HAVING COUNT(c.id) > 0
      ORDER BY contact_count DESC, total_revenue DESC
      LIMIT 10
    `;

    // Actividad de clientes (últimas interacciones)
    const customerActivityQuery = `
      SELECT 
        CASE 
          WHEN last_activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'Última semana'
          WHEN last_activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'Último mes'
          WHEN last_activity_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'Últimos 3 meses'
          WHEN last_activity_date IS NOT NULL THEN 'Más de 3 meses'
          ELSE 'Sin actividad'
        END as activity_period,
        COUNT(*) as contact_count
      FROM (
        SELECT 
          c.id,
          MAX(a.start_date) as last_activity_date
        FROM contacts c
        LEFT JOIN activities a ON c.id = a.contact_id
        GROUP BY c.id
      ) contact_activity
      GROUP BY 
        CASE 
          WHEN last_activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'Última semana'
          WHEN last_activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'Último mes'
          WHEN last_activity_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'Últimos 3 meses'
          WHEN last_activity_date IS NOT NULL THEN 'Más de 3 meses'
          ELSE 'Sin actividad'
        END
      ORDER BY 
        CASE 
          WHEN activity_period = 'Última semana' THEN 1
          WHEN activity_period = 'Último mes' THEN 2
          WHEN activity_period = 'Últimos 3 meses' THEN 3
          WHEN activity_period = 'Más de 3 meses' THEN 4
          ELSE 5
        END
    `;

    const [customerStats, sourceDistribution, topCompanies, customerActivity] = await Promise.all([
      query(customerStatsQuery),
      query(sourceDistributionQuery),
      query(topCompaniesQuery),
      query(customerActivityQuery)
    ]);

    res.json({
      success: true,
      data: {
        customerStats: customerStats.rows[0],
        sourceDistribution: sourceDistribution.rows,
        topCompanies: topCompanies.rows,
        customerActivity: customerActivity.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo análisis de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/reports/dashboard-summary - Resumen para el dashboard principal
router.get('/dashboard-summary', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role_name;
    
    // Filtros según el rol
    let userFilter = '';
    if (userRole === 'Comercial') {
      userFilter = `AND assigned_to = ${userId}`;
    }

    // Estadísticas de negocios
    const dealsStatsQuery = `
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE dp.name = 'Cerrada-Ganada') as won_deals,
        COUNT(*) FILTER (WHERE dp.name = 'Cerrada-Perdida') as lost_deals,
        COUNT(*) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')) as open_deals,
        COALESCE(SUM(value) FILTER (WHERE dp.name = 'Cerrada-Ganada'), 0) as won_value,
        COALESCE(SUM(value) FILTER (WHERE dp.name NOT IN ('Cerrada-Ganada', 'Cerrada-Perdida')), 0) as pipeline_value
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      WHERE d.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      ${userFilter}
    `;

    // Estadísticas de actividades
    const activitiesStatsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_activities,
        COUNT(*) FILTER (WHERE start_date < CURRENT_TIMESTAMP AND status = 'planned') as overdue_activities,
        COUNT(*) FILTER (WHERE DATE(start_date) = CURRENT_DATE AND status = 'planned') as today_activities
      FROM activities
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      ${userFilter}
    `;

    // Estadísticas de contactos
    let contactsStatsQuery = '';
    if (userRole !== 'Comercial') {
      contactsStatsQuery = `
        SELECT 
          COUNT(*) as total_contacts,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as new_contacts,
          COUNT(*) FILTER (WHERE status = 'active') as active_contacts
        FROM contacts
      `;
    } else {
      contactsStatsQuery = `
        SELECT 
          COUNT(*) as total_contacts,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days') as new_contacts,
          COUNT(*) FILTER (WHERE status = 'active') as active_contacts
        FROM contacts
        WHERE assigned_to = ${userId}
      `;
    }

    // Ingresos mensuales últimos 12 meses (para el gráfico)
    const monthlyRevenueQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', actual_close_date), 'YYYY-MM') AS month,
        COALESCE(SUM(value), 0) AS won_value
      FROM deals
      WHERE phase_id = 5 -- Cerrada-Ganada
        AND actual_close_date IS NOT NULL
        AND actual_close_date >= CURRENT_DATE - INTERVAL '12 months'
        ${userFilter}
      GROUP BY month
      ORDER BY month
    `;

    // Negocios por estado (opcional si lo usas en frontend)
    const dealsByStatusQuery = `
      SELECT 
        dp.name AS status,
        COUNT(*) AS count
      FROM deals d
      LEFT JOIN deal_phases dp ON d.phase_id = dp.id
      WHERE d.created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
      ${userFilter}
      GROUP BY dp.name
      ORDER BY count DESC
    `;

    // Próximas actividades
    const upcomingActivitiesQuery = `
      SELECT 
        a.id,
        a.title,
        a.start_date,
        at.name as activity_type,
        at.color as activity_color,
        c.first_name || ' ' || c.last_name as contact_name,
        comp.name as company_name
      FROM activities a
      LEFT JOIN activity_types at ON a.activity_type_id = at.id
      LEFT JOIN contacts c ON a.contact_id = c.id
      LEFT JOIN companies comp ON a.company_id = comp.id
      WHERE a.status = 'planned'
        AND a.start_date >= CURRENT_TIMESTAMP
        AND a.start_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
        ${userFilter}
      ORDER BY a.start_date ASC
      LIMIT 5
    `;

    // Ejecutar queries en paralelo
    const [
      dealsStats, 
      activitiesStats, 
      contactsStats, 
      upcomingActivities,
      monthlyRevenue,
      dealsByStatus
    ] = await Promise.all([
      query(dealsStatsQuery),
      query(activitiesStatsQuery),
      query(contactsStatsQuery),
      query(upcomingActivitiesQuery),
      query(monthlyRevenueQuery),
      query(dealsByStatusQuery)
    ]);

    // Respuesta final
    res.json({
      success: true,
      data: {
        dealsStats: dealsStats.rows[0],
        activitiesStats: activitiesStats.rows[0],
        contactsStats: contactsStats.rows[0],
        upcomingActivities: upcomingActivities.rows,
        monthlyRevenue: monthlyRevenue.rows,
        dealsByStatus: dealsByStatus.rows
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
