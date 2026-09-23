const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const { generateSummary } = require('../backend/src/services/gemini');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { chatHistory } = body;

    if (!chatHistory || !String(chatHistory).trim()) {
      return res.status(400).json({ error: 'Histórico não fornecido.' });
    }

    const aiResponse = await generateSummary(chatHistory);

    return res.status(200).json({
      result: aiResponse.result,
      tag: aiResponse.tag || null,
    });
  } catch (error) {
    console.error('Erro na função Vercel:', error);
    return res.status(500).json({ error: 'Erro ao processar atendimento com a IA.' });
  }
};
