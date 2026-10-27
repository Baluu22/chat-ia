//este archivo sirve para manejar las solicitudes de chat y generar respuestas utilizando la API de Gemini de Google.
const { GoogleGenAI } = require("@google/genai");
// Configuración de la instancia de GoogleGenAI con la clave de API almacenada en las variables de entorno
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});
// Exportación de la función que maneja las solicitudes HTTP
module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
  return res.status(200).json({
    success: true,
    message: "API de chat funcionando en Vercel"
  });
}

if (req.method !== "POST") {
  return res.status(405).json({
    success: false,
    message: "Método no permitido"
  });
}

    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "El mensaje no puede estar vacío."
      });
    }
    // Llamada a la API de Gemini para generar contenido basado en el mensaje recibido
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      config: {
        systemInstruction: `
          Sos un experto en redacción de emails profesionales.
          Tu trabajo es ayudar a los usuarios a escribir, mejorar, corregir y perfeccionar emails.

          Reglas:
          - Respondé ÚNICAMENTE con el email resultante.
          - No incluyas explicaciones, comentarios ni notas adicionales.
          - Seguí las instrucciones del usuario respecto al tono, idioma y propósito.
          - Si el usuario te pide mejorar un email, mantené la intención original pero mejorá la claridad, gramática y profesionalismo.
          - Si el usuario te pide generar un email desde cero, creá uno completo y profesional basado en el contexto dado.
          - Incluí saludo, cuerpo y despedida apropiados para el contexto.
          - Adaptá el registro y formalidad según el tono solicitado.
        `
      },
      contents: message
    });

    return res.status(200).json({
      success: true,
      response: response.text
    });

  } catch (error) {
    console.error("Error al consultar Gemini:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudo obtener una respuesta de la IA."
    });
  }
};