import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Profile = () => {
  const { showNotification } = useNotification();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    bio: '',
    avatar: null,
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'es',
    timezone: 'America/Bogota',
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    marketingEmails: false,
    dashboardLayout: 'default',
    itemsPerPage: 25,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || '',
        avatar: user.avatar || null,
      });
      loadUserStats();
      loadUserActivities();
      loadUserPreferences();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const response = await api.get('/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Mock data for demo
      setStats({
        totalDeals: 15,
        totalActivities: 68,
        totalSales: 125000,
        dealsThisMonth: 5,
        activitiesThisMonth: 22,
        salesThisMonth: 45000,
        avgDealValue: 8333,
        conversionRate: 65,
        lastLogin: '2024-01-20T10:30:00',
        accountCreated: '2024-01-01',
      });
    }
  };

  const loadUserActivities = async () => {
    try {
      const response = await api.get('/users/activities');
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading user activities:', error);
      // Mock data for demo
      setActivities([
        {
          id: 1,
          action: 'login',
          description: 'Inicio de sesión',
          timestamp: '2024-01-20T10:30:00',
          ip_address: '192.168.1.100',
        },
        {
          id: 2,
          action: 'create_deal',
          description: 'Creó el negocio "Venta Software ERP"',
          timestamp: '2024-01-20T09:15:00',
          resource_id: 15,
        },
        {
          id: 3,
          action: 'update_contact',
          description: 'Actualizó el contacto "Empresa ABC"',
          timestamp: '2024-01-19T16:45:00',
          resource_id: 8,
        },
        {
          id: 4,
          action: 'create_activity',
          description: 'Programó reunión de seguimiento',
          timestamp: '2024-01-19T14:20:00',
          resource_id: 25,
        },
        {
          id: 5,
          action: 'view_report',
          description: 'Consultó reporte de ventas mensuales',
          timestamp: '2024-01-19T11:30:00',
        },
      ]);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await api.get('/users/preferences');
      setPreferences(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferenceChange = (event) => {
    const { name, value, checked } = event.target;
    setPreferences(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/profile', profileData);
      updateUser(response.data);
      setEditingProfile(false);
      showNotification('Perfil actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Error al actualizar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      setLoading(true);
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setEditingPassword(false);
      showNotification('Contraseña actualizada exitosamente', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showNotification('Error al actualizar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await api.put('/users/preferences', preferences);
      showNotification('Preferencias guardadas exitosamente', 'success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showNotification('Error al guardar las preferencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || '',
        avatar: user.avatar || null,
      });
    }
    setEditingProfile(false);
  };

  const handleCancelPasswordEdit = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setEditingPassword(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
        return <SecurityIcon />;
      case 'create_deal':
      case 'update_deal':
        return <TrendingUpIcon />;
      case 'create_contact':
      case 'update_contact':
        return <PersonIcon />;
      case 'create_activity':
      case 'update_activity':
        return <AssignmentIcon />;
      case 'view_report':
        return <DashboardIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`profile-tabpanel-${index}`}
        aria-labelledby={`profile-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mi Perfil
        </Typography>
      </Box>

      {/* Profile Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}
              src={profileData.avatar}
            >
              {profileData.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                {profileData.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user.role === 'admin' ? 'Administrador' : 
                 user.role === 'manager' ? 'Gerente' : 'Agente'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profileData.department}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  icon={<EmailIcon />}
                  label={profileData.email}
                  variant="outlined"
                  size="small"
                />
                {profileData.phone && (
                  <Chip
                    icon={<PhoneIcon />}
                    label={profileData.phone}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Último acceso
              </Typography>
              <Typography variant="body2">
                {formatDate(stats.lastLogin)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Miembro desde
              </Typography>
              <Typography variant="body2">
                {new Date(stats.accountCreated).toLocaleDateString('es-ES')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Negocios
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stats.totalDeals}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{stats.dealsThisMonth} este mes
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
                    Total Actividades
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stats.totalActivities}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{stats.activitiesThisMonth} este mes
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'info.main' }} />
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
                    Ventas Totales
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {formatCurrency(stats.totalSales)}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +{formatCurrency(stats.salesThisMonth)} este mes
                  </Typography>
                </Box>
                <DashboardIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Tasa Conversión
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stats.conversionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Promedio: {formatCurrency(stats.avgDealValue)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab icon={<PersonIcon />} label="Información Personal" />
          <Tab icon={<SecurityIcon />} label="Seguridad" />
          <Tab icon={<SettingsIcon />} label="Preferencias" />
          <Tab icon={<HistoryIcon />} label="Actividad Reciente" />
        </Tabs>

        {/* Personal Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Información Personal</Typography>
            {!editingProfile ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingProfile(true)}
              >
                Editar
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  Guardar
                </Button>
              </Box>
            )}
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre Completo"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                disabled={!editingProfile}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                disabled={!editingProfile}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                disabled={!editingProfile}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Departamento"
                name="department"
                value={profileData.department}
                onChange={handleProfileChange}
                disabled={!editingProfile}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Biografía"
                name="bio"
                multiline
                rows={4}
                value={profileData.bio}
                onChange={handleProfileChange}
                disabled={!editingProfile}
                placeholder="Cuéntanos un poco sobre ti..."
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Seguridad</Typography>
            {!editingPassword ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditingPassword(true)}
              >
                Cambiar Contraseña
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelPasswordEdit}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePassword}
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </Box>
            )}
          </Box>
          
          {editingPassword ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Por seguridad, necesitas ingresar tu contraseña actual para cambiarla.
                </Alert>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Contraseña Actual"
                  name="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                  helperText={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'Las contraseñas no coinciden' : ''}
                />
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                Tu contraseña está protegida y encriptada.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Última actualización: Hace 30 días
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Preferencias</Typography>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSavePreferences}
              disabled={loading}
            >
              Guardar Preferencias
            </Button>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaletteIcon /> Apariencia
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tema</InputLabel>
                <Select
                  name="theme"
                  value={preferences.theme}
                  label="Tema"
                  onChange={handlePreferenceChange}
                >
                  <MenuItem value="light">Claro</MenuItem>
                  <MenuItem value="dark">Oscuro</MenuItem>
                  <MenuItem value="auto">Automático</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Idioma</InputLabel>
                <Select
                  name="language"
                  value={preferences.language}
                  label="Idioma"
                  onChange={handlePreferenceChange}
                >
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Zona Horaria</InputLabel>
                <Select
                  name="timezone"
                  value={preferences.timezone}
                  label="Zona Horaria"
                  onChange={handlePreferenceChange}
                >
                  <MenuItem value="America/Bogota">Bogotá (GMT-5)</MenuItem>
                  <MenuItem value="America/New_York">Nueva York (GMT-5)</MenuItem>
                  <MenuItem value="Europe/Madrid">Madrid (GMT+1)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon /> Notificaciones
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Notificaciones por Email"
                    secondary="Recibir notificaciones importantes por correo"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.emailNotifications}
                        onChange={handlePreferenceChange}
                        name="emailNotifications"
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Notificaciones Push"
                    secondary="Recibir notificaciones en el navegador"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.pushNotifications}
                        onChange={handlePreferenceChange}
                        name="pushNotifications"
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Reportes Semanales"
                    secondary="Recibir resumen semanal de actividades"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.weeklyReports}
                        onChange={handlePreferenceChange}
                        name="weeklyReports"
                      />
                    }
                    label=""
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Emails de Marketing"
                    secondary="Recibir información sobre nuevas funciones"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.marketingEmails}
                        onChange={handlePreferenceChange}
                        name="marketingEmails"
                      />
                    }
                    label=""
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DashboardIcon /> Dashboard
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Layout del Dashboard</InputLabel>
                    <Select
                      name="dashboardLayout"
                      value={preferences.dashboardLayout}
                      label="Layout del Dashboard"
                      onChange={handlePreferenceChange}
                    >
                      <MenuItem value="default">Por Defecto</MenuItem>
                      <MenuItem value="compact">Compacto</MenuItem>
                      <MenuItem value="detailed">Detallado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Elementos por Página</InputLabel>
                    <Select
                      name="itemsPerPage"
                      value={preferences.itemsPerPage}
                      label="Elementos por Página"
                      onChange={handlePreferenceChange}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Recent Activity Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Actividad Reciente
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Acción</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getActionIcon(activity.action)}
                        <Typography variant="body2">
                          {activity.action}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {activity.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(activity.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {activity.ip_address || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {activities.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No hay actividad reciente para mostrar.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Profile;