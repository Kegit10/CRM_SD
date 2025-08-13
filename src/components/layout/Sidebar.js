import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Assessment as ReportsIcon,
  SupervisorAccount as UsersIcon,
  History as LogsIcon,
  Person as ProfileIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;

const Sidebar = ({ open, onClose, collapsed, onToggleCollapsed }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [expandedItems, setExpandedItems] = useState({});

  // Función local para verificar permisos
  const hasPermission = (allowedRoles = []) => {
    if (!user || !user.role_name) return false;
    return allowedRoles.includes(user.role_name);
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['Administrador del CRM', 'Gerente de Ventas', 'Comercial'],
    },
    {
      id: 'contacts',
      label: 'Contactos',
      icon: <PeopleIcon />,
      path: '/contacts',
      roles: ['Administrador del CRM', 'Gerente de Ventas', 'Comercial'],
    },
    {
      id: 'deals',
      label: 'Negocios',
      icon: <BusinessIcon />,
      path: '/deals',
      roles: ['Administrador del CRM', 'Gerente de Ventas', 'Comercial'],
    },
    {
      id: 'activities',
      label: 'Actividades',
      icon: <AssignmentIcon />,
      path: '/activities',
      roles: ['Administrador del CRM', 'Gerente de Ventas', 'Comercial'],
    },
    {
      id: 'calendar',
      label: 'Calendario',
      icon: <CalendarIcon />,
      path: '/calendar',
      roles: ['Administrador del CRM', 'Gerente de Ventas', 'Comercial'],
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <ReportsIcon />,
      roles: ['Administrador del CRM', 'Gerente de Ventas'],
      children: [
        {
          id: 'sales-performance',
          label: 'Rendimiento de Ventas',
          path: '/reports/sales-performance',
        },
        {
          id: 'pipeline-analysis',
          label: 'Análisis de Pipeline',
          path: '/reports/pipeline-analysis',
        },
        {
          id: 'activity-metrics',
          label: 'Métricas de Actividad',
          path: '/reports/activity-metrics',
        },
      ],
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: <UsersIcon />,
      path: '/users',
      roles: ['Administrador del CRM'],
    },
    {
      id: 'logs',
      label: 'Logs del Sistema',
      icon: <LogsIcon />,
      path: '/logs',
      roles: ['Administrador del CRM'],
    },
  ];

  const bottomItems = [
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: <ProfileIcon />,
      path: '/profile',
      roles: ['Administrador del CRM', 'Gerente de Ventas', 'Comercial'],
    },
  ];

  const getFilteredItems = (items) => {
    return items.filter(item => hasPermission(item.roles));
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const handleToggleExpand = (itemId) => {
    if (collapsed) return;

    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const isPathActive = (path, children = []) => {
    if (path && location.pathname === path) return true;
    if (children.length > 0) {
      return children.some(child => location.pathname === child.path);
    }
    return false;
  };

  const renderNavItem = (item, isChild = false) => {
    const isActive = isPathActive(item.path, item.children);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id];

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleToggleExpand(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'initial',
              px: collapsed ? 1 : 2.5,
              pl: isChild ? (collapsed ? 1 : 4) : (collapsed ? 1 : 2.5),
              backgroundColor: isActive ? theme.palette.primary.main + '20' : 'transparent',
              borderRight: isActive ? `3px solid ${theme.palette.primary.main}` : 'none',
              '&:hover': {
                backgroundColor: theme.palette.primary.main + '10',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 3,
                justifyContent: 'center',
                color: isActive ? theme.palette.primary.main : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>

            {!collapsed && (
              <>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    color: isActive ? theme.palette.primary.main : 'inherit',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                {hasChildren && (
                  isExpanded ? <ExpandLess /> : <ExpandMore />
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map(child => renderNavItem(child, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          p: collapsed ? 1 : 2,
          minHeight: 64,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!collapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            CRM System
          </Typography>
        )}

        {!isMobile && (
          <IconButton
            onClick={onToggleCollapsed}
            size="small"
            sx={{
              color: theme.palette.text.secondary,
            }}
          >
            {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {!collapsed && user && (
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role_name}
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {getFilteredItems(navigationItems).map(item => renderNavItem(item))}
        </List>
      </Box>

      <Box>
        <Divider />
        <List>
          {getFilteredItems(bottomItems).map(item => renderNavItem(item))}
        </List>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
