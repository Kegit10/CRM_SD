import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Avatar,
  Tooltip,
  Menu,
  MenuList,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const Activities = () => {
  const { showNotification } = useNotification();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formData, setFormData] = useState({
    type: 'call',
    title: '',
    description: '',
    contact_id: '',
    deal_id: '',
    scheduled_date: '',
    status: 'pending',
  });
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  const loadActivities = async () => {
    try {
      const response = await api.get('/activities');
      console.log("API Activities Response:", response.data);

      // Adaptación: Verificación más robusta de la estructura de la respuesta
      const activitiesData = Array.isArray(response.data?.data?.activities)
        ? response.data.data.activities
        : [];

      setActivities(activitiesData);
    } catch (err) {
      console.error("Error al cargar actividades", err);
      showNotification('Error al cargar actividades. Se usaron datos de ejemplo.', 'error');
      // Datos de mock para demo
      setActivities([
        {
          id: 1,
          type: 'call',
          title: 'Llamada de seguimiento',
          description: 'Seguimiento post-reunión con cliente',
          contact_id: 1,
          contact_name: 'Juan Pérez',
          contact_company: 'Empresa ABC',
          deal_id: 1,
          deal_title: 'Implementación CRM',
          scheduled_date: '2024-01-20T10:00:00',
          status: 'pending',
          created_at: '2024-01-15',
          assigned_to: 'Juan Admin',
        },
        {
          id: 2,
          type: 'email',
          title: 'Envío de propuesta',
          description: 'Enviar propuesta técnica actualizada',
          contact_id: 2,
          contact_name: 'María García',
          contact_company: 'Tech Solutions',
          deal_id: 2,
          deal_title: 'Sistema de Inventario',
          scheduled_date: '2024-01-18T14:30:00',
          status: 'completed',
          created_at: '2024-01-12',
          assigned_to: ' user ',
        },
        {
          id: 3,
          type: 'meeting',
          title: 'Reunión de negociación',
          description: 'Discutir términos del contrato',
          contact_id: 3,
          contact_name: 'Carlos López',
          contact_company: 'Innovate Corp',
          deal_id: 3,
          deal_title: 'Consultoría Digital',
          scheduled_date: '2024-01-22T09:00:00',
          status: 'scheduled',
          created_at: '2024-01-16',
          assigned_to: 'Ana Sales',
        },
        {
          id: 4,
          type: 'task',
          title: 'Preparar demo',
          description: 'Configurar ambiente de demo para presentación',
          contact_id: 1,
          contact_name: 'Juan Pérez',
          contact_company: 'Empresa ABC',
          deal_id: 1,
          deal_title: 'Implementación CRM',
          scheduled_date: '2024-01-19T16:00:00',
          status: 'in_progress',
          created_at: '2024-01-17',
          assigned_to: 'Tech Team',
        },
        {
          id: 5,
          type: 'call',
          title: 'Llamada inicial',
          description: 'Primera llamada de contacto',
          contact_id: 4,
          contact_name: 'Ana Rodríguez',
          contact_company: 'StartUp XYZ',
          deal_id: null,
          deal_title: null,
          scheduled_date: '2024-01-16T11:00:00',
          status: 'completed',
          created_at: '2024-01-14',
          assigned_to: 'Juan Admin',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await api.get('/contacts');
      console.log("API Contacts Response:", response.data);

      // Adaptación: Verificación más robusta de la estructura de la respuesta
      const contactsData = Array.isArray(response.data?.data?.contacts)
        ? response.data.data.contacts
        : [];

      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      showNotification('Error al cargar contactos. Se usaron datos de ejemplo.', 'error');
      // Mock data for demo
      setContacts([
        { id: 1, name: 'Juan Pérez', company: 'Empresa ABC' },
        { id: 2, name: 'María García', company: 'Tech Solutions' },
        { id: 3, name: 'Carlos López', company: 'Innovate Corp' },
        { id: 4, name: 'Ana Rodríguez', company: 'StartUp XYZ' },
      ]);
    }
  };

  const loadDeals = async () => {
    try {
      const response = await api.get('/deals');
      console.log("API Deals Response:", response.data);

      // Adaptación: Verificación más robusta de la estructura de la respuesta
      const dealsData = Array.isArray(response.data?.data?.deals)
        ? response.data.data.deals
        : [];

      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading deals:', error);
      showNotification('Error al cargar negocios. Se usaron datos de ejemplo.', 'error');
      // Mock data for demo
      setDeals([
        { id: 1, title: 'Implementación CRM', value: 50000 },
        { id: 2, title: 'Sistema de Inventario', value: 30000 },
        { id: 3, title: 'Consultoría Digital', value: 25000 },
      ]);
    }
  };

  useEffect(() => {
    loadActivities();
    loadContacts();
    loadDeals();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
  };

  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenDialog = (activity = null) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        type: activity.type,
        title: activity.title,
        description: activity.description,
        contact_id: activity.contact_id || '',
        deal_id: activity.deal_id || '',
        scheduled_date: activity.scheduled_date ? activity.scheduled_date.slice(0, 16) : '',
        status: activity.status,
      });
    } else {
      setEditingActivity(null);
      setFormData({
        type: 'call',
        title: '',
        description: '',
        contact_id: '',
        deal_id: '',
        scheduled_date: '',
        status: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingActivity(null);
    setAnchorEl(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingActivity) {
        await api.put(`/activities/${editingActivity.id}`, formData);
        showNotification('Actividad actualizada exitosamente', 'success');
      } else {
        await api.post('/activities', formData);
        showNotification('Actividad creada exitosamente', 'success');
      }
      handleCloseDialog();
      loadActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      showNotification('Error al guardar la actividad', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/activities/${id}`);
      showNotification('Actividad eliminada exitosamente', 'success');
      loadActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      showNotification('Error al eliminar la actividad', 'error');
    }
    setAnchorEl(null);
  };

  const handleMenuClick = (event, activity) => {
    setAnchorEl(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActivity(null);
  };

  const updateActivityStatus = async (id, newStatus) => {
    try {
      await api.put(`/activities/${id}`, { status: newStatus });
      showNotification('Estado actualizado exitosamente', 'success');
      loadActivities();
    } catch (error) {
      console.error('Error updating activity status:', error);
      showNotification('Error al actualizar el estado', 'error');
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return <PhoneIcon />;
      case 'email':
        return <EmailIcon />;
      case 'meeting':
        return <EventIcon />;
      case 'task':
        return <AssignmentIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'in_progress':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'scheduled':
        return 'Programada';
      case 'in_progress':
        return 'En Progreso';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'call':
        return 'Llamada';
      case 'email':
        return 'Email';
      case 'meeting':
        return 'Reunión';
      case 'task':
        return 'Tarea';
      default:
        return type;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'scheduled':
        return <ScheduleIcon />;
      case 'cancelled':
        return <CancelIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  // Adaptación: Mejor manejo de propiedades potencialmente nulas o indefinidas en el filtro
  const filteredActivities = activities.filter(activity => {
    if (!activity) return false; // Asegura que la actividad no sea nula o indefinida

    const matchesSearch =
      (activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (activity.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false); // Uso de optional chaining y fallback a false

    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getActivityStats = () => {
    const total = activities.length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const scheduled = activities.filter(a => a.status === 'scheduled').length;

    return { total, completed, pending, scheduled };
  };

  const stats = getActivityStats();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando actividades...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Actividades
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Actividad
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Actividades
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stats.total}
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Completadas
                  </Typography>
                  <Typography variant="h4" component="h2" color="success.main">
                    {stats.completed}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Pendientes
                  </Typography>
                  <Typography variant="h4" component="h2" color="warning.main">
                    {stats.pending}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
                    Programadas
                  </Typography>
                  <Typography variant="h4" component="h2" color="info.main">
                    {stats.scheduled}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterType}
                label="Tipo"
                onChange={handleFilterTypeChange}
                startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">Todos los tipos</MenuItem>
                <MenuItem value="call">Llamadas</MenuItem>
                <MenuItem value="email">Emails</MenuItem>
                <MenuItem value="meeting">Reuniones</MenuItem>
                <MenuItem value="task">Tareas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filterStatus}
                label="Estado"
                onChange={handleFilterStatusChange}
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="scheduled">Programada</MenuItem>
                <MenuItem value="in_progress">En Progreso</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredActivities.length} de {activities.length} actividades
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Activities List */}
      <Paper>
        <List>
          {filteredActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: `${getStatusColor(activity.status)}.main` }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" component="span">
                        {activity.title}
                      </Typography>
                      <Chip
                        label={getTypeLabel(activity.type)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={getStatusIcon(activity.status)}
                        label={getStatusLabel(activity.status)}
                        size="small"
                        color={getStatusColor(activity.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {activity.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        {activity.contact_name && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {activity.contact_name} - {activity.contact_company}
                            </Typography>
                          </Box>
                        )}
                        {activity.deal_title && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <BusinessIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {activity.deal_title}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Programado: {new Date(activity.scheduled_date).toLocaleString('es-ES')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Asignado a: {activity.assigned_to_name}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {activity.status === 'pending' && (
                      <Tooltip title="Marcar como completada">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => updateActivityStatus(activity.id, 'completed')}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, activity)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredActivities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {filteredActivities.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron actividades que coincidan con los filtros.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <ListItemButton onClick={() => {
            handleOpenDialog(selectedActivity);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </ListItemButton>
          <ListItemButton onClick={() => {
            handleDelete(selectedActivity.id);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </ListItemButton>
        </MenuList>
      </Menu>

      {/* Activity Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Tipo"
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                <MenuItem value="call">Llamada</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="meeting">Reunión</MenuItem>
                <MenuItem value="task">Tarea</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="scheduled">Programada</MenuItem>
                <MenuItem value="in_progress">En Progreso</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Contacto"
                name="contact_id"
                value={formData.contact_id}
                onChange={handleFormChange}
              >
                <MenuItem value="">Sin contacto</MenuItem>
                {contacts.map((contact) => (
                  <MenuItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.company}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Negocio"
                name="deal_id"
                value={formData.deal_id}
                onChange={handleFormChange}
              >
                <MenuItem value="">Sin negocio</MenuItem>
                {deals.map((deal) => (
                  <MenuItem key={deal.id} value={deal.id}>
                    {deal.title}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Fecha y Hora Programada"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingActivity ? 'Actualizar' : 'Crear'} Actividad
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Activities;