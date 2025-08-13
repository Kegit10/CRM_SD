import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

// Create context
const NotificationContext = createContext();

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add notification
  const addNotification = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration: options.duration || (type === 'error' ? 6000 : 4000),
      title: options.title,
      action: options.action,
      persist: options.persist || false,
      ...options,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove if not persistent
    if (!notification.persist) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification(message, 'success', options);
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification(message, 'error', options);
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification(message, 'warning', options);
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification(message, 'info', options);
  }, [addNotification]);

  // Handle API errors
  const handleApiError = useCallback((error, defaultMessage = 'Ha ocurrido un error') => {
    let message = defaultMessage;
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    // Handle validation errors
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const validationErrors = error.response.data.errors
        .map(err => err.msg || err.message)
        .join(', ');
      message = `${message}: ${validationErrors}`;
    }

    return showError(message, { duration: 6000 });
  }, [showError]);

  // Handle API success
  const handleApiSuccess = useCallback((response, defaultMessage = 'Operación exitosa') => {
    const message = response.data?.message || defaultMessage;
    return showSuccess(message);
  }, [showSuccess]);

  // General showNotification function
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    return addNotification(message, type, options);
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    handleApiError,
    handleApiSuccess,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Notification Container Component
const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <>
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.persist ? null : notification.duration}
          onClose={() => onRemove(notification.id)}
          anchorOrigin={{ 
            vertical: 'top', 
            horizontal: 'right' 
          }}
          sx={{
            mt: index * 7, // Stack notifications
          }}
        >
          <Alert
            onClose={() => onRemove(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{
              width: '100%',
              minWidth: 300,
              maxWidth: 500,
            }}
            action={notification.action}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

// Custom hook to use notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

// Higher-order component for handling async operations with notifications
export const withNotifications = (Component) => {
  return function WrappedComponent(props) {
    const notification = useNotification();
    
    const handleAsyncOperation = async (operation, options = {}) => {
      const {
        loadingMessage,
        successMessage = 'Operación exitosa',
        errorMessage = 'Ha ocurrido un error',
        showLoading = false,
        showSuccess = true,
        showError = true,
      } = options;
      
      let loadingId;
      
      try {
        if (showLoading && loadingMessage) {
          loadingId = notification.showInfo(loadingMessage, { persist: true });
        }
        
        const result = await operation();
        
        if (loadingId) {
          notification.removeNotification(loadingId);
        }
        
        if (showSuccess) {
          if (result?.data?.message) {
            notification.showSuccess(result.data.message);
          } else {
            notification.showSuccess(successMessage);
          }
        }
        
        return result;
      } catch (error) {
        if (loadingId) {
          notification.removeNotification(loadingId);
        }
        
        if (showError) {
          notification.handleApiError(error, errorMessage);
        }
        
        throw error;
      }
    };
    
    return (
      <Component 
        {...props} 
        notification={notification}
        handleAsyncOperation={handleAsyncOperation}
      />
    );
  };
};

export default NotificationContext;