import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Contacts from './pages/Contacts/Contacts';
import ContactDetail from './pages/Contacts/ContactDetail';
import Deals from './pages/Deals/Deals';
import DealDetail from './pages/Deals/DealDetail';
import Activities from './pages/Activities/Activities';
import Calendar from './pages/Calendar/Calendar';
import Reports from './pages/Reports/Reports';
import Users from './pages/Users/Users';
import Logs from './pages/Logs/Logs';
import Profile from './pages/Profile/Profile';
import NotFound from './pages/NotFound/NotFound';

// Theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role_name)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar onSidebarToggle={handleSidebarToggle} />
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // Account for navbar height
          ml: sidebarOpen ? '240px' : '60px',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Main App Component
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Contacts />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/contacts/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ContactDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/deals"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Deals />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/deals/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DealDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Activities />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Calendar />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRoles={['Administrador del CRM', 'Gerente de Ventas']}>
            <AppLayout>
              <Reports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRoles={['Administrador del CRM']}>
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/logs"
        element={
          <ProtectedRoute requiredRoles={['Administrador del CRM']}>
            <AppLayout>
              <Logs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Default redirect */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />
      
      {/* 404 Page */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NotFound />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// Root App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;