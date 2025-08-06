const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para la imagen
    const uniqueName = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Verificar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, userType, phone, specialty, profileImage } = req.body;
    
    // Validaciones básicas
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ error: 'Campos requeridos: name, email, password, userType' });
    }
    
    if (userType === 'doctor' && !specialty) {
      return res.status(400).json({ error: 'La especialidad es requerida para médicos' });
    }

    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // **NUEVO: Manejar imagen en base64**
    let profileImagePath = null;
    if (profileImage) {
      try {
        // Extraer datos de la imagen base64
        const matches = profileImage.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
        if (matches && matches.length === 3) {
          const imageType = matches[1];
          const imageData = matches[2];
          
          // Crear directorio si no existe
          const uploadPath = path.join(__dirname, '../uploads/profiles');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          
          // Generar nombre único para la imagen
          const fileName = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}.${imageType}`;
          const filePath = path.join(uploadPath, fileName);
          
          // Guardar imagen
          fs.writeFileSync(filePath, imageData, 'base64');
          profileImagePath = `/uploads/profiles/${fileName}`;
        }
      } catch (error) {
        console.error('Error procesando imagen:', error);
        return res.status(400).json({ error: 'Error procesando la imagen de perfil' });
      }
    }

    // Crear usuario
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone, user_type, profile_image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, user_type, profile_image',
      [name, email, passwordHash, phone, userType, profileImagePath]
    );

    const user = result.rows[0];

    // Si es médico, crear registro en la tabla doctors
    if (userType === 'doctor') {
      await pool.query(
        'INSERT INTO doctors (user_id, specialty) VALUES ($1, $2)',
        [user.id, specialty]
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login de usuario
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const result = await pool.query(
      'SELECT id, name, email, password_hash, user_type FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.user_type
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario actual
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, user_type, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Si es doctor, obtener información adicional
    if (user.user_type === 'doctor') {
      const doctorResult = await pool.query(
        'SELECT * FROM doctors WHERE user_id = $1',
        [user.id]
      );

      if (doctorResult.rows.length > 0) {
        user.doctorInfo = doctorResult.rows[0];
      }
    }

    res.json({ user });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar contraseña
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener contraseña actual
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Encriptar nueva contraseña
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 