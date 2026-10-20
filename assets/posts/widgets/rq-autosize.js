window.addEventListener('message', function (event) {
  if (event.origin !== window.location.origin) return;
  var data = event.data;
  if (data && data.explainer === 'multilingual-rag' && data.height) {
    document.getElementById('rq-explainer').style.height = data.height + 'px';
  }
});

