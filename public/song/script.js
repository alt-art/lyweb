const lyrics = document.querySelector('.lyrics'),
      backTop = document.querySelector('.btn.btn-block'),
      url = new URL(window.location.href),
      id = url.searchParams.get('id');


fetch(`/api/lyrics/${id}`).then(res => res.json()).then(song => {
  let text = song.plain.trim(),
      chorus = false, intro = false;

  if (text != '') {
    text.split('[').filter(i => i != "").map(part => {
      let [ verse, lines ] = part.split(']')
      if (lines == undefined) [ lines, verse ] = [ verse, '' ]
      else verse = verse.toLowerCase();
      intro = (verse.startsWith('intro')) ? true : false
      chorus = (verse.startsWith('refrão') || verse.startsWith('chorus')) ? true : false

      lyrics.innerHTML += `<div class="verse ${chorus ? 'chorus-verse':''}">
        <h4 class="section">${verse.toUpperCase()}</h4>
        ${lines.split('\n').map(line => {
          space = line.trim() == '' ? true : false
          return (`<p class="${(space)? 'text-space':''} ${chorus ? 'text-bold text-primary' : intro ? 'text-transparent':''}">${line}</p>`);
        }).join('\n')}
      </div>`

      backTop.style.display = 'block'
    })
  } else {
    lyrics.innerHTML = `<p>This song has empty lyric</p>`;
  }
});
