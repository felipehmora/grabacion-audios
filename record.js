const mic_btn = document.querySelector("#mic");
const playback = document.querySelector("audio");
const audio_container = document.querySelector(".audio-container");
const aside = document.querySelector("aside");
const deleteAudio = document.querySelectorAll(".playback");
const garbage = document.querySelector("#delete-button");

mic_btn.addEventListener("click", ToogleMic);

function changeHover() {
  console.log("hola soy change");
}

function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

garbage.addEventListener("click", () => {
  console.log("hola mundo");
});

let can_record = false;
let is_recording = false;

let recorder = null;

let chunks = [];

function SetUpAudio() {
  console.log("Setup");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(SetUpStream)
      .catch((err) => console.log(err));
  }
}

SetUpAudio();

function SetUpStream(stream) {
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = function (e) {
    console.log(e.data);
    chunks.push(e.data);
  };

  recorder.onstop = function () {
    let blob = new Blob(chunks, { type: "audio/webm" });
    chunks = [];
    displayAudio(blob);
  };

  can_record = true;
}

function ToogleMic() {
  if (!can_record) return;

  is_recording = !is_recording;

  if (is_recording) {
    recorder.start();
    mic_btn.classList.add("recording");
  } else {
    recorder.stop();
    mic_btn.classList.remove("recording");
  }
}

function displayAudio(blob) {
  console.log("display audio funciona");
  const audioURL = window.URL.createObjectURL(blob);

  playback.src = audioURL;

  playback.controlsList = "download";

  const audioElement = document.createElement("audio");

  document.body.appendChild(audioElement);

  audioElement.src = audioURL;

  audioElement.controls = true;

  audioElement.id = "audioCreated";

  audioElement.classList.add("playback");

  audioElement.draggable = true;

  audioElement.addEventListener("dragstart", () => {
    console.log("ayuda me estan moviendo");
  });

  audioElement.addEventListener("dragend", () => {
    console.log("uf me soltaron");
  });

  garbage.addEventListener("dragenter", () => {
    audioElement.remove();
  });
}
