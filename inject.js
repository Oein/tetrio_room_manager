const id = "__ENV__ID__";
const pw = "__ENV__PW__";

let isSpectator = true;

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

const waitElementNotEmpty = (element) => {
  let inter = null;
  return new Promise((resolve, reject) => {
    inter = setInterval(() => {
      if (element.innerText.length > 0) {
        clearInterval(inter);
        resolve();
      }
    }, 100);
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

  document.getElementById("play_multi").click();
  await waitExsistsElement("#multi_menu");
  document.getElementById("multi_createroom").click();
  document.querySelector("div[data-id=private]").click();
  await waitElementNotEmpty(document.querySelector("#roomid"));

  const g = document.getElementById("victoryview");
  setInterval(() => {
    if (!g.classList.contains("hidden")) {
      document.getElementById("backtoroom").click();
    }
  }, 10);
  setInterval(() => {
    if (document.getElementById("leaveroom").classList.contains("hidden"))
      return;
    let specBtn = document.getElementById("room_switchbracket");
    let isNowSpec = specBtn.innerText.includes("SPECTATING");
    if (!isSpectator && isNowSpec) specBtn.click();
    if (isSpectator && !isNowSpec) specBtn.click();
  }, 1000);

  document.getElementById("room_switchbracket").click();
  document.getElementById("room_opts_game").click();

  return document.querySelector("#roomid").innerText;
})();
