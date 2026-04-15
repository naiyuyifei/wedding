(function () {
  const weddingDate = new Date("2026-05-24T11:28:00+08:00");
  const filmImages = ["film1", "film2", "film3", "film5"];
  const portraitImages = [
    "SBM_8521",
    "SBM_8465",
    "SBM_8446",
    "img3",
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
    mapStaticPreviewWrap: document.getElementById("mapStaticPreviewWrap"),
    mapStaticPreview: document.getElementById("mapStaticPreview"),
    mapFallback: document.getElementById("mapFallback"),
    bg: document.querySelector(".cinema-bg")
  };
  let filmTicker = null;
  let filmFallbackTimer = null;
  const isGitHubPages = /(^|\.)github\.io$/i.test(window.location.hostname || "");

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

  function waitForTrackImages() {
    return new Promise(function (resolve) {
      const imgs = el.filmTrack.querySelectorAll("img");
      if (!imgs.length) {
        resolve();
        return;
      }

      let done = 0;
      const finish = function () {
        done += 1;
        if (done >= imgs.length) resolve();
      };

      imgs.forEach(function (img) {
        if (img.complete) {
          finish();
          return;
        }
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
      });

      setTimeout(resolve, 2400);
    });
  }

  function startFilmMarquee() {
    if (!el.filmTrack) return;

    let offset = 0;
    let lastTs = 0;
    let halfWidth = 1;

    const recalc = function () {
      halfWidth = Math.max(1, el.filmTrack.scrollWidth / 2);
      if (-offset > halfWidth) offset = 0;
    };

    const tick = function (ts) {
      if (!lastTs) lastTs = ts;
      const delta = Math.min(48, ts - lastTs);
      lastTs = ts;

      if (!document.hidden) {
        const speed = window.innerWidth < 768 ? 0.032 : 0.046;
        offset -= delta * speed;
        if (-offset >= halfWidth) {
          offset += halfWidth;
        }
        el.filmTrack.style.transform = "translate3d(" + offset + "px, 0, 0)";
      }

      filmTicker = window.requestAnimationFrame(tick);
    };

    waitForTrackImages().then(function () {
      el.filmTrack.style.animation = "none";
      recalc();
      window.addEventListener("resize", recalc, { passive: true });

      if (window.requestAnimationFrame) {
        filmTicker = window.requestAnimationFrame(tick);
      } else {
        filmFallbackTimer = setInterval(function () {
          offset -= 0.7;
          if (-offset >= halfWidth) {
            offset += halfWidth;
          }
          el.filmTrack.style.transform = "translate3d(" + offset + "px, 0, 0)";
        }, 16);
      }
    });
  }

  function preloadImage(url) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () {
        resolve(true);
      };
      img.onerror = function () {
        resolve(false);
      };
      img.src = url;
    });
  }

  function swapImageSmooth(node, url, alt) {
    if (!node) return;
    if (node.getAttribute("data-current") === url) return;

    preloadImage(url).then(function () {
      node.classList.add("is-fading");
      setTimeout(function () {
        node.src = url;
        node.alt = alt;
        node.setAttribute("data-current", url);
        node.classList.remove("is-fading");
      }, 210);
    });
  }

  function setPortraitActive(index) {
    const name = portraitImages[index];
    if (!name) return;
    const nextName = portraitImages[(index + 1) % portraitImages.length];
    const mainUrl = "./assets/optimized/" + name + ".webp";
    const secondaryUrl = "./assets/optimized/" + nextName + ".webp";

    swapImageSmooth(el.portraitMain, mainUrl, "竖版影像 " + name);
    swapImageSmooth(el.portraitSecondary, secondaryUrl, "下一张影像 " + nextName);
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

  function submitMessage(event) {
    event.preventDefault();

    const guestName = (document.getElementById("guestName").value || "").trim();
    const impression = (document.getElementById("impression").value || "").trim();

    if (impression.length < 2 || impression.length > 120) {
      el.formHint.textContent = "留言需在 2-120 字之间。";
      return;
    }

    if (isGitHubPages) {
      el.submitBtn.disabled = true;
      el.formHint.textContent = "正在发送...";

      const payload = {
        name: guestName || "匿名来宾",
        message: impression,
        _subject: "婚礼留言 - " + (guestName || "匿名来宾"),
        _template: "table",
        _captcha: "false"
      };

      fetch("https://formsubmit.co/ajax/nerdfny@163.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("邮件服务暂时不可用");
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function () {
          el.messageForm.reset();
          el.formHint.textContent = "留言已发送到新人邮箱，感谢你的祝福。";
          el.submitBtn.disabled = false;
        })
        .catch(function () {
          const subject = encodeURIComponent("婚礼留言 - " + (guestName || "匿名来宾"));
          const body = encodeURIComponent(
            "姓名: " +
              (guestName || "匿名来宾") +
              "\n留言: " +
              impression +
              "\n时间: " +
              new Date().toLocaleString("zh-CN", { hour12: false })
          );
          window.location.href = "mailto:nerdfny@163.com?subject=" + subject + "&body=" + body;
          el.formHint.textContent = "自动发送失败，已调用邮箱客户端发送。";
          el.submitBtn.disabled = false;
        });
      return;
    }

    el.submitBtn.disabled = true;
    el.formHint.textContent = "正在发送...";

    fetch("./api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName, impression })
      })
      .then(function (res) {
        const contentType = (res.headers && res.headers.get("content-type")) || "";
        if (contentType.indexOf("application/json") > -1) {
          return res.json().then(function (data) {
            return { res: res, data: data };
          });
        }
        return res.text().then(function (raw) {
          return { res: res, data: { raw: raw } };
        });
      })
      .then(function (result) {
        const res = result.res;
        const data = result.data || {};

        if (!res.ok) {
          if (res.status === 404 || res.status === 405) {
            throw new Error("留言接口未生效，请在 EdgeOne 启用 Edge Functions 并重新部署。");
          }
          throw new Error(data.error || "提交失败，请稍后再试");
        }

        el.messageForm.reset();
        el.formHint.textContent = "留言已发送，感谢你的祝福。";
        el.submitBtn.disabled = false;
      })
      .catch(function (err) {
        el.formHint.textContent = (err && err.message) || "提交失败，请稍后再试。";
        el.submitBtn.disabled = false;
      });
  }

  function startMusic(showFallbackOnFail) {
    const shouldShowFallback = showFallbackOnFail !== false;
    el.music.muted = false;
    return el.music
      .play()
      .then(function () {
        el.musicDock.classList.add("playing");
        el.musicText.textContent = "音乐：播放中";
        el.musicFallbackBtn.classList.add("hidden");
        return true;
      })
      .catch(function () {
        el.musicDock.classList.remove("playing");
        el.musicText.textContent = "音乐：待开启";
        if (shouldShowFallback) {
          el.musicFallbackBtn.classList.remove("hidden");
        }
        return false;
      });
  }

  function forceAutoPlay() {
    return startMusic(false).then(function (direct) {
      if (direct) return true;
      el.music.muted = true;
      return el.music
        .play()
        .then(function () {
          el.music.muted = false;
          el.musicDock.classList.add("playing");
          el.musicText.textContent = "音乐：播放中";
          el.musicFallbackBtn.classList.add("hidden");
          return true;
        })
        .catch(function () {
          el.music.muted = false;
          return false;
        });
    });
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
    if (!el.mapPreview || !el.mapFallback) return;

    const ua = navigator.userAgent || "";
    const isWeChat = /MicroMessenger/i.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua);
    const wrap = el.mapPreview.closest(".map-preview-wrap");
    const mapWebp = "./assets/optimized/map_preview.webp";
    const mapJpg = "./assets/optimized/map_preview.jpg";

    const ensureStaticPreview = function () {
      if (!wrap) return null;

      if (!el.mapStaticPreviewWrap || !el.mapStaticPreview) {
        const picture = document.createElement("picture");
        picture.id = "mapStaticPreviewWrap";
        picture.className = "map-static-preview-wrap hidden";

        const source = document.createElement("source");
        source.srcset = mapWebp;
        source.type = "image/webp";

        const image = document.createElement("img");
        image.id = "mapStaticPreview";
        image.className = "map-static-preview";
        image.src = mapJpg;
        image.alt = "石灿酒店地图预览";
        image.loading = "lazy";

        picture.appendChild(source);
        picture.appendChild(image);
        wrap.insertBefore(picture, wrap.firstChild);

        el.mapStaticPreviewWrap = picture;
        el.mapStaticPreview = image;
      }

      if (el.mapStaticPreview) {
        el.mapStaticPreview.onerror = function () {
          this.onerror = null;
          this.src = mapJpg;
        };
      }

      return el.mapStaticPreviewWrap;
    };

    const showFallback = function (note) {
      const staticWrap = ensureStaticPreview();
      if (wrap) wrap.classList.add("fallback-mode");
      if (staticWrap) staticWrap.classList.remove("hidden");
      el.mapFallback.classList.remove("hidden");
      const noteEl = el.mapFallback.querySelector(".map-fallback-note");
      if (noteEl) {
        if (note) {
          noteEl.textContent = note;
          noteEl.classList.remove("hidden");
        } else {
          noteEl.classList.add("hidden");
        }
      } else if (note) {
        el.mapFallback.textContent = note;
      }
    };

    if (isWeChat || isMobile) {
      showFallback("");
      return;
    }

    let loaded = false;

    el.mapPreview.addEventListener("load", function () {
      loaded = true;
      el.mapFallback.classList.add("hidden");
    });

    setTimeout(function () {
      if (!loaded) {
        showFallback("地图预览加载失败，请使用下方按钮直接打开地图导航。");
      }
    }, 3800);
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
    }, 5800);
  }

  function init() {
    updateCountdown();
    setInterval(updateCountdown, 1000);

    createFilmFrames();
    startFilmMarquee();
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
    document.addEventListener("touchstart", tryAutoMusic, { passive: true });

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
