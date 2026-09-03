const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const app = express();
console.log("Verificação da Chave:", process.env.GEMINI_API_KEY ? "Chave carregada!" : "CHAVE NÃO ENCONTRADA!");
const port = process.env.PORT || 3000;

// Configurações
app.use(cors()); // Permite requisições da extensão
app.use(express.json()); // Permite receber JSON no body

// Importando rotas
const aiRoutes = require('./routes/ai');
app.use('/api', aiRoutes);

app.listen(port, () => {
  console.log(`🚀 Support AI Backend rodando na porta ${port}`);
});