const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa a IA com a chave do arquivo .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define o modelo que vamos usar
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function extractStructuredResponse(rawText) {
  const cleanedText = String(rawText || '').trim();

  try {
    const normalized = cleanedText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(normalized);
    if (parsed && typeof parsed === 'object') {
      const summary = parsed.resumo || parsed.summary || parsed['Resumo do problema'] || cleanedText;
      const tag = parsed.tag || parsed.tags || parsed.categoria || null;

      if (tag) {
        return { result: String(summary).trim(), tag: String(tag).trim() };
      }
    }
  } catch (error) {
    // Não bloqueia o fluxo; tenta parsing manual abaixo.
  }

  const tagMatch = cleanedText.match(/"tag"\s*:\s*"([^"]+)"/i)
    || cleanedText.match(/tag\s*:\s*([^\n]+)/i)
    || cleanedText.match(/TAG\s*:\s*([^\n]+)/i)
    || cleanedText.match(/categoria\s*:\s*([^\n]+)/i);

  const summaryMatch = cleanedText.match(/Resumo do problema:\s*([\s\S]*?)(?:\n\nAnálise realizada:|$)/i)
    || cleanedText.match(/resumo\s*:\s*([\s\S]*?)(?:\n\nAnálise realizada:|$)/i)
    || cleanedText.match(/"resumo"\s*:\s*"([^"]+)"/i);

  const summaryText = summaryMatch ? summaryMatch[1].replace(/\s*\n\s*/g, ' ').trim() : cleanedText;
  const tagText = tagMatch ? tagMatch[1].trim() : null;

  return {
    result: summaryText,
    tag: tagText,
  };
}

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

Além do acompanhamento, escolha a tag mais adequada para o problema com base no conteúdo do resumo.
A tag deve ser uma das opções existentes no sistema, com nome exato e em português.

IMPORTANTE: Responda apenas em JSON válido, sem markdown, com o seguinte formato:
{
  "resumo": "Resumo do problema de forma clara e objetiva.",
  "tag": "Nome exato da tag"
}

Exemplo:
{
  "resumo": "Cliente não conseguiu emitir nota fiscal pela aplicação.",
  "tag": "Nfe"
}`;

async function generateSummary(chatHistory) {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\nHistórico:\n${chatHistory}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const structured = extractStructuredResponse(text);

    if (!structured.tag) {
      const fallback = normalizeText(structured.result || text || '');
      if (fallback.includes('nfe') || fallback.includes('nota fiscal')) {
        structured.tag = 'Nfe';
      } else if (fallback.includes('nfce') || fallback.includes('nfc-e')) {
        structured.tag = 'Nfce';
      } else if (fallback.includes('financeiro') || fallback.includes('boleto') || fallback.includes('pix')) {
        structured.tag = 'Financeiro';
      } else if (fallback.includes('api') || fallback.includes('integra')) {
        structured.tag = 'API';
      }
    }

    return {
      result: structured.result || text,
      tag: structured.tag || null,
    };
  } catch (error) {
    console.error('Erro no serviço do Gemini:', error);
    throw new Error('Falha ao gerar resumo na IA.');
  }
}

module.exports = { generateSummary };