const notifyObject = {
  type: 'basic',
  iconUrl: '../public/small-mantium-mark-color-small.png',
  title: 'MantiumAI :: ',
  message: 'Your message',
};

// let localPrompts = [];
const localContextMenus = [];

function notification(parm) {
  chrome.notifications.create('', parm);
}

function getword(info, tab) {
  chrome.storage.sync.get(['prompts'], function (data) {
    let prompt =
      data.prompts.filter((p) => {
        return p.id === info.menuItemId;
      }) || [];
    let promptId = prompt[0].promptId;

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
          // use to set a loader
          // chrome.storage.sync.set({ output: 'loader' });
          sessionId = data.sessionId;
          promptExecutionId = data.prompt_execution_id;

          return sessionId && promptExecutionId
            ? await getResult(data.prompt_execution_id, data.sessionId)
            : alert('Prompt not found ');

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
                  .then((data) => {
                    // sleep to avoid continue call to MantiumAI API as some time the Process is not done
                    setTimeout(() => {
                      checkResponse(data);
                    }, 800);
                  });
              } else {
                // This send to storage and seen into the popup
                chrome.storage.sync.set({
                  output: res.output || `Error: ${res.error}`,
                });
                // there is no benifit of return but function should return the value ;)
                return res;
              }
            }
          }
        });
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: getResultString,
      args: [promptId],
    });
  }); // end get promt from memory
}

chrome.storage.onChanged.addListener(async function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key == 'output' && newValue != oldValue) {
      if (newValue != '' || newValue != 'loader') {
        chrome.notifications.create('', {
          type: 'basic',
          iconUrl: '../public/small-mantium-mark-color-small.png',
          title: 'Mantium',
          message: newValue,
          priority: 2,
        });
        // add badge once answer is ready
        chrome.action.setBadgeText({ text: ' 1 ' });
        chrome.action.setBadgeBackgroundColor({ color: '#00b3fa' });
      }
      // we can open the option page using following line
      // chrome.runtime.openOptionsPage();
    }

    if (key == 'mContextMenus') {
      newValue.forEach((item) => {
        if (!localContextMenus.includes(item.id)) {
          let contextMenuId = chrome.contextMenus.create(item, function () {
            notification(
              Object.assign(notifyObject, {
                title: 'Context menu created',
                message: 'Your Context menu are created!',
                priority: 2,
              })
            );
          });

          localContextMenus.push(contextMenuId);

          chrome.contextMenus.onClicked.addListener(getword);
        }
      });
    }
  }
});

chrome.storage.sync.get(['prompts', 'mContextMenus'], function (data) {
  if (data.prompts && data.prompts.length) {
    data.prompts.forEach((item) => {
      if (!localContextMenus.includes(item.id)) {
        let contextMenuId = chrome.contextMenus.create(
          {
            id: item.id,
            title: item.title,
            contexts: ['selection'],
          },
          function () {
            chrome.contextMenus.onClicked.addListener(getword);
          }
        );
        localContextMenus.push(contextMenuId);
      }
    });
  }
});
