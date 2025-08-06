import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaStethoscope, FaCalendarAlt, FaMapMarkerAlt, FaDollarSign, FaRobot, FaPaperPlane, FaTimes, FaUser, FaSignOutAlt, FaPhone, FaEnvelope, FaMedal, FaGraduationCap } from 'react-icons/fa';
import { IoMdMedical } from 'react-icons/io';
import ReactMarkdown from 'react-markdown';
import api, { doctorsAPI, appointmentsAPI, symptomsAPI } from './utils/api';
import { useAuth, AuthProvider } from './context/AuthContext';
import LoginModal from './components/LoginModal';

// Componente principal dentro del AuthProvider
function OftalmoBot() {
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

  // Estados para el chat
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([
    { 
      text: "👋 ¡Hola! Soy **OftalmoIA Assistant**, tu especialista virtual en salud ocular.\n\n🔍 **¿Cómo puedo ayudarte hoy?**\n\n• Describe tus síntomas oculares\n• Pregunta sobre enfermedades del ojo\n• Solicita recomendaciones de especialistas\n• Consulta sobre cuidados preventivos\n\n⚠️ *Recuerda: Mis consejos son informativos. Para diagnósticos precisos, consulta siempre con un oftalmólogo.*", 
      sender: "bot" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);

  // Estados para doctores y citas
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [search, setSearch] = useState('');
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

  // **NUEVO: Cambiar título dinámicamente según la sección activa**
  useEffect(() => {
    const baseTitle = "OftalmoIA - Especialistas en Salud Ocular";
    
    if (searchMode === 'symptoms') {
      document.title = `${baseTitle} | Análisis de Síntomas con IA`;
    } else if (searchMode === 'doctors') {
      document.title = `${baseTitle} | Directorio Médico`;
    } else {
      document.title = baseTitle;
    }
  }, [searchMode]);

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'patient',
    profileImage: null,
    specialty: ''
  });

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

  // Función para parsear respuesta de IA
  const parseAIResponse = (aiResponse) => {
    if (!aiResponse) return '';

    try {
      // Intentar extraer JSON si viene en formato de código
      let jsonData;
      if (aiResponse.includes('```json')) {
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[1]);
        }
      } else if (aiResponse.startsWith('{') && aiResponse.endsWith('}')) {
        jsonData = JSON.parse(aiResponse);
      } else {
        return aiResponse; // Si no es JSON, devolver tal como está
      }

      // Formatear el JSON a texto legible con mejor estructura
      let formattedText = '';

      // Encabezado profesional
      formattedText += '# 🔍 Análisis Oftalmológico - OftalmoIA\n\n';

      if (jsonData.conditions && Array.isArray(jsonData.conditions)) {
        formattedText += '## 📋 Posibles Condiciones Oculares\n';
        jsonData.conditions.forEach((condition, index) => {
          formattedText += `${index + 1}. **${condition}**\n`;
        });
        formattedText += '\n';
      }

      if (jsonData.urgency) {
        const urgencyMap = {
          'bajo': { emoji: '🟢', text: 'Bajo - Cita de rutina', color: 'verde' },
          'medio': { emoji: '🟡', text: 'Medio - Cita en días', color: 'amarillo' },
          'alto': { emoji: '🔴', text: 'Alto - Cita urgente', color: 'rojo' },
          'emergencia': { emoji: '🚨', text: 'EMERGENCIA - Atención inmediata', color: 'rojo' }
        };
        const urgencyInfo = urgencyMap[jsonData.urgency] || { emoji: '⚪', text: jsonData.urgency, color: 'gris' };
        formattedText += `## ⚡ Nivel de Urgencia\n${urgencyInfo.emoji} **${urgencyInfo.text}**\n\n`;
      }

      if (jsonData.specialties && Array.isArray(jsonData.specialties)) {
        formattedText += '## 👨‍⚕️ Especialistas Recomendados\n';
        jsonData.specialties.forEach(specialty => {
          formattedText += `• **${specialty}**\n`;
        });
        formattedText += '\n';
      }

      if (jsonData.advice) {
        formattedText += '## 💡 Consejos de Cuidado\n';
        formattedText += `${jsonData.advice}\n\n`;
      }

      if (jsonData.home_care) {
        formattedText += '## 🏠 Cuidados en Casa\n';
        formattedText += `${jsonData.home_care}\n\n`;
      }

      if (jsonData.warning_signs) {
        formattedText += '## ⚠️ Señales de Alarma\n';
        formattedText += `🚨 **Busca atención médica inmediata si experimentas:**\n${jsonData.warning_signs}\n\n`;
      }

      if (jsonData.recommendation) {
        formattedText += '## 📝 Próximos Pasos\n';
        formattedText += `${jsonData.recommendation}\n\n`;
      }

      // Pie de página profesional
      formattedText += '---\n';
      formattedText += '🔬 **Importante:** Este análisis es preliminar y educativo. Para un diagnóstico definitivo y tratamiento personalizado, consulta siempre con un oftalmólogo certificado.\n\n';
      formattedText += '🏥 **¿Necesitas agendar una consulta?** Puedes buscar especialistas en nuestro directorio médico.';

      return formattedText;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return aiResponse; // Si hay error, devolver la respuesta original
    }
  };

  // Datos mock de doctores
  const mockDoctors = [
    {
      id: 1,
      name: "Dr. María González",
      specialty: "Oftalmología Pediátrica",
      rating: 4.9,
      experience: "15 años",
      location: "Ciudad de México",
      consultationFee: "$800 MXN",
      phone: "555-0123",
      email: "maria.gonzalez@oftalmoia.com",
      education: "UNAM - Especialidad en Oftalmología Pediátrica",
      languages: ["Español", "Inglés"],
      image: "/api/placeholder/150/150"
    },
    {
      id: 2,
      name: "Dr. Carlos Ruiz",
      specialty: "Cirugía Refractiva",
      rating: 4.8,
      experience: "12 años",
      location: "Guadalajara",
      consultationFee: "$1200 MXN",
      phone: "555-0456",
      email: "carlos.ruiz@oftalmoia.com",
      education: "Instituto Tecnológico de Monterrey",
      languages: ["Español", "Inglés", "Francés"],
      image: "/api/placeholder/150/150"
    },
    {
      id: 3,
      name: "Dra. Ana López",
      specialty: "Glaucoma",
      rating: 4.7,
      experience: "20 años",
      location: "Monterrey",
      consultationFee: "$1000 MXN",
      phone: "555-0789",
      email: "ana.lopez@oftalmoia.com",
      education: "Universidad Autónoma de Nuevo León",
      languages: ["Español"],
      image: "/api/placeholder/150/150"
    }
  ];

  // Cargar doctores al montar el componente
  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

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

  const loadDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll();
      setDoctors(response.doctors || []);
      setFilteredDoctors(response.doctors || []);
    } catch (error) {
      console.error('Error cargando doctores:', error);
      // Usar datos mock como fallback
      setDoctors(mockDoctors);
      setFilteredDoctors(mockDoctors);
    }
  };

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
          },
          {
            id: 3,
            patientName: 'Ana López',
            appointmentDate: '2024-01-16',
            appointmentTime: '09:00',
            reason: 'Control de glaucoma',
            status: 'pending',
            patientPhone: '555-0789',
            patientEmail: 'ana@example.com'
          }
        ]);
      }
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    // **NUEVO: Validar especialidad para médicos**
    if (registerData.userType === 'doctor' && !registerData.specialty) {
      showNotification('Por favor selecciona tu especialidad médica', 'error');
      return;
    }

    if (registerData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      showNotification('Por favor introduce un email válido', 'error');
      return;
    }

    // **NUEVO: Validar tamaño de imagen**
    if (registerData.profileImage && registerData.profileImage.size > 5 * 1024 * 1024) {
      showNotification('La imagen no puede ser mayor a 5MB', 'error');
      return;
    }

    try {
      // **NUEVO: Preparar datos incluyendo imagen y especialidad**
      let imageBase64 = null;
      
      if (registerData.profileImage) {
        // Convertir imagen a base64
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(registerData.profileImage);
        });
      }

      const userData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        userType: registerData.userType,
        specialty: registerData.specialty || null,
        profileImage: imageBase64
      };

      const result = await register(userData);
      
      if (result.success) {
        // Mostrar mensaje de éxito y cerrar modal
        showNotification('¡Registro exitoso! Bienvenido a OftalmoIA.', 'success');
        setShowRegister(false);
        setRegisterData({
          name: '',
          email: '',
          password: '',
          phone: '',
          userType: 'patient',
          profileImage: null,
          specialty: ''
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

  // Auto-scroll para el chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Filtrar doctores basado en búsqueda
  useEffect(() => {
    if (!search.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const filtered = doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(search.toLowerCase()) ||
      doctor.location.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [search, doctors]);

  // **NUEVO: Función para extraer datos estructurados de la respuesta de IA**
  const extractAIData = (aiResponse) => {
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Si no hay JSON, intentar parsear directamente
      return JSON.parse(aiResponse);
    } catch (error) {
      console.log('No se pudo extraer datos estructurados de IA:', error);
      return null;
    }
  };

  // **NUEVO: Limpiar filtros de IA y mostrar todos los doctores**
  const clearAIFilter = () => {
    setFilteredDoctors(doctors);
    showNotification('Filtros de IA eliminados. Mostrando todos los doctores', 'info');
  };

  // **NUEVO: Filtrar doctores según especialidades recomendadas por IA**
  const filterDoctorsByAI = (aiSpecialties, urgency) => {
    // Mapeo de especialidades de IA a especialidades de doctores
    const specialtyMapping = {
      'Oftalmología General': ['Oftalmología', 'Oftalmólogo General'],
      'Oftalmología': ['Oftalmología', 'Oftalmólogo General'],
      'Retina y Vítreo': ['Retina', 'Vítreo', 'Retinólogo'],
      'Glaucoma': ['Glaucoma', 'Glaucomatólogo'],
      'Córnea': ['Córnea', 'Córnea y Superficie Ocular'],
      'Oftalmología Pediátrica': ['Oftalmología Pediátrica', 'Estrabismo'],
      'Neuro-oftalmología': ['Neuro-oftalmología'],
      'Oculoplástica': ['Oculoplástica', 'Estética Ocular'],
      'Cataratas': ['Catarata', 'Cataratas', 'Facoemulsificación'],
      'Urgencias Oftalmológicas': ['Urgencias', 'Oftalmología General']
    };

         let filtered = [...doctors];

     // Filtrar por especialidades recomendadas
     if (aiSpecialties && aiSpecialties.length > 0) {
       filtered = doctors.filter(doctor => {
         return aiSpecialties.some(aiSpecialty => {
           const mappedSpecialties = specialtyMapping[aiSpecialty] || [aiSpecialty];
           return mappedSpecialties.some(specialty => 
             doctor.specialty.toLowerCase().includes(specialty.toLowerCase())
           );
         });
       });
     }

     // Si es alta urgencia, priorizar disponibilidad inmediata
     if (urgency === 'alto' || urgency === 'emergencia') {
       filtered.sort((a, b) => {
         // Priorizar doctores con disponibilidad hoy
         const aAvailable = a.availability?.includes('Hoy') ? 1 : 0;
         const bAvailable = b.availability?.includes('Hoy') ? 1 : 0;
         return bAvailable - aAvailable;
       });
     }

     setFilteredDoctors(filtered);
     // Marcar que se filtró por IA - no necesitamos specialtyFilter para esto
  };

  // Análisis de síntomas con IA
  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return;

    setAiThinking(true);
    setAiResponse('');
    setRecommendedSpecialties([]);

    try {
      const response = await symptomsAPI.analyze(symptoms);
      const formattedResponse = parseAIResponse(response.analysis.aiResponse);
      setAiResponse(formattedResponse);

      // **NUEVO: Filtrar doctores automáticamente según diagnóstico de IA**
      const aiData = extractAIData(response.analysis.aiResponse);
      if (aiData && aiData.specialties && aiData.specialties.length > 0) {
        // Filtrar doctores por especialidades recomendadas
        filterDoctorsByAI(aiData.specialties, aiData.urgency);
        showNotification(`🔍 Doctores filtrados según tu diagnóstico: ${aiData.specialties.join(', ')}`, 'success');
        
        // Cambiar automáticamente a vista de doctores
        setSearchMode('doctors');
      }

      // Extraer especialidades recomendadas si están disponibles (compatibilidad)
      if (response.analysis.recommendedSpecialties) {
        setRecommendedSpecialties(response.analysis.recommendedSpecialties);
      }
    } catch (error) {
      console.error('Error:', error);
      setAiResponse(`## ⚠️ Análisis temporalmente no disponible

Lo siento, no pude procesar tu consulta en este momento debido a un problema técnico.

## 🔄 Te recomiendo:

### **Opciones inmediatas:**
- **Reformula tu consulta** con términos más específicos
- **Usa palabras clave** como: dolor, visión borrosa, enrojecimiento, etc.
- **Intenta nuevamente** en unos minutos

### **Alternativas disponibles:**
- **Busca un especialista** en nuestro directorio médico
- **Agenda una consulta** directamente con un oftalmólogo
- **Llama al 911** si es una emergencia ocular

### **⚡ ¿Es urgente?**
Si experimentas:
- Pérdida súbita de visión
- Dolor ocular severo
- Destellos de luz intensos
- Cortina oscura en tu campo visual

**Busca atención médica inmediata**

---
*💡 Tip: Mientras tanto, evita frotarte los ojos y mantén una buena higiene ocular.*`);
    } finally {
      setAiThinking(false);
    }
  };



  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const userMessage = inputMessage;
    const newUserMessage = { text: userMessage, sender: "user" };
    
    // Agregar mensaje del usuario inmediatamente
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage("");

    // Mostrar mensaje de "escribiendo..."
    setMessages(prev => [...prev, { text: "💭 Analizando tu consulta...", sender: "bot", loading: true }]);

    try {
      // Usar la nueva API de chat conversacional
      const response = await api.chat.sendMessage(userMessage, conversationHistory);
      const aiResponse = response.response;
      
      // Actualizar historial de conversación
      const newHistory = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "assistant", content: aiResponse }
      ].slice(-10); // Mantener solo los últimos 10 intercambios
      
      setConversationHistory(newHistory);
      
      // Remover el mensaje de "escribiendo..." y agregar la respuesta de IA
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.loading);
        return [...withoutLoading, { 
          text: aiResponse,
          sender: "bot" 
        }];
      });
    } catch (error) {
      console.error('Error en chatbot:', error);
      
      // Remover el mensaje de "escribiendo..." y agregar respuesta de fallback
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.loading);
        return [...withoutLoading, { 
          text: "⚠️ **Conexión temporalmente interrumpida**\n\n💬 Disculpa, tuve un problema técnico momentáneo. Como especialista en oftalmología, te sugiero:\n\n🔄 **Mientras tanto:**\n• Reformula tu pregunta sobre salud ocular\n• Usa términos específicos como: dolor, visión borrosa, enrojecimiento\n• Prueba el análisis de síntomas en la página principal\n\n📞 **¿Es urgente?** Si experimentas pérdida súbita de visión o dolor severo, contacta a un oftalmólogo inmediatamente.\n\n👁️ Estoy aquí para ayudarte con cualquier duda sobre tus ojos.",
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

      await appointmentsAPI.create(appointmentPayload);

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

      {/* Contenido Principal - Vista Condicional */}
      {viewMode === 'patient' ? (
        <>
          {/* Hero Section */}
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
                <option value="Ciudad de México">Ciudad de México</option>
                <option value="Guadalajara">Guadalajara</option>
                <option value="Monterrey">Monterrey</option>
                <option value="Puebla">Puebla</option>
                <option value="Tijuana">Tijuana</option>
                <option value="León">León</option>
                <option value="Juárez">Juárez</option>
                <option value="Zapopan">Zapopan</option>
                <option value="Mérida">Mérida</option>
                <option value="San Luis Potosí">San Luis Potosí</option>
              </select>
            </div>
            
            {/* Filtro por Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rango de precio</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                <option value="">Todos los precios</option>
                <option value="500-800">$500 - $800 MXN</option>
                <option value="800-1200">$800 - $1,200 MXN</option>
                <option value="1200+">$1,200+ MXN</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis de IA */}
      {aiThinking && (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
            <div>
              <h3 className="text-xl font-semibold text-blue-800">Analizando síntomas...</h3>
              <p className="text-blue-600">Nuestra IA está procesando tu información</p>
            </div>
          </div>
        </div>
      )}

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
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-600 font-medium">
                  💡 Recuerda: Este es un análisis preliminar. Consulta siempre con un especialista para un diagnóstico preciso.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Doctores */}
      <div className="max-w-6xl mx-auto mt-12 p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {searchMode === 'symptoms' && recommendedSpecialties.length > 0 
              ? 'Especialistas Recomendados' 
              : 'Directorio de Especialistas'}
          </h2>
          
          {/* **NUEVO: Botón para limpiar filtros de IA** */}
          {filteredDoctors.length !== doctors.length && (
            <button
              onClick={clearAIFilter}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <FaTimes size={14} />
              <span>Limpiar filtros de IA</span>
            </button>
          )}
        </div>
        
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FaSearch size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron especialistas</h3>
            <p className="text-gray-500">Intenta con diferentes términos de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full border-4 border-blue-100 mr-4"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
                      <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400">
                          {"★".repeat(Math.floor(doctor.rating))}
                        </div>
                        <span className="text-gray-600 text-sm ml-2">{doctor.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600">
                      <FaGraduationCap className="mr-2" />
                      <span className="text-sm">{doctor.experience}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2" />
                      <span className="text-sm">{doctor.location}</span>
                    </div>
                    {/* Precio oculto por solicitud del usuario */}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => openDoctorModal(doctor)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Ver perfil
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setShowAppointment(true);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      ) : (
        /* Vista del Médico */
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

      {/* Modal del Doctor */}
      {selectedDoctor && !showAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <img 
                    src={selectedDoctor.image} 
                    alt={selectedDoctor.name}
                    className="w-20 h-20 rounded-full border-4 border-blue-100 mr-4"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedDoctor.name}</h2>
                    <p className="text-blue-600 font-medium text-lg">{selectedDoctor.specialty}</p>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(selectedDoctor.rating))}
                      </div>
                      <span className="text-gray-600 ml-2">{selectedDoctor.rating}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Información Profesional</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaGraduationCap className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium">Experiencia</p>
                        <p className="text-gray-600">{selectedDoctor.experience}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaMedal className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium">Educación</p>
                        <p className="text-gray-600">{selectedDoctor.education}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-gray-600">{selectedDoctor.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Contacto y Consulta</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaDollarSign className="text-green-600 mr-3" />
                      <div>
                        <p className="font-medium">Costo de consulta</p>
                        <p className="text-green-600 font-semibold">{selectedDoctor.consultationFee}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaPhone className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium">Teléfono</p>
                        <p className="text-gray-600">{selectedDoctor.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaEnvelope className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600">{selectedDoctor.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Idiomas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.languages.map((language, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex space-x-4">
                <button 
                  onClick={() => setShowAppointment(true)}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <FaCalendarAlt className="inline mr-2" />
                  Agendar Cita
                </button>
                <button 
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot */}
      <div className="fixed bottom-6 right-6 z-40">
        {!showChat ? (
          <button
            onClick={() => setShowChat(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <FaRobot size={24} />
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center">
                <FaRobot className="mr-2" />
                <span className="font-semibold">OftalmoIA Assistant</span>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg max-w-xs ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : message.loading 
                      ? 'bg-gray-100 text-gray-600 italic' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.loading ? (
                      <span>{message.text}</span>
                    ) : (
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Describe tus síntomas..."
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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

                {/* **NUEVO: Campo de foto de perfil** */}
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Foto de perfil (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setRegisterData({...registerData, profileImage: e.target.files[0]})}
                  />
                  <p className="text-sm text-gray-500 mt-1">Formatos: JPG, PNG, GIF (máx. 5MB)</p>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Tipo de usuario</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="patient"
                        checked={registerData.userType === 'patient'}
                        onChange={(e) => setRegisterData({...registerData, userType: e.target.value, specialty: ''})}
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

                {/* **NUEVO: Campo de especialidad (solo para médicos)** */}
                {registerData.userType === 'doctor' && (
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Especialidad médica *</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={registerData.specialty}
                      onChange={(e) => setRegisterData({...registerData, specialty: e.target.value})}
                      required
                    >
                      <option value="">Selecciona tu especialidad</option>
                      <option value="Oftalmología General">Oftalmología General</option>
                      <option value="Retina y Vítreo">Retina y Vítreo</option>
                      <option value="Glaucoma">Glaucoma</option>
                      <option value="Córnea y Superficie Ocular">Córnea y Superficie Ocular</option>
                      <option value="Oftalmología Pediátrica">Oftalmología Pediátrica</option>
                      <option value="Neuro-oftalmología">Neuro-oftalmología</option>
                      <option value="Oculoplástica">Oculoplástica</option>
                      <option value="Cataratas">Cataratas</option>
                      <option value="Estrabismo">Estrabismo</option>
                      <option value="Oncología Ocular">Oncología Ocular</option>
                      <option value="Cirugía Refractiva">Cirugía Refractiva</option>
                      <option value="Urgencias Oftalmológicas">Urgencias Oftalmológicas</option>
                    </select>
                  </div>
                )}

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

// Componente principal con AuthProvider
function App() {
  return (
    <AuthProvider>
      <OftalmoBot />
    </AuthProvider>
  );
}

export default App;
