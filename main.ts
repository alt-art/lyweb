import 'dotenv/config';
import express, { Application } from 'express';
import helmet from 'helmet';
import axios from 'axios';
import { createClient } from 'redis';
import path from 'path';
import console from 'console';
import { compileFile } from 'pug';

const authToken = process.env.GENIUS_TOKEN;

const port: string = process.env.PORT || '3000';

const app: Application = express();

const redisClient = createClient({
  url: process.env.REDIS_TLS_URL,
  socket: { tls: process.env.TLS !== 'false', rejectUnauthorized: false },
});

redisClient.on('error', (err) => {
  console.log('Redis error', err);
});

app.use(express.static(path.resolve('./public')));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://images.genius.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  },
}));
app.use(express.json());

const geniusAPI = axios.create({
  baseURL: 'https://api.genius.com',
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
});

app.get('/api/search', async (req, res) => {
  const { q: query, page } = req.query;
  try {
    const { data } = await geniusAPI.get(`/search?q=${query}&page=${page}`);
    const songs = data.response.hits.map((hit) => {
      const {
        song_art_image_thumbnail_url: songArt,
        title_with_featured: title,
        primary_artist: { name: artistName },
        id,
      } = hit.result;
      return {
        songArt,
        title,
        artistName,
        id,
      };
    });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ ...error.response.data });
  }
});

async function getLyrics(id: string) {
  const cachedLyrics = await redisClient.get(`lyrics:${id}`);
  if (cachedLyrics) {
    try {
      return JSON.parse(cachedLyrics);
    } catch (error) {
      redisClient.del(`lyrics:${id}`);
    }
  }
  const { data } = await geniusAPI.get(`/songs/${id}?text_format=plain`);
  const {
    song: {
      lyrics,
      artist_names: artistNames,
      song_art_image_thumbnail_url: songArt,
      title,
    },
  } = data.response;
  const lyricsData = {
    plain: lyrics.plain,
    artists: artistNames,
    songArt,
    title,
  };
  await redisClient.setEx(
    `lyrics:${id}`,
    60 * 60 * 48,
    JSON.stringify(lyricsData),
  );
  return lyricsData;
}

app.get('/api/lyrics/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const lyricsData = await getLyrics(id);
    res.json(lyricsData);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

app.get('/song/:id', async (req, res) => {
  const { id } = req.params;
  const songTemplate = compileFile(path.resolve('./views/song.pug'));
  const lyricsData = await getLyrics(id);
  res.send(songTemplate({ song: { ...lyricsData } }));
});

app.listen(port, async () => {
  console.time('Redis connected');
  await redisClient.connect();
  console.timeEnd('Redis connected');
  console.log(`Server listening on port ${port}`);
});
