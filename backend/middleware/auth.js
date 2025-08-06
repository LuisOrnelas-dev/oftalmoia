const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe en la base de datos
    const result = await pool.query(
      'SELECT id, name, email, user_type FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

const requireDoctor = async (req, res, next) => {
  if (req.user.user_type !== 'doctor') {
    return res.status(403).json({ error: 'Acceso denegado. Solo doctores pueden acceder a este recurso.' });
  }
  next();
};

const requirePatient = async (req, res, next) => {
  if (req.user.user_type !== 'patient') {
    return res.status(403).json({ error: 'Acceso denegado. Solo pacientes pueden acceder a este recurso.' });
  }
  next();
};

module.exports = { auth, requireDoctor, requirePatient }; 