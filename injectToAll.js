(() => {
  setInterval(() => {
    let dig = document.getElementById("dialogs");
    if (dig.childElementCount > 0) {
      let chi = dig.children[0].innerText;
      if (chi.includes("CONNECTION ERROR")) {
        location.reload();
      }
    }
  }, 1000);
})();
