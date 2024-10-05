const mic_btn = document.querySelector("#mic");
const playback = document.querySelector("audio");
const audio_container = document.querySelector(".audio-container");
const aside = document.querySelector("aside");
const deleteAudio = document.querySelectorAll(".playback");
const garbage = document.querySelector("#delete-button");
let allAudios = [];
let db;
const request = indexedDB.open("audios");
let stopEjecution = false;

window.onload = function () {
  detenerDisplay = true; // Cambia a true para detener la ejecución
  loadAudiosFromDB(); // Cargar los audios almacenados al recargar la página

  // Si deseas restablecer la bandera después de la carga, puedes hacerlo aquí
  detenerDisplay = false; // Cambia de nuevo a false si es necesario
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log("Base de datos abierta:", db);
  leerDatos(); // Leer datos al abrir
};

request.onerror = function (event) {
  console.error("Error al abrir la base de datos:", event);
};

request.onupgradeneeded = function (event) {
  db = event.target.result;
  const store = db.createObjectStore("miAlmacen", {
    keyPath: "id",
    audio: addAudio,
    autoIncrement: true,
  });
  console.log("Almacén de objetos creado");

  const addAudio = store.add(allAudios);
};

function leerDatos() {
  const transaction = db.transaction(["miAlmacen"], "readonly");
  const store = transaction.objectStore("miAlmacen");
  const request = store.getAll();

  request.onsuccess = function (event) {
    console.log("Datos leídos:", event.target.result);
  };
}

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
    agregarAudio(allAudios);
  };

  can_record = true;
}

function agregarAudio(audioData) {
  const transaction = db.transaction(["miAlmacen"], "readwrite");
  const store = transaction.objectStore("miAlmacen");

  // Agregar cada audio en allAudios (si es un array)
  audioData.forEach((audio) => {
    const request = store.add(audio);

    request.onsuccess = function () {
      console.log("Audio agregado con éxito a la base de datos");
    };

    request.onerror = function (event) {
      console.error("Error al agregar audio:", event);
    };
  });
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

  const audioURLObj = {
    keyPath: "id",
    audioURL: window.URL.createObjectURL(blob),
    autoIncrement: true,
    audioData: blob,
  };

  playback.src = audioURL;
  playback.controlsList = "download";

  console.log(allAudios);

  const audioElement = document.createElement("audio");

  console.log(allAudios.push(audioURLObj));

  document.body.appendChild(audioElement);

  audioElement.src = audioURLObj.audioURL;
  audioElement.controls = true;
  audioElement.id = "audio-created";
  audioElement.classList.add("playback");
  audioElement.draggable = true;

  addEventListener("dragstart", (event) => {
    draggedElement = event.target;
    playback.currentSrc;
    console.log(draggedElement.currentSrc);
  });

  garbage.addEventListener("dragover", (ev) => {
    ev.preventDefault();
  });

  garbage.addEventListener("drop", (ev) => {
    ev.preventDefault();

    const index = allAudios.indexOf(draggedElement);
    if (index > -1) {
      allAudios.splice(index, 1);
    }

    draggedElement.remove();
    console.log(draggedElement);
  });
}

// Función para recuperar todos los audios de la base de datos
function loadAudiosFromDB() {
  const transaction = db.transaction(["miAlmacen"], "readonly");
  const store = transaction.objectStore("miAlmacen");

  const request = store.getAll(); // Recuperar todos los audios

  request.onsuccess = function (event) {
    const allAudios = event.target.result;
    console.log(allAudios);

    if (allAudios && allAudios.length > 0) {
      allAudios.forEach((audio) => {
        // Verifica si los datos son un Blob
        if (audio.audioData instanceof Blob) {
          displayAudio(audio.audioData); // Mostrar el audio en la vista
        } else {
          console.error("El audio recuperado no es un Blob:", audio.audioData);
        }
      });
    } else {
      console.log("No hay audios en la base de datos");
    }
  };

  request.onerror = function (event) {
    console.error("Error al cargar audios desde la base de datos", event);
  };
}
