(() => {
  const element = document.querySelector('input[data-index="__sel__"]');
  element.checked = __val__;
  element.dispatchEvent(new Event("input"));
  document.getElementById("room_opts_save").click();
})();
