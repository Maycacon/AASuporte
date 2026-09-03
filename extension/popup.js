// Ação do botão "Gerar acompanhamento"
document.getElementById('btn-generate').addEventListener('click', async () => {
  const statusContainer = document.querySelector('#status-container p');
  const btn = document.getElementById('btn-generate');
  const resultBox = document.getElementById('result-box');
  const resultText = document.getElementById('result-text');

  // Muda o status para dar feedback ao usuário
  statusContainer.innerHTML = 'Status: <strong>Processando IA... 🤖</strong>';
  btn.disabled = true;

  // 1. Pega a aba atual que o usuário está visualizando
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 2. Executa um script rápido na página para ler o texto do chat
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairTextoDoChat,
  }, async (injectionResults) => {
    
    const chatText = injectionResults[0].result;

    if (!chatText) {
      statusContainer.innerHTML = 'Status: <strong style="color:red;">Erro: Histórico não encontrado</strong>';
      btn.disabled = false;
      return;
    }

    try {
      // 3. Envia o texto para o nosso backend Node.js
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: chatText })
      });

      const data = await response.json();
      
      // 4. Mostra o resultado na tela do popup
      resultText.value = data.result;
      resultBox.style.display = 'block';
      statusContainer.innerHTML = 'Status: <strong style="color:green;">Pronto!</strong>';

    } catch (error) {
      console.error(error);
      statusContainer.innerHTML = 'Status: <strong style="color:red;">Erro ao conectar no Servidor</strong>';
    }
    
    btn.disabled = false;
  });
});

// Função que roda dentro da página do sistema de chamados para capturar a div
// Função que roda dentro da página do sistema de chamados para capturar a div
function extrairTextoDoChat() {
  // Busca a div verificando se ela contém as classes principais do seu sistema
  const chatContainer = document.querySelector('div[class*="md:flex-1"][class*="space-y-4"]');
  
  if (chatContainer) {
    // O innerText vai capturar perfeitamente o nome do usuário, data, hora e a mensagem limpa
    return chatContainer.innerText; 
  }
  
  return null;
}

// Ação do botão "Copiar texto"
document.getElementById('btn-copy').addEventListener('click', () => {
  const resultText = document.getElementById('result-text');
  
  // Seleciona e copia o texto usando a API da área de transferência
  navigator.clipboard.writeText(resultText.value).then(() => {
    const btnCopy = document.getElementById('btn-copy');
    btnCopy.innerText = 'Copiado com sucesso! ✔️';
    
    // Volta o texto do botão ao normal após 2 segundos
    setTimeout(() => {
      btnCopy.innerText = 'Copiar texto';
    }, 2000);
  });
});