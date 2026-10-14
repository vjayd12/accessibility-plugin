/* DWAO AI — Accessibility Suite v2 · background */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'capture') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) { sendResponse({ error: 'No tab' }); return; }
      chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) sendResponse({ error: chrome.runtime.lastError.message });
        else sendResponse({ dataUrl });
      });
    });
    return true;
  }
  if (msg.action === 'saveReport') {
    chrome.storage.local.set({ ['report_' + Date.now()]: msg.report }, () => sendResponse({ ok: true }));
    return true;
  }
});
