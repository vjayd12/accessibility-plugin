const statusEl = document.getElementById('status');

async function launch(feature = null) {
  statusEl.textContent = 'Opening…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { statusEl.textContent = 'No active tab'; return; }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['audit-engine.js', 'content.js']
    });
  } catch (e) {}
  await new Promise(r => setTimeout(r, 140));
  chrome.tabs.sendMessage(tab.id, { action: 'open', feature }, res => {
    if (chrome.runtime.lastError) { statusEl.textContent = chrome.runtime.lastError.message; return; }
    window.close();
  });
}

document.getElementById('auditBtn').onclick = () => launch('audit');
document.getElementById('openAll').onclick = () => launch(null);
document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => launch(b.dataset.f));
