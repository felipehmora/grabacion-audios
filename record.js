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
    download(blob);
  };

  stop.onclick = () => mediaRecorder.stop();
}

function download(blob) {
  let link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", "audio_recorded.webm");
  link.style.display = "none";

  document.body.appendChild(link);

  link.click();

  link.remove();
}

const audio = document.createElement("audio");
audio.controls = true;
audio.preload = "auto";
audio.src = "https://manzdev.github.io/codevember2017/assets/eye-tiger.mp3";
document.body.appendChild(audio);
