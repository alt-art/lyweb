const app = {

  /** @var {object} e fake PointerEvent */
  e: {preventDefault: () => {}},

  /** Default LocalStorage data */
  storage: {
    view_mode: "grid_mode",
    dark_mode: 0,

    /**
     * Set default values to localStorage
     */
    setDefault() {
      Object.entries(app.storage).forEach(([item, value]) => {
        localStorage.getItem(item) == null
        if (localStorage.getItem(item) == null)
          localStorage.setItem(item, value)
      })
    },

    /**
     * Load localStorage
     */
    load() {
      if (app.GUI.container.dataset.mode != localStorage.getItem('view_mode'))
        app.actions.view_mode(app.e);

      if (parseInt(localStorage.getItem('dark_mode')))
        app.actions.dark_mode(app.e);
    }
  },

  /** Interfaces components */
  GUI: {
    container: "#container",
    search: "#query",
    page: "#page",
    label: ".subtitle",
    view_more: ".btn.btn-view-more",
    view_mode: ".btn.btn-view-mode",
    dark_mode: ".btn.btn-dark-mode",
    _actions: ".btn[data-action]",

    /**
     * Load elements GUI
     */
    load() {
      Object.entries(app.GUI)
        .forEach(([elem, query]) => {
          if(!elem.startsWith('_') && typeof query == 'string')
            app.GUI[elem] = document.querySelector(query);
        })
    }
  },

  /** Event actions */
  actions: {

    /**
     * Search Event
     * @param {PointerEvent} e event
     */
    search: e => {
      e.preventDefault();
      let song = app.GUI.search.value,
          page = app.GUI.page.value;
      
      if(!app.setSearch(song)) return
      app.GUI.label.innerText = "Searching.."
      app.GUI.search.disabled = true

      app.beforeSearch = app.GUI.search.value;
      app.beforePage = app.GUI.page.value;
      app.GUI.page.dataset.search = song

      fetch(`./api/search?q=${song}&page=${page}`)
        .then((response) => response.json())
        .then((data) => {
          data.map(song => app.GUI.container.innerHTML += app.createCard(song))
          app.GUI.search.disabled = false
          app.GUI.label.innerText = "Select a song to see lyrics";
          app.GUI.view_more.innerText = `View more '${song}' results (${parseInt(app.GUI.page.value) + 1})`
          app.GUI.view_more.style.display = 'block';
        });
    },

    /**
     * Change View Mode
     * @param {PointerEvent} e event
     */
    view_mode: e => {
      e.preventDefault();
      let mode = app.GUI.container.dataset.mode == "view_list" ? "grid_view": "view_list"
      let icon = app.GUI.view_mode.children[0]
      app.GUI.container.dataset.mode = mode
      icon.innerText = mode

      localStorage.setItem('view_mode', mode)
    },

    /**
     * Next page to view more results
     * @param {PointerEvent} e event
     */
    view_more: e => {
      app.GUI.page.value = parseInt(app.GUI.page.value) + 1;
      app.GUI.search.value = app.GUI.page.dataset.search;
      app.actions.search(app.e)
    },

    /**
     * Enable/Disable Dark mode
     * @param {PointerEvent} e event
     */
    dark_mode: e => {
      e.preventDefault();
      document.querySelector("body").classList.toggle('dark-mode')
      app.GUI.dark_mode.classList.toggle('active')
      if (e instanceof PointerEvent)
        localStorage.setItem('dark_mode', parseInt(localStorage.getItem('dark_mode')) ? 0 : 1)
    },

    /**
     * Load Actions
     */
    load() {
      Array.from(document.querySelectorAll(app.GUI._actions))
      .forEach(b => {
        b.addEventListener("click", app.actions[b.dataset.action.replace('-', '_')])
      })
    }
  },

  /**
   * trait search (anti-duplicate)
   * @param {string} song song search
   * @returns 
   */
  setSearch(song) {
    let page = app.GUI.page.value
    if (app.beforeSearch == song && page == app.beforePage) return false
    if (song == "" || app.beforeSearch != song) {
      app.GUI.label.innerText = "Find lyrics of your favorites songs";
      app.GUI.view_more.style.display = 'none';
      app.GUI.container.innerHTML = "";
      app.GUI.page.value = 1
    }
    if (song == "") return false
    return true
  },

  /**
   * create card element
   * @param {object} song song data
   * @returns string
   */
  createCard({id, title, songArt, artistName}) {
    return `<a href="./song?id=${id}">
      <div class="card">
        <img class="card-img" src="${songArt}" alt="${title}">
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
    app.storage.setDefault()

    app.GUI.load()
    app.storage.load()
    app.actions.load()

    app.beforeSearch = app.GUI.search.value;
    app.beforePage = app.GUI.page.value;
  }
};


app.start()