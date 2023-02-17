const id = "__ENV__ID__";
const pw = "__ENV__PW__";

const waitElementNotHidden = (element) => {
  let inter = null;
  return new Promise((resolve, reject) => {
    inter = setInterval(() => {
      if (!element.classList.contains("hidden")) {
        clearInterval(inter);
        resolve();
      }
    }, 100);
  });
};

const waitExsistsElement = (query) => {
  let inter = null;
  return new Promise((resolve, reject) => {
    inter = setInterval(() => {
      if (document.querySelector(query)) {
        clearInterval(inter);
        resolve();
      }
    }, 100);
  });
};

const delay = (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

(async function () {
  if (!document.getElementById("return_form").classList.contains("hidden")) {
    document.getElementById("return_logout").click();
  }
  document.getElementById("entry_username").value = id;
  document.getElementById("entry_button").click();
  await waitElementNotHidden(document.getElementById("login_form"));
  document.getElementById("login_password").value = pw;
  document.getElementById("login_button").click();
  await waitExsistsElement(
    'div.notification > img[src="res/icon/connect.svg"]'
  );
  await waitExsistsElement("#dialogs > div > h1");
  document.querySelector("#dialogs > div > div > div.pri").click();

  document.getElementById("sig_config").click();
  document.querySelector('h1[title="Change the way TETR.IO looks"]').click();
  document.getElementById("video_graphics_minimal").click();
  document.getElementById("video_powersave").click();

  await delay(1000);
})();
