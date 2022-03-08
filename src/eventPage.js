const notifyObject = {
  type: 'basic',
  iconUrl: '../public/small-mantium-mark-color-small.png',
  title: 'MantiumAI :: ',
  message: 'Your message',
};

let localPrompts = [];

function notification(parm) {
  chrome.notifications.create('', parm);
}

function getword(info, tab) {
  console.log('info ::', info);
  console.log('tab ::', tab);

  let prompt = localPrompts.filter((p) => p.id == info.menuItemId) || [];
  let promptId = prompt[0].promptId;

  function getResultString(promptId) {
    alert('Your selected text send to MantiumAI');
    postData(
      'https://mantium-whatsapp-chatbot.herokuapp.com/chrome-extension',
      {
        message: window.getSelection().toString(),
      }
    ).then((data) => {
      console.log('MantiumAI ::: response ->', data.output);
      chrome.storage.sync.set({ output: data.output });
    });

    async function postData(url = '', data = {}) {
      // Default options are marked with *

      var details = {
        message: data.message,
        prompt_id: promptId,
      };

      console.log(details);

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
    args: [promptId],
  });

  /*
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        // files: ['script.js'],
      },
      () => {
        getResultString(promptId);
      }
    );
  */
}

// chrome.storage.sync.get()

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key == 'output' && newValue != oldValue) {
      if (newValue != '') {
        chrome.notifications.create('', {
          type: 'basic',
          iconUrl: '../public/small-mantium-mark-color-small.png',
          title: 'MantiumAI :: Result',
          message: newValue,
          priority: 2,
        });
      }

      // chrome.runtime.openOptionsPage();
    }

    if (key == 'mContextMenus') {
      newValue.forEach((item) => {
        chrome.contextMenus.create(item, function () {
          notification(
            Object.assign(notifyObject, {
              title: 'Context menu created',
              message: 'Your Context menu are created!',
              priority: 2,
            })
          );
        });
        chrome.contextMenus.onClicked.addListener(getword);
      });
    }
  }
});

chrome.storage.sync.get(['prompts', 'mContextMenus'], function (data) {
  localPrompts = data.prompts;

  chrome.contextMenus.removeAll(function () {
    if (data.prompts && data.prompts.length) {
      data.prompts.forEach((item) => {
        chrome.contextMenus.create(
          {
            id: item.id,
            title: item.title,
            contexts: ['selection'],
          },
          function () {
            chrome.contextMenus.onClicked.addListener(getword);
          }
        );
      });
    }
  });
});
