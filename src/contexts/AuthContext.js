import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

// Tipos de acción
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return { ...state, loading: true, error: null };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return { ...state, user: action.payload, loading: false, error: null };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return { ...state, user: null, token: null, loading: false, error: action.payload };

    case AUTH_ACTIONS.LOGOUT:
      return { ...state, user: null, token: null, loading: false, error: null };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// AuthProvider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configurar token en API
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Login
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;

      setAuthToken(token);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });

      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Error en el inicio de sesión';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: msg });
      return { success: false, error: msg };
    }
  };

  // Cargar usuario
  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
      try {
        const response = await api.get('/auth/me');
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: response.data.data.user });
      } catch (error) {
        console.error('Error cargando usuario:', error);
        setAuthToken(null);
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'Error cargando usuario' });
      }
    } else {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Error durante logout', e);
    } finally {
      setAuthToken(null);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error
  const clearError = () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  // Load user al iniciar
  useEffect(() => {
    loadUser();
  }, []);

  // Interceptor para token inválido
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401 && state.token) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [state.token]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        error: state.error,
        login,
        logout,
        loadUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export default AuthContext;
