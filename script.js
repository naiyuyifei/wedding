(function () {
  const weddingDate = new Date("2026-05-24T11:28:00+08:00");
  const filmImages = ["film1", "film2", "film3", "film5"];
  const portraitImages = [
    "SBM_8521",
    "SBM_8465",
    "SBM_8446",
    "scene_01_05",
    "scene_01_09",
    "scene_04_01",
    "scene_05_01"
  ];

  const el = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
    filmTrack: document.getElementById("filmTrack"),
    portraitMain: document.getElementById("portraitMain"),
    portraitSecondary: document.getElementById("portraitSecondary"),
    portraitDots: document.getElementById("portraitDots"),
    portraitFrame: document.querySelector(".portrait-frame"),
    portraitSecondaryFrame: document.querySelector(".portrait-secondary-frame"),
    messageForm: document.getElementById("messageForm"),
    submitBtn: document.getElementById("submitBtn"),
    formHint: document.getElementById("formHint"),
    music: document.getElementById("bgMusic"),
    musicDock: document.getElementById("musicDock"),
    musicText: document.getElementById("musicText"),
    musicFallbackBtn: document.getElementById("musicFallbackBtn"),
    mapPreview: document.getElementById("mapPreview"),
    mapFallback: document.getElementById("mapFallback"),
    bg: document.querySelector(".cinema-bg")
  };

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function updateCountdown() {
    const diff = weddingDate.getTime() - Date.now();
    if (diff <= 0) {
      el.days.textContent = "00";
      el.hours.textContent = "00";
      el.minutes.textContent = "00";
      el.seconds.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    el.days.textContent = pad(days);
    el.hours.textContent = pad(hours);
    el.minutes.textContent = pad(minutes);
    el.seconds.textContent = pad(seconds);
  }

  function createFilmFrames() {
    const list = filmImages.concat(filmImages);
    const frag = document.createDocumentFragment();
    list.forEach((name, index) => {
      const eager = index < 3 ? "eager" : "lazy";
      const priority = index < 2 ? "high" : "auto";
      const frame = document.createElement("article");
      frame.className = "film-frame";
      frame.innerHTML =
        '<picture><source srcset="./assets/optimized/' +
        name +
        '.webp" type="image/webp" /><img loading="' +
        eager +
        '" fetchpriority="' +
        priority +
        '" src="./' +
        name +
        '.png" alt="电影胶片 ' +
        name +
        '" /></picture>';
      frag.appendChild(frame);
    });
    el.filmTrack.appendChild(frag);
  }

  function setPortraitActive(index) {
    const name = portraitImages[index];
    if (!name) return;
    const nextName = portraitImages[(index + 1) % portraitImages.length];
    const mainUrl = "./assets/optimized/" + name + ".webp";
    const secondaryUrl = "./assets/optimized/" + nextName + ".webp";

    el.portraitMain.src = mainUrl;
    el.portraitMain.alt = "竖版影像 " + name;
    el.portraitSecondary.src = secondaryUrl;
    el.portraitSecondary.alt = "下一张影像 " + nextName;
    el.portraitFrame.style.setProperty("--portrait-main-bg", "url('" + mainUrl + "')");
    el.portraitSecondaryFrame.style.setProperty("--portrait-secondary-bg", "url('" + secondaryUrl + "')");

    document.querySelectorAll(".portrait-dot").forEach((item, idx) => {
      item.classList.toggle("active", idx === index);
    });
  }

  function initPortraitDots() {
    const frag = document.createDocumentFragment();

    portraitImages.forEach((name, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "portrait-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", "切换影像 " + (index + 1));

      dot.addEventListener("click", function () {
        activePortraitIndex = index;
        setPortraitActive(activePortraitIndex);
      });

      frag.appendChild(dot);
    });

    el.portraitDots.appendChild(frag);
  }

  async function submitMessage(event) {
    event.preventDefault();

    const guestName = (document.getElementById("guestName").value || "").trim();
    const impression = (document.getElementById("impression").value || "").trim();

    if (impression.length < 2 || impression.length > 120) {
      el.formHint.textContent = "留言需在 2-120 字之间。";
      return;
    }

    el.submitBtn.disabled = true;
      el.formHint.textContent = "正在发送...";

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName, impression })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "提交失败，请稍后再试");
      }

      el.messageForm.reset();
      el.formHint.textContent = "留言已发送，感谢你的祝福。";
    } catch (err) {
      el.formHint.textContent = err.message || "提交失败，请稍后再试。";
    } finally {
      el.submitBtn.disabled = false;
    }
  }

  async function startMusic(showFallbackOnFail) {
    const shouldShowFallback = showFallbackOnFail !== false;
    try {
      el.music.muted = false;
      await el.music.play();
      el.musicDock.classList.add("playing");
      el.musicText.textContent = "音乐：播放中";
      el.musicFallbackBtn.classList.add("hidden");
      return true;
    } catch (err) {
      el.musicDock.classList.remove("playing");
      el.musicText.textContent = "音乐：待开启";
      if (shouldShowFallback) {
        el.musicFallbackBtn.classList.remove("hidden");
      }
      return false;
    }
  }

  async function forceAutoPlay() {
    const direct = await startMusic(false);
    if (direct) return true;

    try {
      el.music.muted = true;
      await el.music.play();
      el.music.muted = false;
      el.musicDock.classList.add("playing");
      el.musicText.textContent = "音乐：播放中";
      el.musicFallbackBtn.classList.add("hidden");
      return true;
    } catch (err) {
      el.music.muted = false;
      return false;
    }
  }

  function toggleMusic() {
    if (el.music.paused) {
      startMusic();
      return;
    }

    el.music.pause();
    el.musicDock.classList.remove("playing");
    el.musicText.textContent = "音乐：已暂停";
  }

  function initMapFallback() {
    let loaded = false;

    el.mapPreview.addEventListener("load", function () {
      loaded = true;
      el.mapFallback.classList.add("hidden");
    });

    setTimeout(function () {
      if (!loaded) {
        el.mapFallback.classList.remove("hidden");
      }
    }, 5000);
  }

  function initParallax() {
    let currentY = 0;
    window.addEventListener(
      "scroll",
      function () {
        currentY = window.scrollY || 0;
        const scale = 1.06 + Math.min(currentY / 4200, 0.05);
        el.bg.style.transform = "scale(" + scale + ") translateY(" + currentY * 0.02 + "px)";
      },
      { passive: true }
    );
  }

  let activePortraitIndex = 0;

  function startPortraitLoop() {
    setInterval(function () {
      activePortraitIndex = (activePortraitIndex + 1) % portraitImages.length;
      setPortraitActive(activePortraitIndex);
    }, 5000);
  }

  function init() {
    updateCountdown();
    setInterval(updateCountdown, 1000);

    createFilmFrames();
    initPortraitDots();
    setPortraitActive(0);
    startPortraitLoop();

    el.messageForm.addEventListener("submit", submitMessage);

    let autoRetry = 0;
    const tryAutoMusic = function () {
      if (!el.music.paused) return;
      forceAutoPlay().then(function (ok) {
        if (!ok && autoRetry >= 5) {
          el.musicFallbackBtn.classList.remove("hidden");
        }
      });
      autoRetry += 1;
    };

    tryAutoMusic();
    window.addEventListener("load", tryAutoMusic, { passive: true });
    window.addEventListener("pageshow", tryAutoMusic, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        tryAutoMusic();
      }
    });
    document.addEventListener("WeixinJSBridgeReady", tryAutoMusic, false);
    document.addEventListener("YixinJSBridgeReady", tryAutoMusic, false);

    document.addEventListener(
      "pointerdown",
      function () {
        if (el.music.paused) {
          forceAutoPlay();
        }
      },
      { once: true }
    );

    el.musicDock.addEventListener("click", toggleMusic);
    el.musicFallbackBtn.addEventListener("click", startMusic);

    initMapFallback();
    initParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
