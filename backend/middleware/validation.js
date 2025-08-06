const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Datos de entrada inválidos',
      details: errors.array() 
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('userType').isIn(['patient', 'doctor']).withMessage('Tipo de usuario inválido'),
  body('phone').optional().isMobilePhone().withMessage('Número de teléfono inválido'),
  handleValidationErrors
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  handleValidationErrors
];

const appointmentValidation = [
  body('doctorId').isInt({ min: 1 }).withMessage('ID de doctor inválido'),
  body('appointmentDate').isDate().withMessage('Fecha de cita inválida'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de cita inválida'),
  body('reason').optional().isLength({ max: 1000 }).withMessage('El motivo no puede exceder 1000 caracteres'),
  body('patientName').trim().isLength({ min: 2, max: 255 }).withMessage('Nombre inválido'),
  body('patientPhone').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('patientEmail').optional().isEmail().withMessage('Email inválido'),
  handleValidationErrors
];

const symptomsValidation = [
  body('symptoms').trim().isLength({ min: 10, max: 2000 }).withMessage('Los síntomas deben tener entre 10 y 2000 caracteres'),
  handleValidationErrors
];

const chatValidation = [
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('El mensaje debe tener entre 1 y 500 caracteres'),
  body('conversationHistory').optional().isArray({ max: 20 }).withMessage('Historial de conversación inválido'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  appointmentValidation,
  symptomsValidation,
  chatValidation,
  handleValidationErrors
}; 