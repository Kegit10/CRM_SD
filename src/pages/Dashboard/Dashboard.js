import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  AttachMoney,
  Refresh,
  Phone,
  Email,
  Event,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalContacts: 0,
      totalDeals: 0,
      totalActivities: 0,
      totalRevenue: 0,
    },
    recentActivities: [],
    dealsByStatus: [],
    monthlyRevenue: [],
    upcomingActivities: [],
  });

 const loadDashboardData = async () => {
  try {
    setLoading(true);
    const response = await api.get('/reports/dashboard-summary');

    // Sacamos el verdadero payload
    const payload = response.data.data;

    // Normalizamos los datos que espera el dashboard
    const normalizedData = {
      stats: {
        totalContacts: Number(payload.contactsStats.total_contacts),
        totalDeals: Number(payload.dealsStats.total_deals),
        totalActivities: Number(payload.activitiesStats.total_activities),
        totalRevenue: Number(payload.dealsStats.won_value),
      },
      recentActivities: [], // Si el backend te devuelve algo aquí, agrégalo
      dealsByStatus: [
        { name: 'Nuevo', value: Number(payload.dealsStats.open_deals), color: '#8884d8' },
        { name: 'Ganado', value: Number(payload.dealsStats.won_deals), color: '#82ca9d' },
        { name: 'Perdido', value: Number(payload.dealsStats.lost_deals), color: '#ffc658' },
      ],
      monthlyRevenue: [], // Llénalo según la API si devuelve esto
      upcomingActivities: payload.upcomingActivities || [],
    };

    setDashboardData(normalizedData);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('Error al cargar los datos del dashboard', 'error');

    // Mock data opcional
    setDashboardData({
      stats: {
        totalContacts: 156,
        totalDeals: 42,
        totalActivities: 89,
        totalRevenue: 125000,
      },
      recentActivities: [],
      dealsByStatus: [],
      monthlyRevenue: [],
      upcomingActivities: [],
    });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone />;
      case 'email':
        return <Email />;
      case 'meeting':
        return <Event />;
      default:
        return <Assignment />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'call':
        return 'primary';
      case 'email':
        return 'secondary';
      case 'meeting':
        return 'success';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Bienvenido, {user?.name || 'Usuario'}
          </Typography>
        </Box>
        <IconButton onClick={loadDashboardData} color="primary">
          <Refresh />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Contactos"
            value={dashboardData.stats.totalContacts}
            icon={<People sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Negocios Activos"
            value={dashboardData.stats.totalDeals}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Actividades"
            value={dashboardData.stats.totalActivities}
            icon={<Assignment sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ingresos Totales"
            value={formatCurrency(dashboardData.stats.totalRevenue)}
            icon={<AttachMoney sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts and Activities */}
      <Grid container spacing={3}>
        {/* Monthly Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Ingresos Mensuales
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="won_value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Deals by Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Negocios por Estado
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.dealsByStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {dashboardData.dealsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Actividades Recientes
            </Typography>
            <List>
              {dashboardData.recentActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${new Date(activity.start_date).toLocaleDateString()} - ${new Date(activity.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      color={getActivityColor(activity.type)}
                    />
                  </ListItem>
                  {index < dashboardData.recentActivities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Próximas Actividades
            </Typography>
            <List>
              {dashboardData.upcomingActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${activity.date} - ${activity.time}`}
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      color={getActivityColor(activity.type)}
                    />
                  </ListItem>
                  {index < dashboardData.upcomingActivities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;