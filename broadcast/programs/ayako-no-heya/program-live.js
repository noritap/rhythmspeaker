(() => {
  const scriptUrl = new URL(document.currentScript?.src || './program-live.js', window.location.href);
  const root = new URL('../../', scriptUrl);
  const fetchJson = (file) => fetch(new URL(`./data/${file}`, root), {credentials:'same-origin'}).then((response) => {
    if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
    return response.json();
  });
  const episodeHref = (episode) => new URL(`./episodes/${episode.id}/`, root).href;
  const chapterHref = (episode, chapter) => {
    const url = new URL(episodeHref(episode));
    url.searchParams.set('start', Number(chapter.seconds || 0));
    url.hash = `chapter-${String(chapter.time || '00:00').replace(':','-')}`;
    return url.href;
  };

  const latestEpisode = (episodes) => episodes
    .filter((episode) => episode.program === 'ayako-no-heya')
    .sort((a,b) => Number(b.episode_number || 0) - Number(a.episode_number || 0))[0] || null;

  const updateLink = (link, href) => {
    if (!link) return;
    link.href = href;
  };

  const renderLatest = (episode, peopleById) => {
    const href = episodeHref(episode);
    document.querySelectorAll('.program-nav .btn--gold, .ayako-hero-copy .btn--gold').forEach((link) => updateLink(link, href));

    const section = document.querySelector('#episodes');
    if (!section) return;
    const guestNames = (episode.guest_ids || []).map((id) => peopleById.get(id)?.name).filter(Boolean);
    const heading = section.querySelector('#latest-heading');
    if (heading) heading.textContent = `第${episode.episode_number}回｜${guestNames.join(' / ') || episode.title}`;
    updateLink(section.querySelector('.text-link'), href);

    const image = section.querySelector('.feature-media img');
    if (image) {
      image.src = episode.thumbnail_url || `https://i.ytimg.com/vi/${episode.youtube_id}/maxresdefault.jpg`;
      image.alt = `あやこの部屋 第${episode.episode_number}回 ${guestNames.join(' / ') || episode.title}`;
      image.width = 1280;
      image.height = 720;
    }

    const eyebrow = section.querySelector('.feature-body .eyebrow');
    if (eyebrow) eyebrow.textContent = `EP.${String(episode.episode_number).padStart(2,'0')} / ${episode.duration || 'NOW ON AIR'}`;
    const title = section.querySelector('.feature-body h2');
    if (title) title.textContent = episode.title;
    const summary = section.querySelector('.feature-body > p:not(.eyebrow)');
    if (summary) summary.textContent = episode.summary || '';
    const actions = section.querySelectorAll('.feature-body .hero-actions a');
    if (actions[0]) actions[0].href = href;
    if (actions[1]) {
      actions[1].href = episode.youtube_url || `https://youtu.be/${episode.youtube_id}`;
      actions[1].target = '_blank';
      actions[1].rel = 'noopener noreferrer';
    }
  };

  const renderCorners = (episode) => {
    const definitions = [
      { title: '俺のシャッフル', pattern: /俺のシャッフル/ },
      { title: 'あやこのインプロ講座 プチ', pattern: /あやこのインプロ講座/ }
    ];
    const cards = [...document.querySelectorAll('#corners .corner')];
    definitions.forEach((definition) => {
      const card = cards.find((item) => item.querySelector('h3')?.textContent.includes(definition.title));
      const chapter = (episode.chapters || []).find((item) => definition.pattern.test(item.label || ''));
      if (!card || !chapter) return;
      const action = card.querySelector('.hero-actions a');
      if (!action) return;
      action.href = chapterHref(episode, chapter);
      action.textContent = `最新回で見る｜${chapter.time}`;
    });
  };

  const renderMissingPeople = (episode, peopleById) => {
    const grid = document.querySelector('#people .people-grid');
    if (!grid) return;
    (episode.guest_ids || []).forEach((id) => {
      const person = peopleById.get(id);
      if (!person || grid.textContent.includes(person.name)) return;
      const article = document.createElement('article');
      article.className = 'person-card';
      const role = document.createElement('div');
      role.className = 'person-role';
      role.textContent = `EP.${String(episode.episode_number).padStart(2,'0')} GUEST / TAP DANCER`;
      const name = document.createElement('h3');
      name.append(document.createTextNode(person.name + ' '));
      if (person.name_en) {
        const en = document.createElement('span');
        en.textContent = person.name_en;
        name.append(en);
      }
      const lead = document.createElement('p');
      lead.className = 'person-lead';
      lead.textContent = episode.summary || `${person.name}さん出演回。`;
      const links = document.createElement('div');
      links.className = 'person-links';
      const episodeLink = document.createElement('a');
      episodeLink.className = 'btn btn--gold';
      episodeLink.href = episodeHref(episode);
      episodeLink.textContent = `EP.${String(episode.episode_number).padStart(2,'0')}を見る`;
      links.append(episodeLink);
      if (person.official_url) {
        const official = document.createElement('a');
        official.className = 'btn btn--ghost';
        official.href = person.official_url;
        official.target = '_blank';
        official.rel = 'noopener noreferrer';
        official.textContent = '公式サイト';
        links.append(official);
      }
      if (person.instagram_url) {
        const instagram = document.createElement('a');
        instagram.className = 'btn btn--ghost';
        instagram.href = person.instagram_url;
        instagram.target = '_blank';
        instagram.rel = 'noopener noreferrer';
        instagram.textContent = 'Instagram';
        links.append(instagram);
      }
      article.append(role, name, lead, links);
      grid.append(article);
    });
  };

  const run = async () => {
    try {
      const [episodes, people] = await Promise.all([fetchJson('episodes.json'), fetchJson('people.json')]);
      const episode = latestEpisode(episodes);
      if (!episode) return;
      const peopleById = new Map(people.map((person) => [person.id, person]));
      renderLatest(episode, peopleById);
      renderCorners(episode);
      renderMissingPeople(episode, peopleById);
    } catch (error) {
      console.warn('[RSB] Program live sync fallback retained.', error);
    }
  };

  run();
})();
