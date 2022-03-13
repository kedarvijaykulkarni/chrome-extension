let prompts = [];
let mContextMenus = [];
const container = document.getElementById('ad-prompts');
const rowIDPrefix = 'mantium-';
const inputIDPrefix = 'input-';
const deleteIDPrefix = 'delete-';
const loader = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;

const notifyObject = {
  type: 'basic',
  iconUrl: '../public/small-mantium-mark-color-small.png',
  title: 'MantiumAI :: ',
  message: 'Your message',
};
/*
 * methods
 */
function restore_options() {
  console.log('restore_options calle');
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get(['prompts', 'mContextMenus'], function (data) {
    console.log('data.prompts', data.prompts);
    console.log('data.mContextMenus', data.mContextMenus);

    prompts = data.prompts || [];
    mContextMenus = data.mContextMenus || null;
    if (prompts && prompts.length) {
      prompts.forEach((item) => {
        let row = document.createElement('div');
        row.id = item.row;
        row.className = item.row;
        container.appendChild(row);

        const rowEle = document.getElementById(row.id);

        let input = document.createElement('input');
        input.type = 'text';
        input.name = item.id;
        input.id = item.id;
        input.value = item.url;
        input.classList.add('prompt-field');

        rowEle.appendChild(input);

        let remove = document.createElement('input');
        remove.type = 'button';
        remove.value = 'remove';
        remove.id = row.del;

        // hide the remove now
        remove.classList.add('hide');

        rowEle.appendChild(remove);

        document
          .getElementById(remove.id)
          .addEventListener('click', removePrompt);
      });

      if (mContextMenus.length != prompts.length) {
        prompts.forEach(async (item) => {
          if (!mContextMenus.some((cm) => item.id == cm.id)) {
            url = document.getElementById(item.id).value;
            item.promptId = await getPromtId(url);
            item.url = url;

            console.log('restore item.promptId', item.promptId);

            // menuItem.title = text.prompt.deploy_name;
            mContextMenus.push({
              id: item.id,
              title: item.title,
              contexts: ['selection'],
            });
            item.hasAction = true;
          }
        });

        chrome.storage.sync.set({ mContextMenus, prompts });
        console.log('restore_options -> mContextMenus :::', mContextMenus);
      }
    }
  });
}

function addPromt() {
  const totalPrompt = container.children.length;

  // create new row
  let row = document.createElement('div');
  row.id = `row-${rowIDPrefix}${Number(totalPrompt + 1)}`;
  row.className = `row-${rowIDPrefix}${Number(totalPrompt + 1)}`;
  container.appendChild(row);

  const rowEle = document.getElementById(row.id);

  let input = document.createElement('input');
  input.type = 'text';
  input.name = String(inputIDPrefix + Number(totalPrompt + 1));
  input.id = String(inputIDPrefix + Number(totalPrompt + 1));
  input.classList.add('prompt-field');

  rowEle.appendChild(input);

  let remove = document.createElement('input');
  remove.type = 'button';
  remove.value = 'remove';
  remove.id = String(deleteIDPrefix + Number(totalPrompt + 1));

  // hide the remove now
  remove.classList.add('hide');

  rowEle.appendChild(remove);

  document.getElementById(remove.id).addEventListener('click', removePrompt);

  prompts.push({
    id: input.id,
    del: remove.id,
    row: row.id,
    hasAction: false,
    promptId: '',
    title: String('Prompt ' + Number(totalPrompt + 1)),
  });

  console.log('prompts :::', prompts);
}

function saveContextMenu() {
  mContextMenus = [];
  prompts.forEach(async (menuItem, index) => {
    let url = document.getElementById(menuItem.id).value || '';
    await getPromtId(url).then((text) => {
      let promptId = '';

      console.log('text:::', text);
      if (text.isValid) {
        if (menuItem.promptId != text.message && text.message != '') {
          menuItem.isUpdate = true;
          menuItem.promptId = text.message;
          menuItem.url = url;
          menuItem.title = text.prompt.deploy_name;
          promptId = text.message;
        } else {
          promptId = text.message;
        }
      } else {
        alert(text.message);
      }

      console.log('text:::', text);
      console.log('promptId ------------------------------- :::', promptId);

      // Object.assign({ contexts: ['selection'] }, menuItem)
      if (document.getElementById(menuItem.id).value) {
        if (
          Array.from(container.children).some(
            (div) => div.id === menuItem.row && !menuItem.hasAction
          )
        ) {
          // set the prompt ID that received
          menuItem.promptId = promptId;
          menuItem.url = url;
          mContextMenus.push({
            id: menuItem.id,
            title: text.prompt.deploy_name,
            contexts: ['selection'],
          });

          // back.addListener(menuItem);
          menuItem.hasAction = true;
        }
      } else {
        notification(
          Object.assign(notifyObject, {
            title: 'Context menu creation fail!',
            message: `${Number(index + 1)}. Prompt should have a value!`,
            priority: 2,
          })
        );

        // document.getElementById(menuItem.id).value;
      }

      chrome.storage.sync.set({ mContextMenus, prompts });
    });
  });

  console.log('update to local storage');
  console.log('storage', mContextMenus, prompts);
  // chrome.storage.sync.set({ prompts });
}

function removePrompt(parm) {
  console.log('remove prompt', this);
  console.log('remove prompt', this.id);
  // prompts = prompts.filter((p) => p.del != this.id);
  // chrome.storage.sync.set({ mContextMenus, prompts });
}

function notification(parm) {
  chrome.notifications.create('inform', parm);
}

function removeAll() {
  let text = 'Are you sure?';
  if (confirm(text) == true) {
    chrome.storage.sync.set({ mContextMenus: [], prompts: [] });
    chrome.contextMenus.removeAll(function () {
      notification(
        Object.assign(notifyObject, {
          title: 'MantiumAI',
          message: 'All menu delted',
          priority: 2,
        })
      );
      window.location.reload();
    });
  }
}

async function getPromtId(url) {
  let isValidURL = url.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  );
  if (isValidURL == null)
    return {
      isValid: false,
      message: 'Invalid URL',
    };

  if (url.indexOf('share.mantiumai.com') <= 0) {
    return {
      isValid: false,
      message: 'domain must be include share.mantiumai.com',
    };
  }

  let res = url.replace('.share.mantiumai.com', '').split('/');
  let promptArr =
    res.filter((str) => {
      return str.length >= 36;
    }) || [];

  console.log('promptArr ::-----------------------', promptArr);

  if (promptArr && promptArr.length) {
    return {
      isValid: true,
      message: promptArr[0],
      prompt: await getPromptDetails(promptArr[0]),
    };
  }

  return { isValid: false, message: 'Invalid ID in the URL' };
}

async function getPromptDetails(promptId) {
  let prompt = await fetch(
    `https://shareapi.mantiumai.com/v1/prompt/deployed/${promptId}`
  )
    .then((response) => response.json())
    .then((data) => data);

  return prompt;
}

/*
 * attached to addEventListener
 */

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('add').addEventListener('click', addPromt);
document.getElementById('save').addEventListener('click', saveContextMenu);
document.getElementById('remove-all').addEventListener('click', removeAll);
