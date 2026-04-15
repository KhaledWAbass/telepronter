// DOM selectors
const DOM = {
  color: document.querySelector(".edit .color input"),
  font: document.querySelector(".edit .fonts input"),
  create: document.querySelector(".create"),
  cards: document.querySelector(".cards"),
  clear: document.querySelector(".edit button"),
  fontBtn: document.querySelector(".edit div.fonts div.sup1"),
  bacBtn: document.querySelector(".edit div.backgroundColor div.sup1"),
  backgroundColorOpacityBtn: document.querySelector(
    ".edit div.background-opacity div.sup1",
  ),
  exit: document.querySelector(".exit"),
  colorBtn: document.querySelector(".edit div.color div"),
  speedInput: document.querySelector(".edit div.speed input"),
  textarea: document.querySelector("textarea"),
  saveBtn: document.querySelector(".two .save .twos"),
  titleInput: document.querySelector(".bar input"),
  video: document.querySelector(".video"),
  scriptDiv: document.querySelector(".bac-script div"),
  BackscriptDiv: document.querySelector(".bac-script"),
  scriptContainer: document.querySelector(".bac-script"),
  backgroundColor: document.querySelector(".edit .backgroundColor input"),
  backgroundColorOpacity: document.querySelector(
    ".edit .background-opacity input",
  ),
};

const params = new URLSearchParams(window.location.search);
let scriptArr = [];
let scrollAnimationId = null;

// Initialize application
if (DOM.titleInput) DOM.titleInput.value = "title";
if (localStorage.getItem("Storage")) {
  scriptArr = JSON.parse(localStorage.getItem("Storage"));
}
getScripts();

// Event listeners
DOM.create?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location = "html/writing.html";
});
DOM.bacBtn?.addEventListener("click", () => {
  if (DOM.textarea && DOM.backgroundColor) {
    DOM.textarea.style.backgroundColor = DOM.backgroundColor.value;
  }
});

DOM.fontBtn?.addEventListener("click", () => {
  const value = Number(DOM.font.value);
  DOM.textarea.style.fontSize = `${value}px`;
});

DOM.colorBtn?.addEventListener("click", () => {
  DOM.textarea.style.color = DOM.color.value;
});

DOM.clear?.addEventListener("click", (e) => {
  e.preventDefault();
  DOM.textarea.value = "";
});

DOM.backgroundColorOpacityBtn?.addEventListener("click", () => {
  if (DOM.textarea && DOM.backgroundColorOpacity) {
    DOM.textarea.style.opacity = DOM.backgroundColorOpacity.value;
  }
});

DOM.saveBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (!DOM.textarea?.value.trim()) {
    alert("Please enter your script");
    return;
  }
  saveScript(
    DOM.textarea.value,
    DOM.titleInput,
    DOM.color?.value || "white",
    DOM.font?.value || 24,
    DOM.speedInput?.value || 0.5,
    DOM.backgroundColor?.value || "black",
    DOM.backgroundColorOpacity?.value || 0.5,
  );
  window.location = "../index.html";
});

DOM.exit?.addEventListener("click", () => {
  window.location = "../index.html";
});

// Functions
/**
 * Save a new script with all properties
 */
function saveScript(
  text,
  titleEl,
  color,
  font,
  speed,
  backgroundColor,
  backgroundColorOpacity,
) {
  const script = {
    id: Date.now(),
    text,
    title: titleEl.value,
    color,
    font,
    speed,
    backgroundColor,
    backgroundColorOpacity,
  };
  scriptArr.push(script);
  save(scriptArr);
}

/**
 * Save data to localStorage
 */
function save(data) {
  try {
    localStorage.setItem("Storage", JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Retrieve scripts from localStorage
 */
function getScripts() {
  try {
    const data = localStorage.getItem("Storage");
    if (data) showData(JSON.parse(data));
  } catch (error) {
    console.error("Error retrieving scripts:", error);
  }
}

/**
 * Display all scripts as cards
 */
function showData(data) {
  if (!DOM.cards) return;
  DOM.cards.innerHTML = "";

  data.forEach((item) => {
    const card = createCard(item);
    DOM.cards.appendChild(card);
  });
}

/**
 * Create a card element for a script
 */
function createCard(item) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("id", item.id);

  card.innerHTML = `
        <div class="edit"><i class="fa-sharp fa-solid fa-file-pen"></i></div>
        <div class="rec"><i class="fa-solid fa-video"></i></div>
        <div class="dele">X</div>
        <div class="title">${item.title}</div>
        <p>${item.text}</p>
    `;

  // Delete button handler
  card.querySelector(".dele")?.addEventListener("click", () => {
    deleteScript(item.id);
    card.remove();
  });

  // Recording button handler
  card.querySelector(".rec")?.addEventListener("click", () => {
    window.location = `/html/record.html?id=${item.id}`;
  });

  // Edit button handler
  card.querySelector(".edit")?.addEventListener("click", () => {
    window.location = `/html/writing.html?id=${item.id}`;
  });

  return card;
}

/**
 * Delete a script from storage
 */
function deleteScript(id) {
  scriptArr = scriptArr.filter((item) => item.id !== id);
  save(scriptArr);
}

// Handle URL parameters to load script data
if (params.get("id")) {
  const scriptId = Number(params.get("id"));
  const script = scriptArr.find((item) => item.id === scriptId);

  if (script) {
    // Load in writing editor
    if (DOM.textarea) {
      DOM.textarea.value = script.text;
      DOM.textarea.style.color = script.color;
      DOM.textarea.style.fontSize = `${script.font}px`;
      if (DOM.font) DOM.font.value = script.font;
      if (DOM.color) DOM.color.value = script.color;
      scriptArr = scriptArr.filter((item) => item.id !== scriptId);
    }

    // Load in recording view
    if (DOM.scriptDiv && DOM.BackscriptDiv) {
      DOM.scriptDiv.textContent = script.text;
      DOM.BackscriptDiv.style.backgroundColor = script.backgroundColor;
      DOM.BackscriptDiv.style.opacity = script.backgroundColorOpacity;
      DOM.scriptDiv.style.color = script.color;
      DOM.scriptDiv.style.fontSize = `${script.font}px`;
    }

    // Initialize recording if video element exists
    if (DOM.video) {
      initializeRecording(script);
    }
  }
}

/**
 * Initialize video recording with camera and audio
 */
function initializeRecording(script) {
  const video = DOM.video;
  const startBtn = document.querySelector(".start");
  const stopBtn = document.querySelector(".stop");
  const downloadBtn = document.querySelector(".download");
  const minSpan = document.querySelector(".min");
  const secSpan = document.querySelector(".sec");

  let mediaRecorder;
  let chunks = [];
  let seconds = 0;
  let timerInterval;

  // Request camera and microphone access
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        sampleRate: 48000,
        channelCount: 1,
      },
    })
    .then((stream) => {
      if (video) {
        video.srcObject = stream;
      }
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const downloadLink = downloadBtn?.querySelector("a");
        if (downloadLink) {
          downloadLink.href = url;
          downloadLink.download = "recording.mp4";
          downloadBtn.removeAttribute("disabled");
        }
      };
    })
    .catch((error) => {
      console.error("Camera/microphone access error:", error);
      alert("Unable to access camera or microphone. Please check permissions.");
    });

  // Start recording button handler
  startBtn?.addEventListener("click", () => {
    chunks = [];
    DOM.scriptContainer?.scrollTo({ top: 0 });

    if (mediaRecorder?.state === "inactive") {
      // Play start sound
      const audioElements = document.querySelectorAll("audio");
      audioElements[0]?.play();

      chunks = [];
      seconds = 0;
      mediaRecorder.start();
      startBtn.setAttribute("disabled", "true");
      stopBtn?.removeAttribute("disabled");

      // Start auto-scrolling script
      if (script.speed && DOM.scriptContainer) {
        smoothScroll(DOM.scriptContainer, Number(script.speed));
      }

      // Start timer
      timerInterval = setInterval(() => {
        seconds++;
        if (minSpan)
          minSpan.textContent = String(Math.floor(seconds / 60)).padStart(
            2,
            "0",
          );
        if (secSpan)
          secSpan.textContent = String(seconds % 60).padStart(2, "0");
      }, 1000);
    }
  });

  // Stop recording button handler
  stopBtn?.addEventListener("click", () => {
    // Play stop sound
    const audioElements = document.querySelectorAll("audio");
    audioElements[1]?.play();

    mediaRecorder?.stop();
    clearInterval(timerInterval);
    startBtn?.removeAttribute("disabled");
    stopBtn?.setAttribute("disabled", "true");

    if (scrollAnimationId) {
      cancelAnimationFrame(scrollAnimationId);
      scrollAnimationId = null;
    }
  });
  /**
   * Smooth scroll animation for script
   */
  function smoothScroll(container, speed) {
    let position = 0;
    const scroll = () => {
      if (position < container.scrollHeight) {
        position += speed;
        container.scrollTo({ top: position, behavior: "smooth" });
        scrollAnimationId = requestAnimationFrame(scroll);
      }
    };
    scrollAnimationId = requestAnimationFrame(scroll);
  }
}
