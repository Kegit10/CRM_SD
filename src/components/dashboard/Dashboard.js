import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { apiService } from '../../services/api';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { handleApiError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalDeals: 0,
      totalValue: 0,
      totalActivities: 0,
      totalContacts: 0,
      pendingActivities: 0,
      overdueActivities: 0,
    },
    recentActivities: [],
    dealsByPhase: [],
    salesTrend: [],
    topPerformers: [],
  });

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [summaryResponse, activitiesResponse] = await Promise.all([
        apiService.reports.getDashboardSummary({ period: '30' }),
        apiService.activities.getAll({ limit: 5, status: 'planned' }),
      ]);
      
      // Load additional data for managers and admins
      let dealsByPhase = [];
      let salesTrend = [];
      let topPerformers = [];
      
      if (isAdmin() || isManager()) {
        const [pipelineResponse, salesResponse] = await Promise.all([
          apiService.reports.getPipelineAnalysis(),
          apiService.reports.getSalesPerformance({ period: '6' }),
        ]);
        
        dealsByPhase = pipelineResponse.data?.data?.phaseDistribution || [];
        salesTrend = salesResponse.data?.data?.salesTrend || [];
        topPerformers = salesResponse.data?.data?.userPerformance?.slice(0, 5) || [];
      }
      
      setDashboardData({
        summary: summaryResponse.data?.data || {},
        recentActivities: activitiesResponse.data?.data?.activities || [],
        dealsByPhase,
        salesTrend,
        topPerformers,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      handleApiError(error, 'Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/reports/dashboard-summary');
      console.log('Dashboard data:', response.data.data); // Aquí se verá en consola
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error al obtener el dashboard:', error);
    }
  };
  fetchData();
}, []);


  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get activity status color
  const getActivityStatusColor = (startDate) => {
    const now = new Date();
    const activityDate = new Date(startDate);
    const diffHours = (activityDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'error'; // Overdue
    if (diffHours < 24) return 'warning'; // Today
    return 'success'; // Future
  };

  // Colors for charts
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const pieColors = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.error, COLORS.info];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido, {user?.first_name}. Aquí tienes un resumen de tu actividad.
          </Typography>
        </Box>
        <IconButton onClick={loadDashboardData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Negocios
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData.summary.totalDeals || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: COLORS.primary }}>
                  <BusinessIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Valor Total
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(dashboardData.summary.totalValue || 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: COLORS.success }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Actividades
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData.summary.totalActivities || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: COLORS.warning }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Contactos
                  </Typography>
                  <Typography variant="h4" component="div">
                    {dashboardData.summary.totalContacts || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: COLORS.info }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Próximas Actividades
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/activities')}
                >
                  Ver todas
                </Button>
              </Box>
              
              {dashboardData.recentActivities.length > 0 ? (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {dashboardData.recentActivities.map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemIcon>
                        <CalendarIcon color={getActivityStatusColor(activity.start_date)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.contact_name} - {activity.company_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(activity.start_date)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={activity.activity_type_name}
                        size="small"
                        color={getActivityStatusColor(activity.start_date)}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No hay actividades próximas
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Deals by Phase (for managers and admins) */}
        {(isAdmin() || isManager()) && (
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Distribución de Negocios por Fase
                </Typography>
                
                {dashboardData.dealsByPhase.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.dealsByPhase}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {dashboardData.dealsByPhase.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Negocios']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No hay datos de negocios disponibles
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Sales Trend (for managers and admins) */}
        {(isAdmin() || isManager()) && dashboardData.salesTrend.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Tendencia de Ventas (Últimos 6 meses)
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Ventas']} />
                    <Line 
                      type="monotone" 
                      dataKey="totalValue" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top Performers (for managers and admins) */}
        {(isAdmin() || isManager()) && dashboardData.topPerformers.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Mejores Comerciales
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user_name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Ventas']} />
                    <Bar dataKey="totalValue" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;