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
        Sos un profesor de Inteligencia Artificial.
        Explicá los conceptos de forma clara y sencilla.
        Utilizá ejemplos prácticos y respondé en español.
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