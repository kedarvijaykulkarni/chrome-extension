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
        input.value = item.promptId;
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
        prompts.forEach((item) => {
          if (!mContextMenus.some((cm) => item.id == cm.id)) {
            promptId = document.getElementById(item.id).value;

            item.promptId = promptId;
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
    title: String('Promt ' + Number(totalPrompt + 1)),
  });

  console.log('prompts :::', prompts);
}

function saveContextMenu() {
  mContextMenus = [];
  prompts.forEach((menuItem, index) => {
    console.log('menuItem :::', menuItem, menuItem.id);
    promptId = document.getElementById(menuItem.id).value;
    // Object.assign({ contexts: ['selection'] }, menuItem)
    if (document.getElementById(menuItem.id).value) {
      if (
        Array.from(container.children).some(
          (div) => div.id === menuItem.row && !menuItem.hasAction
        )
      ) {
        // set the prompt ID that received
        menuItem.promptId = promptId;
        mContextMenus.push({
          id: menuItem.id,
          title: menuItem.title,
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
  });

  chrome.storage.sync.set({ mContextMenus, prompts });
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

/*
 * attached to addEventListener
 */

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('add').addEventListener('click', addPromt);
document.getElementById('save').addEventListener('click', saveContextMenu);
document.getElementById('remove-all').addEventListener('click', removeAll);
