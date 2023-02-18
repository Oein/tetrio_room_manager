let isSpectator = true;

(async () => {
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

  const delay = (ms) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  };

  return await (async () => {
    await delay(1000);
    document.getElementById("return_button").click();
    await delay(1000);
    await waitExsistsElement(
      'div.notification > img[src="res/icon/connect.svg"]'
    );

    document.getElementById("play_multi").click();
    await waitExsistsElement("#multi_menu");
    document.getElementById("multi_createroom").click();
    document.querySelector("div[data-id=private]").click();
    await waitElementNotEmpty(document.querySelector("#roomid"));

    const g = document.getElementById("victoryview");
    setInterval(() => {
      if (!g.classList.contains("hidden")) {
        window.ipcRenderer.invoke(
          "data.game.winner",
          document.getElementById("playerresults").children[0].children[1]
            .innerText
        );
        document.getElementById("backtoroom").click();
        window.ipcRenderer.invoke("event.game.end");
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
})();
