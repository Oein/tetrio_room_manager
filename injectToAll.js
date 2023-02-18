(() => {
  setInterval(() => {
    let dig = document.getElementById("dialogs");
    if (dig.childElementCount > 0) {
      let chi = dig.children[0].innerText;
      if (chi.includes("CONNECTION ERROR")) {
        window.ipcRenderer.invoke("data.game.crash");
        setTimeout(location.reload, 1000);
      }
    }
  }, 1000);
})();
