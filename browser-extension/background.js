// Background service worker for Cogito extension
// Handles extension lifecycle and personality tracking

chrome.runtime.onInstalled.addListener(() => {
  console.log('Cogito personality evolution extension installed');
  
  // Initialize personality tracking storage
  chrome.storage.local.set({
    interactionCount: 0,
    personalityVersion: '0.3.0',
    collaboratorName: 'ken',
    sessionStart: Date.now()
  });
});

// Track personality evolution events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackInteraction') {
    // Increment interaction count
    chrome.storage.local.get(['interactionCount'], (result) => {
      const newCount = (result.interactionCount || 0) + 1;
      chrome.storage.local.set({ interactionCount: newCount });
    });
  }
  
  if (request.action === 'updatePersonality') {
    // Update personality version and metadata
    chrome.storage.local.set({
      personalityVersion: request.version,
      lastUpdated: Date.now()
    });
  }
  
  if (request.keepAlive) {
    sendResponse({status: 'alive'});
  }
  
  return true;
});