const url = new URL(window.location.href);
const sectionLyrics = document.querySelector('.lyrics');

const id = url.searchParams.get('id');

fetch(`/api/lyrics/${id}`).then(res => res.json()).then(song => {
    const lyrics = String(song.plain).split('\n');
    lyrics.forEach(line => {
        const p = document.createElement('p');
        p.innerHTML = line;
        if (line.includes('[') && line.includes(']')) {
            p.className = 'h4';
        }
        sectionLyrics.appendChild(p);
    });
});