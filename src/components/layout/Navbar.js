import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Navbar = ({ onMenuClick, collapsed }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess } = useNotification();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);

  // Handle user menu
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Handle notifications menu
  const handleOpenNotifications = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Sesión cerrada exitosamente');
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
    handleCloseUserMenu();
  };

  // Handle profile navigation
  const handleProfile = () => {
    navigate('/profile');
    handleCloseUserMenu();
  };

  // Handle settings navigation
  const handleSettings = () => {
    navigate('/settings');
    handleCloseUserMenu();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const firstInitial = user.first_name?.charAt(0) || '';
    const lastInitial = user.last_name?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  };

  // Mock notifications (in a real app, this would come from a context or API)
  const notifications = [
    {
      id: 1,
      title: 'Nueva actividad programada',
      message: 'Reunión con cliente ABC Corp mañana a las 10:00 AM',
      time: '5 min ago',
      read: false,
    },
    {
      id: 2,
      title: 'Negocio actualizado',
      message: 'El negocio "Proyecto XYZ" cambió a fase "Propuesta Comercial"',
      time: '1 hora ago',
      read: false,
    },
    {
      id: 3,
      title: 'Nuevo contacto asignado',
      message: 'Se te ha asignado un nuevo contacto: María González',
      time: '2 horas ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: theme.shadows[1],
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        {/* Menu button for mobile */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Title */}
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
        >
          {isMobile || collapsed ? 'CRM' : 'SIGLO DATA CRM'}
        </Typography>

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notificaciones">
            <IconButton
              color="inherit"
              onClick={handleOpenNotifications}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User menu */}
          <Tooltip title="Cuenta de usuario">
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{ p: 0, ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                }}
              >
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu */}
        <Menu
          sx={{ mt: '45px' }}
          id="menu-appbar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          PaperProps={{
            sx: {
              minWidth: 200,
              mt: 1,
            },
          }}
        >
          {/* User info */}
          <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {user?.role_name}
            </Typography>
          </Box>

          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mi Perfil</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configuración</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cerrar Sesión</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          sx={{ mt: '45px' }}
          id="notifications-menu"
          anchorEl={anchorElNotifications}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElNotifications)}
          onClose={handleCloseNotifications}
          PaperProps={{
            sx: {
              minWidth: 320,
              maxWidth: 400,
              mt: 1,
              maxHeight: 400,
            },
          }}
        >
          {/* Notifications header */}
          <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" color="primary">
                {unreadCount} sin leer
              </Typography>
            )}
          </Box>

          {/* Notifications list */}
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <MenuItem
                  onClick={handleCloseNotifications}
                  sx={{
                    whiteSpace: 'normal',
                    alignItems: 'flex-start',
                    py: 1.5,
                    backgroundColor: notification.read ? 'transparent' : theme.palette.action.hover,
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                </MenuItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No hay notificaciones
              </Typography>
            </MenuItem>
          )}

          {/* View all notifications */}
          {notifications.length > 0 && (
            <>
              <Divider />
              <MenuItem
                onClick={() => {
                  navigate('/notifications');
                  handleCloseNotifications();
                }}
                sx={{ justifyContent: 'center', color: theme.palette.primary.main }}
              >
                <Typography variant="body2">Ver todas las notificaciones</Typography>
              </MenuItem>
            </>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;