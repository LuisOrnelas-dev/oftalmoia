const express = require('express');
const pool = require('../config/database');
const { auth, requirePatient } = require('../middleware/auth');
const { appointmentValidation } = require('../middleware/validation');

const router = express.Router();

// Crear nueva cita
router.post('/', appointmentValidation, async (req, res) => {
  try {
    const { 
      doctorId, 
      appointmentDate, 
      appointmentTime, 
      reason, 
      patientName, 
      patientPhone, 
      patientEmail 
    } = req.body;

    // Verificar que el doctor existe
    const doctorResult = await pool.query(
      'SELECT d.id, u.name, d.specialty FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1',
      [doctorId]
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    // Verificar disponibilidad (implementación básica)
    const existingAppointment = await pool.query(
      'SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 AND status != $4',
      [doctorId, appointmentDate, appointmentTime, 'cancelled']
    );

    if (existingAppointment.rows.length > 0) {
      return res.status(400).json({ error: 'Horario no disponible' });
    }

    // Crear usuario temporal si no está autenticado
    let patientId = null;
    
    if (req.user) {
      patientId = req.user.id;
    } else {
      // Validar campos requeridos para usuario temporal
      if (!patientName || !patientPhone) {
        return res.status(400).json({ error: 'Nombre y teléfono son requeridos para agendar cita' });
      }

      // Generar email único si no se proporciona
      const email = patientEmail || `${patientName.toLowerCase().replace(/\s+/g, '')}${Date.now()}@temp.com`;
      
      try {
        // Crear usuario temporal para la cita
        const tempUserResult = await pool.query(
          'INSERT INTO users (name, email, password_hash, phone, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [patientName, email, 'temp_hash', patientPhone, 'patient']
        );
        patientId = tempUserResult.rows[0].id;
        console.log(`Usuario temporal creado con ID: ${patientId}`);
      } catch (userError) {
        console.error('Error creando usuario temporal:', userError);
        // Si el email ya existe, intentar con uno diferente
        if (userError.code === '23505') { // Unique violation
          const uniqueEmail = `${patientName.toLowerCase().replace(/\s+/g, '')}${Date.now()}@temp.com`;
          const retryResult = await pool.query(
            'INSERT INTO users (name, email, password_hash, phone, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [patientName, uniqueEmail, 'temp_hash', patientPhone, 'patient']
          );
          patientId = retryResult.rows[0].id;
          console.log(`Usuario temporal creado con email único: ${uniqueEmail}`);
        } else {
          throw userError;
        }
      }
    }

    // Crear la cita
    const result = await pool.query(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, reason
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [patientId, doctorId, appointmentDate, appointmentTime, reason]);

    const appointment = result.rows[0];

    // Enviar email de confirmación (implementar después)
    // await sendAppointmentConfirmation(appointment, doctorResult.rows[0], patientName, patientEmail);

    res.status(201).json({
      message: 'Cita agendada exitosamente',
      appointment: {
        id: appointment.id,
        doctorName: doctorResult.rows[0].name,
        specialty: doctorResult.rows[0].specialty,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error('Error al crear cita:', error);
    console.error('Stack trace:', error.stack);
    console.error('Request body:', req.body);
    
    // Proporcionar mensajes más específicos
    if (error.code === '23505') {
      res.status(400).json({ error: 'Ya existe una cita en este horario' });
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Doctor no encontrado' });
    } else {
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Obtener citas del usuario autenticado
router.get('/my-appointments', auth, async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.user_type === 'patient') {
      // Citas como paciente
      query = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.reason,
          a.status,
          a.created_at,
          d.specialty,
          d.consultation_fee,
          u.name as doctor_name,
          u.email as doctor_email,
          u.phone as doctor_phone
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        JOIN users u ON d.user_id = u.id
        WHERE a.patient_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
      params = [req.user.id];
    } else {
      // Citas como doctor
      query = `
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.reason,
          a.status,
          a.created_at,
          u.name as patient_name,
          u.email as patient_email,
          u.phone as patient_phone
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.user_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);

    res.json({
      appointments: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener cita específica
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        a.*,
        d.specialty,
        d.consultation_fee,
        doctor_user.name as doctor_name,
        doctor_user.email as doctor_email,
        doctor_user.phone as doctor_phone,
        patient_user.name as patient_name,
        patient_user.email as patient_email,
        patient_user.phone as patient_phone
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doctor_user ON d.user_id = doctor_user.id
      JOIN users patient_user ON a.patient_id = patient_user.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const appointment = result.rows[0];

    // Verificar permisos
    if (req.user.user_type === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta cita' });
    }

    if (req.user.user_type === 'doctor') {
      const doctorResult = await pool.query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      if (doctorResult.rows.length === 0 || appointment.doctor_id !== doctorResult.rows[0].id) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta cita' });
      }
    }

    res.json({ appointment });

  } catch (error) {
    console.error('Error al obtener cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar estado de cita
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Verificar que la cita existe
    const appointmentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const appointment = appointmentResult.rows[0];

    // Verificar permisos (solo el doctor puede cambiar el estado)
    if (req.user.user_type === 'doctor') {
      const doctorResult = await pool.query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      if (doctorResult.rows.length === 0 || appointment.doctor_id !== doctorResult.rows[0].id) {
        return res.status(403).json({ error: 'No tienes permisos para modificar esta cita' });
      }
    } else {
      // Pacientes solo pueden cancelar sus propias citas
      if (appointment.patient_id !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permisos para modificar esta cita' });
      }
      
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Los pacientes solo pueden cancelar citas' });
      }
    }

    // Actualizar estado
    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      message: 'Estado de cita actualizado exitosamente',
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado de cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cancelar cita
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la cita existe
    const appointmentResult = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const appointment = appointmentResult.rows[0];

    // Verificar permisos
    if (req.user.user_type === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para cancelar esta cita' });
    }

    if (req.user.user_type === 'doctor') {
      const doctorResult = await pool.query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      if (doctorResult.rows.length === 0 || appointment.doctor_id !== doctorResult.rows[0].id) {
        return res.status(403).json({ error: 'No tienes permisos para cancelar esta cita' });
      }
    }

    // Cancelar cita (cambiar estado a cancelled)
    await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    res.json({ message: 'Cita cancelada exitosamente' });

  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 