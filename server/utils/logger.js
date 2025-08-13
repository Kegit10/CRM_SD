const { query } = require('../config/database');

/**
 * Registra una actividad en el sistema de logs
 * @param {number} userId - ID del usuario que realiza la acción
 * @param {string} action - Acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)
 * @param {string} entityType - Tipo de entidad (users, contacts, deals, activities, etc.)
 * @param {number} entityId - ID de la entidad afectada
 * @param {object} oldValues - Valores anteriores (para UPDATE)
 * @param {object} newValues - Valores nuevos (para CREATE/UPDATE)
 * @param {string} ipAddress - Dirección IP del usuario
 * @param {string} userAgent - User Agent del navegador
 */
const logActivity = async (userId, action, entityType, entityId, oldValues = null, newValues = null, ipAddress = null, userAgent = null) => {
    try {
        await query(
            `INSERT INTO system_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId,
                action,
                entityType,
                entityId,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                ipAddress,
                userAgent
            ]
        );
    } catch (error) {
        console.error('Error registrando actividad en logs:', error);
        // No lanzamos el error para no interrumpir la operación principal
    }
};

/**
 * Obtiene los logs del sistema con filtros y paginación
 * @param {object} filters - Objeto con los filtros (action, table_name, user_id, start_date, end_date, ip_address)
 * @param {number} page - Número de página actual
 * @param {number} limit - Límite de registros por página
 */
const getLogs = async (filters = {}, page = 1, limit = 50) => {
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Asegúrate de que user_id sea un número si está presente y no es una cadena vacía
        if (filters.user_id) {
            const parsedUserId = parseInt(filters.user_id, 10);
            if (!isNaN(parsedUserId)) {
                whereClause += ` AND sl.user_id = $${paramIndex}`;
                params.push(parsedUserId);
                paramIndex++;
            }
        }

        if (filters.action) {
            whereClause += ` AND sl.action = $${paramIndex}`;
            params.push(filters.action);
            paramIndex++;
        }

        if (filters.table_name) { // Asegúrate de que este filtro existe en el objeto filters
            whereClause += ` AND sl.table_name = $${paramIndex}`;
            params.push(filters.table_name);
            paramIndex++;
        }

        if (filters.start_date) {
            whereClause += ` AND sl.created_at >= $${paramIndex}`;
            params.push(filters.start_date);
            paramIndex++;
        }

        if (filters.end_date) {
            whereClause += ` AND sl.created_at <= $${paramIndex}`;
            params.push(filters.end_date);
            paramIndex++;
        }

        if (filters.ip_address) {
            whereClause += ` AND sl.ip_address = $${paramIndex}`;
            params.push(filters.ip_address);
            paramIndex++;
        }

        // Calcular offset
        const offset = (page - 1) * limit;

        // Consulta principal
        const logsQuery = `
            SELECT 
                sl.*,
                u.username,
                u.first_name,
                u.last_name,
                r.name as role_name
            FROM system_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereClause}
            ORDER BY sl.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        // Los parámetros para la consulta de logs incluyen los filtros y luego limit y offset
        const logsParams = [...params, limit, offset];

        // Consulta para contar total, usa los mismos parámetros de filtro pero sin limit y offset
        const countQuery = `
            SELECT COUNT(*) as total
            FROM system_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            ${whereClause}
        `;
        // Los parámetros para la consulta de conteo son solo los filtros
        const countParams = [...params]; 

        const [logsResult, countResult] = await Promise.all([
            query(logsQuery, logsParams),
            query(countQuery, countParams) 
        ]);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return {
            logs: logsResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords: total,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    } catch (error) {
        console.error('Error obteniendo logs:', error);
        throw error;
    }
};

/**
 * Exporta logs a CSV con filtros
 * @param {object} filters - Objeto con los filtros (action, table_name, user_id, start_date, end_date, ip_address)
 */
const exportLogsToCSV = async (filters = {}) => {
    try {
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Asegúrate de que user_id sea un número si está presente y no es una cadena vacía
        if (filters.user_id) {
            const parsedUserId = parseInt(filters.user_id, 10);
            if (!isNaN(parsedUserId)) {
                whereClause += ` AND sl.user_id = $${paramIndex}`;
                params.push(parsedUserId);
                paramIndex++;
            }
        }

        if (filters.action) {
            whereClause += ` AND sl.action = $${paramIndex}`;
            params.push(filters.action);
            paramIndex++;
        }

        if (filters.table_name) {
            whereClause += ` AND sl.table_name = $${paramIndex}`;
            params.push(filters.table_name);
            paramIndex++;
        }

        if (filters.start_date) {
            whereClause += ` AND sl.created_at >= $${paramIndex}`;
            params.push(filters.start_date);
            paramIndex++;
        }

        if (filters.end_date) {
            whereClause += ` AND sl.created_at <= $${paramIndex}`;
            params.push(filters.end_date);
            paramIndex++;
        }

        if (filters.ip_address) {
            whereClause += ` AND sl.ip_address = $${paramIndex}`;
            params.push(filters.ip_address);
            paramIndex++;
        }

        const exportQuery = `
            SELECT 
                sl.id,
                sl.action,
                sl.entity_type,
                sl.entity_id,
                u.username,
                u.first_name || ' ' || u.last_name as full_name,
                r.name as role_name,
                sl.ip_address,
                sl.created_at
            FROM system_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereClause}
            ORDER BY sl.created_at DESC
        `;

        const result = await query(exportQuery, params);
        return result.rows;
    } catch (error) {
        console.error('Error exportando logs:', error);
        throw error;
    }
};

/**
 * Limpia logs antiguos (mantiene solo los últimos N días)
 * @param {number} daysToKeep - Días a mantener
 */
const cleanOldLogs = async (daysToKeep = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await query(
            'DELETE FROM system_logs WHERE created_at < $1',
            [cutoffDate]
        );

        console.log(`Logs limpiados: ${result.rowCount} registros eliminados`);
        return result.rowCount;
    } catch (error) {
        console.error('Error limpiando logs antiguos:', error);
        throw error;
    }
};

/**
 * Obtiene estadísticas de actividad
 * @param {number} period - Período en días para el cual obtener estadísticas
 */
const getActivityStats = async (period = 30) => {
    try {
        const days = parseInt(period);
        let whereClause = `WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`;
        // En este caso, no hay otros filtros dinámicos que se pasen en un objeto 'filters'
        // por lo que no necesitamos params y paramIndex como en las otras funciones
        // La consulta de dashboard ya maneja 'period' directamente.

        // Estadísticas por acción
        const actionStatsQuery = `
            SELECT action, COUNT(*) as count
            FROM system_logs
            ${whereClause}
            GROUP BY action
            ORDER BY count DESC
        `;

        // Estadísticas por usuario
        const userStatsQuery = `
            SELECT 
                u.username,
                u.first_name || ' ' || u.last_name as full_name,
                COUNT(*) as activity_count
            FROM system_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            ${whereClause}
            GROUP BY u.id, u.username, u.first_name, u.last_name
            ORDER BY activity_count DESC
            LIMIT 10
        `;

        // Estadísticas por día
        const dailyStatsQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as activity_count
            FROM system_logs
            ${whereClause}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `;

        const [actionStats, userStats, dailyStats] = await Promise.all([
            query(actionStatsQuery),
            query(userStatsQuery),
            query(dailyStatsQuery)
        ]);

        return {
            actionStats: actionStats.rows,
            userStats: userStats.rows,
            dailyStats: dailyStats.rows
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas de actividad:', error);
        throw error;
    }
};

module.exports = {
    logActivity,
    getLogs,
    exportLogsToCSV,
    cleanOldLogs,
    getActivityStats
};