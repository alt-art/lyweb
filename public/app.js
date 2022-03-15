/** @constant {object} app Application */
const app = {

  /** @var {object} e fake PointerEvent */
  e: {preventDefault: () => {}},

  /** @var {string} DEFAULT_IMG default card image */
  DEFAULT_IMG: "icon.jpg",

  /** Default LocalStorage data */
  storage: {
    view_mode: "grid_mode",
    dark_mode: 0,
    recents: "",

    /**
     * Set default values to localStorage
     */
    setDefault() {
      Object.entries(app.storage).forEach(([item, value]) => {
        if (typeof value == 'function') return
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
        if (app.GUI.view_mode) app.actions.view_mode(app.e);

      if (parseInt(localStorage.getItem('dark_mode')))
        if (app.GUI.dark_mode) app.actions.dark_mode(app.e);
    }
  },

  /** Interfaces components */
  GUI: {
    container: "#container",
    search: "#query",
    page: "#page",
    label: ".subtitle",
    alert: ".alert",
    title: ".alert .title",
    view_more: ".btn.btn-view-more",
    view_mode: ".btn.btn-view-mode",
    dark_mode: ".btn.btn-dark-mode",
    _actions: ".btn[data-action]",
    _recents: "a.recent",

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
      app.recents.add(song)
      app.GUI.alert.style.display = "none"
      app.GUI.label.innerText = "Searching..."
      app.GUI.search.disabled = true

      app.beforeSearch = app.GUI.search.value;
      app.beforePage = app.GUI.page.value;
      app.GUI.page.dataset.search = song

      fetch(`./api/search?q=${song}&page=${page}`)
        .then((response) => response.json())
        .then((data) => {
          app.GUI.search.disabled = false;
          app.GUI.label.innerText = "Select a song to see lyric";

          if (data.length) {
            app.view.load(data)
            
            if (data.length >= 5) {
              let nextPage = parseInt(app.GUI.page.value) + 1
              app.GUI.view_more.innerHTML = `View more <b>"${song}"</b> results (${nextPage})`;
              app.GUI.view_more.style.display = 'block';
            }
          } else {
            if (app.GUI.page.value > 1) {
              app.GUI.view_more.style.display = 'none'
              app.GUI.page.value -= 1
            } else {
              app.view.reset()
              app.GUI.title.innerText = `Not found results to: ${song}`
            }
          }
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
      if (e instanceof Event) {
        let newValue = parseInt(localStorage.getItem('dark_mode')) ? 0 : 1
        localStorage.setItem('dark_mode', newValue)
      }
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

  /** View functions */
  view: {

    /**
     * create card element
     * @param {object} song song data
     * @returns string
     */
    createCard({id, title, songArt, artistName}) {
      return `<a href="./song?id=${id}">
        <div class="card">
          <img class="card-img" src="${songArt}" alt="${artistName} - ${title}" onerror="this.src = '${app.DEFAULT_IMG}'">
          <div class="card-body">
            <h5 class="card-title">${title}</h5>
            <p class="card-text">${artistName}</p>
          </div>
        </div>
      </a>`;
    },

    /**
     * Load data song cards
     * @param {Array} data songs
     */
    load(data) {
      data.forEach(song => {
        app.GUI.container.innerHTML += app.view.createCard(song)
      })
    },

    /**
     * Reset view
     */
    reset() {
      app.GUI.label.innerText = "Find lyrics of your favorites songs";
      app.GUI.title.innerText = "You don't search anything yet"
      app.GUI.view_more.style.display = 'none';
      app.GUI.container.innerHTML = "";
      app.GUI.page.value = 1;
      app.recents.load(true);
    },

  },

  /** Group to recents functions */
  recents: {

    /** @var {Number} MAX_LENGTH Max length of recents list */
    MAX_LENGTH: 3,

    /**
     * Add song to recents list
     * @param {string} song song search
     */
    add(song) {
      let recents = localStorage.getItem('recents')
      if (!recents.split(',').includes(song)) {
        if (recents.split(',').length >= app.recents.MAX_LENGTH) {
          let r = recents.split(',');r.pop()
          localStorage.setItem('recents', r.join(','))
          recents = r.join(',')
        }

        recents_count = recents.split(',').filter(r => r != "").length
        localStorage.setItem('recents', song + (recents_count == 0 ? '' : ',') + recents)
      }
    },

    /**
     * Load recents fields
     * @param {boolean} display display alert
     */
    load(display = false) {
      if (!app.GUI.alert) return
      if (display) app.GUI.alert.style.display = "block";
      let recents = app.GUI.alert.querySelector(".recents"),
          links = localStorage.getItem('recents').split(',').filter(r => r != "")
          .map(r => `<a class="recent">${r}</a>`);
      
      recents.innerHTML = `Recents searchs: ${links == "" ? "Nothing" : links.join(', ')}`;
      app.recents.update();
    },

    /**
     * Update recents links
     */
    update() {
      Array.from(document.querySelectorAll(app.GUI._recents)).map(link => {
        link.addEventListener("click" , () => {
          app.GUI.search.value = link.innerText;
          app.actions.search(app.e);
        })
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
    if (app.beforeSearch != song) app.view.reset()
    if (song == "") return false
    return true
  },

  /**
   * Start Application
   */
  start() {
    app.storage.setDefault()

    app.GUI.load()
    app.storage.load()
    app.recents.load()
    app.actions.load()

    if (!app.GUI.search) return
    app.beforeSearch = app.GUI.search.value;
    app.beforePage = app.GUI.page.value;
  }
};


app.start()