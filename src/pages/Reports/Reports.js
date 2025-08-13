import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const Reports = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // week, month, quarter, year
  const [reportType, setReportType] = useState('sales'); // sales, activities, contacts, deals
  const [salesData, setSalesData] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);
  const [dealsData, setDealsData] = useState([]);
  const [contactsData, setContactsData] = useState([]);
  const [kpis, setKpis] = useState({});
  const [topPerformers, setTopPerformers] = useState([]);
  const [dealsByStatus, setDealsByStatus] = useState([]);
  const [activitiesByType, setActivitiesByType] = useState([]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      // In a real app, these would be separate API calls
      const [salesResponse, activitiesResponse, dealsResponse, contactsResponse] = await Promise.all([
        api.get(`/reports/sales?range=${dateRange}`),
        api.get(`/reports/activities?range=${dateRange}`),
        api.get(`/reports/deals?range=${dateRange}`),
        api.get(`/reports/contacts?range=${dateRange}`),
      ]);
      
      setSalesData(salesResponse.data);
      setActivitiesData(activitiesResponse.data);
      setDealsData(dealsResponse.data);
      setContactsData(contactsResponse.data);
    } catch (error) {
      console.error('Error loading reports data:', error);
      showNotification('Error al cargar los reportes', 'error');
      
      // Mock data for demo
      setSalesData([
        { month: 'Ene', ventas: 45000, meta: 50000 },
        { month: 'Feb', ventas: 52000, meta: 50000 },
        { month: 'Mar', ventas: 48000, meta: 50000 },
        { month: 'Abr', ventas: 61000, meta: 55000 },
        { month: 'May', ventas: 55000, meta: 55000 },
        { month: 'Jun', ventas: 67000, meta: 60000 },
      ]);
      
      setActivitiesData([
        { week: 'Sem 1', llamadas: 25, reuniones: 8, emails: 45, tareas: 12 },
        { week: 'Sem 2', llamadas: 30, reuniones: 12, emails: 52, tareas: 15 },
        { week: 'Sem 3', llamadas: 28, reuniones: 10, emails: 48, tareas: 18 },
        { week: 'Sem 4', llamadas: 35, reuniones: 15, emails: 60, tareas: 20 },
      ]);
      
      setDealsData([
        { stage: 'Prospecto', count: 15, value: 125000 },
        { stage: 'Calificado', count: 12, value: 180000 },
        { stage: 'Propuesta', count: 8, value: 240000 },
        { stage: 'Negociación', count: 5, value: 175000 },
        { stage: 'Cerrado', count: 3, value: 90000 },
      ]);
      
      setContactsData([
        { source: 'Web', count: 45, percentage: 35 },
        { source: 'Referidos', count: 32, percentage: 25 },
        { source: 'Redes Sociales', count: 28, percentage: 22 },
        { source: 'Email Marketing', count: 15, percentage: 12 },
        { source: 'Eventos', count: 8, percentage: 6 },
      ]);
      
      setKpis({
        totalSales: 328000,
        salesGrowth: 12.5,
        totalDeals: 43,
        conversionRate: 18.6,
        avgDealValue: 7628,
        totalActivities: 245,
        activitiesGrowth: 8.3,
        totalContacts: 128,
        contactsGrowth: 15.2,
      });
      
      setTopPerformers([
        { name: 'Juan Admin', sales: 85000, deals: 12, activities: 68 },
        { name: 'user', sales: 72000, deals: 10, activities: 55 },
        { name: 'Ana Sales', sales: 68000, deals: 9, activities: 62 },
        { name: 'Carlos Rep', sales: 45000, deals: 7, activities: 45 },
        { name: 'Luis Agent', sales: 38000, deals: 5, activities: 38 },
      ]);
      
      setDealsByStatus([
        { name: 'Ganados', value: 35, color: '#4caf50' },
        { name: 'En Progreso', value: 28, color: '#2196f3' },
        { name: 'Perdidos', value: 15, color: '#f44336' },
        { name: 'Pausados', value: 22, color: '#ff9800' },
      ]);
      
      setActivitiesByType([
        { name: 'Llamadas', value: 118, color: '#1976d2' },
        { name: 'Reuniones', value: 45, color: '#388e3c' },
        { name: 'Emails', value: 205, color: '#f57c00' },
        { name: 'Tareas', value: 65, color: '#7b1fa2' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleExportReport = () => {
    showNotification('Función de exportación en desarrollo', 'info');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? (
      <TrendingUpIcon sx={{ color: 'success.main', ml: 1 }} />
    ) : (
      <TrendingDownIcon sx={{ color: 'error.main', ml: 1 }} />
    );
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'success.main' : 'error.main';
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando reportes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reportes y Análisis
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={dateRange}
              label="Período"
              onChange={handleDateRangeChange}
            >
              <MenuItem value="week">Esta Semana</MenuItem>
              <MenuItem value="month">Este Mes</MenuItem>
              <MenuItem value="quarter">Este Trimestre</MenuItem>
              <MenuItem value="year">Este Año</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportReport}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Ventas Totales
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {formatCurrency(kpis.totalSales)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color={getGrowthColor(kpis.salesGrowth)}>
                      {kpis.salesGrowth > 0 ? '+' : ''}{kpis.salesGrowth}%
                    </Typography>
                    {getGrowthIcon(kpis.salesGrowth)}
                  </Box>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Tasa de Conversión
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {kpis.conversionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {kpis.totalDeals} negocios activos
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Valor Promedio
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {formatCurrency(kpis.avgDealValue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Por negocio
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Actividades
                  </Typography>
                  <Typography variant="h5" component="h2">
                    {kpis.totalActivities}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color={getGrowthColor(kpis.activitiesGrowth)}>
                      {kpis.activitiesGrowth > 0 ? '+' : ''}{kpis.activitiesGrowth}%
                    </Typography>
                    {getGrowthIcon(kpis.activitiesGrowth)}
                  </Box>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ventas vs Meta Mensual
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="ventas" fill="#1976d2" name="Ventas" />
                <Bar dataKey="meta" fill="#ff9800" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Deals by Status */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Negocios por Estado
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dealsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dealsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {dealsByStatus.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.color,
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {item.name}: {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Activities Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividades por Semana
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activitiesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="llamadas" stackId="1" stroke="#1976d2" fill="#1976d2" />
                <Area type="monotone" dataKey="reuniones" stackId="1" stroke="#388e3c" fill="#388e3c" />
                <Area type="monotone" dataKey="emails" stackId="1" stroke="#f57c00" fill="#f57c00" />
                <Area type="monotone" dataKey="tareas" stackId="1" stroke="#7b1fa2" fill="#7b1fa2" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Performers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vendedor</TableCell>
                    <TableCell align="right">Ventas</TableCell>
                    <TableCell align="right">Negocios</TableCell>
                    <TableCell align="right">Actividades</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topPerformers.map((performer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {performer.name.charAt(0)}
                          </Avatar>
                          {performer.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(performer.sales)}
                      </TableCell>
                      <TableCell align="right">{performer.deals}</TableCell>
                      <TableCell align="right">{performer.activities}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Pipeline Analysis */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Análisis del Pipeline
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Etapa</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Valor Total</TableCell>
                    <TableCell align="right">Valor Promedio</TableCell>
                    <TableCell>Progreso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dealsData.map((stage, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          label={stage.stage}
                          size="small"
                          color={index < 2 ? 'primary' : index < 4 ? 'warning' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="right">{stage.count}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(stage.value)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(stage.value / stage.count)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={(stage.count / 15) * 100}
                            sx={{ width: 100, mr: 1 }}
                            color={index < 2 ? 'primary' : index < 4 ? 'warning' : 'success'}
                          />
                          <Typography variant="body2">
                            {Math.round((stage.count / 15) * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Contact Sources */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fuentes de Contactos
            </Typography>
            <List>
              {contactsData.map((source, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: `hsl(${index * 60}, 70%, 50%)` }}>
                      <PersonIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={source.source}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {source.count} contactos ({source.percentage}%)
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={source.percentage}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;