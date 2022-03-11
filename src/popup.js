chrome.storage.sync.get(['output'], function (data) {
  const results = document.getElementById('results');

  results.innerHTML = data.output;

  // if (data.output == 'loader') {
  //   results.innerHTML = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;
  // } else {
  //   results.innerHTML = data.output;
  // }
});

document.getElementById('delete').addEventListener('click', clearResult);

function clearResult() {
  const results = document.getElementById('results');
  results.innerHTML = '';

  chrome.storage.sync.set({ output: '' });
}

document.querySelector('#go-to-options').addEventListener('click', function () {
  console.log('chrome.contextMenus ===', chrome.contextMenus);
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

window.addEventListener('load', (event) => {
  chrome.action.setBadgeText({ text: '' });
});
