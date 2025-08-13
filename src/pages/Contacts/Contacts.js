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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  PhoneIphone as MobileIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

const Contacts = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    company_id: '',
    assigned_to: '',
    source: '',
    status: 'active',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  // Cargar datos iniciales
  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contacts');
      console.log('Contacts API response:', response.data);
      const contactsData = response.data.data?.contacts || response.data || [];
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      showNotification('Error al cargar los contactos', 'error');
      // Mock data para pruebas con estructura correcta
      setContacts([
        {
          id: 1,
          first_name: 'Juan',
          last_name: 'Pérez',
          email: 'juan.perez@example.com',
          phone: '3001234567',
          mobile: '',
          position: 'Gerente de Ventas',
          company_id: 1,
          company: { id: 1, name: 'Empresa ABC' },
          assigned_to: null,
          source: '',
          status: 'active',
          notes: '',
          created_at: '2025-06-30T17:25:49.550455Z',
          updated_at: '2025-06-30T17:25:49.550455Z',
        },
        {
          id: 2,
          first_name: 'María',
          last_name: 'García',
          email: 'maria.garcia@example.com',
          phone: '3007654321',
          mobile: '',
          position: 'Directora Comercial',
          company_id: 2,
          company: { id: 2, name: 'Corporación XYZ' },
          assigned_to: null,
          source: '',
          status: 'active',
          notes: '',
          created_at: '2025-06-30T17:25:49.550455Z',
          updated_at: '2025-06-30T17:25:49.550455Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await api.get('/companies');
      console.log('Companies API response:', response.data);
      setCompanies(response.data.data?.companies || response.data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      // Mock data para companies
      setCompanies([
        { id: 1, name: 'Empresa ABC' },
        { id: 2, name: 'Corporación XYZ' },
        { id: 3, name: 'Servicios 123' },
      ]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log('Users API response:', response.data);
      setUsers(response.data.data?.users || response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      // Mock data para users
      setUsers([
        { id: 1, first_name: 'Juan', last_name: 'Admin', username: 'juan.admin' },
        { id: 2, first_name: 'María', last_name: 'Manager', username: 'maria.manager' },
      ]);
    }
  };

  useEffect(() => {
    loadContacts();
    loadCompanies();
    loadUsers();
  }, []);

  // Validaciones del formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    // Validar email único (excepto para el contacto que se está editando)
    const emailExists = contacts.some(contact => 
      contact.email.toLowerCase() === formData.email.toLowerCase() && 
      contact.id !== editingContact?.id
    );
    if (emailExists) {
      newErrors.email = 'Este email ya está en uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers del formulario
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOpenDialog = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        position: contact.position || '',
        company_id: contact.company_id || '',
        assigned_to: contact.assigned_to || '',
        source: contact.source || '',
        status: contact.status || 'active',
        notes: contact.notes || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile: '',
        position: '',
        company_id: '',
        assigned_to: '',
        source: '',
        status: 'active',
        notes: '',
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContact(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification('Por favor, corrija los errores en el formulario', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        mobile: formData.mobile.trim(),
        position: formData.position.trim(),
        company_id: formData.company_id ? parseInt(formData.company_id) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        source: formData.source.trim(),
        status: formData.status,
        notes: formData.notes.trim(),
      };

      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, submitData);
        showNotification('Contacto actualizado exitosamente', 'success');
      } else {
        await api.post('/contacts', submitData);
        showNotification('Contacto creado exitosamente', 'success');
      }
      
      handleCloseDialog();
      loadContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      const message = error.response?.data?.message || 'Error al guardar el contacto';
      showNotification(message, 'error');
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este contacto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/contacts/${id}`);
      showNotification('Contacto eliminado exitosamente', 'success');
      loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      const message = error.response?.data?.message || 'Error al eliminar el contacto';
      showNotification(message, 'error');
    }
  };

  // Handlers de filtros y paginación
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

  // Funciones auxiliares
  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    const email = contact.email || '';
    const companyName = contact.company?.name || '';
    const position = contact.position || '';

    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedContacts = filteredContacts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'prospect':
        return 'warning';
      case 'lead':
        return 'info';
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
      case 'lead':
        return 'Lead';
      default:
        return status;
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : '';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : '';
  };

  const handleViewContact = (contactId) => {
    navigate(`/contacts/${contactId}`);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando contactos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Contactos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Contacto
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar contactos..."
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
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
              <MenuItem value="prospect">Prospecto</MenuItem>
              <MenuItem value="lead">Lead</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              {filteredContacts.length} de {contacts.length} contactos
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Contactos */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contacto</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Asignado</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContacts.map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {`${contact.first_name?.charAt(0) || ''}${contact.last_name?.charAt(0) || ''}`.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {contact.first_name} {contact.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {contact.position || 'Sin cargo'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      {contact.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {contact.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{contact.phone}</Typography>
                        </Box>
                      )}
                      {contact.mobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MobileIcon fontSize="small" color="action" />
                          <Typography variant="body2">{contact.mobile}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="action" />
                      {contact.company?.name || getCompanyName(contact.company_id) || 'Sin empresa'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(contact.status)}
                      color={getStatusColor(contact.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {getUserName(contact.assigned_to) || 'Sin asignar'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {contact.created_at ? new Date(contact.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleViewContact(contact.id)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(contact)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(contact.id)}
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
          count={filteredContacts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
        />
      </Paper>

      {/* Dialog para Crear/Editar Contacto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        </DialogTitle>
        <DialogContent>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              Por favor, corrija los errores en el formulario
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleFormChange}
                error={!!errors.first_name}
                helperText={errors.first_name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="last_name"
                value={formData.last_name}
                onChange={handleFormChange}
                error={!!errors.last_name}
                helperText={errors.last_name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cargo/Posición"
                name="position"
                value={formData.position}
                onChange={handleFormChange}
                error={!!errors.position}
                helperText={errors.position}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Móvil"
                name="mobile"
                value={formData.mobile}
                onChange={handleFormChange}
                error={!!errors.mobile}
                helperText={errors.mobile}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  name="company_id"
                  value={formData.company_id}
                  label="Empresa"
                  onChange={handleFormChange}
                  error={!!errors.company_id}
                >
                  <MenuItem value="">Sin empresa</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Asignado a</InputLabel>
                <Select
                  name="assigned_to"
                  value={formData.assigned_to}
                  label="Asignado a"
                  onChange={handleFormChange}
                  error={!!errors.assigned_to}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fuente"
                name="source"
                value={formData.source}
                onChange={handleFormChange}
                error={!!errors.source}
                helperText={errors.source}
                placeholder="ej: Web, Referido, Llamada fría, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Estado"
                  onChange={handleFormChange}
                  error={!!errors.status}
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                  <MenuItem value="prospect">Prospecto</MenuItem>
                  <MenuItem value="lead">Lead</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                error={!!errors.notes}
                helperText={errors.notes}
                multiline
                rows={3}
                placeholder="Notas adicionales sobre el contacto..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : (editingContact ? 'Actualizar' : 'Crear')} Contacto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contacts;