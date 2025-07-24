const audio = document.getElementById("audio");
const lyricsDisplay = document.getElementById("lyricsDisplay");
let playlist = JSON.parse(localStorage.getItem("playlist")) || [];

function saveToPlaylist(name, fileDataUrl, albumArtDataUrl = "") {
  playlist.push({ name, fileDataUrl, albumArtDataUrl });
  localStorage.setItem("playlist", JSON.stringify(playlist));
  renderPlaylist();
}

function renderPlaylist() {
  const list = document.getElementById("playlist");
  list.innerHTML = "";
  playlist.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.name;
    li.onclick = () => {
      audio.src = track.fileDataUrl;
      document.getElementById("albumArt").src = track.albumArtDataUrl || "default-art.png";
      audio.play();
    };
    list.appendChild(li);
  });
}

document.getElementById("songFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      audio.src = ev.target.result;
      audio.play();
      saveToPlaylist(file.name, ev.target.result);
    };
    reader.readAsDataURL(file);
  }
});

renderPlaylist();
