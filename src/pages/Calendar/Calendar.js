import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Calendar as ReactCalendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const Calendar = () => {
  const { showNotification } = useNotification();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [formData, setFormData] = useState({
    type: 'meeting',
    title: '',
    description: '',
    contact_id: '',
    deal_id: '',
    scheduled_date: '',
    duration: 60,
    status: 'scheduled',
  });
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/activities');
      // CORRECCIÓN: Accede a response.data.data para obtener el array de actividades.
      // Añade una verificación robusta por si la estructura cambia.
      const activitiesData = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.activities) // Por si el backend usa 'activities' directamente
        ? response.data.activities
        : []; // Si no es un array en ninguna de las ubicaciones esperadas, usa un array vacío

      setActivities(activitiesData);
      showNotification('Actividades cargadas exitosamente', 'success');
    } catch (error) {
      console.error('Error loading activities:', error);
      showNotification('Error al cargar las actividades. Se usaron datos de ejemplo.', 'error');
      // Mock data for demo
      setActivities([
        {
          id: 1,
          type: 'meeting',
          title: 'Reunión con cliente ABC',
          description: 'Presentación de propuesta inicial',
          contact_id: 1,
          contact_name: 'Juan Pérez',
          contact_company: 'Empresa ABC',
          deal_id: 1,
          deal_title: 'Implementación CRM',
          scheduled_date: '2024-01-20T10:00:00',
          duration: 90,
          status: 'scheduled',
          created_at: '2024-01-15',
          assigned_to: 'Juan Admin',
        },
        {
          id: 2,
          type: 'call',
          title: 'Llamada de seguimiento',
          description: 'Seguimiento post-reunión',
          contact_id: 2,
          contact_name: 'María García',
          contact_company: 'Tech Solutions',
          deal_id: 2,
          deal_title: 'Sistema de Inventario',
          scheduled_date: '2024-01-20T14:30:00',
          duration: 30,
          status: 'scheduled',
          created_at: '2024-01-12',
          assigned_to: 'María Manager',
        },
        {
          id: 3,
          type: 'meeting',
          title: 'Demo del producto',
          description: 'Demostración técnica del CRM',
          contact_id: 3,
          contact_name: 'Carlos López',
          contact_company: 'Innovate Corp',
          deal_id: 3,
          deal_title: 'Consultoría Digital',
          scheduled_date: '2024-01-22T09:00:00',
          duration: 120,
          status: 'scheduled',
          created_at: '2024-01-16',
          assigned_to: 'Ana Sales',
        },
        {
          id: 4,
          type: 'call',
          title: 'Llamada inicial',
          description: 'Primera llamada de contacto',
          contact_id: 4,
          contact_name: 'Ana Rodríguez',
          contact_company: 'StartUp XYZ',
          deal_id: null,
          deal_title: null,
          scheduled_date: '2024-01-18T11:00:00',
          duration: 45,
          status: 'completed',
          created_at: '2024-01-14',
          assigned_to: 'Juan Admin',
        },
        {
          id: 5,
          type: 'meeting',
          title: 'Reunión de cierre',
          description: 'Firma de contrato',
          contact_id: 1,
          contact_name: 'Juan Pérez',
          contact_company: 'Empresa ABC',
          deal_id: 1,
          deal_title: 'Implementación CRM',
          scheduled_date: '2024-01-25T15:00:00',
          duration: 60,
          status: 'scheduled',
          created_at: '2024-01-17',
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
      // CORRECCIÓN: Accede a la propiedad correcta si la API devuelve un objeto.
      const contactsData = Array.isArray(response.data?.data?.contacts)
        ? response.data.data.contacts
        : Array.isArray(response.data?.contacts)
        ? response.data.contacts
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
      // CORRECCIÓN: Accede a la propiedad correcta si la API devuelve un objeto.
      const dealsData = Array.isArray(response.data?.data?.deals)
        ? response.data.data.deals
        : Array.isArray(response.data?.deals)
        ? response.data.deals
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

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenDialog = () => {
    const dateStr = selectedDate.toISOString().slice(0, 16);
    setFormData({
      type: 'meeting',
      title: '',
      description: '',
      contact_id: '',
      deal_id: '',
      scheduled_date: dateStr,
      duration: 60,
      status: 'scheduled',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

const handleSubmit = async (values) => {
  const activityData = {
    ...values,
    contact_id: values.contact_id ? parseInt(values.contact_id, 10) : null,
    deal_id: values.deal_id ? parseInt(values.deal_id, 10) : null,
    // Asegúrate de que assigned_to también sea un número si aplica
    assigned_to: values.assigned_to ? parseInt(values.assigned_to, 10) : null,
  };

  try {
    const response = await api.post('/activities', activityData);
    // ... manejar respuesta
  } catch (error) {
    // ... manejar error
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
        return <EventIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'info';
      case 'cancelled':
        return 'error';
      case 'in_progress':
        return 'warning';
      default:
        return 'default';
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'scheduled':
        return 'Programada';
      case 'cancelled':
        return 'Cancelada';
      case 'in_progress':
        return 'En Progreso';
      default:
        return status;
    }
  };
console.log('Loaded activities:', activities);

  // Get activities for selected date
const getActivitiesForDate = (date) => {
  const dateStr = date.toISOString().split('T')[0];
  return Array.isArray(activities)
    ? activities.filter(activity => {
        const activityDate = new Date(activity.start_date).toISOString().split('T')[0];
        return activityDate === dateStr;
      })
    : [];
};

  // Get activities for the selected date
  const selectedDateActivities = getActivitiesForDate(selectedDate);

  // Calendar tile content - show dots for days with activities
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayActivities = getActivitiesForDate(date);
      if (dayActivities.length > 0) {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
              }}
            />
          </Box>
        );
      }
    }
    return null;
  };

  // Get upcoming activities (next 7 days)
  const getUpcomingActivities = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    
    // CORRECCIÓN: Asegúrate de que 'activities' sea un array antes de llamar a .filter
    return Array.isArray(activities)
      ? activities
          .filter(activity => {
            const activityDate = new Date(activity.scheduled_date);
            return activityDate >= today && activityDate <= nextWeek && activity.status === 'scheduled';
          })
          .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
          .slice(0, 5)
      : []; // Si no es un array, devuelve un array vacío
  };

  const upcomingActivities = getUpcomingActivities();

  // Get today's activities
  const getTodayActivities = () => {
    const today = new Date();
    return getActivitiesForDate(today);
  };

  const todayActivities = getTodayActivities();

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) {
      return 'N/A'; // O lo que consideres apropiado para duración nula
   }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0 && remainingMinutes > 0) {
     return `${hours}h ${remainingMinutes}m`;
   } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${remainingMinutes}m`;
    }
};

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando calendario...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Calendario
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nueva Cita
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedDate.toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
              <Button
                startIcon={<TodayIcon />}
                onClick={() => setSelectedDate(new Date())}
                size="small"
              >
                Hoy
              </Button>
            </Box>
            
            <Box sx={{ 
              '& .react-calendar': {
                width: '100%',
                border: 'none',
                fontFamily: 'inherit',
              },
              '& .react-calendar__tile': {
                padding: '10px',
                position: 'relative',
              },
              '& .react-calendar__tile--active': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
              '& .react-calendar__tile--now': {
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
              },
            }}>
              <ReactCalendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={tileContent}
                locale="es-ES"
              />
            </Box>
          </Paper>

          {/* Selected Date Activities */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividades para {selectedDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
            
            {selectedDateActivities.length > 0 ? (
              <List>
                {selectedDateActivities.map((activity, index) => (
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
                            <Typography variant="subtitle1">
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
                              <Typography variant="caption" color="primary">
                                {formatTime(activity.scheduled_date)} ({formatDuration(activity.duration)})
                              </Typography>
                              {activity.contact_name && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PersonIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {activity.contact_name}
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
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < selectedDateActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No hay actividades programadas para esta fecha.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Today's Activities */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividades de Hoy
            </Typography>
            {todayActivities.length > 0 ? (
              <List dense>
                {todayActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${formatTime(activity.scheduled_date)} - ${activity.contact_name}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay actividades para hoy.
              </Typography>
            )}
          </Paper>

          {/* Upcoming Activities */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Próximas Actividades
            </Typography>
            {upcomingActivities.length > 0 ? (
              <List dense>
                {upcomingActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {new Date(activity.scheduled_date).toLocaleDateString('es-ES')} - {formatTime(activity.scheduled_date)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.contact_name}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay actividades próximas.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* New Activity Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Cita</DialogTitle>
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
                <MenuItem value="meeting">Reunión</MenuItem>
                <MenuItem value="call">Llamada</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="task">Tarea</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duración (minutos)"
                name="duration"
                value={formData.duration}
                onChange={handleFormChange}
                inputProps={{ min: 15, max: 480, step: 15 }}
              />
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
                label="Fecha y Hora"
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
            Crear Cita
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;