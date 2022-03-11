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

  console.log('prompt ::', prompt);
  console.log('promptId ::', promptId);

  async function getResultString(promptId) {
    alert('Your selected text send to MantiumAI');

    const result = await fetch(
      `https://shareapi.mantiumai.com/v1/prompt/deployed/${promptId}/execute`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: window.getSelection().toString() }),
      }
    )
      .then((response) => response.json())
      .then(async (data) => {
        console.log('MantiumAI ::: response ->', data);

        // use to set a loader
        // chrome.storage.sync.set({ output: 'loader' });

        sessionId = data.sessionId;
        promptExecutionId = data.prompt_execution_id;

        console.log('MantiumAI ::: sessionId ->', sessionId);
        console.log('MantiumAI ::: promptExecutionId ->', promptExecutionId);

        return await getResult(data.prompt_execution_id, data.sessionId);

        async function getResult(promptExecutionId, sessionId) {
          let url = `https://shareapi.mantiumai.com/v1/prompt/deployed/result/${promptExecutionId}?sessionId=${sessionId}`;
          return await fetch(url)
            .then((response) => response.json())
            .then((data) => checkResponse(data));

          function checkResponse(res) {
            if (
              res &&
              !['COMPLETED', 'REJECTED', 'INTERRUPTED', 'ERRORED'].includes(
                res.status
              )
            ) {
              return fetch(url)
                .then((response) => response.json())
                .then((data) => checkResponse(data));
            } else {
              return res;
            }
          }
        }
      });

    chrome.storage.sync.set({ output: result.output });
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

chrome.storage.onChanged.addListener(async function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key == 'output' && newValue != oldValue) {
      if (newValue != '' || newValue != 'loader') {
        chrome.notifications.create('', {
          type: 'basic',
          iconUrl: '../public/small-mantium-mark-color-small.png',
          title: 'MantiumAI :: Result',
          message: newValue,
          priority: 2,
        });

        chrome.action.setBadgeText({ text: ' 1 ' });
        chrome.action.setBadgeBackgroundColor({ color: '#00b3fa' });
      }

      // chrome.browserAction.setBadgeText({ text: '1' });
      // chrome.browserAction.setBadgeText({ text: '1' })

      // await chrome.action.setBadgeText({ text: 'it works' });
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
