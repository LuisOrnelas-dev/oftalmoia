const express = require('express');
const OpenAI = require('openai');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { symptomsValidation } = require('../middleware/validation');

const router = express.Router();

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Análisis de síntomas con IA
router.post('/analyze', symptomsValidation, async (req, res) => {
  try {
    const { symptoms } = req.body;
    const userId = req.user?.id || null;

    // Prompt mejorado para OpenAI
    const prompt = `
    Eres Dr. OftalmoIA, un asistente médico virtual especializado en oftalmología con amplia experiencia clínica. Un paciente te describe sus síntomas oculares y necesitas proporcionar un análisis preliminar profesional y comprensivo.

    SÍNTOMAS DEL PACIENTE: "${symptoms}"

    Por favor, analiza estos síntomas y responde ÚNICAMENTE en formato JSON válido con la siguiente estructura:

    {
      "conditions": ["lista de 2-4 posibles condiciones oculares específicas"],
      "specialties": ["especialidades médicas relevantes"],
      "advice": "consejos detallados de cuidado inmediato y preventivo, incluyendo qué hacer y qué evitar",
      "urgency": "bajo/medio/alto/emergencia",
      "recommendation": "recomendación específica sobre próximos pasos, cuándo buscar atención y qué especialista consultar",
      "warning_signs": "señales de alarma que requieren atención inmediata",
      "home_care": "cuidados que puede realizar en casa de forma segura"
    }

    DIRECTRICES IMPORTANTES:
    - Enfócate EXCLUSIVAMENTE en condiciones oftalmológicas
    - Sé específico pero no definitivo en diagnósticos
    - Incluye tanto condiciones comunes como menos frecuentes pero posibles
    - Menciona especialidades como: Oftalmología General, Retina y Vítreo, Glaucoma, Córnea, Oftalmología Pediátrica, etc.
    - En urgencia: "bajo" = cita rutinaria, "medio" = cita en días, "alto" = cita urgente, "emergencia" = atención inmediata
    - Da consejos prácticos y específicos
    - Mantén un tono empático pero profesional
    - SIEMPRE enfatiza la importancia de consultar un oftalmólogo para diagnóstico definitivo

    Responde SOLO con el JSON, sin texto adicional.
    `;

    let aiResponse;
    let recommendedSpecialties = [];

    try {
      // Llamada a OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Eres un asistente médico oftalmológico profesional. Proporciona análisis útiles pero siempre recomienda consultar con un especialista."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      aiResponse = completion.choices[0].message.content;

      // Intentar parsear la respuesta JSON
      try {
        const parsedResponse = JSON.parse(aiResponse);
        recommendedSpecialties = parsedResponse.specialties || [];
        aiResponse = parsedResponse.recommendation || aiResponse;
      } catch (parseError) {
        console.log('No se pudo parsear respuesta JSON, usando texto completo');
      }

    } catch (openaiError) {
      console.error('Error con OpenAI:', openaiError);
      
      // Respuesta de fallback
      aiResponse = `Basado en tus síntomas, te recomiendo consultar con un oftalmólogo especialista. Los síntomas que describes pueden estar relacionados con varias condiciones oculares que requieren evaluación profesional. Por favor, agenda una cita con un especialista para un diagnóstico preciso.`;
      
      recommendedSpecialties = [
        'Oftalmología General',
        'Córnea y Enfermedades Externas',
        'Oftalmología Pediátrica'
      ];
    }

    // Guardar análisis en base de datos si el usuario está autenticado
    if (userId) {
      try {
        await pool.query(`
          INSERT INTO symptom_analyses (
            patient_id, symptoms, ai_response, recommended_specialties
          ) VALUES ($1, $2, $3, $4)
        `, [userId, symptoms, aiResponse, recommendedSpecialties]);
      } catch (dbError) {
        console.error('Error al guardar análisis:', dbError);
        // No fallar si no se puede guardar
      }
    }

    res.json({
      analysis: {
        symptoms,
        aiResponse,
        recommendedSpecialties,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en análisis de síntomas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener historial de análisis (solo usuarios autenticados)
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        symptoms,
        ai_response,
        recommended_specialties,
        created_at
      FROM symptom_analyses 
      WHERE patient_id = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [req.user.id]);

    res.json({
      history: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener análisis específico
router.get('/history/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        id,
        symptoms,
        ai_response,
        recommended_specialties,
        created_at
      FROM symptom_analyses 
      WHERE id = $1 AND patient_id = $2
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Análisis no encontrado' });
    }

    res.json({ analysis: result.rows[0] });

  } catch (error) {
    console.error('Error al obtener análisis:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de síntomas comunes
router.get('/stats', async (req, res) => {
  try {
    // Síntomas más comunes (simulado para MVP)
    const commonSymptoms = [
      { symptom: 'Ojo rojo', count: 45 },
      { symptom: 'Visión borrosa', count: 38 },
      { symptom: 'Dolor de cabeza', count: 32 },
      { symptom: 'Picazón en los ojos', count: 28 },
      { symptom: 'Sensibilidad a la luz', count: 25 },
      { symptom: 'Lagrimeo excesivo', count: 22 },
      { symptom: 'Dolor al mover los ojos', count: 18 },
      { symptom: 'Visión doble', count: 15 }
    ];

    // Especialidades más solicitadas
    const popularSpecialties = [
      { specialty: 'Oftalmología General', count: 120 },
      { specialty: 'Córnea y Enfermedades Externas', count: 85 },
      { specialty: 'Oftalmología Pediátrica', count: 72 },
      { specialty: 'Glaucoma', count: 58 },
      { specialty: 'Retina y Vítreo', count: 45 },
      { specialty: 'Cirugía Refractiva', count: 38 }
    ];

    res.json({
      commonSymptoms,
      popularSpecialties,
      totalAnalyses: 450,
      averageResponseTime: '2.3 segundos'
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Sugerencias de síntomas comunes
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      'Dolor de cabeza con problemas de visión',
      'Ojos rojos y picazón',
      'Visión borrosa al leer',
      'Sensibilidad a la luz',
      'Lagrimeo excesivo',
      'Dolor al mover los ojos',
      'Visión doble',
      'Ojos secos y ardor',
      'Manchas en la visión',
      'Dificultad para ver de noche'
    ];

    res.json({ suggestions });

  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 