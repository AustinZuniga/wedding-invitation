const revealElements = document.querySelectorAll(".reveal");
const themedSections = Array.from(document.querySelectorAll("[data-theme]"));
const themeClasses = Array.from(
  new Set(themedSections.map((section) => `theme-${section.dataset.theme}`))
);
const pageBody = document.body;
const bgCurrentLayer = document.querySelector(".bg-current");
const bgNextLayer = document.querySelector(".bg-next");

const themeImages = {
  hero: "https://images.unsplash.com/photo-1680090966824-eb9e8500bc2b?auto=format&fit=crop&w=2400&q=80",
  details:
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2400&q=80",
  location:
    "https://images.unsplash.com/photo-1670529774543-98dd1e0f84d1?auto=format&fit=crop&w=2400&q=80",
  program: "https://images.unsplash.com/photo-1719004132644-10be4ae045d5?auto=format&fit=crop&w=2400&q=80",
  rsvp: "https://images.unsplash.com/photo-1764010729975-969e3c99e2c0?auto=format&fit=crop&w=2400&q=80"
};

let activeLayer = bgCurrentLayer;
let standbyLayer = bgNextLayer;
let activeBackgroundUrl = "";

const updatePhotoBackground = (themeName, immediate = false) => {
  const nextUrl = themeImages[themeName] || themeImages.hero;
  if (!nextUrl || !activeLayer || !standbyLayer) return;
  if (nextUrl === activeBackgroundUrl) return;

  standbyLayer.style.backgroundImage = `url("${nextUrl}")`;
  standbyLayer.classList.add("visible");

  if (!immediate) {
    activeLayer.classList.remove("visible");
  }

  const previousActive = activeLayer;
  activeLayer = standbyLayer;
  standbyLayer = previousActive;

  if (immediate) {
    standbyLayer.classList.remove("visible");
  } else {
    window.setTimeout(() => {
      standbyLayer.classList.remove("visible");
      standbyLayer.style.backgroundImage = "";
    }, 1000);
  }

  activeBackgroundUrl = nextUrl;
};

const setTheme = (themeName, options = {}) => {
  if (!themeName) return;
  pageBody.classList.remove(...themeClasses);
  pageBody.classList.add(`theme-${themeName}`);
  updatePhotoBackground(themeName, options.immediate === true);
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  if (themedSections.length > 0) {
    const themeVisibility = new Map();
    const themeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const themeName = entry.target.dataset.theme;
          if (!themeName) return;

          if (entry.isIntersecting) {
            themeVisibility.set(themeName, entry.intersectionRatio);
          } else {
            themeVisibility.delete(themeName);
          }
        });

        if (themeVisibility.size === 0) return;
        const [nextTheme] = [...themeVisibility.entries()].sort((a, b) => b[1] - a[1])[0];
        setTheme(nextTheme);
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8]
      }
    );

    themedSections.forEach((section) => themeObserver.observe(section));
    setTheme(themedSections[0].dataset.theme, { immediate: true });
  }
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
  if (themedSections.length > 0) {
    setTheme(themedSections[0].dataset.theme, { immediate: true });
  }
}

const rsvpForm = document.getElementById("rsvpForm");
const rsvpOutput = document.getElementById("rsvpOutput");
const rsvpPreview = document.getElementById("rsvpPreview");
const copyBtn = document.getElementById("copyBtn");
const emailBtn = document.getElementById("emailBtn");
const musicToggle = document.getElementById("musicToggle");
const bgMusic = document.getElementById("bgMusic");
const autoScrollHint = document.getElementById("autoScrollHint");
const introOverlay = document.getElementById("introOverlay");
const introOpenBtn = document.getElementById("introOpenBtn");
const RSVP_RECEIVER_EMAIL = "earlaustinavilazuniga@gmail.com";

let latestMessage = "";
const AUTO_SCROLL_MS = 9000;
const AUTO_SCROLL_RESUME_MS = 12000;
const AUTO_SCROLL_MIN_ANIMATION_MS = 2600;
const AUTO_SCROLL_MAX_ANIMATION_MS = 7000;
const AUTO_SCROLL_PX_PER_SECOND = 480;
const INTRO_UNWRAP_MS = 1200;
const INTRO_DISAPPEAR_DELAY_MS = 1500;

let autoScrollIntervalId = null;
let autoScrollResumeTimeoutId = null;
let autoScrollAnimationId = null;
let autoScrollInProgress = false;

const setAutoScrollHintState = (isPaused) => {
  if (!autoScrollHint) return;
  autoScrollHint.classList.toggle("paused", isPaused);
  autoScrollHint.innerHTML = isPaused
    ? '<span class="auto-scroll-dot"></span>Auto-scroll paused (resumes in 12s)'
    : '<span class="auto-scroll-dot"></span>Auto-scroll on (every 9s)';
};

const getClosestSectionIndex = () => {
  if (themedSections.length === 0) return 0;

  const viewportMiddle = window.scrollY + window.innerHeight / 2;
  let bestIndex = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;

  themedSections.forEach((section, index) => {
    const sectionCenter = section.offsetTop + section.offsetHeight / 2;
    const distance = Math.abs(viewportMiddle - sectionCenter);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const smoothScrollToY = (targetY, duration) =>
  new Promise((resolve) => {
    if (autoScrollAnimationId) {
      window.cancelAnimationFrame(autoScrollAnimationId);
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();

    const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutSine(progress);

      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        autoScrollAnimationId = window.requestAnimationFrame(animate);
        return;
      }

      autoScrollAnimationId = null;
      resolve();
    };

    autoScrollAnimationId = window.requestAnimationFrame(animate);
  });

const startAutoScroll = () => {
  if (pageBody.classList.contains("intro-locked")) return;
  if (themedSections.length < 2 || autoScrollIntervalId) return;
  setAutoScrollHintState(false);

  autoScrollIntervalId = window.setInterval(() => {
    if (autoScrollInProgress) return;

    const currentIndex = getClosestSectionIndex();
    const nextIndex = (currentIndex + 1) % themedSections.length;
    const nextTop = themedSections[nextIndex].offsetTop;
    const distance = Math.abs(nextTop - window.scrollY);
    const estimatedDuration = (distance / AUTO_SCROLL_PX_PER_SECOND) * 1000;
    const animationDuration = Math.max(
      AUTO_SCROLL_MIN_ANIMATION_MS,
      Math.min(AUTO_SCROLL_MAX_ANIMATION_MS, estimatedDuration)
    );

    autoScrollInProgress = true;
    void smoothScrollToY(nextTop, animationDuration).finally(() => {
      autoScrollInProgress = false;
    });
  }, AUTO_SCROLL_MS);
};

const stopAutoScroll = () => {
  if (!autoScrollIntervalId) return;
  window.clearInterval(autoScrollIntervalId);
  autoScrollIntervalId = null;
};

const pauseAutoScrollTemporarily = () => {
  if (pageBody.classList.contains("intro-locked")) return;
  stopAutoScroll();
  setAutoScrollHintState(true);

  if (autoScrollResumeTimeoutId) {
    window.clearTimeout(autoScrollResumeTimeoutId);
  }

  autoScrollResumeTimeoutId = window.setTimeout(() => {
    startAutoScroll();
  }, AUTO_SCROLL_RESUME_MS);
};

const finishIntroOpening = () => {
  pageBody.classList.remove("intro-locked", "intro-opening");
  pageBody.classList.add("intro-opened");
  startAutoScroll();
};

if (introOpenBtn && introOverlay) {
  introOpenBtn.addEventListener("click", async () => {
    if (pageBody.classList.contains("intro-opening")) return;

    pageBody.classList.add("intro-opening");
    introOpenBtn.disabled = true;

    if (bgMusic) {
      try {
        bgMusic.muted = false;
        await bgMusic.play();
      } catch (_error) {
        // Autoplay restrictions may still apply; regular handlers will continue retries.
      }
    }

    window.setTimeout(() => {
      finishIntroOpening();
    }, INTRO_UNWRAP_MS + INTRO_DISAPPEAR_DELAY_MS);
  });
}

if (rsvpForm) {
  rsvpForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const guestName = document.getElementById("guestName").value.trim();
    const attendance = document.getElementById("attendance").value;
    const message = document.getElementById("message").value.trim();

    latestMessage = [
      "Wedding RSVP",
      "",
      `Name: ${guestName}`,
      `Attendance: ${attendance}`,
      `Message: ${message || "N/A"}`
    ].join("\n");

    rsvpPreview.textContent = latestMessage;
    rsvpOutput.hidden = false;

    const subject = encodeURIComponent(`RSVP | ${guestName}`);
    const body = encodeURIComponent(latestMessage);
    emailBtn.href = `mailto:${RSVP_RECEIVER_EMAIL}?subject=${subject}&body=${body}`;
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!latestMessage) return;

    try {
      await navigator.clipboard.writeText(latestMessage);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy Message";
      }, 1200);
    } catch (_error) {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => {
        copyBtn.textContent = "Copy Message";
      }, 1200);
    }
  });
}

if (musicToggle && bgMusic) {
  bgMusic.volume = 0.35;
  let awaitingGestureToStart = false;
  let mutedAutoplayActive = false;
  let unlockHandler = null;
  let autoStartAttempted = false;
  let userPausedMusic = false;
  let autoStartRetryTimeoutId = null;

  const setMusicUiState = (isPlaying) => {
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    if (!isPlaying && !awaitingGestureToStart) {
      musicToggle.textContent = "Play Wedding Song";
      return;
    }
    if (awaitingGestureToStart) {
      musicToggle.textContent = "Tap To Start Music";
      return;
    }
    if (mutedAutoplayActive) {
      musicToggle.textContent = "Tap To Unmute Music";
      return;
    }
    musicToggle.textContent = isPlaying ? "Pause Wedding Song" : "Play Wedding Song";
  };

  const tryPlayTrack = async () => {
    try {
      await bgMusic.play();
      mutedAutoplayActive = bgMusic.muted;
      awaitingGestureToStart = false;
      setMusicUiState(true);
      return true;
    } catch (_error) {
      return false;
    }
  };

  const tryUnmuteAutoStartedTrack = async () => {
    if (bgMusic.paused || !bgMusic.muted) return false;
    try {
      bgMusic.muted = false;
      await bgMusic.play();
      mutedAutoplayActive = false;
      setMusicUiState(true);
      return true;
    } catch (_error) {
      bgMusic.muted = true;
      mutedAutoplayActive = true;
      setMusicUiState(true);
      return false;
    }
  };

  const scheduleAutoStartRetry = () => {
    if (userPausedMusic) return;
    if (autoStartRetryTimeoutId) {
      window.clearTimeout(autoStartRetryTimeoutId);
    }
    autoStartRetryTimeoutId = window.setTimeout(() => {
      autoStartAttempted = false;
      void autoStartMusicOnVisit();
    }, 1400);
  };

  const unlockOnFirstGesture = () => {
    if (!awaitingGestureToStart && !mutedAutoplayActive) return;
    if (unlockHandler) return;

    const cleanupUnlockListeners = () => {
      if (!unlockHandler) return;
      ["pointerdown", "touchstart", "keydown"].forEach((evtName) => {
        window.removeEventListener(evtName, unlockHandler);
      });
      unlockHandler = null;
    };

    unlockHandler = async () => {
      cleanupUnlockListeners();

      if (mutedAutoplayActive && !bgMusic.paused) {
        bgMusic.muted = false;
        bgMusic.volume = 0.35;
        mutedAutoplayActive = false;
        awaitingGestureToStart = false;
        setMusicUiState(true);
        return;
      }

      awaitingGestureToStart = false;
      const trackStarted = await tryPlayTrack();
      if (!trackStarted) {
        awaitingGestureToStart = true;
        setMusicUiState(false);
        unlockOnFirstGesture();
      }
      setMusicUiState(!bgMusic.paused);
    };

    ["pointerdown", "touchstart", "keydown"].forEach((evtName) => {
      window.addEventListener(evtName, unlockHandler, { passive: true });
    });
  };

  const autoStartMusicOnVisit = async () => {
    if (userPausedMusic) return;
    if (autoStartAttempted) return;
    autoStartAttempted = true;

    bgMusic.currentTime = 0;
    bgMusic.muted = false;
    const playedAudible = await tryPlayTrack();
    if (playedAudible) return;

    bgMusic.muted = true;
    const playedMuted = await tryPlayTrack();
    if (playedMuted) {
      mutedAutoplayActive = true;
      setMusicUiState(true);
      unlockOnFirstGesture();
      window.setTimeout(() => {
        void tryUnmuteAutoStartedTrack();
      }, 300);
      scheduleAutoStartRetry();
      return;
    }

    awaitingGestureToStart = true;
    setMusicUiState(false);
    unlockOnFirstGesture();
    scheduleAutoStartRetry();
  };

  musicToggle.addEventListener("click", async () => {
    if (mutedAutoplayActive && !bgMusic.paused) {
      bgMusic.muted = false;
      bgMusic.volume = 0.35;
      mutedAutoplayActive = false;
      awaitingGestureToStart = false;
      userPausedMusic = false;
      setMusicUiState(true);
      return;
    }

    const nativeTrackPlaying = !bgMusic.paused && !bgMusic.ended;

    if (nativeTrackPlaying) {
      bgMusic.pause();
      userPausedMusic = true;
      mutedAutoplayActive = false;
      awaitingGestureToStart = false;
      setMusicUiState(false);
      return;
    }

    userPausedMusic = false;
    awaitingGestureToStart = false;
    const trackStarted = await tryPlayTrack();
    if (!trackStarted) {
      awaitingGestureToStart = true;
      setMusicUiState(false);
      unlockOnFirstGesture();
      scheduleAutoStartRetry();
    }
  });

  bgMusic.addEventListener("play", () => setMusicUiState(true));
  bgMusic.addEventListener("pause", () => {
    setMusicUiState(false);
  });
  bgMusic.addEventListener("error", () => {
    autoStartAttempted = false;
    awaitingGestureToStart = true;
    mutedAutoplayActive = false;
    setMusicUiState(false);
    unlockOnFirstGesture();
    scheduleAutoStartRetry();
  });

  bgMusic.addEventListener("canplaythrough", () => {
    if (!userPausedMusic && bgMusic.paused) {
      autoStartAttempted = false;
      void autoStartMusicOnVisit();
      return;
    }
    if (!userPausedMusic) {
      void tryUnmuteAutoStartedTrack();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden || userPausedMusic) return;
    if (bgMusic.paused) {
      autoStartAttempted = false;
      void autoStartMusicOnVisit();
      return;
    }
    void tryUnmuteAutoStartedTrack();
  });

  window.addEventListener("pageshow", () => {
    if (userPausedMusic) return;
    if (bgMusic.paused) {
      autoStartAttempted = false;
      void autoStartMusicOnVisit();
    }
  });

  void autoStartMusicOnVisit();
  window.addEventListener("load", () => {
    void autoStartMusicOnVisit();
  }, { once: true });
}

window.addEventListener("load", () => {
  if (!pageBody.classList.contains("intro-locked")) {
    startAutoScroll();
  }
});

["wheel", "touchstart", "keydown", "mousedown"].forEach((eventName) => {
  window.addEventListener(eventName, pauseAutoScrollTemporarily, { passive: true });
});
