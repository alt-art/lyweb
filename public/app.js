const getInputValue = document.querySelector("#query");
const searchButton = document.querySelector("#btn-query");
const getContainer = document.querySelector("#container");

searchButton.addEventListener("click", (e) => {
  e.preventDefault();
  getContainer.innerHTML = "";
  const song = getInputValue.value;
  fetch(`./api/search?q=${song}`)
    .then((response) => response.json())
    .then((data) =>
      data.forEach((song) => {
        createCard(song.id ,song.title, song.songArt, song.artistName);
      })
    );
});

const createImgElement = (path) => {
  const img = document.createElement("img");
  img.src = path;
  img.className = "card-img-top";
  return img;
};

const createCard = (id, title, songArt, artistName) => {
  const link = document.createElement("a");
  const firstDiv = document.createElement("div");
  firstDiv.className = "card";
  link.href = `./song?id=${id}`;
  const songImg = createImgElement(songArt);
  const secondDiv = document.createElement("div");
  secondDiv.className = "card-body";
  const songTitle = document.createElement("h5");
  songTitle.className = "card-title";
  songTitle.innerText = title;
  const nameArtist = document.createElement("p");
  nameArtist.innerText = artistName;
  nameArtist.className = "card-text";
  link.appendChild(songTitle);
  secondDiv.appendChild(link);
  secondDiv.appendChild(nameArtist);
  firstDiv.appendChild(songImg);
  firstDiv.appendChild(secondDiv);
  getContainer.appendChild(firstDiv);
};
