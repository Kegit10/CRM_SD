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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Menu,
  MenuList,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AlternateEmail as UsernameIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  SupportAgent as AgentIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Users = () => {
  const { showNotification } = useNotification();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role_id: '',
    is_active: true,
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Cargar roles desde la API
  const loadRoles = async () => {
    try {
      const response = await api.get('/roles');
      console.log("Roles obtenidos:", response.data);
      setRoles(response.data?.data?.roles || response.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback con los roles de tu BD
      setRoles([
        { id: 1, name: 'Administrador del CRM', description: 'Acceso completo al sistema' },
        { id: 2, name: 'Gerente de Ventas', description: 'Supervisa equipos de ventas' },
        { id: 3, name: 'Comercial', description: 'Gestiona clientes y ventas' },
      ]);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      console.log("Usuarios obtenidos:", response.data);
      setUsers(response.data?.data?.users || response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Error al cargar los usuarios', 'error');
      // Mock data actualizado sin campos que no existen en tu BD
      setUsers([
        {
          id: 1,
          username: 'juan.admin',
          first_name: 'Juan',
          last_name: 'Admin',
          email: 'juan.admin@crm.com',
          role_id: 1,
          role: { id: 1, name: 'Administrador del CRM' },
          is_active: true,
          last_login: '2024-01-20T10:30:00',
          created_at: '2024-01-01',
        },
        {
          id: 2,
          username: 'maria.manager',
          first_name: 'María',
          last_name: 'Manager',
          email: 'maria.manager@crm.com',
          role_id: 2,
          role: { id: 2, name: 'Gerente de Ventas' },
          is_active: true,
          last_login: '2024-01-20T09:15:00',
          created_at: '2024-01-02',
        },
        {
          id: 3,
          username: 'ana.sales',
          first_name: 'Ana',
          last_name: 'Sales',
          email: 'ana.sales@crm.com',
          role_id: 3,
          role: { id: 3, name: 'Comercial' },
          is_active: true,
          last_login: '2024-01-19T16:45:00',
          created_at: '2024-01-03',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'El username es requerido';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.username)) {
      errors.username = 'El username solo puede contener letras, números, puntos, guiones y guiones bajos';
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (!formData.role_id) {
      errors.role_id = 'El rol es requerido';
    }

    // Validar contraseña solo si es usuario nuevo o si se está cambiando
    if (!editingUser || formData.password) {
      if (!formData.password) {
        errors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Validar username único (excepto para el usuario que se está editando)
    const usernameExists = users.some(user => 
      user.username.toLowerCase() === formData.username.toLowerCase() && 
      user.id !== editingUser?.id
    );
    if (usernameExists) {
      errors.username = 'Este username ya está en uso';
    }

    // Validar email único (excepto para el usuario que se está editando)
    const emailExists = users.some(user => 
      user.email.toLowerCase() === formData.email.toLowerCase() && 
      user.id !== editingUser?.id
    );
    if (emailExists) {
      errors.email = 'Este email ya está en uso';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterRoleChange = (event) => {
    setFilterRole(event.target.value);
  };

  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const handleFormChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role_id: user.role_id || '',
        is_active: user.is_active !== undefined ? user.is_active : true,
        password: '',
        confirmPassword: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        role_id: '',
        is_active: true,
        password: '',
        confirmPassword: '',
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormErrors({});
    setAnchorEl(null);
  };

  const handleOpenViewDialog = (user) => {
    setViewingUser(user);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingUser(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showNotification('Por favor, corrija los errores en el formulario', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        username: formData.username.trim().toLowerCase(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role_id: parseInt(formData.role_id),
        is_active: formData.is_active,
      };

      // Solo incluir contraseña si se proporciona
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, submitData);
        showNotification('Usuario actualizado exitosamente', 'success');
      } else {
        await api.post('/users', submitData);
        showNotification('Usuario creado exitosamente', 'success');
      }
      
      handleCloseDialog();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error.response?.data?.message || 'Error al guardar el usuario';
      showNotification(message, 'error');
      
      // Manejar errores específicos del servidor
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      showNotification('No puedes eliminar tu propio usuario', 'error');
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      showNotification('Usuario eliminado exitosamente', 'success');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      const message = error.response?.data?.message || 'Error al eliminar el usuario';
      showNotification(message, 'error');
    }
    setAnchorEl(null);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (id === currentUser?.id) {
      showNotification('No puedes desactivar tu propio usuario', 'error');
      return;
    }

    try {
      await api.put(`/users/${id}`, { is_active: !currentStatus });
      showNotification(
        `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`,
        'success'
      );
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      const message = error.response?.data?.message || 'Error al actualizar el estado del usuario';
      showNotification(message, 'error');
    }
  };

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // Obtener información del rol
  const getRoleInfo = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role || { id: roleId, name: 'Rol desconocido' };
  };

  const getRoleIcon = (roleId) => {
    const role = getRoleInfo(roleId);
    switch (role.name) {
      case 'Administrador del CRM':
        return <AdminIcon />;
      case 'Gerente de Ventas':
        return <ManagerIcon />;
      case 'Comercial':
        return <AgentIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (roleId) => {
    const role = getRoleInfo(roleId);
    switch (role.name) {
      case 'Administrador del CRM':
        return 'error';
      case 'Gerente de Ventas':
        return 'warning';
      case 'Comercial':
        return 'primary';
      default:
        return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
    const userEmail = (user.email || '').toLowerCase();
    const userName = (user.username || '').toLowerCase();
    const roleInfo = getRoleInfo(user.role_id);
    const roleName = roleInfo.name.toLowerCase();
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                          userEmail.includes(searchTerm.toLowerCase()) ||
                          userName.includes(searchTerm.toLowerCase()) ||
                          roleName.includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role_id === parseInt(filterRole);
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && user.is_active) ||
                          (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const byRole = roles.reduce((acc, role) => {
      acc[role.id] = users.filter(u => u.role_id === role.id).length;
      return acc;
    }, {});
    
    return { total, active, byRole };
  };

  const stats = getUserStats();

  // Verificar permisos del usuario actual - Más permisivo para pruebas
  const canManageUsers = true; // Temporalmente habilitado para todos
  // TODO: Implementar verificación real de permisos
  // const canManageUsers = currentUser?.role?.name === 'Administrador del CRM' || 
  //                       currentUser?.role?.name === 'Gerente de Ventas';

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Nuevo Usuario
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
                    Total Usuarios
                  </Typography>
                  <Typography variant="h4" component="h2">
                    {stats.total}
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
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
                    Activos
                  </Typography>
                  <Typography variant="h4" component="h2" color="success.main">
                    {stats.active}
                  </Typography>
                </Box>
                <ActiveIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {roles.map((role) => (
          <Grid item xs={12} sm={6} md={3} key={role.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {role.name}
                    </Typography>
                    <Typography variant="h4" component="h2" color={getRoleColor(role.id) + '.main'}>
                      {stats.byRole[role.id] || 0}
                    </Typography>
                  </Box>
                  {getRoleIcon(role.id)}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={filterRole}
                label="Rol"
                onChange={handleFilterRoleChange}
              >
                <MenuItem value="all">Todos los roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </MenuItem>
                ))}
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
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length} de {users.length} usuarios
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Users List */}
      <Paper>
        <List>
          {filteredUsers.map((user, index) => {
            const roleInfo = getRoleInfo(user.role_id);
            return (
              <React.Fragment key={user.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: user.is_active ? 'primary.main' : 'grey.400' }}>
                      {(user.first_name || ' ')[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" component="span">
                          {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                        </Typography>
                        <Chip
                          icon={getRoleIcon(user.role_id)}
                          label={roleInfo.name}
                          size="small"
                          color={getRoleColor(user.role_id)}
                        />
                        <Chip
                          label={user.is_active ? 'Activo' : 'Inactivo'}
                          size="small"
                          color={user.is_active ? 'success' : 'default'}
                          variant={user.is_active ? 'filled' : 'outlined'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <UsernameIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 'small', color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            Último acceso: {user.last_login ? new Date(user.last_login).toLocaleDateString('es-ES') : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Creado: {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenViewDialog(user)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar usuario">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.is_active ? 'Desactivar' : 'Activar'}>
                        <IconButton
                          size="small"
                          color={user.is_active ? 'warning' : 'success'}
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.is_active ? <BlockIcon /> : <ActiveIcon />}
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredUsers.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
        
        {filteredUsers.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron usuarios que coincidan con los filtros.
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
            handleOpenDialog(selectedUser);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </ListItemButton>
          <ListItemButton 
            onClick={() => {
              handleDelete(selectedUser.id);
              handleMenuClose();
            }}
            disabled={selectedUser?.id === currentUser?.id}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </ListItemButton>
        </MenuList>
      </Menu>

      {/* User Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          {Object.keys(formErrors).length > 0 && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              Por favor, corrija los errores en el formulario
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                error={!!formErrors.username}
                helperText={formErrors.username || 'Solo letras, números, puntos, guiones y guiones bajos'}
                required
                placeholder="ej: juan.perez"
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
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="first_name"
                value={formData.first_name}
                onChange={handleFormChange}
                error={!!formErrors.first_name}
                helperText={formErrors.first_name}
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
                error={!!formErrors.last_name}
                helperText={formErrors.last_name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Rol"
                name="role_id"
                value={formData.role_id}
                onChange={handleFormChange}
                error={!!formErrors.role_id}
                helperText={formErrors.role_id}
                required
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    name="is_active"
                  />
                }
                label="Usuario Activo"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                {editingUser ? 'Cambiar Contraseña (opcional)' : 'Contraseña'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                error={!!formErrors.password}
                helperText={formErrors.password || (editingUser ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres')}
                required={!editingUser}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleFormChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                required={!editingUser || formData.password}
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
            {saving ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear')} Usuario
          </Button>
        </DialogActions>
      </Dialog>

      {/* User View Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Detalles del Usuario
        </DialogTitle>
        <DialogContent>
          {viewingUser && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                  {(viewingUser.first_name || ' ')[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {`${viewingUser.first_name || ''} ${viewingUser.last_name || ''}`.trim()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    @{viewingUser.username}
                  </Typography>
                  <Chip
                    icon={getRoleIcon(viewingUser.role_id)}
                    label={getRoleInfo(viewingUser.role_id).name}
                    size="small"
                    color={getRoleColor(viewingUser.role_id)}
                  />
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Información de Contacto</Typography>
                  <Typography variant="body2">Username: @{viewingUser.username}</Typography>
                  <Typography variant="body2">Email: {viewingUser.email}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Rol y Permisos</Typography>
                  <Typography variant="body2">Rol: {getRoleInfo(viewingUser.role_id).name}</Typography>
                  <Typography variant="body2">Descripción: {getRoleInfo(viewingUser.role_id).description}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Estado</Typography>
                  <Typography variant="body2">
                    Estado: {viewingUser.is_active ? 'Activo' : 'Inactivo'}
                  </Typography>
                  <Typography variant="body2">
                    Último acceso: {viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleString('es-ES') : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Creado: {viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Actualizado: {viewingUser.updated_at ? new Date(viewingUser.updated_at).toLocaleDateString('es-ES') : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
          <Button 
            onClick={() => {
              handleCloseViewDialog();
              handleOpenDialog(viewingUser);
            }}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Editar Usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;