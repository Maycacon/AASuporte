const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini'); // Importa o serviço

router.post('/generate', async (req, res) => {
  try {
    const { chatHistory } = req.body;

    if (!chatHistory) {
      return res.status(400).json({ error: 'Histórico não fornecido.' });
    }

    console.log('Recebido histórico. Enviando para o Gemini...');

    // Chama o serviço do Gemini e aguarda a resposta
    const aiResponse = await geminiService.generateSummary(chatHistory);

    // Devolve o texto real para a extensão
    res.json({
      result: aiResponse.result,
      tag: aiResponse.tag || null,
    });

  } catch (error) {
    console.error('Erro na rota:', error);
    res.status(500).json({ error: 'Erro ao processar atendimento com a IA.' });
  }
});

module.exports = router;