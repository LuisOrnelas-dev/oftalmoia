import { useState, useRef, useEffect } from "react";
import { FaCommentDots, FaTimes, FaSearch, FaStethoscope, FaPhone, FaEnvelope, FaMapMarkerAlt, FaStar, FaUser, FaSignOutAlt } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { IoMdMedical } from "react-icons/io";
import ReactMarkdown from 'react-markdown';
import { useAuth } from './context/AuthContext';
import { doctorsAPI, appointmentsAPI, symptomsAPI, authAPI } from './utils/api';
import LoginModal from './components/LoginModal';

// Datos mock para fallback si la API no está disponible
const mockDoctors = [
  { 
    id: 1, 
    name: "Dr. Juan Pérez", 
    specialty: "Oftalmología Pediátrica", 
    location: "CDMX", 
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 4.8,
    reviews: 127,
    experience: "15 años",
    languages: ["Español", "Inglés"],
    consultationFee: "$800",
    availability: "Lun-Vie 9:00-17:00"
  },
  { 
    id: 2, 
    name: "Dra. María López", 
    specialty: "Cirugía Refractiva", 
    location: "Guadalajara", 
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 4.9,
    reviews: 89,
    experience: "12 años",
    languages: ["Español"],
    consultationFee: "$1,200",
    availability: "Mar-Jue 8:00-16:00"
  },
  { 
    id: 3, 
    name: "Dr. Carlos Sánchez", 
    specialty: "Glaucoma", 
    location: "Monterrey", 
    image: "https://randomuser.me/api/portraits/men/56.jpg",
    rating: 4.7,
    reviews: 203,
    experience: "18 años",
    languages: ["Español", "Inglés"],
    consultationFee: "$950",
    availability: "Lun-Sáb 10:00-18:00"
  },
  { 
    id: 4, 
    name: "Dra. Ana Rodríguez", 
    specialty: "Retina y Vítreo", 
    location: "Puebla", 
    image: "https://randomuser.me/api/portraits/women/60.jpg",
    rating: 4.6,
    reviews: 156,
    experience: "14 años",
    languages: ["Español"],
    consultationFee: "$1,100",
    availability: "Lun-Vie 9:00-15:00"
  },
  { 
    id: 5, 
    name: "Dr. Luis Fernández", 
    specialty: "Córnea y Enfermedades Externas", 
    location: "Tijuana", 
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4.5,
    reviews: 78,
    experience: "10 años",
    languages: ["Español", "Inglés"],
    consultationFee: "$750",
    availability: "Mar-Sáb 8:00-14:00"
  },
  { 
    id: 6, 
    name: "Dr. Ricardo Gómez", 
    specialty: "Neuroftalmología", 
    location: "Mérida", 
    image: "https://randomuser.me/api/portraits/men/50.jpg",
    rating: 4.9,
    reviews: 67,
    experience: "20 años",
    languages: ["Español"],
    consultationFee: "$1,300",
    availability: "Lun-Jue 9:00-17:00"
  },
  { 
    id: 7, 
    name: "Dra. Sofía Ramírez", 
    specialty: "Oftalmología Oncológica", 
    location: "Querétaro", 
    image: "https://randomuser.me/api/portraits/women/55.jpg",
    rating: 4.8,
    reviews: 45,
    experience: "16 años",
    languages: ["Español", "Inglés"],
    consultationFee: "$1,500",
    availability: "Lun-Vie 8:00-16:00"
  },
  { 
    id: 8, 
    name: "Dr. Alejandro Torres", 
    specialty: "Cirugía de Cataratas", 
    location: "León", 
    image: "https://randomuser.me/api/portraits/men/65.jpg",
    rating: 4.7,
    reviews: 189,
    experience: "22 años",
    languages: ["Español"],
    consultationFee: "$1,000",
    availability: "Lun-Sáb 9:00-17:00"
  },
  { 
    id: 9, 
    name: "Dra. Valeria Martínez", 
    specialty: "Oftalmología Plástica", 
    location: "Veracruz", 
    image: "https://randomuser.me/api/portraits/women/35.jpg",
    rating: 4.6,
    reviews: 92,
    experience: "11 años",
    languages: ["Español", "Inglés"],
    consultationFee: "$1,400",
    availability: "Mar-Vie 10:00-18:00"
  },
  { 
    id: 10, 
    name: "Dr. Fernando Castillo", 
    specialty: "Uveítis", 
    location: "Hermosillo", 
    image: "https://randomuser.me/api/portraits/men/28.jpg",
    rating: 4.4,
    reviews: 34,
    experience: "8 años",
    languages: ["Español"],
    consultationFee: "$850",
    availability: "Lun-Jue 9:00-15:00"
  }
];

export default function OftalmoBot() {
  const { user, isAuthenticated, logout, register } = useAuth();
  
  // Estados para el nuevo flujo de IA
  const [searchMode, setSearchMode] = useState('symptoms'); // 'symptoms' o 'doctors'
  const [viewMode, setViewMode] = useState('patient'); // 'patient' o 'doctor'
  const [symptoms, setSymptoms] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [recommendedSpecialties, setRecommendedSpecialties] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'patient' // 'patient' o 'doctor'
  });

  const [doctors, setDoctors] = useState(mockDoctors);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [search, setSearch] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: '',
    patientName: '',
    patientPhone: '',
    patientEmail: ''
  });
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const messagesEndRef = useRef(null);

  // Función para mostrar notificaciones
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Cargar doctores desde la API
  const loadDoctors = async (filters = {}) => {
    setLoadingDoctors(true);
    try {
      const response = await doctorsAPI.getAll(filters);
      setDoctors(response.doctors);
    } catch (error) {
      console.error('Error cargando doctores:', error);
      // Usar datos mock como fallback
      setDoctors(mockDoctors);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Cargar doctores al montar el componente
  useEffect(() => {
    loadDoctors();
  }, []);

  // Cambiar vista según el tipo de usuario
  useEffect(() => {
    if (isAuthenticated && user) {
      setViewMode(user.userType);
      if (user.userType === 'doctor') {
        loadDoctorAppointments();
      }
    } else {
      setViewMode('patient');
    }
  }, [isAuthenticated, user]);

  // Cargar citas del médico
  const loadDoctorAppointments = async () => {
    if (isAuthenticated && user?.userType === 'doctor') {
      try {
        const response = await appointmentsAPI.getMyAppointments();
        setDoctorAppointments(response.appointments || []);
      } catch (error) {
        console.error('Error cargando citas del doctor:', error);
        // Datos mock para demostración
        setDoctorAppointments([
          {
            id: 1,
            patientName: 'María González',
            appointmentDate: '2024-01-15',
            appointmentTime: '10:00',
            reason: 'Dolor de ojos y visión borrosa',
            status: 'pending',
            patientPhone: '555-0123',
            patientEmail: 'maria@example.com'
          },
          {
            id: 2,
            patientName: 'Carlos Ruiz',
            appointmentDate: '2024-01-15',
            appointmentTime: '14:00',
            reason: 'Revisión post-operatoria',
            status: 'confirmed',
            patientPhone: '555-0456',
            patientEmail: 'carlos@example.com'
          }
        ]);
      }
    }
  };

  const handleRegister = async () => {
    // Validación básica
    if (!registerData.name || !registerData.email || !registerData.password) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      showNotification('Por favor ingresa un email válido', 'error');
      return;
    }

    // Validación de contraseña
    if (registerData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      const result = await register(registerData);
      
      if (result.success) {
        // Mostrar mensaje de éxito y cerrar modal
        showNotification('¡Registro exitoso! Bienvenido a OftalmoIA.', 'success');
        setShowRegister(false);
        setRegisterData({
          name: '',
          email: '',
          password: '',
          phone: '',
          userType: 'patient'
        });
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error en registro:', error);
      
      // Mostrar mensaje específico según el tipo de error
      let errorMessage = 'Error en el registro';
      
      if (error.message.includes('El email ya está registrado')) {
        errorMessage = 'Este email ya está registrado. Intenta con otro email o inicia sesión.';
      } else if (error.message.includes('No se pudo conectar')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Datos inválidos. Verifica que todos los campos estén correctos.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Error del servidor. Intenta nuevamente en unos momentos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    }
  };
    // Función para analizar síntomas con IA real
  // Función para parsear y formatear la respuesta de la IA
  const parseAIResponse = (aiResponse) => {
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = aiResponse.match(/```json\s*(\{.*?\})\s*```/s);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        
        let formattedResponse = '## 📋 Análisis de Síntomas\n\n';
        
        if (jsonData.conditions && jsonData.conditions.length > 0) {
          formattedResponse += '### 🔍 Posibles Condiciones:\n';
          jsonData.conditions.forEach(condition => {
            formattedResponse += `• ${condition}\n`;
          });
          formattedResponse += '\n';
        }
        
        if (jsonData.specialties && jsonData.specialties.length > 0) {
          formattedResponse += '### 👨‍⚕️ Especialidades Recomendadas:\n';
          jsonData.specialties.forEach(specialty => {
            formattedResponse += `• ${specialty}\n`;
          });
          formattedResponse += '\n';
        }
        
        if (jsonData.advice) {
          formattedResponse += '### 💡 Consejos Inmediatos:\n';
          formattedResponse += `${jsonData.advice}\n\n`;
        }
        
        if (jsonData.urgency) {
          const urgencyEmoji = jsonData.urgency === 'alto' ? '🚨' : 
                              jsonData.urgency === 'medio' ? '⚠️' : 'ℹ️';
          formattedResponse += `### ${urgencyEmoji} Nivel de Urgencia:\n`;
          formattedResponse += `${jsonData.urgency.charAt(0).toUpperCase() + jsonData.urgency.slice(1)}\n\n`;
        }
        
        if (jsonData.recommendation) {
          formattedResponse += '### 🎯 Recomendación:\n';
          formattedResponse += `${jsonData.recommendation}\n`;
        }
        
        return formattedResponse;
      }
      
      // Si no hay JSON, devolver la respuesta original
      return aiResponse;
    } catch (error) {
      console.error('Error parseando respuesta de IA:', error);
      return aiResponse;
    }
  };

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;
    
    setAiThinking(true);
    
    try {
      const response = await symptomsAPI.analyze(symptoms);
      const formattedResponse = parseAIResponse(response.analysis.aiResponse);
      setAiResponse(formattedResponse);
      setRecommendedSpecialties(response.analysis.recommendedSpecialties);
      setSearchMode('doctors');
    } catch (error) {
      console.error('Error analizando síntomas:', error);
      // Fallback a análisis básico
      setAiResponse('Basado en tus síntomas, te recomiendo consultar con un oftalmólogo especialista para un diagnóstico preciso.');
      setRecommendedSpecialties(['Oftalmología General']);
      setSearchMode('doctors');
    } finally {
      setAiThinking(false);
    }
  };

  // Filtrar doctores basado en especialidades recomendadas
  const filteredDoctors = searchMode === 'doctors' && recommendedSpecialties.length > 0
    ? doctors.filter(doctor => 
        recommendedSpecialties.includes(doctor.specialty) ||
        doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(search.toLowerCase()) ||
        doctor.location.toLowerCase().includes(search.toLowerCase())
      )
    : doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(search.toLowerCase()) ||
        doctor.location.toLowerCase().includes(search.toLowerCase())
      );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const botResponses = [
    "¡Hola! Soy OftalmoBot, tu asistente virtual especializado en oftalmología. ¿En qué puedo ayudarte hoy?",
    "Puedo ayudarte a:",
    "1. Encontrar especialistas en oftalmología",
    "2. Explicarte sobre diferentes condiciones oculares",
    "3. Orientarte sobre cuidados visuales",
    "¿Qué necesitas?"
  ];

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const userMessage = inputMessage;
    setMessages([...messages, { text: userMessage, sender: "user" }]);
    setInputMessage("");

    // Mostrar mensaje de "escribiendo..."
    setMessages(prev => [...prev, { text: "Escribiendo...", sender: "bot", loading: true }]);

    try {
      // Usar la API de síntomas para análisis con IA
      const response = await symptomsAPI.analyze(userMessage);
      const aiResponse = response.analysis.aiResponse;
      
      // Remover el mensaje de "escribiendo..." y agregar la respuesta de IA
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.loading);
        return [...withoutLoading, { 
          text: parseAIResponse(aiResponse) || "Gracias por tu consulta. Te recomiendo consultar con un especialista para obtener un diagnóstico preciso.",
          sender: "bot" 
        }];
      });
    } catch (error) {
      console.error('Error en chatbot:', error);
      
      // Remover el mensaje de "escribiendo..." y agregar respuesta de fallback
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.loading);
        return [...withoutLoading, { 
          text: "Gracias por tu mensaje. Un especialista te contactará pronto para responder a tu consulta.",
          sender: "bot" 
        }];
      });
    }
  };

  const openDoctorModal = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const closeModal = () => {
    setSelectedDoctor(null);
  };

  const handleAppointment = async () => {
    if (!appointmentData.date || !appointmentData.time || !appointmentData.patientName) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const appointmentPayload = {
        doctorId: selectedDoctor.id,
        appointmentDate: appointmentData.date,
        appointmentTime: appointmentData.time,
        reason: appointmentData.reason,
        patientName: appointmentData.patientName,
        patientPhone: appointmentData.patientPhone,
        patientEmail: appointmentData.patientEmail
      };

      const response = await appointmentsAPI.create(appointmentPayload);

      alert('¡Cita agendada exitosamente! Te enviaremos una confirmación por email.');
      setShowAppointment(false);
      setAppointmentData({
        date: '',
        time: '',
        reason: '',
        patientName: '',
        patientPhone: '',
        patientEmail: ''
      });
      
      // Agregar notificación
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        message: `Cita agendada con ${selectedDoctor.name} para ${appointmentData.date}`
      }]);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error al agendar la cita');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center shadow-md">
        <h1 className="text-3xl font-bold">OftalmoIA</h1>
        <div className="flex items-center space-x-6">
          <button 
            className={`hover:underline ${searchMode === 'symptoms' ? 'font-bold underline' : ''}`}
            onClick={() => setSearchMode('symptoms')}
          >
            Por síntomas
          </button>
          <button 
            className={`hover:underline ${searchMode === 'doctors' ? 'font-bold underline' : ''}`}
            onClick={() => setSearchMode('doctors')}
          >
            Directorio
          </button>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaUser className="text-sm" />
                <span className="text-sm">{user?.name}</span>
              </div>
              <button 
                onClick={logout}
                className="flex items-center space-x-1 bg-red-500 px-3 py-1 rounded-full text-white text-sm hover:bg-red-600"
              >
                <FaSignOutAlt size={12} />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <button 
                className="hover:underline"
                onClick={() => setShowLogin(true)}
              >
                Iniciar sesión
              </button>
              <button 
                className="hover:underline"
                onClick={() => setShowRegister(true)}
              >
                Registrarse
              </button>
            </div>
          )}
          
          {isAuthenticated && user?.userType === 'doctor' && (
            <button 
              onClick={() => setViewMode(viewMode === 'doctor' ? 'patient' : 'doctor')}
              className="bg-green-400 px-4 py-2 rounded-full text-white font-semibold hover:bg-green-500 transition-colors"
            >
              {viewMode === 'doctor' ? 'Vista Paciente' : 'Área Médica'}
            </button>
          )}
        </div>
      </nav>

      {/* Contenido Principal */}
          {/* Hero Section */}
          {/* Hero Section Mejorada - Integración Opción 1 */}
          <header className="bg-gradient-to-b from-blue-50 to-white py-12 px-6">
  <div className="max-w-4xl mx-auto text-center">
    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
      <span className="text-blue-600">Describe</span> tus síntomas oculares
    </h1>
    
    {/* Selector de síntomas visual */}
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {["Ojo rojo", "Dolor", "Visión borrosa", "Picazón", "Sensibilidad", "Lagrimeo"].map((symptom) => (
          <button
            key={symptom}
            onClick={() => setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom)}
            className="bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg transition-all hover:scale-105"
          >
            {symptom}
          </button>
        ))}
      </div>
      
      {/* Input con botón de IA integrado */}
      <div className="relative">
        <input
          type="text"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && analyzeSymptoms()}
          placeholder="Ej: 'Tengo ojos rojos y dolor de cabeza'..."
          className="w-full p-4 pr-16 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400 text-lg"
        />
        <button 
          onClick={analyzeSymptoms}
          disabled={!symptoms.trim()}
          className={`absolute right-2 top-2 p-2 rounded-lg ${symptoms.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
        >
          <FaStethoscope size={20} />
        </button>
      </div>
    </div>

    {/* Ejemplos de búsquedas comunes */}
    <div className="max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-inner border border-blue-100">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Ejemplos frecuentes:</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {["Dolor al mover los ojos", "Ojos llorosos", "Visión doble"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setSymptoms(item);
                setSearchMode('symptoms');
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
</header>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto mt-6 p-4">
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o ubicación..."
          className="w-full p-4 border border-gray-300 rounded-lg mb-6 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {/* Filtros Avanzados para MVP */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Especialidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                onChange={(e) => setSearch(prev => prev + (e.target.value ? ` ${e.target.value}` : ''))}
              >
                <option value="">Todas las especialidades</option>
                <option value="Oftalmología Pediátrica">Oftalmología Pediátrica</option>
                <option value="Cirugía Refractiva">Cirugía Refractiva</option>
                <option value="Glaucoma">Glaucoma</option>
                <option value="Retina y Vítreo">Retina y Vítreo</option>
                <option value="Córnea y Enfermedades Externas">Córnea y Enfermedades Externas</option>
                <option value="Neuroftalmología">Neuroftalmología</option>
                <option value="Oftalmología Oncológica">Oftalmología Oncológica</option>
                <option value="Cirugía de Cataratas">Cirugía de Cataratas</option>
                <option value="Oftalmología Plástica">Oftalmología Plástica</option>
                <option value="Uveítis">Uveítis</option>
              </select>
            </div>
            
            {/* Filtro por Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                onChange={(e) => setSearch(prev => prev + (e.target.value ? ` ${e.target.value}` : ''))}
              >
                <option value="">Todas las ubicaciones</option>
                <option value="CDMX">CDMX</option>
                <option value="Guadalajara">Guadalajara</option>
                <option value="Monterrey">Monterrey</option>
                <option value="Puebla">Puebla</option>
                <option value="Tijuana">Tijuana</option>
                <option value="Mérida">Mérida</option>
                <option value="Querétaro">Querétaro</option>
                <option value="León">León</option>
                <option value="Veracruz">Veracruz</option>
                <option value="Hermosillo">Hermosillo</option>
              </select>
            </div>
            
            {/* Filtro por Disponibilidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                <option value="">Cualquier día</option>
                <option value="hoy">Disponible hoy</option>
                <option value="semana">Esta semana</option>
                <option value="fin">Fin de semana</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      {/* Resultado de IA */}
      {aiResponse && (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <IoMdMedical className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Análisis de OftalmoIA</h3>
              <div className="text-gray-700 prose prose-sm max-w-none">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
              {recommendedSpecialties.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-800">Especialistas recomendados:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {recommendedSpecialties.map((specialty, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button 
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  setSearchMode('doctors');
                  setSearch(recommendedSpecialties[0] || '');
                }}
              >
                Ver especialistas recomendados →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {aiThinking && (
        <div className="max-w-4xl mx-auto mt-8 p-6 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-700">Analizando tus síntomas con nuestra IA...</span>
          </div>
        </div>
      )}

      {/* Doctors Grid */}
      {(searchMode === 'doctors' || aiResponse) && (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedDoctor(doctor)}
              >
                <div className="flex items-center mb-4">
                  <img 
                    src={doctor.image} 
                    alt={doctor.name} 
                    className="w-16 h-16 rounded-full border-4 border-blue-200 object-cover"
                  />
                  <div className="ml-4 flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{doctor.name}</h2>
                    <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                    <div className="flex items-center mt-1">
                      <FaMapMarkerAlt className="mr-1 text-gray-400 text-sm" />
                      <span className="text-gray-600 text-sm">{doctor.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{doctor.consultationFee}</div>
                    <div className="text-xs text-gray-500">consulta</div>
                  </div>
                </div>
                
                {/* Información adicional */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Experiencia:</span>
                    <span className="font-medium">{doctor.experience}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Idiomas:</span>
                    <span className="font-medium">{doctor.languages.join(", ")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Disponibilidad:</span>
                    <span className="font-medium">{doctor.availability}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={`${i < Math.floor(doctor.rating) ? 'text-yellow-400' : 'text-gray-300'} mr-1 text-sm`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">({doctor.reviews})</span>
                  </div>
                  <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                    Ver perfil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <img 
                src="https://img.icons8.com/color/96/000000/visible.png" 
                alt="No results" 
                className="mx-auto mb-4 opacity-70"
              />
              <p className="text-gray-700 text-lg">No encontramos especialistas con esos criterios</p>
              <button 
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setSearchMode('symptoms')}
              >
                ← Volver a buscar por síntomas
              </button>
            </div>
          )}
        </div>
      )}
      {/* Añade esto cerca de tus otros modales */}
      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Crear cuenta</h2>
              <button 
                onClick={() => setShowRegister(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Tipo de usuario</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="userType"
                    value="patient"
                    checked={registerData.userType === 'patient'}
                    onChange={(e) => setRegisterData({...registerData, userType: e.target.value})}
                  />
                  <span className="ml-2">Paciente</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="userType"
                    value="doctor"
                    checked={registerData.userType === 'doctor'}
                    onChange={(e) => setRegisterData({...registerData, userType: e.target.value})}
                  />
                  <span className="ml-2">Médico</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nombre completo</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Correo electrónico</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={registerData.phone}
                onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
              />
            </div>

            {registerData.userType === 'doctor' && (
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Número de cédula profesional</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Opcional - puedes agregarla después"
                />
              </div>
            )}

            <button 
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              onClick={handleRegister}
            >
              Registrarse
            </button>

            <p className="text-center mt-4 text-gray-600">
              ¿Ya tienes cuenta? <button 
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setShowRegister(false);
                  // Aquí podrías abrir el modal de login si lo implementas
                }}
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      )}
      {/* Modal del Doctor */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 hover:bg-gray-200 z-10"
              >
                <FaTimes className="text-gray-600" />
              </button>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <img 
                      src={selectedDoctor.image} 
                      alt={selectedDoctor.name} 
                      className="w-40 h-40 rounded-full border-4 border-blue-400 shadow-lg object-cover mx-auto"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedDoctor.name}</h2>
                    <p className="text-xl text-blue-600 font-medium mb-4">{selectedDoctor.specialty}</p>
                    
                    <div className="flex items-center mb-3">
                      <FaMapMarkerAlt className="text-gray-500 mr-2" />
                      <span className="text-gray-700">{selectedDoctor.location}</span>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <FaPhone className="text-gray-500 mr-2" />
                      <span className="text-gray-700">+52 55 {Math.floor(1000 + Math.random() * 9000)} {Math.floor(1000 + Math.random() * 9000)}</span>
                    </div>
                    
                    <div className="flex items-center mb-6">
                      <FaEnvelope className="text-gray-500 mr-2" />
                      <span className="text-gray-700">{selectedDoctor.name.replace(/\s+/g, '').toLowerCase()}@clinicaoftalmo.com</span>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={`${i < 4 ? 'text-yellow-400' : 'text-gray-300'} mr-1`} 
                        />
                      ))}
                      <span className="text-gray-500 ml-2">(24 reseñas)</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Sobre el especialista</h3>
                  <p className="text-gray-700 mb-4">
                    {selectedDoctor.name} es especialista en {selectedDoctor.specialty} con más de {Math.floor(5 + Math.random() * 10)} años de experiencia. 
                    Graduado de la Universidad Nacional Autónoma de México con especialización en {selectedDoctor.specialty}.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">Horarios de atención</h3>
                  <ul className="grid grid-cols-2 gap-2 mb-6">
                    <li className="text-gray-700">Lunes: 9:00 - 17:00</li>
                    <li className="text-gray-700">Martes: 9:00 - 17:00</li>
                    <li className="text-gray-700">Miércoles: 9:00 - 13:00</li>
                    <li className="text-gray-700">Jueves: 9:00 - 17:00</li>
                    <li className="text-gray-700">Viernes: 9:00 - 15:00</li>
                    <li className="text-gray-700">Sábado: Cerrado</li>
                  </ul>
                  
                  <div className="flex space-x-4">
                    <button 
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center"
                      onClick={() => setShowAppointment(true)}
                    >
                      <FaPhone className="mr-2" /> Agendar cita
                    </button>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center">
                      <FaPhone className="mr-2" /> Llamar ahora
                    </button>
                    <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition flex items-center">
                      <FaEnvelope className="mr-2" /> Enviar mensaje
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="bg-white text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">S</span>
              SymptoDoc
            </h2>
            <p className="text-blue-200">
              Plataforma especializada en conectar pacientes con los mejores oftalmólogos de México.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-white hover:text-blue-300">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-blue-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-blue-300">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white">Inicio</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Doctores</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Clínicas</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Especialidades</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white">Oftalmología Pediátrica</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Cirugía Refractiva</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Glaucoma</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Retina y Vítreo</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white">Córnea</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2 text-blue-200">
              <li className="flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +52 55 1234 5678
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contacto@symptodoc.com
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Av. Reforma 123, CDMX
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-6 text-center text-blue-300">
          <p>© {new Date().getFullYear()} SymptoDoc. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Chat Button mejorado */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-400 text-white p-5 rounded-full shadow-2xl hover:scale-110 transform transition-all duration-300 flex items-center justify-center border-4 border-white z-50"
      >
        {chatOpen ? (
          <FaTimes size={24} />
        ) : (
          <div className="relative">
            <div className="absolute -inset-1 bg-white rounded-full opacity-75 animate-ping"></div>
            <FaCommentDots size={24} />
          </div>
        )}
      </button>

      {/* Chat Window mejorado */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-t-xl shadow-xl flex flex-col z-50 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-t-xl flex items-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-75 animate-pulse"></div>
              <div className="relative bg-white p-1 rounded-full">
                <img 
                  src="https://img.icons8.com/color/48/000000/artificial-intelligence.png" 
                  alt="AI" 
                  className="w-6 h-6"
                />
              </div>
            </div>
            <h3 className="ml-3 font-bold">Asistente OftalmoIA</h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-16">
                <img 
                  src="https://img.icons8.com/color/96/000000/eye-checked.png" 
                  alt="OftalmoBot" 
                  className="mx-auto mb-2"
                />
                <p>¡Hola! Soy tu asistente de oftalmología.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-3 ${msg.sender === "user" ? "text-right" : "text-left"}`}
                >
                  <div 
                    className={`inline-block px-4 py-2 rounded-lg ${msg.sender === "user" 
                      ? "bg-blue-500 text-white" 
                      : "bg-gray-200 text-gray-800"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition"
            >
              <IoSend />
            </button>
          </div>
        </div>
      )}

      {/* Vista del Médico */}
      ) : (
        <div className="min-h-screen bg-gray-50">
          {/* Header del Doctor */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Panel Médico</h1>
                  <p className="text-gray-600 mt-1">Bienvenido, Dr. {user?.name}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Citas de hoy</p>
                    <p className="text-2xl font-bold text-blue-600">{doctorAppointments.filter(apt => apt.status === 'pending').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del Panel Médico */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Citas Pendientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctorAppointments.filter(apt => apt.status === 'pending').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctorAppointments.filter(apt => apt.status === 'confirmed').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctorAppointments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pacientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{new Set(doctorAppointments.map(apt => apt.patientName)).size}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Citas */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Citas Programadas</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {doctorAppointments.length > 0 ? (
                  doctorAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">{appointment.patientName}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              appointment.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{appointment.reason}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>📅 {appointment.appointmentDate}</span>
                            <span>🕐 {appointment.appointmentTime}</span>
                            <span>📞 {appointment.patientPhone}</span>
                            <span>✉️ {appointment.patientEmail}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                            Confirmar
                          </button>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors">
                            Ver Perfil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas programadas</h3>
                    <p className="mt-1 text-sm text-gray-500">Las citas aparecerán aquí cuando los pacientes las agenden.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cierre del fragmento JSX */}
      </>
      ) : (
        <div className="min-h-screen bg-gray-50">
          {/* Header del Doctor */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Panel Médico</h1>
                  <p className="text-gray-600 mt-1">Bienvenido, Dr. {user?.name}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Citas de hoy</p>
                    <p className="text-2xl font-bold text-blue-600">{doctorAppointments.filter(apt => apt.status === 'pending').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del Panel Médico */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Citas Pendientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctorAppointments.filter(apt => apt.status === 'pending').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctorAppointments.filter(apt => apt.status === 'confirmed').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                    <p className="text-2xl font-semibold text-gray-900">{doctorAppointments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pacientes</p>
                    <p className="text-2xl font-semibold text-gray-900">{new Set(doctorAppointments.map(apt => apt.patientName)).size}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Citas */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Citas Programadas</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {doctorAppointments.length > 0 ? (
                  doctorAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">{appointment.patientName}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              appointment.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{appointment.reason}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>📅 {appointment.appointmentDate}</span>
                            <span>🕐 {appointment.appointmentTime}</span>
                            <span>📞 {appointment.patientPhone}</span>
                            <span>✉️ {appointment.patientEmail}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                            Confirmar
                          </button>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors">
                            Ver Perfil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas programadas</h3>
                    <p className="mt-1 text-sm text-gray-500">Las citas aparecerán aquí cuando los pacientes las agenden.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>

      {/* Modal de Citas */}
      {showAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Agendar Cita</h2>
                <button 
                  onClick={() => setShowAppointment(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">

            {selectedDoctor && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">{selectedDoctor.name}</h3>
                <p className="text-blue-600">{selectedDoctor.specialty}</p>
                <p className="text-sm text-blue-700">Costo: {selectedDoctor.consultationFee}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Fecha</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={appointmentData.date}
                onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Hora</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={appointmentData.time}
                onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
              >
                <option value="">Selecciona una hora</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Motivo de la consulta</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows="3"
                value={appointmentData.reason}
                onChange={(e) => setAppointmentData({...appointmentData, reason: e.target.value})}
                placeholder="Describe brevemente el motivo de tu consulta..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nombre completo</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={appointmentData.patientName}
                onChange={(e) => setAppointmentData({...appointmentData, patientName: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={appointmentData.patientPhone}
                onChange={(e) => setAppointmentData({...appointmentData, patientPhone: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={appointmentData.patientEmail}
                onChange={(e) => setAppointmentData({...appointmentData, patientEmail: e.target.value})}
              />
            </div>

            <button 
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
              onClick={handleAppointment}
            >
              Confirmar Cita
            </button>
            </div>
          </div>
        </div>
      )}



      {/* Notificaciones */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`transform transition-all duration-300 ease-in-out ${
                notification.type === 'success' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-l-4 border-green-400' 
                  : notification.type === 'error'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-l-4 border-red-400'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-l-4 border-blue-400'
              } p-4 rounded-lg shadow-xl max-w-sm backdrop-blur-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'success' ? (
                    <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : notification.type === 'error' ? (
                    <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-5">{notification.message}</p>
                </div>
                <button 
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Registro */}
      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Registrarse</h2>
                <button 
                  onClick={() => setShowRegister(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Nombre completo</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Tipo de usuario</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="patient"
                        checked={registerData.userType === 'patient'}
                        onChange={(e) => setRegisterData({...registerData, userType: e.target.value})}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">Paciente</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="doctor"
                        checked={registerData.userType === 'doctor'}
                        onChange={(e) => setRegisterData({...registerData, userType: e.target.value})}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">Médico</span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Registrarse
                </button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button 
                    onClick={() => {
                      setShowRegister(false);
                      setShowLogin(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Iniciar sesión
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Login */}
      <LoginModal 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
        showNotification={showNotification}
      />
    </div>
  );
}
