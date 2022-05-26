import 'dotenv/config';
import express, { Application } from 'express';
import helmet from 'helmet';
import axios from 'axios';
import { createClient } from 'redis';
import path from 'path';
import console from 'console';

const authToken = process.env.GENIUS_TOKEN;

const port: string = process.env.PORT || '3000';

const app: Application = express();

const redisClient = createClient({
    url: process.env.REDIS_TLS_URL,
    socket: { tls: true, rejectUnauthorized: false },
});

redisClient.on('error', (err) => {
    console.log('Redis error', err);
});

app.use(helmet());
app.use(express.static(path.resolve('./public')));
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

app.get('/api/lyrics/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const cachedLyrics = await redisClient.get(`lyrics:${id}`);
        if (cachedLyrics) {
            res.json({ plain: cachedLyrics });
            return;
        }
        const { data } = await geniusAPI.get(`/songs/${id}?text_format=plain`);
        const {
            song: { lyrics },
        } = data.response;
        await redisClient.setEx(`lyrics:${id}`, 60 * 60 * 48, lyrics.plain);
        res.json(lyrics);
    } catch (error) {
        res.status(500).json({ ...error.response.data });
    }
});

app.listen(port, async () => {
    console.time('Redis connected');
    await redisClient.connect();
    console.timeEnd('Redis connected');
    console.log(`Server listening on port ${port}`);
});
