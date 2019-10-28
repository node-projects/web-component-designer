window.addEventListener('WebComponentsReady', function() {
  document.addEventListener('update-code', function(event: CustomEvent) {
    // @ts-ignore
    codeView.dump(event.detail.target);
  }, true);
});