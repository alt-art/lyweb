import 'dotenv/config';
import express, { Application } from 'express';
import axios from 'axios';
import path from 'path';
import console from 'console';

const authToken = process.env.GENIUS_TOKEN;

const port: string = process.env.PORT || '3000';

const app: Application = express();

app.use(express.static(path.resolve(__dirname, '../public')));
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
        const status = error.response.status || 500;
        res.status(status).json({ ...error.response.data });
    }
});

app.get('/api/lyrics/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = await geniusAPI.get(`/songs/${id}?text_format=plain`);
        const {
            song: { lyrics },
        } = data.response;
        res.json(lyrics);
    } catch (error) {
        const status = error.response.status || 500;
        res.status(status).json({ ...error.response.data });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
