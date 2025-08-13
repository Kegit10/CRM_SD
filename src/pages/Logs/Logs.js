import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Logs = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    end: new Date().toISOString().split('T')[0]
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/logs', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          level: filterLevel !== 'all' ? filterLevel : undefined,
          action: filterAction !== 'all' ? filterAction : undefined,
          user_id: filterUser !== 'all' ? filterUser : undefined,
          search: searchTerm || undefined,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setLogs(response.data.logs || response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
      showNotification('Error al cargar los logs', 'error');
      // Mock data for demo
      setLogs([
        {
          id: 1,
          timestamp: '2024-01-20T10:30:15.123Z',
          level: 'info',
          action: 'login',
          user_id: 1,
          user_name: 'Juan Admin',
          message: 'Usuario inició sesión exitosamente',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'auth',
          resource_id: null,
          details: {
            session_id: 'sess_abc123',
            login_method: 'email',
            location: 'Bogotá, Colombia'
          }
        },
        {
          id: 2,
          timestamp: '2024-01-20T10:25:30.456Z',
          level: 'success',
          action: 'create',
          user_id: 2,
          user_name: 'María Manager',
          message: 'Nuevo contacto creado: Empresa ABC',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'contact',
          resource_id: 15,
          details: {
            contact_name: 'Empresa ABC',
            contact_email: 'info@empresaabc.com',
            contact_phone: '+57 300 123 4567'
          }
        },
        {
          id: 3,
          timestamp: '2024-01-20T10:20:45.789Z',
          level: 'warning',
          action: 'update',
          user_id: 3,
          user_name: 'Ana Sales',
          message: 'Intento de actualizar negocio sin permisos suficientes',
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'deal',
          resource_id: 8,
          details: {
            deal_title: 'Venta Software ERP',
            attempted_field: 'amount',
            required_permission: 'deals.update_amount'
          }
        },
        {
          id: 4,
          timestamp: '2024-01-20T10:15:20.012Z',
          level: 'error',
          action: 'delete',
          user_id: 1,
          user_name: 'Juan Admin',
          message: 'Error al eliminar actividad: Restricción de integridad',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'activity',
          resource_id: 25,
          details: {
            error_code: 'INTEGRITY_CONSTRAINT',
            error_message: 'Cannot delete activity with associated deals',
            activity_title: 'Reunión de seguimiento'
          }
        },
        {
          id: 5,
          timestamp: '2024-01-20T10:10:10.345Z',
          level: 'info',
          action: 'view',
          user_id: 4,
          user_name: 'Carlos Rep',
          message: 'Acceso a reporte de ventas mensuales',
          ip_address: '192.168.1.103',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'report',
          resource_id: 'monthly_sales',
          details: {
            report_type: 'sales',
            period: '2024-01',
            filters: {
              department: 'Ventas',
              status: 'closed_won'
            }
          }
        },
        {
          id: 6,
          timestamp: '2024-01-20T10:05:55.678Z',
          level: 'success',
          action: 'update',
          user_id: 2,
          user_name: 'María Manager',
          message: 'Configuración de sistema actualizada',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'settings',
          resource_id: 'email_notifications',
          details: {
            setting_key: 'email_notifications',
            old_value: 'disabled',
            new_value: 'enabled',
            affected_users: 15
          }
        },
        {
          id: 7,
          timestamp: '2024-01-20T09:58:30.901Z',
          level: 'warning',
          action: 'login_failed',
          user_id: null,
          user_name: 'Desconocido',
          message: 'Intento de inicio de sesión fallido',
          ip_address: '203.0.113.45',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          resource_type: 'auth',
          resource_id: null,
          details: {
            email: 'admin@fake.com',
            reason: 'invalid_credentials',
            attempts_count: 3,
            blocked_until: '2024-01-20T10:58:30.901Z'
          }
        },
        {
          id: 8,
          timestamp: '2024-01-20T09:45:15.234Z',
          level: 'info',
          action: 'export',
          user_id: 1,
          user_name: 'Juan Admin',
          message: 'Exportación de datos de contactos completada',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'contact',
          resource_id: null,
          details: {
            export_format: 'CSV',
            records_count: 150,
            file_size: '2.3 MB',
            download_url: '/exports/contacts_20240120.csv'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      // Mock users for demo
      setUsers([
        { id: 1, name: 'Juan Admin' },
        { id: 2, name: 'María Manager' },
        { id: 3, name: 'Ana Sales' },
        { id: 4, name: 'Carlos Rep' },
      ]);
    }
  };

  useEffect(() => {
    loadLogs();
    loadUsers();
  }, [page, rowsPerPage, filterLevel, filterAction, filterUser, dateRange]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 0) {
        loadLogs();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterLevelChange = (event) => {
    setFilterLevel(event.target.value);
    setPage(0);
  };

  const handleFilterActionChange = (event) => {
    setFilterAction(event.target.value);
    setPage(0);
  };

  const handleFilterUserChange = (event) => {
    setFilterUser(event.target.value);
    setPage(0);
  };

  const handleDateRangeChange = (field) => (event) => {
    setDateRange(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const handleRefresh = () => {
    loadLogs();
    showNotification('Logs actualizados', 'success');
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/logs/export', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          level: filterLevel !== 'all' ? filterLevel : undefined,
          action: filterAction !== 'all' ? filterAction : undefined,
          user_id: filterUser !== 'all' ? filterUser : undefined,
          search: searchTerm || undefined,
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs_${dateRange.start}_${dateRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showNotification('Logs exportados exitosamente', 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      showNotification('Error al exportar los logs', 'error');
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'success':
        return <SuccessIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'info';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
      case 'logout':
      case 'login_failed':
        return <SecurityIcon />;
      case 'create':
      case 'update':
      case 'delete':
        return <AssignmentIcon />;
      case 'view':
        return <ViewIcon />;
      case 'export':
        return <DownloadIcon />;
      default:
        return <EventIcon />;
    }
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'contact':
        return <PersonIcon />;
      case 'deal':
        return <BusinessIcon />;
      case 'activity':
        return <EventIcon />;
      case 'auth':
        return <SecurityIcon />;
      case 'settings':
        return <SettingsIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogStats = () => {
    const total = logs.length;
    const errors = logs.filter(log => log.level === 'error').length;
    const warnings = logs.filter(log => log.level === 'warning').length;
    const success = logs.filter(log => log.level === 'success').length;
    const info = logs.filter(log => log.level === 'info').length;
    
    return { total, errors, warnings, success, info };
  };

  const stats = getLogStats();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando logs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Logs del Sistema
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Logs
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stats.total}
                  </Typography>
                </Box>
                <InfoIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Errores
                  </Typography>
                  <Typography variant="h4" component="h2" color="error.main">
                    {stats.errors}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Advertencias
                  </Typography>
                  <Typography variant="h4" component="h2" color="warning.main">
                    {stats.warnings}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Éxitos
                  </Typography>
                  <Typography variant="h4" component="h2" color="success.main">
                    {stats.success}
                  </Typography>
                </Box>
                <SuccessIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Información
                  </Typography>
                  <Typography variant="h4" component="h2" color="info.main">
                    {stats.info}
                  </Typography>
                </Box>
                <InfoIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Inicio"
              value={dateRange.start}
              onChange={handleDateRangeChange('start')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Fin"
              value={dateRange.end}
              onChange={handleDateRangeChange('end')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Nivel</InputLabel>
              <Select
                value={filterLevel}
                label="Nivel"
                onChange={handleFilterLevelChange}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warning">Advertencia</MenuItem>
                <MenuItem value="success">Éxito</MenuItem>
                <MenuItem value="info">Información</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Acción</InputLabel>
              <Select
                value={filterAction}
                label="Acción"
                onChange={handleFilterActionChange}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="login">Inicio de sesión</MenuItem>
                <MenuItem value="logout">Cierre de sesión</MenuItem>
                <MenuItem value="create">Crear</MenuItem>
                <MenuItem value="update">Actualizar</MenuItem>
                <MenuItem value="delete">Eliminar</MenuItem>
                <MenuItem value="view">Ver</MenuItem>
                <MenuItem value="export">Exportar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <FormControl fullWidth>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={filterUser}
                label="Usuario"
                onChange={handleFilterUserChange}
              >
                <MenuItem value="all">Todos</MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Logs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Nivel</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Mensaje</TableCell>
                <TableCell>Recurso</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getLevelIcon(log.level)}
                      label={log.level.toUpperCase()}
                      size="small"
                      color={getLevelColor(log.level)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActionIcon(log.action)}
                      <Typography variant="body2">
                        {log.action}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.user_name || 'Sistema'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 300, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {log.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {log.resource_type && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getResourceIcon(log.resource_type)}
                        <Typography variant="body2">
                          {log.resource_type}
                          {log.resource_id && ` #${log.resource_id}`}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.ip_address}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(log)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={logs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Log Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Log
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Información General</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getLevelColor(selectedLog.level) + '.main' }}>
                          {getLevelIcon(selectedLog.level)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`Nivel: ${selectedLog.level.toUpperCase()}`}
                        secondary={formatTimestamp(selectedLog.timestamp)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Usuario"
                        secondary={selectedLog.user_name || 'Sistema'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Acción"
                        secondary={selectedLog.action}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Mensaje"
                        secondary={selectedLog.message}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Información Técnica</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Dirección IP"
                        secondary={selectedLog.ip_address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="User Agent"
                        secondary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              wordBreak: 'break-all',
                              fontSize: '0.75rem'
                            }}
                          >
                            {selectedLog.user_agent}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {selectedLog.resource_type && (
                      <ListItem>
                        <ListItemText
                          primary="Recurso"
                          secondary={`${selectedLog.resource_type}${selectedLog.resource_id ? ` #${selectedLog.resource_id}` : ''}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                
                {selectedLog.details && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>Detalles Adicionales</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Logs;