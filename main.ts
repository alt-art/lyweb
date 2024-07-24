import 'dotenv/config';
import express, { Application } from 'express';
import helmet from 'helmet';
import axios, { AxiosError } from 'axios';
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

app.use((req, _res, next) => {
  const log: string[] = [];
  log.push(req.method);
  log.push(req.path);
  log.push(req.ip);
  log.push(req.socket.remoteAddress);
  const headers = Object.entries(req.headers);
  headers.forEach(([key, value]) => {
    log.push(`${key}: ${value}`);
  });
  console.log(log.join(' | '));
  next();
});

app.use(express.static(path.resolve('./public')));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://images.genius.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
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
  try {
    const { id } = req.params;
    const songTemplate = compileFile(path.resolve('./views/song.pug'));
    const lyricsData = await getLyrics(id);
    res.send(songTemplate({ song: { ...lyricsData } }));
  } catch (error) {
    const errorTemplate = compileFile(path.resolve('./views/error.pug'));
    if (error instanceof AxiosError) {
      res.status(error.response.status || 500).send(
        errorTemplate({
          data: {
            status: error.response.status || 500,
            message: error.response.statusText || 'Internal Server Error',
          },
        }),
      );
    } else {
      res.status(500).send(
        errorTemplate({
          data: {
            status: 500,
            message: 'Internal Server Error',
          },
        }),
      );
    }
  }
});

app.use((_req, res) => {
  const errorTemplate = compileFile(path.resolve('./views/error.pug'));
  res.status(404).send(
    errorTemplate({
      data: {
        status: 404,
        message: 'Not Found',
      },
    }),
  );
});

app.listen(port, async () => {
  console.time('Redis connected');
  await redisClient.connect();
  console.timeEnd('Redis connected');
  console.log(`Server listening on port ${port}`);
});
