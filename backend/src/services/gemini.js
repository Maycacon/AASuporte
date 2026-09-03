const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a IA com a chave do arquivo .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define o modelo que vamos usar
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

// O prompt padrão que você definiu na documentação
const SYSTEM_PROMPT = `Você é um analista especialista em suporte técnico de sistemas ERP.

Analise o histórico de atendimento abaixo.
Crie um acompanhamento técnico profissional.

O texto deve possuir:
1. Resumo do problema
2. Análise realizada
3. Procedimento executado
4. Resultado

Não invente informações.
Utilize somente dados presentes no histórico.

Formato:

ACOMPANHAMENTO:

Resumo do problema:
-

Análise realizada:
-

Procedimento executado:
-

Resultado:
-`;

async function generateSummary(chatHistory) {
  try {
    // Junta o prompt padrão com o texto do chat capturado
    const prompt = `${SYSTEM_PROMPT}\n\nHistórico:\n${chatHistory}`;
    
    // Faz a requisição para o Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Erro no serviço do Gemini:", error);
    throw new Error("Falha ao gerar resumo na IA.");
  }
}

module.exports = { generateSummary };