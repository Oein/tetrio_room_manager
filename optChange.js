(() => {
  const element = document.querySelector('input[data-index="${sel}"]');
  element.value = "${val}";
  element.dispatchEvent(new Event("input"));
  document.getElementById("room_opts_save").click();
})();
