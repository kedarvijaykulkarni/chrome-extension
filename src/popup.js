chrome.storage.sync.get(['output'], function (data) {
  const results = document.getElementById('results');
  results.innerHTML = data.output;
});

document.getElementById('delete').addEventListener('click', clearResult);

function clearResult() {
  const results = document.getElementById('results');
  results.innerHTML = '';

  chrome.storage.sync.set({ output: '' });
}

document.querySelector('#go-to-options').addEventListener('click', function () {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});
