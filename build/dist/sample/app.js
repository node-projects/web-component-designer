"use strict";

window.addEventListener('WebComponentsReady', function () {
  document.addEventListener('update-code', function (event) {
    // @ts-ignore
    codeView.dump(event.detail.target);
  }, true);
});