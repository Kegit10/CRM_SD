import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Avatar,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: 'call',
    title: '',
    description: '',
    scheduled_date: '',
    status: 'pending',
  });

  const loadContact = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contacts/${id}`);
      setContact(response.data);
    } catch (error) {
      console.error('Error loading contact:', error);
      showNotification('Error al cargar el contacto', 'error');
      // Mock data for demo
      setContact({
        id: parseInt(id),
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+57 300 123 4567',
        company: 'Empresa ABC',
        position: 'Gerente de Ventas',
        status: 'active',
        notes: 'Cliente potencial muy interesado en nuestros servicios.',
        created_at: '2024-01-10',
        updated_at: '2024-01-15',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await api.get(`/contacts/${id}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Mock data for demo
      setActivities([
        {
          id: 1,
          type: 'call',
          title: 'Llamada de seguimiento',
          description: 'Discutir propuesta de servicios',
          scheduled_date: '2024-01-16',
          status: 'completed',
          created_at: '2024-01-15',
        },
        {
          id: 2,
          type: 'email',
          title: 'Envío de propuesta',
          description: 'Enviar propuesta comercial detallada',
          scheduled_date: '2024-01-17',
          status: 'pending',
          created_at: '2024-01-15',
        },
        {
          id: 3,
          type: 'meeting',
          title: 'Reunión presencial',
          description: 'Presentación de servicios y negociación',
          scheduled_date: '2024-01-20',
          status: 'scheduled',
          created_at: '2024-01-15',
        },
      ]);
    }
  };

  const loadDeals = async () => {
    try {
      const response = await api.get(`/contacts/${id}/deals`);
      setDeals(response.data);
    } catch (error) {
      console.error('Error loading deals:', error);
      // Mock data for demo
      setDeals([
        {
          id: 1,
          title: 'Implementación CRM',
          value: 50000,
          status: 'in_progress',
          probability: 75,
          expected_close_date: '2024-02-15',
          created_at: '2024-01-10',
        },
        {
          id: 2,
          title: 'Consultoría IT',
          value: 25000,
          status: 'proposal',
          probability: 50,
          expected_close_date: '2024-03-01',
          created_at: '2024-01-12',
        },
      ]);
    }
  };

  useEffect(() => {
    if (id) {
      loadContact();
      loadActivities();
      loadDeals();
    }
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/contacts');
  };

  const handleEdit = () => {
    // This would open an edit dialog or navigate to edit page
    showNotification('Función de edición en desarrollo', 'info');
  };

  const handleActivityFormChange = (event) => {
    const { name, value } = event.target;
    setActivityForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateActivity = async () => {
    try {
      await api.post(`/contacts/${id}/activities`, activityForm);
      showNotification('Actividad creada exitosamente', 'success');
      setOpenActivityDialog(false);
      setActivityForm({
        type: 'call',
        title: '',
        description: '',
        scheduled_date: '',
        status: 'pending',
      });
      loadActivities();
    } catch (error) {
      console.error('Error creating activity:', error);
      showNotification('Error al crear la actividad', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'prospect':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'prospect':
        return 'Prospecto';
      default:
        return status;
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
      default:
        return <AssignmentIcon />;
    }
  };

  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDealStatusColor = (status) => {
    switch (status) {
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'proposal':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDealStatusLabel = (status) => {
    switch (status) {
      case 'won':
        return 'Ganado';
      case 'lost':
        return 'Perdido';
      case 'in_progress':
        return 'En Progreso';
      case 'proposal':
        return 'Propuesta';
      default:
        return status;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando contacto...</Typography>
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Contacto no encontrado</Typography>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Volver a Contactos
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {contact.name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Editar
        </Button>
      </Box>

      {/* Contact Info Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: '2rem',
                  bgcolor: 'primary.main',
                  mb: 2,
                }}
              >
                {getInitials(contact.name)}
              </Avatar>
              <Chip
                label={getStatusLabel(contact.status)}
                color={getStatusColor(contact.status)}
                sx={{ mb: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography>{contact.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography>{contact.phone}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography>{contact.company}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {contact.position}
                </Typography>
              </Grid>
              {contact.notes && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Notas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {contact.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Actividades" />
          <Tab label="Negocios" />
        </Tabs>

        {/* Activities Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Actividades ({activities.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenActivityDialog(true)}
              >
                Nueva Actividad
              </Button>
            </Box>
            <List>
              {activities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {activity.title}
                          </Typography>
                          <Chip
                            label={activity.status}
                            size="small"
                            color={getActivityStatusColor(activity.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Programado: {new Date(activity.scheduled_date).toLocaleDateString('es-ES')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < activities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Deals Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Negocios ({deals.length})
            </Typography>
            <Grid container spacing={2}>
              {deals.map((deal) => (
                <Grid item xs={12} md={6} key={deal.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6">
                          {deal.title}
                        </Typography>
                        <Chip
                          label={getDealStatusLabel(deal.status)}
                          color={getDealStatusColor(deal.status)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h5" color="primary" gutterBottom>
                        {formatCurrency(deal.value)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUpIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Probabilidad: {deal.probability}%
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Cierre esperado: {new Date(deal.expected_close_date).toLocaleDateString('es-ES')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Activity Dialog */}
      <Dialog open={openActivityDialog} onClose={() => setOpenActivityDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Actividad</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Tipo"
                name="type"
                value={activityForm.type}
                onChange={handleActivityFormChange}
              >
                <MenuItem value="call">Llamada</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="meeting">Reunión</MenuItem>
                <MenuItem value="task">Tarea</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={activityForm.title}
                onChange={handleActivityFormChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                name="description"
                value={activityForm.description}
                onChange={handleActivityFormChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Fecha Programada"
                name="scheduled_date"
                value={activityForm.scheduled_date}
                onChange={handleActivityFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                name="status"
                value={activityForm.status}
                onChange={handleActivityFormChange}
              >
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="scheduled">Programada</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivityDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateActivity} variant="contained">
            Crear Actividad
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactDetail;