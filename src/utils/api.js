const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Función helper para hacer requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Agregar token si existe
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    // Si es un error de red, devolver un mensaje más claro
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }
    
    // Si es un error de respuesta del servidor, intentar extraer el mensaje
    if (error.response) {
      const errorData = await error.response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${error.response.status}: ${error.response.statusText}`);
    }
    
    // Si es un error personalizado, devolverlo tal como está
    if (error.message) {
      throw error;
    }
    
    // Error genérico
    throw new Error('Error inesperado. Intenta nuevamente.');
  }
};

// Auth API
export const authAPI = {
  register: (userData) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getProfile: () => 
    apiRequest('/auth/profile'),

  changePassword: (passwords) => 
    apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwords),
    }),
};

// Doctors API
export const doctorsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/doctors?${params}`);
  },

  getById: (id) => 
    apiRequest(`/doctors/${id}`),

  getSpecialties: () => 
    apiRequest('/doctors/specialties/list'),

  getLocations: () => 
    apiRequest('/doctors/locations/list'),

  createProfile: (profileData) => 
    apiRequest('/doctors', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),

  updateProfile: (id, profileData) => 
    apiRequest(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
};

// Appointments API
export const appointmentsAPI = {
  create: (appointmentData) => 
    apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }),

  getMyAppointments: () => 
    apiRequest('/appointments/my-appointments'),

  getById: (id) => 
    apiRequest(`/appointments/${id}`),

  updateStatus: (id, status) => 
    apiRequest(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  cancel: (id) => 
    apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
    }),
};

// Symptoms API
export const symptomsAPI = {
  analyze: (symptoms) => 
    apiRequest('/symptoms/analyze', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    }),

  getHistory: () => 
    apiRequest('/symptoms/history'),

  getStats: () => 
    apiRequest('/symptoms/stats'),

  getSuggestions: () => 
    apiRequest('/symptoms/suggestions'),
};

// Health check
export const healthCheck = () => 
  apiRequest('/health');

// API para chat
const chatAPI = {
  sendMessage: (message, conversationHistory = []) => 
    apiRequest('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory })
    }),
  
  getSuggestions: () => 
    apiRequest('/chat/suggestions')
};

export default {
  auth: authAPI,
  doctors: doctorsAPI,
  appointments: appointmentsAPI,
  symptoms: symptomsAPI,
  chat: chatAPI,
  healthCheck,
}; 