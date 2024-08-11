const apiUrl = "http://localhost:3000/upload";

let auidoRecorder = document.querySelector("#audio-recorder");
let stop = document.getElementById("stop");

document.querySelector("#button").addEventListener("click", function (ev) {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(record)
    .catch((err) => console.log(err));
});

let chunks = [];

function record(stream) {
  //auidoRecorder.srcObject = stream;

  let mediaRecorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;",
  });

  mediaRecorder.start();

  console.log("empieza la grabacion");

  mediaRecorder.ondataavailable = function (e) {
    console.log(e.data);
    chunks.push(e.data);
  };

  mediaRecorder.onstop = function () {
    alert("Finalizo la grabacion");

    let blob = new Blob(chunks, { type: "audio/webm" });
    chunks = [];
    displayAudio(blob);
  };

  stop.onclick = () => mediaRecorder.stop();
}

function displayAudio(blob) {
  let audio = document.createElement("audio");

  audio.src = window.URL.createObjectURL(blob);

  audio.controls = true;

  document.body.appendChild(audio);
}

const audio = document.createElement("audio");
audio.controls = true;
audio.preload = "auto";
audio.src = "https://manzdev.github.io/codevember2017/assets/eye-tiger.mp3";
document.body.appendChild(audio);

async function getArchives() {
  try {
    const response = await fetch(apiUrl, method);
    const results = await response.json();
    console.log(results);
  } catch (error) {
    console.log(error);
  }
}

getArchives();
