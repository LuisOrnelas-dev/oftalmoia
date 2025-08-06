const express = require('express');
const OpenAI = require('openai');
const { chatValidation } = require('../middleware/validation');

const router = express.Router();

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat conversacional con IA
router.post('/message', async (req, res) => {
  try {
    console.log('Received chat request:', req.body);
    
    const { message, conversationHistory = [] } = req.body;
    
    // Validación simple
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }
    
    if (message.length > 500) {
      return res.status(400).json({ error: 'El mensaje es demasiado largo' });
    }

    // Crear el contexto de la conversación
    const messages = [
      {
        role: "system",
        content: `Eres Dr. OftalmoIA, un asistente médico virtual especializado en oftalmología. Tu personalidad es:

- EMPÁTICO y COMPRENSIVO con los pacientes
- PROFESIONAL pero ACCESIBLE en tu comunicación
- EXPERTO en salud ocular y oftalmología
- EDUCATIVO, proporcionas información clara y útil
- RESPONSABLE, siempre recomiendas consultar especialistas para diagnósticos

DIRECTRICES DE RESPUESTA:
1. Responde de manera conversacional y natural
2. Usa emojis apropiados para el contexto médico (👁️, 🔍, 💡, ⚠️, 🏥)
3. Haz preguntas específicas para entender mejor los síntomas
4. Proporciona educación sobre salud ocular cuando sea relevante
5. Siempre mantén el enfoque en oftalmología
6. Si no es relacionado con ojos, redirige amablemente hacia temas oculares
7. En casos urgentes, enfatiza la necesidad de atención inmediata
8. Sugiere especialistas específicos según el caso (retina, glaucoma, córnea, etc.)

TONO: Profesional, empático, educativo y tranquilizador
LONGITUD: Respuestas de 50-150 palabras, claras y directas
FORMATO: Texto natural con markdown básico para énfasis (**negrita**, *cursiva*)

Si el usuario pregunta algo no relacionado con oftalmología, redirige cortésmente hacia temas oculares.`
      },
      // Agregar historial de conversación si existe
      ...conversationHistory.slice(-10), // Mantener solo los últimos 10 mensajes para contexto
      {
        role: "user",
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      max_tokens: 400,
      temperature: 0.7,
      frequency_penalty: 0.3,
      presence_penalty: 0.3
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      response: aiResponse,
      conversationId: req.body.conversationId || Date.now().toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en chat:', error);
    
    // Respuesta de fallback más natural
    const fallbackResponses = [
      "💬 Disculpa, tuve un problema técnico momentáneo. ¿Podrías repetir tu pregunta sobre salud ocular?",
      "🔄 Estoy experimentando una conexión intermitente. Mientras tanto, ¿hay algún síntoma ocular específico que te preocupe?",
      "⚠️ No pude procesar tu mensaje. Si tienes síntomas oculares urgentes, te recomiendo contactar a un oftalmólogo inmediatamente.",
      "🤖 Perdón por la interrupción. ¿En qué puedo ayudarte con tus ojos o visión?"
    ];
    
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.json({
      response: randomFallback,
      error: true,
      conversationId: req.body.conversationId || Date.now().toString(),
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para obtener sugerencias de preguntas
router.get('/suggestions', (req, res) => {
  const suggestions = [
    "¿Qué causa los ojos rojos?",
    "Tengo visión borrosa, ¿es normal?",
    "¿Cómo puedo cuidar mejor mis ojos?",
    "¿Qué es el glaucoma?",
    "Siento presión en los ojos",
    "¿Cuándo debo ver un oftalmólogo?",
    "¿Es normal ver destellos de luz?",
    "Tengo sequedad ocular",
    "¿Qué es la miopía?",
    "Me duelen los ojos al leer"
  ];

  res.json({
    suggestions: suggestions.sort(() => 0.5 - Math.random()).slice(0, 6)
  });
});

module.exports = router; 