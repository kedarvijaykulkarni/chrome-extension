const notifyObject = {
  type: 'basic',
  iconUrl: '../public/small-mantium-mark-color-small.png',
  title: 'MantiumAI :: ',
  message: 'Your message',
};

function notification(parm) {
  console.log('parm 00000000000', parm);
  chrome.notifications.create('', parm);
}

function getword(info, tab) {
  console.log('item ******************', info);
  console.log('tab ******************', tab);

  // if (info.menuItemId !== CONTEXT_MENU_ID) {
  //   return;
  // }

  function getResultString() {
    postData(
      'https://mantium-whatsapp-chatbot.herokuapp.com/chrome-extension',
      {
        message: window.getSelection().toString(),
      }
    ).then((data) => {
      console.log('DATA ::::', data);
      console.log(data.output); // JSON data parsed by `data.json()` call
      // alert(data.output);

      chrome.storage.sync.set({ output: data.output });

      chrome.notifications.create(
        'output',
        Object.assign(notifyObject, {
          title: 'Result',
          message: data.output,
          priority: 2,
        })
      );
      // yet to try for .sendMessage advance method to communicate between storage and popup
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

chrome.storage.sync.get(['prompts', 'mContextMenus'], function (data) {
  console.log('********** prompts', data.prompts);
  console.log('********** mContextMenus', data.mContextMenus);
  // chrome.contextMenus.removeAll(function () {
  // if (data.prompts && data.prompts.length) {
  data.prompts.forEach((item) => {
    let menu = {
      id: item.id,
      title: item.title,
      contexts: ['selection'],
    };
    chrome.contextMenus.create(menu, function () {
      notification(
        Object.assign(notifyObject, {
          title: 'Context menu created',
          message: 'chrome.storage.sync.get!',
          priority: 2,
        })
      );
    });
    chrome.contextMenus.onClicked.addListener(getword);
  });
  // }
  // });
});
