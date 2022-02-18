function setup() {
  noCanvas();

  // This is a way of getting a global variable from the background script
  var word = chrome.extension.getBackgroundPage().word;

  // console.log('I am setup :::', word);

  // createP(word);
  // const resultsDiv = document.getElementById('results');
  /*  const loader = `<div class="lds-facebook"><div></div><div></div><div></div></div>`;
  if (word !== null) {
    var p = select('#results');
    p.html(word);
  } else {
    p.html('Something went wrong.');
  }*/
}
