// DOM selectors
const DOM = {
  color: document.querySelector(".edit .color input"),
  font: document.querySelector(".edit .fonts input"),
  create: document.querySelector(".create"),
  cards: document.querySelector(".cards"),
  clear: document.querySelector(".edit button"),
  fontBtn: document.querySelector(".edit div.fonts div.sup1"),
  exit: document.querySelector(".exit"),
  colorBtn: document.querySelector(".edit div.color div"),
  speedInput: document.querySelector(".edit div.speed input"),
  textarea: document.querySelector("textarea"),
  saveBtn: document.querySelector(".two .save .twos"),
  titleInput: document.querySelector(".bar input"),
  video: document.querySelector(".video"),
  scriptDiv: document.querySelector(".bac-script div"),
  BacScriptDiv: document.querySelector(".bac-script"),
  scriptContainer: document.querySelector(".bac-script"),
  bacgroundColor: document.querySelector(".edit .bacgroundColor input"),
  bacColorOp: document.querySelector(".edit .bac-color-op input"),
};

const params = new URLSearchParams(window.location.search);
let scriptArr = [];

// Initialize
if (DOM.titleInput) DOM.titleInput.value = "title";
if (localStorage.getItem("Storage")) {
  scriptArr = JSON.parse(localStorage.getItem("Storage"));
}
getScripts();

// Event listeners
DOM.create?.addEventListener("click", (e) => {
  e.preventDefault();
  window.location = "html/wrieting.html";
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

DOM.saveBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (DOM.textarea.value.trim() === "") {
    alert("Please enter your script");
  } else {
    saveScript(
      DOM.textarea.value,
      DOM.titleInput,
      DOM.color.value ? DOM.color.value : "white",
      DOM.font.value ? DOM.font.value : 24,
      DOM.speedInput.value ? DOM.speedInput.value : 0.5,
      DOM.bacgroundColor.value ? DOM.bacgroundColor.value : "black",
      DOM.bacColorOp.value ? DOM.bacColorOp.value : 1,
    );
    window.location = "../index.html";
  }
});

DOM.exit?.addEventListener("click", () => {
  window.location = "../index.html";
});

// Functions
function saveScript(
  text,
  titleEl,
  color,
  font,
  speed,
  bacgroundColor,
  bacColorOp,
) {
  const script = {
    id: Date.now(),
    text,
    title: titleEl.value,
    color,
    font,
    speed,
    bacgroundColor,
    bacColorOp,
  };
  scriptArr.push(script);
  save(scriptArr);
}

function save(data) {
  localStorage.setItem("Storage", JSON.stringify(data));
}

function getScripts() {
  const data = localStorage.getItem("Storage");
  if (data) showData(JSON.parse(data));
}

function showData(data) {
  if (!DOM.cards) return;
  DOM.cards.innerHTML = "";

  data.forEach((item) => {
    const card = createCard(item);
    DOM.cards.appendChild(card);
  });
}

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

  card.querySelector(".dele").addEventListener("click", () => {
    deleteScript(item.id);
    card.remove();
  });

  card.querySelector(".rec").addEventListener("click", () => {
    window.location = `/html/record.html?id=${item.id}`;
  });

  card.querySelector(".edit").addEventListener("click", () => {
    window.location = `/html/wrieting.html?id=${item.id}`;
  });

  return card;
}

function deleteScript(id) {
  scriptArr = scriptArr.filter((item) => item.id !== id);
  save(scriptArr);
}

// Handle URL parameters
if (params.get("id")) {
  const scriptId = Number(params.get("id"));
  const script = scriptArr.find((item) => item.id === scriptId);

  if (script) {
    if (DOM.textarea) {
      DOM.textarea.value = script.text;
      DOM.textarea.style.color = script.color;
      DOM.textarea.style.fontSize = `${script.font}px`;
      if (DOM.font) DOM.font.value = script.font;
      if (DOM.color) DOM.color.value = script.color;
      scriptArr = scriptArr.filter((item) => item.id !== scriptId);
    }

    if (DOM.scriptDiv) {
      DOM.scriptDiv.textContent = script.text;
      DOM.BacScriptDiv.style.backgroundColor = script.bacgroundColor;
      DOM.BacScriptDiv.style.opacity = script.bacColorOp;
      DOM.scriptDiv.style.color = script.color;
      DOM.scriptDiv.style.fontSize = `${script.font}px`;
    }

    if (DOM.video) initializeRecording(script);
  }
}

function initializeRecording(script) {
  const video = DOM.video;
  const startBtn = document.querySelector(".start");
  const stopBtn = document.querySelector(".stop");
  const downloadBtn = document.querySelector(".download");
  const minSpan = document.querySelector(".min");
  const secSpan = document.querySelector(".sec");

  let mediaRecorder,
    chunks = [],
    seconds = 0,
    timerInterval;

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      video.srcObject = stream;
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        downloadBtn.querySelector("a").href = url;
        downloadBtn.querySelector("a").download = "recording.mp4";
        downloadBtn.removeAttribute("disabled");
      };
    })
    .catch((error) => {
      console.error("Camera/microphone access error:", error);
      alert("Unable to access camera or microphone.");
    });

  startBtn?.addEventListener("click", () => {
    chunks = [];
    DOM.scriptContainer?.scrollTo({ top: 0 });
    if (mediaRecorder?.state === "inactive") {
      document.querySelectorAll("audio")[0]?.play();
      chunks = [];
      seconds = 0;
      mediaRecorder.start();
      startBtn.setAttribute("disabled", "true");
      stopBtn.removeAttribute("disabled");

      if (script.speed && DOM.scriptContainer) {
        smoothScroll(DOM.scriptContainer, Number(script.speed));
      }

      timerInterval = setInterval(() => {
        seconds++;
        minSpan.textContent = String(Math.floor(seconds / 60)).padStart(2, "0");
        secSpan.textContent = String(seconds % 60).padStart(2, "0");
      }, 1000);
    }
  });

  stopBtn?.addEventListener("click", () => {
    DOM.scriptContainer?.scrollTo({ top: 0 });
    document.querySelectorAll("audio")[1]?.play();
    mediaRecorder?.stop();
    clearInterval(timerInterval);
    startBtn.removeAttribute("disabled");
    stopBtn.setAttribute("disabled", "true");
  });
}

function smoothScroll(container, speed) {
  let position = 0;
  const scroll = () => {
    if (position < container.scrollHeight) {
      position += speed;
      container.scrollTo({ top: position, behavior: "smooth" });
      requestAnimationFrame(scroll);
    }
  };
  requestAnimationFrame(scroll);
}
