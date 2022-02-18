const CONTEXT_MENU_ID = 'MANTIUM_CONTEXT';

// A "global" variable to store the word selected by the user
var word = null;

function getword(info, tab) {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return;
  }

  function getResultString() {
    postData(
      'https://mantium-whatsapp-chatbot.herokuapp.com/chrome-extension',
      {
        message: window.getSelection().toString(),
      }
    ).then((data) => {
      console.log('DATA ::::', data);
      console.log(data.output); // JSON data parsed by `data.json()` call
      alert(data.output);
      // chrome.runtime.sendMessage({ word: data.output });
    });

    async function postData(url = '', data = {}) {
      // Default options are marked with *

      var details = {
        message: data.message,
      };

      var formBody = [];
      for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + '=' + encodedValue);
      }
      formBody = formBody.join('&');

      const response = await fetch(url, {
        method: 'POST', // or 'PUT'
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: formBody,
      })
        .then((response) => response.json())
        .then((data) => data)
        .catch((error) => {
          console.error('Error:', error);
        });
      return response; // parses JSON response into native JavaScript objects
    }
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getResultString,
  });
}
chrome.contextMenus.create({
  title: 'Send for completion',
  contexts: ['selection'],
  id: CONTEXT_MENU_ID,
});
chrome.contextMenus.onClicked.addListener(getword);

// chrome.contextMenus.create({
//   title: 'Send to a second prompt',
//   contexts: ['selection'],
//   id: CONTEXT_MENU_ID + '1',
// });
// chrome.contextMenus.onClicked.addListener(getword);

/*
chrome.runtime.onMessage.addListener(receiver);

function receiver(request, sender, sendResponse) {
  // Save the word
  word = request.word;
}
*/
