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
  LinearProgress,
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
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState([]);
  const [openActivityDialog, setOpenActivityDialog] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: 'call',
    title: '',
    description: '',
    scheduled_date: '',
    status: 'pending',
  });
  const [noteForm, setNoteForm] = useState({
    content: '',
  });

  const loadDeal = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/deals/${id}`);
      setDeal(response.data);
    } catch (error) {
      console.error('Error loading deal:', error);
      showNotification('Error al cargar el negocio', 'error');
      // Mock data for demo
      setDeal({
        id: parseInt(id),
        title: 'Implementación CRM',
        description: 'SIGLO DATA CRM completo para empresa mediana con módulos de ventas, marketing y servicio al cliente.',
        value: 50000,
        contact_id: 1,
        contact_name: 'Juan Pérez',
        contact_email: 'juan.perez@email.com',
        contact_phone: '+57 300 123 4567',
        contact_company: 'Empresa ABC',
        status: 'in_progress',
        probability: 75,
        expected_close_date: '2024-02-15',
        created_at: '2024-01-10',
        updated_at: '2024-01-15',
        notes: 'Cliente muy interesado, ya aprobó presupuesto inicial.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await api.get(`/deals/${id}/activities`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Mock data for demo
      setActivities([
        {
          id: 1,
          type: 'call',
          title: 'Llamada inicial',
          description: 'Presentación de propuesta inicial',
          scheduled_date: '2024-01-12',
          status: 'completed',
          created_at: '2024-01-10',
        },
        {
          id: 2,
          type: 'email',
          title: 'Envío de propuesta',
          description: 'Propuesta técnica y comercial detallada',
          scheduled_date: '2024-01-14',
          status: 'completed',
          created_at: '2024-01-12',
        },
        {
          id: 3,
          type: 'meeting',
          title: 'Reunión de negociación',
          description: 'Ajustes finales y negociación de términos',
          scheduled_date: '2024-01-18',
          status: 'scheduled',
          created_at: '2024-01-15',
        },
        {
          id: 4,
          type: 'call',
          title: 'Seguimiento post-reunión',
          description: 'Confirmar detalles acordados',
          scheduled_date: '2024-01-20',
          status: 'pending',
          created_at: '2024-01-15',
        },
      ]);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await api.get(`/deals/${id}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error loading notes:', error);
      // Mock data for demo
      setNotes([
        {
          id: 1,
          content: 'Cliente confirmó interés en módulo de marketing automation.',
          created_at: '2024-01-12',
          created_by: 'Juan Admin',
        },
        {
          id: 2,
          content: 'Solicita demo personalizada para el equipo de ventas.',
          created_at: '2024-01-14',
          created_by: 'user',
        },
        {
          id: 3,
          content: 'Presupuesto aprobado por gerencia, proceder con contrato.',
          created_at: '2024-01-16',
          created_by: 'Juan Admin',
        },
      ]);
    }
  };

  useEffect(() => {
    if (id) {
      loadDeal();
      loadActivities();
      loadNotes();
    }
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/deals');
  };

  const handleEdit = () => {
    showNotification('Función de edición en desarrollo', 'info');
  };

  const handleActivityFormChange = (event) => {
    const { name, value } = event.target;
    setActivityForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNoteFormChange = (event) => {
    const { name, value } = event.target;
    setNoteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateActivity = async () => {
    try {
      await api.post(`/deals/${id}/activities`, activityForm);
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

  const handleCreateNote = async () => {
    try {
      await api.post(`/deals/${id}/notes`, noteForm);
      showNotification('Nota agregada exitosamente', 'success');
      setOpenNoteDialog(false);
      setNoteForm({ content: '' });
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      showNotification('Error al agregar la nota', 'error');
    }
  };

  const updateDealStatus = async (newStatus) => {
    try {
      await api.put(`/deals/${id}`, { status: newStatus });
      showNotification('Estado actualizado exitosamente', 'success');
      loadDeal();
    } catch (error) {
      console.error('Error updating deal status:', error);
      showNotification('Error al actualizar el estado', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'won':
        return 'success';
      case 'lost':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'proposal':
        return 'warning';
      case 'qualified':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'won':
        return 'Ganado';
      case 'lost':
        return 'Perdido';
      case 'in_progress':
        return 'En Progreso';
      case 'proposal':
        return 'Propuesta';
      case 'qualified':
        return 'Calificado';
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

  const getActivityStatusIcon = (status) => {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 75) return 'success';
    if (probability >= 50) return 'warning';
    if (probability >= 25) return 'info';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando negocio...</Typography>
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Negocio no encontrado</Typography>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Volver a Negocios
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
          {deal.title}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          sx={{ mr: 2 }}
        >
          Editar
        </Button>
        <Chip
          label={getStatusLabel(deal.status)}
          color={getStatusColor(deal.status)}
          size="large"
        />
      </Box>

      {/* Deal Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Valor del Negocio
                  </Typography>
                  <Typography variant="h5" component="h2" color="success.main">
                    {formatCurrency(deal.value)}
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Probabilidad
                  </Typography>
                  <Typography variant="h5" component="h2" color={`${getProbabilityColor(deal.probability)}.main`}>
                    {deal.probability}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={deal.probability}
                    color={getProbabilityColor(deal.probability)}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: `${getProbabilityColor(deal.probability)}.main` }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Fecha de Cierre
                  </Typography>
                  <Typography variant="h6" component="h2">
                    {new Date(deal.expected_close_date).toLocaleDateString('es-ES')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {Math.ceil((new Date(deal.expected_close_date) - new Date()) / (1000 * 60 * 60 * 24))} días restantes
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Contacto
                  </Typography>
                  <Typography variant="subtitle1" component="h2">
                    {deal.contact_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {deal.contact_company}
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Deal Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información del Negocio
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="body1" paragraph>
              {deal.description}
            </Typography>
            {deal.notes && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Notas:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {deal.notes}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Información de Contacto
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
              <Typography variant="body2">{deal.contact_email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIcon sx={{ mr: 1, fontSize: 'small', color: 'text.secondary' }} />
              <Typography variant="body2">{deal.contact_phone}</Typography>
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Acciones Rápidas
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="success"
                onClick={() => updateDealStatus('won')}
                disabled={deal.status === 'won'}
              >
                Marcar como Ganado
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => updateDealStatus('lost')}
                disabled={deal.status === 'lost'}
              >
                Marcar como Perdido
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Actividades" />
          <Tab label="Notas" />
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
                            icon={getActivityStatusIcon(activity.status)}
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

        {/* Notes Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Notas ({notes.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenNoteDialog(true)}
              >
                Agregar Nota
              </Button>
            </Box>
            <List>
              {notes.map((note, index) => (
                <React.Fragment key={note.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={note.content}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {note.created_by} - {new Date(note.created_at).toLocaleDateString('es-ES')}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < notes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
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

      {/* Note Dialog */}
      <Dialog open={openNoteDialog} onClose={() => setOpenNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Nota</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Contenido de la nota"
            name="content"
            value={noteForm.content}
            onChange={handleNoteFormChange}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNoteDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateNote} variant="contained">
            Agregar Nota
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DealDetail;