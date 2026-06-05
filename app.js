const state = {
  streak: 0,
lastStudyDate: null,
  words: [],
  filtered: [],
  index: 0,
  level: "All",
  search: "",
  flipped: false,
  currentAudio: null,
  audioRequestId: 0,
  favorites: new Set(),
  showFavorites: false,
  difficultWords: new Set(),
  showDifficult: false,
  learnedWords: new Set(),
  sessionTarget: 20,
  sessionReviewed: new Set(),
  sessionLearned: new Set(),
  sessionDifficult: new Set(),
};

const elements = {
  count: document.querySelector("#card-count"),
  themeToggle: document.querySelector("#theme-toggle"),
  searchInput: document.querySelector("#search-input"),
  levelTabs: document.querySelector("#level-tabs"),
  flashcard: document.querySelector("#flashcard"),
  emptyState: document.querySelector("#empty-state"),
  frontLevel: document.querySelector("#front-level"),
  frontWord: document.querySelector("#front-word"),
  frontIpa: document.querySelector("#front-ipa"),
  favoriteButton: document.querySelector("#favorite-button"),
  favoriteFilterButton: document.querySelector("#favorite-filter-button"),
  favoriteCount: document.querySelector("#favorite-count"),
  difficultButton: document.querySelector("#difficult-button"),
  difficultButtonLabel: document.querySelector("#difficult-button-label"),
  difficultFilterButton: document.querySelector("#difficult-filter-button"),
  difficultCount: document.querySelector("#difficult-count"),
  learnedButton: document.querySelector("#learned-button"),
  learnedButtonLabel: document.querySelector("#learned-button-label"),
  learnedCount: document.querySelector("#learned-count"),
  remainingCount: document.querySelector("#remaining-count"),
  progressPercent: document.querySelector("#progress-percent"),
  progressMeter: document.querySelector(".progress-meter"),
  progressFill: document.querySelector("#progress-fill"),
  targetOptions: document.querySelector("#target-options"),
  sessionTargetStatus: document.querySelector("#session-target-status"),
  sessionReviewedCount: document.querySelector("#session-reviewed-count"),
  sessionLearnedCount: document.querySelector("#session-learned-count"),
  sessionDifficultCount: document.querySelector("#session-difficult-count"),
  sessionMeter: document.querySelector(".session-meter"),
  sessionProgressFill: document.querySelector("#session-progress-fill"),
  resetSessionButton: document.querySelector("#reset-session-button"),
  dailyStreak: document.querySelector("#daily-streak"),
  speakerButton: document.querySelector("#speaker-button"),
  audioStatus: document.querySelector("#audio-status"),
  backMeaning: document.querySelector("#back-meaning"),
  backDefinition: document.querySelector("#back-definition"),
  backExampleEn: document.querySelector("#back-example-en"),
  backExampleVi: document.querySelector("#back-example-vi"),
  prevButton: document.querySelector("#prev-button"),
  nextButton: document.querySelector("#next-button"),
  randomButton: document.querySelector("#random-button"),
};

const AUDIO_FOLDERS = ["audio/", "media/", ""];
const FAVORITES_STORAGE_KEY = "oxford3000:favorites";
const DIFFICULT_STORAGE_KEY = "oxford3000:difficult";
const LEARNED_STORAGE_KEY = "oxford3000:learned";
const SESSION_STORAGE_KEY = "oxford3000:session";

function restoreTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", savedTheme ? savedTheme === "dark" : prefersDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

function loadFavorites() {
  try {
    const savedFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    state.favorites = new Set(savedFavorites.map(String));
  } catch (_) {
    state.favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...state.favorites]));
}

function loadDifficultWords() {
  try {
    const savedDifficultWords = JSON.parse(localStorage.getItem(DIFFICULT_STORAGE_KEY) || "[]");
    state.difficultWords = new Set(savedDifficultWords.map(String));
  } catch (_) {
    state.difficultWords = new Set();
  }
}

function saveDifficultWords() {
  localStorage.setItem(DIFFICULT_STORAGE_KEY, JSON.stringify([...state.difficultWords]));
}

function loadLearnedWords() {
  try {
    const savedLearnedWords = JSON.parse(localStorage.getItem(LEARNED_STORAGE_KEY) || "[]");
    state.learnedWords = new Set(savedLearnedWords.map(String));
  } catch (_) {
    state.learnedWords = new Set();
  }
}

function saveLearnedWords() {
  localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify([...state.learnedWords]));
}

function loadSession() {
  try {
    const savedSession = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "{}");
    state.sessionTarget = [10, 20, 50, 100].includes(savedSession.target) ? savedSession.target : 20;
    state.sessionReviewed = new Set((savedSession.reviewed || []).map(String));
    state.sessionLearned = new Set((savedSession.learned || []).map(String));
    state.sessionDifficult = new Set((savedSession.difficult || []).map(String));

    state.streak = savedSession.streak || 0;
    state.lastStudyDate = savedSession.lastStudyDate || null;
  } catch (_) {
    state.sessionTarget = 20;
    state.sessionReviewed = new Set();
    state.sessionLearned = new Set();
    state.sessionDifficult = new Set();
    state.streak = 0;
    state.lastStudyDate = null;
  }
}

function saveSession() {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      target: state.sessionTarget,
      reviewed: [...state.sessionReviewed],
      learned: [...state.sessionLearned],
      difficult: [...state.sessionDifficult],
      streak: state.streak,
      lastStudyDate: state.lastStudyDate
    })
  );
}
function favoriteKey(word) {
  return String(word.id);
}

function isFavorite(word) {
  return Boolean(word && state.favorites.has(favoriteKey(word)));
}

function isDifficult(word) {
  return Boolean(word && state.difficultWords.has(favoriteKey(word)));
}

function isLearned(word) {
  return Boolean(word && state.learnedWords.has(favoriteKey(word)));
}

function searchableText(word) {
  return [
    word.word,
    word.pos,
    word.ipa,
    word.meaning_vi,
    word.definition_en,
    word.example_en,
    word.example_vi,
    word.level,
  ]
    .join(" ")
    .toLowerCase();
}

function applyFilters() {
  const query = state.search.trim().toLowerCase();

  state.filtered = state.words.filter((word) => {
  const levelMatches =
  state.level === "All" ||
  word.level.includes(state.level);
    const searchMatches = !query || searchableText(word).includes(query);
    const favoriteMatches = !state.showFavorites || isFavorite(word);
    const difficultMatches = !state.showDifficult || isDifficult(word);
    return levelMatches && searchMatches && favoriteMatches && difficultMatches;
  });

  state.index = 0;
  state.flipped = false;
  render();
}

function currentWord() {
  return state.filtered[state.index];
}

function setHtml(element, value) {
  element.innerHTML = value || "";
}

function stripHtml(value) {
  const container = document.createElement("span");
  container.innerHTML = value || "";
  return container.textContent || container.innerText || "";
}

function resetAudioUi() {
  elements.speakerButton.classList.remove("loading", "error");
  elements.speakerButton.disabled = false;
  elements.audioStatus.textContent = "";
  elements.audioStatus.classList.remove("error");
}

function updateFavoriteUi(word) {
  const favorited = isFavorite(word);
  elements.favoriteButton.classList.toggle("active", favorited);
  elements.favoriteButton.setAttribute("aria-pressed", String(favorited));
  elements.favoriteButton.setAttribute("aria-label", favorited ? "Remove from favorites" : "Add to favorites");
}

function updateFavoriteFilterUi() {
  elements.favoriteCount.textContent = String(state.favorites.size);
  elements.favoriteFilterButton.classList.toggle("active", state.showFavorites);
  elements.favoriteFilterButton.setAttribute("aria-pressed", String(state.showFavorites));
}

function updateDifficultUi(word) {
  const difficult = isDifficult(word);
  elements.difficultButton.classList.toggle("active", difficult);
  elements.difficultButton.setAttribute("aria-pressed", String(difficult));
  elements.difficultButtonLabel.textContent = difficult ? "Marked Difficult" : "Mark as Difficult";
}

function updateDifficultFilterUi() {
  elements.difficultCount.textContent = String(state.difficultWords.size);
  elements.difficultFilterButton.classList.toggle("active", state.showDifficult);
  elements.difficultFilterButton.setAttribute("aria-pressed", String(state.showDifficult));
}

function updateLearnedUi(word) {
  const learned = isLearned(word);
  elements.learnedButton.classList.toggle("active", learned);
  elements.learnedButton.setAttribute("aria-pressed", String(learned));
  elements.learnedButtonLabel.textContent = learned ? "Learned" : "Mark as Learned";
}

function updateProgressUi() {
  const total = state.words.length;
  const learned = state.learnedWords.size;
  const remaining = Math.max(total - learned, 0);
  const percentage = total ? Math.round((learned / total) * 100) : 0;

  elements.learnedCount.textContent = String(learned);
  elements.remainingCount.textContent = String(remaining);
  elements.progressPercent.textContent = `${percentage}%`;
  elements.progressMeter.setAttribute("aria-valuenow", String(percentage));
  elements.progressFill.style.width = `${percentage}%`;
}

function updateSessionUi() {
  const reviewed = state.sessionReviewed.size;
  const learned = state.sessionLearned.size;
  const difficult = state.sessionDifficult.size;
  const percentage = state.sessionTarget ? Math.min(Math.round((reviewed / state.sessionTarget) * 100), 100) : 0;

  elements.sessionTargetStatus.textContent = `${reviewed} / ${state.sessionTarget} completed`;
  elements.sessionReviewedCount.textContent = String(reviewed);
  elements.sessionLearnedCount.textContent = String(learned);
  elements.sessionDifficultCount.textContent = String(difficult);
  elements.sessionMeter.setAttribute("aria-valuenow", String(percentage));
  elements.sessionProgressFill.style.width = `${percentage}%`;

  document.querySelectorAll(".target-option").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.target) === state.sessionTarget);
  });
}

function markSessionReviewed(word) {
  if (!word) {
    return;
  }

  const key = favoriteKey(word);
  if (!state.sessionReviewed.has(key)) {
    state.sessionReviewed.add(key);
    saveSession();
  }
}

function setAudioStatus(message, type = "idle") {
  elements.audioStatus.textContent = message;
  elements.audioStatus.classList.toggle("error", type === "error");
  elements.speakerButton.classList.toggle("loading", type === "loading");
  elements.speakerButton.classList.toggle("error", type === "error");
  elements.speakerButton.disabled = type === "loading";
}

function stopCurrentAudio() {
  state.audioRequestId += 1;

  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.currentTime = 0;
    state.currentAudio = null;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function renderCount() {
  if (!state.words.length) {
    elements.count.textContent = "Loading...";
    return;
  }

  if (!state.filtered.length) {
    elements.count.textContent = `0 of ${state.words.length} words`;
    return;
  }

  elements.count.textContent = `${state.index + 1} of ${state.filtered.length} words`;
}

function render() {
  const word = currentWord();
  const hasWord = Boolean(word);

  stopCurrentAudio();
  resetAudioUi();
  elements.flashcard.hidden = !hasWord;
  elements.emptyState.hidden = hasWord;
  elements.prevButton.disabled = !hasWord;
  elements.nextButton.disabled = !hasWord;
  elements.randomButton.disabled = !hasWord;
  elements.favoriteButton.disabled = !hasWord;
  elements.difficultButton.disabled = !hasWord;
  elements.learnedButton.disabled = !hasWord;
  elements.flashcard.classList.toggle("flipped", state.flipped);
  updateFavoriteFilterUi();
  updateDifficultFilterUi();
  updateProgressUi();
  updateSessionUi();
  renderCount();

  if (!word) {
    return;
  }

  markSessionReviewed(word);
  updateSessionUi();
  setHtml(elements.frontLevel, word.level);
  setHtml(elements.frontWord, word.word);
  setHtml(elements.frontIpa, word.ipa);
  setHtml(elements.backMeaning, word.meaning_vi);
  setHtml(elements.backDefinition, word.definition_en);
  setHtml(elements.backExampleEn, word.example_en);
  setHtml(elements.backExampleVi, word.example_vi);
  updateFavoriteUi(word);
  updateDifficultUi(word);
  updateLearnedUi(word);
}

function move(delta) {
  if (!state.filtered.length) {
    return;
  }

  state.index = (state.index + delta + state.filtered.length) % state.filtered.length;
  state.flipped = false;
  render();
}

function audioSources(filename) {
  if (!filename) {
    return [];
  }

  return AUDIO_FOLDERS.map((folder) => `${folder}${encodeURIComponent(filename)}`);
}

function playAudioSource(src, requestId) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    let settled = false;
    const timeout = window.setTimeout(() => rejectOnce(new Error("Audio loading timed out")), 3500);

    function cleanup() {
      window.clearTimeout(timeout);
      audio.removeEventListener("canplaythrough", play);
      audio.removeEventListener("canplay", play);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
    }

    function rejectOnce(error) {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    }

    async function play() {
      if (settled || requestId !== state.audioRequestId) {
        return;
      }

      try {
        await audio.play();
        settled = true;
        cleanup();
        state.currentAudio = audio;
        audio.addEventListener("ended", onEnded, { once: true });
        resolve();
      } catch (error) {
        rejectOnce(error);
      }
    }

    function onError() {
      rejectOnce(new Error("Audio file is missing or unavailable"));
    }

    function onEnded() {
      if (requestId === state.audioRequestId) {
        resetAudioUi();
      }
    }

    audio.preload = "auto";
    audio.addEventListener("canplaythrough", play, { once: true });
    audio.addEventListener("canplay", play, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

async function playLocalAudio(word, requestId) {
  const sources = audioSources(word.audio);

  for (const source of sources) {
    if (requestId !== state.audioRequestId) {
      return true;
    }

    try {
      await playAudioSource(source, requestId);
      return true;
    } catch (_) {
      // Try the next likely local media location before falling back to speech.
    }
  }

  return false;
}

function speakWithBrowser(word, requestId) {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      reject(new Error("Web Speech API is not available in this browser"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(stripHtml(word.word));
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    utterance.onend = () => {
      if (requestId === state.audioRequestId) {
        resetAudioUi();
      }
      resolve();
    };

    utterance.onerror = () => {
      reject(new Error("Pronunciation playback failed"));
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

async function playPronunciation(event) {
  event.stopPropagation();

  const word = currentWord();
  if (!word) {
    return;
  }

  stopCurrentAudio();
  const requestId = state.audioRequestId;
  setAudioStatus("Loading pronunciation...", "loading");

  try {
    const playedLocalAudio = await playLocalAudio(word, requestId);

    if (requestId !== state.audioRequestId) {
      return;
    }

    if (playedLocalAudio) {
      elements.speakerButton.disabled = false;
      elements.speakerButton.classList.remove("loading", "error");
      elements.audioStatus.textContent = "";
      return;
    }

    setAudioStatus("Using browser voice...", "loading");
    await speakWithBrowser(word, requestId);
  } catch (error) {
    if (requestId !== state.audioRequestId) {
      return;
    }

    setAudioStatus(error.message || "Pronunciation unavailable", "error");
    elements.speakerButton.disabled = false;
  }
}

function toggleFavorite(event) {
  event.stopPropagation();

  const word = currentWord();
  if (!word) {
    return;
  }

  const key = favoriteKey(word);
  if (state.favorites.has(key)) {
    state.favorites.delete(key);
  } else {
    state.favorites.add(key);
  }

  saveFavorites();

  if (state.showFavorites && !state.favorites.has(key)) {
    applyFilters();
    return;
  }

  updateFavoriteUi(word);
  updateFavoriteFilterUi();
}

function toggleFavoriteFilter() {
  state.showFavorites = !state.showFavorites;
  applyFilters();
}

function toggleDifficult(event) {
  event.stopPropagation();

  const word = currentWord();
  if (!word) {
    return;
  }

  const key = favoriteKey(word);
  if (state.difficultWords.has(key)) {
    state.difficultWords.delete(key);
    state.sessionDifficult.delete(key);
  } else {
    state.difficultWords.add(key);
    state.sessionDifficult.add(key);
  }

  saveDifficultWords();
  saveSession();

  if (state.showDifficult && !state.difficultWords.has(key)) {
    applyFilters();
    return;
  }

  updateDifficultUi(word);
  updateDifficultFilterUi();
  updateSessionUi();
}

function toggleDifficultFilter() {
  state.showDifficult = !state.showDifficult;
  applyFilters();
}

function updateDailyStreak() {
  const today = new Date().toISOString().split("T")[0];

  if (!state.lastStudyDate) {
    state.streak = 1;
    state.lastStudyDate = today;
  } else {
    const last = new Date(state.lastStudyDate);
    const now = new Date(today);

    const diffDays = Math.floor(
      (now - last) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      state.streak += 1;
      state.lastStudyDate = today;
    } else if (diffDays > 1) {
      state.streak = 1;
      state.lastStudyDate = today;
    }
  }

  localStorage.setItem("dailyStreak", state.streak);
  localStorage.setItem("lastStudyDate", state.lastStudyDate);

  updateStreakUi();
}

function updateStreakUi() {
  const streakElement = document.querySelector("#daily-streak");

  if (streakElement) {
    streakElement.textContent =
      `🔥 ${state.streak} Day Streak`;
  }
}
function toggleLearned(event) {
  event.stopPropagation();

  const word = currentWord();
  if (!word) {
    return;
  }

  const key = favoriteKey(word);
  if (state.learnedWords.has(key)) {
    state.learnedWords.delete(key);
    state.sessionLearned.delete(key);
  } else {
    state.learnedWords.add(key);
    state.sessionLearned.add(key);

  }

  saveLearnedWords();
  saveSession();
  
  updateDailyStreak();
  
  updateLearnedUi(word);
  updateProgressUi();
  updateSessionUi();
}

function setSessionTarget(event) {
  const button = event.target.closest("[data-target]");
  if (!button) {
    return;
  }

  state.sessionTarget = Number(button.dataset.target);
  saveSession();
  updateSessionUi();
}

function resetSession() {
  state.sessionReviewed.clear();
  state.sessionLearned.clear();
  state.sessionDifficult.clear();
  saveSession();
  updateSessionUi();
}

function randomCard() {
  if (state.filtered.length < 2) {
    return;
  }

  let nextIndex = state.index;
  while (nextIndex === state.index) {
    nextIndex = Math.floor(Math.random() * state.filtered.length);
  }
  state.index = nextIndex;
  state.flipped = false;
  render();
}

async function loadWords(deckFile = "oxford3000") {
  try {

    const response = await fetch(`decks/${deckFile}.json`);

    if (!response.ok) {
      throw new Error(`Could not load ${deckFile}.json: ${response.status}`);
    }

    state.words = await response.json();
    state.filtered = [...state.words];

    state.index = 0;
    state.flipped = false;

    render();

  } catch (error) {

    elements.count.textContent = "Could not load deck";
    elements.flashcard.hidden = true;
    elements.emptyState.hidden = false;
    elements.emptyState.querySelector("h2").textContent = "Data unavailable";
    elements.emptyState.querySelector("p").textContent = error.message;

  }
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.flashcard.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    state.flipped = !state.flipped;
    render();
  });

  elements.speakerButton.addEventListener("click", playPronunciation);
  elements.favoriteButton.addEventListener("click", toggleFavorite);
  elements.favoriteFilterButton.addEventListener("click", toggleFavoriteFilter);
  elements.difficultButton.addEventListener("click", toggleDifficult);
  elements.difficultFilterButton.addEventListener("click", toggleDifficultFilter);
  elements.learnedButton.addEventListener("click", toggleLearned);
  elements.targetOptions.addEventListener("click", setSessionTarget);
  elements.resetSessionButton.addEventListener("click", resetSession);

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    applyFilters();
  });
const deckSelect = document.getElementById("deck-select");

if (deckSelect) {
  deckSelect.addEventListener("change", (event) => {
    loadWords(event.target.value);
  });
}
  elements.levelTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-level]");
    if (!button) {
      return;
    }

    state.level = button.dataset.level;
    document.querySelectorAll(".level-tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });
    applyFilters();
  });

  elements.prevButton.addEventListener("click", () => move(-1));
  elements.nextButton.addEventListener("click", () => move(1));
  elements.randomButton.addEventListener("click", randomCard);

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, button")) {
      return;
    }

    if (event.key === "ArrowLeft") {
      move(-1);
    } else if (event.key === "ArrowRight") {
      move(1);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      state.flipped = !state.flipped;
      render();
    }
  });
}

restoreTheme();
loadFavorites();
loadDifficultWords();
loadLearnedWords();
loadSession();
updateDailyStreak();
bindEvents();
loadWords();
