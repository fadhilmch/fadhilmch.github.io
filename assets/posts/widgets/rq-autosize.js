(() => {
  // node_modules/.cache/widgets-build/kit.js
  function byId(id) {
    return document.getElementById(id);
  }

  // node_modules/.cache/widgets-build/rq-autosize.js
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin)
      return;
    const data = event.data;
    if (data && data.explainer === "multilingual-rag" && data.height) {
      byId("rq-explainer").style.height = data.height + "px";
    }
  });
})();
