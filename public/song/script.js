const lyrics = document.querySelector('.lyrics');
const backTop = document.querySelector('.btn.btn-block');
const url = new URL(window.location.href);
const id = url.searchParams.get('id');

fetch(`/api/lyrics/${id}`)
  .then((res) => res.json())
  .then((song) => {
    const text = song.plain.trim();
    if (text === '') {
      lyrics.innerHTML = '<p>This song has empty lyric</p>';
      return;
    }
    text
      .split('[')
      .filter((i) => i !== '')
      .forEach((part) => {
        let [verse, lines] = part.split(']');
        if (lines === undefined) [lines, verse] = [verse, ''];
        verse = verse.toLowerCase();
        const intro = verse.startsWith('intro');
        const chorus = verse.startsWith('refrão') || verse.startsWith('chorus');
        lyrics.innerHTML += `
<div class="verse ${chorus ? 'chorus-verse' : ''}">
  <h4 class="section">${verse.toUpperCase()}</h4>
  ${lines
    .split('\n')
    .map((line) => {
      const space = line.trim() === '';
      if (chorus) {
        return `<p class="${
          space ? 'text-space' : ''
        } text-bold text-primary">${line}</p>`;
      }
      if (intro) {
        return `<p class="${space ? 'text-space' : ''} text-transparent">${line}</p>`;
      }
      return `<p class="${space ? 'text-space' : ''}">${line}</p>`;
    })
    .join('')}
</div>`;
        backTop.style.display = 'block';
      });
  })
  .catch(() => {
    lyrics.innerHTML = '<p>No lyrics found</p>';
  });
