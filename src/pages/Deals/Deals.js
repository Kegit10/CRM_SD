import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  InputAdornment,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const Deals = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    contact_id: '',
    status: 'proposal',
    probability: 50,
    expected_close_date: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

const loadDeals = async () => {
  try {
    setLoading(true);
    const response = await api.get('/deals');
    console.log("Deals API response:", response.data);

    // Detecta la estructura correcta
    let dealsData = null;

    if (Array.isArray(response.data)) {
      dealsData = response.data;
    } else if (Array.isArray(response.data.data)) {
      dealsData = response.data.data;
    } else if (Array.isArray(response.data.deals)) {
      dealsData = response.data.deals;
    } else if (Array.isArray(response.data.data?.deals)) {
      dealsData = response.data.data.deals;
    }

    if (dealsData) {
      setDeals(dealsData);
    } else {
      console.error("Formato inesperado de deals:", response.data);
      showNotification('Formato inesperado en respuesta de negocios', 'warning');
      setDeals([]);
    }

  } catch (error) {
    console.error('Error al cargar los negocios:', error);
    showNotification('Error al cargar los negocios', 'error');
    setDeals([]);
  } finally {
    setLoading(false);
  }
};

const loadContacts = async () => {
  try {
    const response = await api.get('/contacts');
    console.log("Contacts API response:", response.data);

    // Detecta la estructura correcta
    let contactsData = null;

    if (Array.isArray(response.data)) {
      contactsData = response.data;
    } else if (Array.isArray(response.data.data)) {
      contactsData = response.data.data;
    } else if (Array.isArray(response.data.contacts)) {
      contactsData = response.data.contacts;
    } else if (Array.isArray(response.data.data?.contacts)) {
      contactsData = response.data.data.contacts;
    }

    if (contactsData) {
      setContacts(contactsData);
    } else {
      console.error("Formato inesperado de contacts:", response.data);
      showNotification('Formato inesperado en respuesta de contactos', 'warning');
      setContacts([]);
    }

  } catch (error) {
    console.error('Error al cargar los contactos:', error);
    showNotification('Error al cargar los contactos', 'error');
    setContacts([]);
  }
};

  useEffect(() => {
    loadDeals();
    loadContacts();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // Aseguramos que 'deals' es un array antes de filtrar
  const filteredDeals = (Array.isArray(deals) ? deals : []).filter((deal) => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (deal.contact_name && deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (deal.contact_company && deal.contact_company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedDeals = filteredDeals.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleOpenDialog = (deal = null) => {
    if (deal) {
      setSelectedDeal(deal);
      setFormData({
        title: deal.title,
        description: deal.description,
        value: deal.value,
        contact_id: deal.contact_id,
        status: deal.status,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date,
        notes: deal.notes || '',
      });
    } else {
      setSelectedDeal(null);
      setFormData({
        title: '',
        description: '',
        value: '',
        contact_id: '',
        status: 'proposal',
        probability: 50,
        expected_close_date: '',
        notes: '',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDeal(null);
    setFormData({
      title: '',
      description: '',
      value: '',
      contact_id: '',
      status: 'proposal',
      probability: 50,
      expected_close_date: '',
      notes: '',
    });
    setErrors({});
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (!formData.value || formData.value <= 0) {
      newErrors.value = 'El valor debe ser mayor a 0';
    }

    if (!formData.contact_id) {
      newErrors.contact_id = 'Debe seleccionar un contacto';
    }

    if (!formData.expected_close_date) {
      newErrors.expected_close_date = 'La fecha de cierre es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (selectedDeal) {
        await api.put(`/deals/${selectedDeal.id}`, formData);
        showNotification('Negocio actualizado exitosamente', 'success');
      } else {
        await api.post('/deals', formData);
        showNotification('Negocio creado exitosamente', 'success');
      }
      handleCloseDialog();
      loadDeals();
    } catch (error) {
      console.error('Error al guardar el negocio:', error);
      showNotification('Error al guardar el negocio', 'error');
    }
  };

  const handleDelete = async (dealId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este negocio?')) {
      try {
        await api.delete(`/deals/${dealId}`);
        showNotification('Negocio eliminado exitosamente', 'success');
        loadDeals();
      } catch (error) {
        console.error('Error al eliminar el negocio:', error);
        showNotification('Error al eliminar el negocio', 'error');
      }
    }
  };

  const handleViewDeal = (dealId) => {
    navigate(`/deals/${dealId}`);
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

  // Calculate summary stats, asegurando que 'deals' sea un array
  const totalValue = (Array.isArray(deals) ? deals : []).reduce((sum, deal) => {
  const value = Number(deal.value) || 0;  // asegura numérico
  return sum + value;
    }, 0);
  const wonDeals = (Array.isArray(deals) ? deals : []).filter(deal => deal.status === 'won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgProbability = (Array.isArray(deals) && deals.length > 0) ? deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length : 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando negocios...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Negocios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Negocio
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Negocios
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {deals.length}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Valor Total
                  </Typography>
                  <Typography variant="h5" component="h2" color="success.main">
                    {formatCurrency(totalValue)}
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
                    Negocios Ganados
                  </Typography>
                  <Typography variant="h4" component="h2" color="success.main">
                    {wonDeals.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatCurrency(wonValue)}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                    Probabilidad Promedio
                  </Typography>
                  <Typography variant="h4" component="h2" color="info.main">
                    {Math.round(avgProbability)}%
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar negocios..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Estado"
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="proposal">Propuesta</MenuItem>
              <MenuItem value="qualified">Calificado</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="won">Ganado</MenuItem>
              <MenuItem value="lost">Perdido</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Deals Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Negocio</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Probabilidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha Cierre</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Protección en el renderizado */}
              {Array.isArray(paginatedDeals) && paginatedDeals.map((deal) => (
                <TableRow key={deal.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {deal.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {deal.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2">
                          {deal.contact_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {deal.contact_company}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="success.main">
                      {formatCurrency(deal.value)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={deal.probability}
                        color={getProbabilityColor(deal.probability)}
                        sx={{ width: 60, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2">
                        {deal.probability}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(deal.status)}
                      color={getStatusColor(deal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" color="action" />
                      {new Date(deal.expected_close_date).toLocaleDateString('es-ES')}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDeal(deal.id)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(deal)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(deal.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredDeals.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Deal Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDeal ? 'Editar Negocio' : 'Nuevo Negocio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleInputChange}
                error={!!errors.value}
                helperText={errors.value}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Contacto"
                name="contact_id"
                value={formData.contact_id}
                onChange={handleInputChange}
                error={!!errors.contact_id}
                helperText={errors.contact_id}
              >
                {/* Protección en el renderizado del select */}
                {Array.isArray(contacts) && contacts.map((contact) => (
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
                label="Estado"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <MenuItem value="proposal">Propuesta</MenuItem>
                <MenuItem value="qualified">Calificado</MenuItem>
                <MenuItem value="in_progress">En Progreso</MenuItem>
                <MenuItem value="won">Ganado</MenuItem>
                <MenuItem value="lost">Perdido</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Probabilidad (%)"
                name="probability"
                type="number"
                value={formData.probability}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Cierre Esperada"
                name="expected_close_date"
                value={formData.expected_close_date}
                onChange={handleInputChange}
                error={!!errors.expected_close_date}
                helperText={errors.expected_close_date}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedDeal ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Deals;