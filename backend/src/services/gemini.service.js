let ai;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Falta configurar GEMINI_API_KEY en .env");
}

async function generateResponse(message) {
  if (!ai) {
    const { GoogleGenAI } = await import("@google/genai");

    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    // Configuración de la instrucción del sistema para que actúe como un profesor de IA 
    //Es el ROL que queremos que tenga la IA
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

  return response.text;
}

/* module.exports = { generateResponse }; */

async function listModels() {
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const models = await ai.models.list();

  for await (const model of models) {
  console.log(JSON.stringify(model, null, 2));
}
}

module.exports = {
  generateResponse,
  listModels
};