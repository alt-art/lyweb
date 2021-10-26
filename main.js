require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const authToken = process.env.GENIUS_TOKEN;

const path = require('path');
const port = process.env.PORT || 3000;

const app = express();

const URL = 'https://api.genius.com';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', (req, res) => {
  const query = req.query.q;
  fetch(`${URL}/search?q=${query}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const songs = data.response.hits.map((hit) => {
        const {
          song_art_image_thumbnail_url: songArt,
          title_with_featured: title,
          primary_artist: {name: artistName},
          id: id,
        } = hit.result;
        return { songArt, title, artistName: artistName.name, id };
      });
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(songs));
    });
});

app.get('/api/lyrics/:id', (req, res) => {
  const id = req.params.id;
  fetch(`${URL}/songs/${id}?text_format=html`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const {
        song: { lyrics: lyrics },
      } = data.response;
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(lyrics));
    });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
