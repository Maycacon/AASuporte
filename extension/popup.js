const DEFAULT_API_URL = 'https://backend-maycacos-projects.vercel.app/api/generate';
const tagBox = document.getElementById('tag-box');
const tagLabel = document.getElementById('tag-label');

function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['aasuporteApiUrl'], (result) => {
      const configured = result.aasuporteApiUrl && result.aasuporteApiUrl.trim();
      resolve(configured || DEFAULT_API_URL);
    });
  });
}

function aplicarTagNaPagina(tagProcurado) {
  const normalizeText = (value = '') => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const normalize = (value = '') => normalizeText(value).replace(/[^a-z0-9]/g, '');

  const findButtons = () => [...document.querySelectorAll('button')];

  const findButtonByText = (matcher) => {
    const buttons = findButtons();
    return buttons.find((button) => {
      const text = (button.textContent || button.getAttribute('title') || '').trim();
      return matcher(text);
    }) || null;
  };

  const waitFor = (predicate, timeoutMs = 4000) => new Promise((resolve) => {
    const startedAt = Date.now();

    const tick = () => {
      if (predicate()) {
        resolve(true);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }

      requestAnimationFrame(tick);
    };

    tick();
  });

  const findTagOption = (tag) => {
    const normalizedTarget = normalize(tag);
    const buttons = findButtons();

    const option = buttons.find((button) => {
      const text = (button.textContent || '').trim();
      if (!text) return false;
      const normalizedText = normalize(text);
      return normalizedText === normalizedTarget
        || normalizedText.includes(normalizedTarget)
        || normalizedTarget.includes(normalizedText);
    });

    return option || null;
  };

  return (async () => {
    const editButton = findButtonByText((text) => /editar|edit/i.test(text));
    if (editButton) {
      editButton.click();
    }

    const tagButton = await waitFor(() => !!findButtonByText((text) => /tag/i.test(text) && !/tagger|tagging/i.test(text)), 3000);
    if (!tagButton) {
      return { applied: false, reason: 'Botão de tag não encontrado.' };
    }

    const tagToggle = findButtonByText((text) => /tag/i.test(text) && !/tagger|tagging/i.test(text));
    if (tagToggle) {
      tagToggle.click();
    }

    const tagFound = await waitFor(() => !!findTagOption(tagProcurado), 3000);
    if (!tagFound) {
      return { applied: false, reason: 'Tag não encontrada na lista.' };
    }

    const selectedTag = findTagOption(tagProcurado);
    if (selectedTag) {
      selectedTag.click();
    }

    const saveButton = await waitFor(() => !!findButtonByText((text) => /salvar|save/i.test(text)), 2500);
    if (!saveButton) {
      return { applied: false, reason: 'Botão de salvar não encontrado.' };
    }

    const finalSaveButton = findButtonByText((text) => /salvar|save/i.test(text));
    if (finalSaveButton) {
      finalSaveButton.click();
      return { applied: true, tag: tagProcurado };
    }

    return { applied: false, reason: 'Não foi possível salvar a tag.' };
  })();
}

// Ação do botão "Gerar acompanhamento"
document.getElementById('btn-generate').addEventListener('click', async () => {
  const statusContainer = document.querySelector('#status-container p');
  const btn = document.getElementById('btn-generate');
  const resultBox = document.getElementById('result-box');
  const resultText = document.getElementById('result-text');

  statusContainer.innerHTML = 'Status: <strong>Processando IA... 🤖</strong>';
  btn.disabled = true;
  tagBox.style.display = 'none';
  tagLabel.textContent = '';

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extrairTextoDoChat,
  }, async (injectionResults) => {
    const chatText = injectionResults?.[0]?.result;

    if (!chatText) {
      statusContainer.innerHTML = 'Status: <strong style="color:red;">Erro: Histórico não encontrado</strong>';
      btn.disabled = false;
      return;
    }

    try {
      const apiUrl = await getApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatHistory: chatText })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.error || `Erro HTTP ${response.status}`);
      }

      const resultContent = data.result || 'Resumo não gerado.';
      const suggestedTag = data.tag || null;

      resultText.value = resultContent;
      resultBox.style.display = 'block';

      if (suggestedTag) {
        tagLabel.textContent = suggestedTag;
        tagBox.style.display = 'block';

        const pageExecution = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: aplicarTagNaPagina,
          args: [suggestedTag],
        });

        const resultFromPage = pageExecution?.[0]?.result;
        if (resultFromPage && resultFromPage.applied) {
          statusContainer.innerHTML = 'Status: <strong style="color:green;">Resumo e tag aplicados!</strong>';
        } else {
          statusContainer.innerHTML = 'Status: <strong style="color:green;">Resumo gerado. Ajuste a tag manualmente se necessário.</strong>';
        }
      } else {
        statusContainer.innerHTML = 'Status: <strong style="color:green;">Pronto!</strong>';
      }

    } catch (error) {
      console.error(error);
      statusContainer.innerHTML = 'Status: <strong style="color:red;">Erro ao conectar no Servidor</strong>';
    }

    btn.disabled = false;
  });
});

function extrairTextoDoChat() {
  const chatContainer = document.querySelector('div[class*="md:flex-1"][class*="space-y-4"]');

  if (chatContainer) {
    return chatContainer.innerText;
  }

  return null;
}

// Ação do botão "Copiar texto"
document.getElementById('btn-copy').addEventListener('click', () => {
  const resultText = document.getElementById('result-text');

  navigator.clipboard.writeText(resultText.value).then(() => {
    const btnCopy = document.getElementById('btn-copy');
    btnCopy.innerText = 'Copiado com sucesso! ✔️';

    setTimeout(() => {
      btnCopy.innerText = 'Copiar texto';
    }, 2000);
  });
});