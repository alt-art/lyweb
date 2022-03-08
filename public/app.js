const app = {

  /**
   * Interface components
   */
  interface: {
    container: "#container",
    search: "#query"
  },

  actions: {

    /**
     * Search Event
     * @param {PointerEvent} e event
     */
    search: e => {
      e.preventDefault();
      app.interface.container.innerHTML = "";
      const song = app.interface.search.value;
      fetch(`./api/search?q=${song}`)
        .then((response) => response.json())
        .then((data) => {
          app.interface.container.innerHTML = data
            .map(song => app.createCard(song)).join('\n')
        });
    },

  },

  /**
   * create card element
   * @param {object} song song data
   * @returns string
   */
  createCard({id, title, songArt, artistName}) {
    return `<a href="./song?id=${id}">
      <div class="card">
        <img src="${songArt}" alt="${title}">
        <div class="card-body">
          <h5 class="card-title">${title}</h5>
          <p class="card-text">${artistName}</p>
        </div>
      </div>
    </a>`;
  },

  /**
   * Start Application
   */
  start() {
    Object.entries(app.interface)
      .forEach(([elem, query]) => {
        app.interface[elem] = document.querySelector(query)
      })
    
    Array.from(document.querySelectorAll(".btn[data-action]"))
      .forEach(b => {
        b.addEventListener("click", app.actions[b.dataset.action])
      })
  }
};


app.start()