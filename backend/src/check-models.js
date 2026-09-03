const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listarModelos() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log("Chave da API não encontrada no .env!");
    return;
  }

  console.log("Conectando ao Google para buscar os modelos disponíveis...");
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("Erro da API:", data.error.message);
      return;
    }

    console.log("\n=== MODELOS LIBERADOS PARA A SUA CHAVE ===");
    data.models.forEach(model => {
      // Filtra apenas os modelos que suportam geração de texto
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(model.name.replace('models/', ''));
      }
    });
    console.log("=========================================\n");
    
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

listarModelos();