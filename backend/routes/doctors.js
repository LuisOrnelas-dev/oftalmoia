const express = require('express');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los doctores con filtros
router.get('/', async (req, res) => {
  try {
    const { 
      specialty, 
      location, 
      search, 
      minRating, 
      maxPrice, 
      language 
    } = req.query;

    let query = `
      SELECT 
        d.id,
        d.specialty,
        d.experience_years,
        d.languages,
        d.consultation_fee,
        d.availability,
        d.rating,
        d.reviews_count,
        d.image_url,
        d.location,
        u.name,
        u.email,
        u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Filtros
    if (specialty) {
      paramCount++;
      query += ` AND d.specialty ILIKE $${paramCount}`;
      params.push(`%${specialty}%`);
    }

    if (location) {
      paramCount++;
      query += ` AND d.location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR d.specialty ILIKE $${paramCount} OR d.location ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (minRating) {
      paramCount++;
      query += ` AND d.rating >= $${paramCount}`;
      params.push(parseFloat(minRating));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND d.consultation_fee <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }

    if (language) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(d.languages)`;
      params.push(language);
    }

    query += ' ORDER BY d.rating DESC, d.reviews_count DESC';

    const result = await pool.query(query, params);

    // Formatear respuesta
    const doctors = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      location: row.location,
      image: row.image_url,
      rating: parseFloat(row.rating),
      reviews: row.reviews_count,
      experience: `${row.experience_years} años`,
      languages: row.languages,
      consultationFee: `$${row.consultation_fee}`,
      availability: row.availability?.schedule || 'No especificado',
      email: row.email,
      phone: row.phone
    }));

    res.json({
      doctors,
      total: doctors.length,
      filters: {
        specialty,
        location,
        search,
        minRating,
        maxPrice,
        language
      }
    });

  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener doctor por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        d.id,
        d.specialty,
        d.experience_years,
        d.languages,
        d.consultation_fee,
        d.availability,
        d.rating,
        d.reviews_count,
        d.image_url,
        d.location,
        u.name,
        u.email,
        u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    const doctor = result.rows[0];

    // Obtener reseñas del doctor
    const reviewsResult = await pool.query(`
      SELECT 
        r.rating,
        r.comment,
        r.created_at,
        u.name as patient_name
      FROM reviews r
      JOIN users u ON r.patient_id = u.id
      WHERE r.doctor_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);

    const formattedDoctor = {
      id: doctor.id,
      name: doctor.name,
      specialty: doctor.specialty,
      location: doctor.location,
      image: doctor.image_url,
      rating: parseFloat(doctor.rating),
      reviews: doctor.reviews_count,
      experience: `${doctor.experience_years} años`,
      languages: doctor.languages,
      consultationFee: `$${doctor.consultation_fee}`,
      availability: doctor.availability?.schedule || 'No especificado',
      email: doctor.email,
      phone: doctor.phone,
      reviewsList: reviewsResult.rows
    };

    res.json({ doctor: formattedDoctor });

  } catch (error) {
    console.error('Error al obtener doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener especialidades disponibles
router.get('/specialties/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT specialty 
      FROM doctors 
      ORDER BY specialty
    `);

    const specialties = result.rows.map(row => row.specialty);

    res.json({ specialties });

  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener ubicaciones disponibles
router.get('/locations/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT location 
      FROM doctors 
      WHERE location IS NOT NULL
      ORDER BY location
    `);

    const locations = result.rows.map(row => row.location);

    res.json({ locations });

  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear perfil de doctor (requiere autenticación)
router.post('/', auth, async (req, res) => {
  try {
    const { 
      specialty, 
      experienceYears, 
      languages, 
      consultationFee, 
      availability, 
      imageUrl, 
      location 
    } = req.body;

    // Verificar que el usuario es doctor
    if (req.user.user_type !== 'doctor') {
      return res.status(403).json({ error: 'Solo los doctores pueden crear perfiles médicos' });
    }

    // Verificar que no tenga ya un perfil
    const existingProfile = await pool.query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tienes un perfil de doctor creado' });
    }

    // Crear perfil de doctor
    const result = await pool.query(`
      INSERT INTO doctors (
        user_id, specialty, experience_years, languages, 
        consultation_fee, availability, image_url, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      req.user.id, specialty, experienceYears, languages,
      consultationFee, availability, imageUrl, location
    ]);

    res.status(201).json({
      message: 'Perfil de doctor creado exitosamente',
      doctor: result.rows[0]
    });

  } catch (error) {
    console.error('Error al crear perfil de doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar perfil de doctor
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      specialty, 
      experienceYears, 
      languages, 
      consultationFee, 
      availability, 
      imageUrl, 
      location 
    } = req.body;

    // Verificar que el doctor existe y pertenece al usuario
    const doctorResult = await pool.query(
      'SELECT user_id FROM doctors WHERE id = $1',
      [id]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    if (doctorResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este perfil' });
    }

    // Actualizar perfil
    const result = await pool.query(`
      UPDATE doctors SET 
        specialty = $1,
        experience_years = $2,
        languages = $3,
        consultation_fee = $4,
        availability = $5,
        image_url = $6,
        location = $7
      WHERE id = $8
      RETURNING *
    `, [
      specialty, experienceYears, languages, consultationFee,
      availability, imageUrl, location, id
    ]);

    res.json({
      message: 'Perfil actualizado exitosamente',
      doctor: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar perfil de doctor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 