(() => {
  const scriptUrl = new URL(document.currentScript?.src || './app.js', window.location.href);
  const dataUrl = (file) => new URL(`./data/${file}`, scriptUrl).href;
  const jsonCache = new Map();

  const sendEvent = (name, detail = {}) => {
    const payload = {
      event: name,
      ...detail,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    window.dispatchEvent(new CustomEvent('rsb:analytics', { detail: payload }));

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
  };

  const fetchJson = (file) => {
    if (!jsonCache.has(file)) {
      jsonCache.set(file, fetch(dataUrl(file), { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
          return response.json();
        }));
    }
    return jsonCache.get(file);
  };

  const episodeHref = (episode) => new URL(`./episodes/${episode.id}/`, scriptUrl).href;
  const programHref = (program) => new URL(`./programs/${program.id}/`, scriptUrl).href;

  const makeEpisodeCard = (episode, guestNames) => {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = episodeHref(episode);
    link.dataset.rsbEvent = 'program_episode_click';
    link.dataset.programId = episode.program;
    link.dataset.episodeId = episode.id;
    link.dataset.placement = 'archive';
    link.dataset.destinationType = 'episode';

    if (episode.thumbnail_url || episode.youtube_id) {
      const media = document.createElement('div');
      media.className = 'card-media';
      const image = document.createElement('img');
      image.src = episode.thumbnail_url || `https://i.ytimg.com/vi/${episode.youtube_id}/hqdefault.jpg`;
      image.alt = `${episode.title} のサムネイル`;
      image.loading = 'lazy';
      media.append(image);
      link.append(media);
    }

    const label = document.createElement('small');
    label.textContent = `EP.${String(episode.episode_number).padStart(2, '0')}${episode.duration ? ` / ${episode.duration}` : ''}`;
    const title = document.createElement('h3');
    title.textContent = guestNames.length ? guestNames.join(' / ') : episode.title;
    const summary = document.createElement('p');
    summary.textContent = episode.summary;
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = 'Episodeを見る →';

    link.append(label, title, summary, arrow);
    return link;
  };

  const makeComingSoonCard = () => {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('aria-label', '次回エピソードは公開準備中');

    const label = document.createElement('small');
    label.textContent = 'NEXT';
    const title = document.createElement('h3');
    title.textContent = '次のEpisodeへ';
    const body = document.createElement('p');
    body.textContent = '公開状態と内容確認が整ったEpisodeから順次追加します。';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = 'COMING SOON';

    article.append(label, title, body, arrow);
    return article;
  };

  const makeProgramCard = (program) => {
    const link = document.createElement('a');
    link.className = 'card';
    link.href = programHref(program);
    link.dataset.rsbEvent = 'broadcast_program_click';
    link.dataset.programId = program.id;
    link.dataset.placement = 'program-grid';
    link.dataset.destinationType = 'program';

    if (program.artwork_url) {
      const media = document.createElement('div');
      media.className = 'card-media';
      const image = document.createElement('img');
      image.src = new URL(program.artwork_url, scriptUrl).href;
      image.alt = `${program.name} 番組ビジュアル`;
      image.loading = 'lazy';
      media.append(image);
      link.append(media);
    }

    const label = document.createElement('small');
    label.textContent = program.status || 'PROGRAM';
    const title = document.createElement('h3');
    title.textContent = program.name;
    const body = document.createElement('p');
    body.textContent = program.tagline || '番組ホームへ';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = '番組ホームへ →';

    link.append(label, title, body, arrow);
    return link;
  };

  const makeMoreProgramsCard = () => {
    const article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('aria-label', 'RS BROADCAST NETWORKの番組は順次追加予定');

    const label = document.createElement('small');
    label.textContent = 'NETWORK';
    const title = document.createElement('h3');
    title.textContent = 'MORE PROGRAMS';
    const body = document.createElement('p');
    body.textContent = '公開状態と権利確認が整った番組から順次追加します。';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = 'ON AIR 2026.09.23';

    article.append(label, title, body, arrow);
    return article;
  };

  const makePersonCard = (person) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.personId = person.id;

    const label = document.createElement('small');
    label.textContent = person.role || 'PERSON';
    const title = document.createElement('h3');
    title.textContent = person.name;
    const body = document.createElement('p');
    body.textContent = person.name_en || '';

    article.append(label, title, body);
    return article;
  };

  const renderEpisodeArchives = async () => {
    const containers = [...document.querySelectorAll('[data-rsb-episode-archive]')];
    if (!containers.length) return;

    try {
      const [episodes, people] = await Promise.all([
        fetchJson('episodes.json'),
        fetchJson('people.json')
      ]);
      const peopleById = new Map(people.map((person) => [person.id, person.name]));

      containers.forEach((container) => {
        const programId = container.dataset.rsbEpisodeArchive;
        const programEpisodes = episodes
          .filter((episode) => episode.program === programId)
          .sort((a, b) => b.episode_number - a.episode_number);
        if (!programEpisodes.length) return;

        const fragment = document.createDocumentFragment();
        programEpisodes.forEach((episode) => {
          const guestNames = (episode.guest_ids || [])
            .map((id) => peopleById.get(id))
            .filter(Boolean);
          fragment.append(makeEpisodeCard(episode, guestNames));
        });
        fragment.append(makeComingSoonCard());
        container.replaceChildren(fragment);
      });
    } catch (error) {
      console.warn('[RSB] Episode archive fallback retained.', error);
    }
  };

  const renderProgramGrids = async () => {
    const containers = [...document.querySelectorAll('[data-rsb-program-grid]')];
    if (!containers.length) return;

    try {
      const programs = await fetchJson('programs.json');
      if (!programs.length) return;

      containers.forEach((container) => {
        const fragment = document.createDocumentFragment();
        programs.forEach((program) => fragment.append(makeProgramCard(program)));
        fragment.append(makeMoreProgramsCard());
        container.replaceChildren(fragment);
      });
    } catch (error) {
      console.warn('[RSB] Program grid fallback retained.', error);
    }
  };

  const renderPeopleGrids = async () => {
    const containers = [...document.querySelectorAll('[data-rsb-people]')]
      .filter((container) => container.dataset.rsbPeopleStatic !== 'true');
    if (!containers.length) return;

    try {
      const [programs, episodes, people] = await Promise.all([
        fetchJson('programs.json'),
        fetchJson('episodes.json'),
        fetchJson('people.json')
      ]);
      const peopleById = new Map(people.map((person) => [person.id, person]));

      containers.forEach((container) => {
        const programId = container.dataset.rsbPeople;
        const program = programs.find((item) => item.id === programId);
        if (!program) return;

        const ids = new Set([...(program.host_ids || []), ...(program.assistant_ids || [])]);
        episodes
          .filter((episode) => episode.program === programId)
          .forEach((episode) => (episode.guest_ids || []).forEach((id) => ids.add(id)));

        const programPeople = [...ids].map((id) => peopleById.get(id)).filter(Boolean);
        if (!programPeople.length) return;

        const fragment = document.createDocumentFragment();
        programPeople.forEach((person) => fragment.append(makePersonCard(person)));
        container.replaceChildren(fragment);
      });
    } catch (error) {
      console.warn('[RSB] People grid fallback retained.', error);
    }
  };


  const latestEpisodeForProgram = (programId, episodes) => episodes
    .filter((episode) => episode.program === programId)
    .sort((a, b) => Number(b.episode_number || 0) - Number(a.episode_number || 0))[0] || null;

  const makeStreamEpisodeTile = (episode, program, guestNames = []) => {
    const link = document.createElement('a');
    link.className = 'stream-tile';
    link.href = episodeHref(episode);
    link.dataset.rsbEvent = 'episode_card_click';
    link.dataset.programId = episode.program;
    link.dataset.episodeId = episode.id;
    link.dataset.placement = 'latest-shelf';
    link.dataset.destinationType = 'episode';

    const media = document.createElement('div');
    media.className = 'stream-tile__media';
    const image = document.createElement('img');
    image.src = episode.thumbnail_url || `https://i.ytimg.com/vi/${episode.youtube_id}/hqdefault.jpg`;
    image.alt = `${program?.name || ''} EP.${String(episode.episode_number).padStart(2, '0')} ${guestNames.join(' / ')}`.trim();
    image.loading = 'lazy';
    media.append(image);

    const body = document.createElement('div');
    body.className = 'stream-tile__body';
    const label = document.createElement('small');
    label.textContent = `${program?.name || episode.program} / EP.${String(episode.episode_number).padStart(2, '0')}${episode.duration ? ` / ${episode.duration}` : ''}`;
    const title = document.createElement('h3');
    title.textContent = guestNames.length ? guestNames.join(' / ') : episode.title;
    const summary = document.createElement('p');
    summary.textContent = episode.summary || '';
    body.append(label, title, summary);
    link.append(media, body);
    return link;
  };

  const makeStreamProgramTile = (program) => {
    const link = document.createElement('a');
    link.className = 'stream-tile';
    link.href = programHref(program);
    link.dataset.rsbEvent = 'broadcast_program_click';
    link.dataset.programId = program.id;
    link.dataset.placement = 'program-shelf';
    link.dataset.destinationType = 'program';

    const media = document.createElement('div');
    media.className = 'stream-tile__media';
    if (program.artwork_url) {
      const image = document.createElement('img');
      image.src = new URL(program.artwork_url, scriptUrl).href;
      image.alt = `${program.name} 番組ビジュアル`;
      image.loading = 'lazy';
      media.append(image);
    } else {
      media.classList.add('stream-tile__media--editorial');
      const title = document.createElement('strong');
      title.textContent = program.name;
      media.append(title);
    }

    const body = document.createElement('div');
    body.className = 'stream-tile__body';
    const label = document.createElement('small');
    label.textContent = program.category || program.status || 'PROGRAM';
    const title = document.createElement('h3');
    title.textContent = program.name;
    const summary = document.createElement('p');
    summary.textContent = program.description || program.tagline || '';
    body.append(label, title, summary);
    link.append(media, body);
    return link;
  };

  const makeStreamPersonTile = (person, latestAppearance) => {
    const link = document.createElement('a');
    link.className = 'stream-tile';
    link.href = latestAppearance
      ? episodeHref(latestAppearance)
      : new URL('./programs/ayako-no-heya/#people', scriptUrl).href;
    link.dataset.rsbEvent = 'broadcast_person_click';
    link.dataset.personId = person.id;
    link.dataset.placement = 'people-shelf';
    link.dataset.destinationType = latestAppearance ? 'episode' : 'program';

    const media = document.createElement('div');
    media.className = 'stream-tile__media stream-tile__media--editorial';
    const title = document.createElement('strong');
    title.textContent = person.name_en || person.name;
    media.append(title);

    const body = document.createElement('div');
    body.className = 'stream-tile__body';
    const label = document.createElement('small');
    label.textContent = person.role || 'PEOPLE';
    const name = document.createElement('h3');
    name.textContent = person.name;
    const summary = document.createElement('p');
    summary.textContent = latestAppearance
      ? `EP.${String(latestAppearance.episode_number).padStart(2, '0')} から見る`
      : '人物アーカイブへ';
    body.append(label, name, summary);
    link.append(media, body);
    return link;
  };

  const renderNetworkHome = async () => {
    const featured = document.querySelector('[data-rsb-network-featured]');
    const latestShelf = document.querySelector('[data-rsb-network-latest]');
    const programShelf = document.querySelector('[data-rsb-network-programs]');
    const peopleShelf = document.querySelector('[data-rsb-network-people]');
    if (!featured && !latestShelf && !programShelf && !peopleShelf) return;

    try {
      const [programs, episodes, people] = await Promise.all([
        fetchJson('programs.json'),
        fetchJson('episodes.json'),
        fetchJson('people.json')
      ]);

      const programsById = new Map(programs.map((item) => [item.id, item]));
      const peopleById = new Map(people.map((item) => [item.id, item]));
      const orderedEpisodes = [...episodes].sort((a, b) => {
        const programCompare = String(a.program).localeCompare(String(b.program));
        if (programCompare !== 0) return programCompare;
        return Number(b.episode_number || 0) - Number(a.episode_number || 0);
      });

      const featuredProgram = programs.find((program) => latestEpisodeForProgram(program.id, episodes)) || programs[0];
      const featuredEpisode = featuredProgram ? latestEpisodeForProgram(featuredProgram.id, episodes) : null;

      if (featured && featuredProgram && featuredEpisode) {
        const heroImage = featuredEpisode.thumbnail_url || `https://i.ytimg.com/vi/${featuredEpisode.youtube_id}/maxresdefault.jpg`;
        featured.style.setProperty('--stream-hero-image', `url("${heroImage}")`);
        const label = featured.querySelector('[data-rsb-featured-label]');
        const title = featured.querySelector('[data-rsb-featured-title]');
        const copy = featured.querySelector('[data-rsb-featured-copy]');
        const watch = featured.querySelector('[data-rsb-featured-watch]');
        const details = featured.querySelector('[data-rsb-featured-details]');
        if (label) label.textContent = `FEATURED / ${featuredProgram.name} / EP.${String(featuredEpisode.episode_number).padStart(2, '0')}`;
        if (title) title.textContent = featuredProgram.name;
        if (copy) copy.textContent = featuredEpisode.summary || featuredProgram.description || featuredProgram.tagline || '';
        [watch, details].forEach((link) => {
          if (!link) return;
          link.href = episodeHref(featuredEpisode);
          link.dataset.programId = featuredProgram.id;
          link.dataset.episodeId = featuredEpisode.id;
          link.dataset.destinationType = 'episode';
        });
      }

      if (latestShelf) {
        const fragment = document.createDocumentFragment();
        orderedEpisodes
          .sort((a, b) => Number(b.episode_number || 0) - Number(a.episode_number || 0))
          .slice(0, 8)
          .forEach((episode) => {
            const guestNames = (episode.guest_ids || [])
              .map((id) => peopleById.get(id)?.name)
              .filter(Boolean);
            fragment.append(makeStreamEpisodeTile(episode, programsById.get(episode.program), guestNames));
          });
        latestShelf.replaceChildren(fragment);
      }

      if (programShelf) {
        const fragment = document.createDocumentFragment();
        programs.forEach((program) => fragment.append(makeStreamProgramTile(program)));
        programShelf.replaceChildren(fragment);
      }

      if (peopleShelf) {
        const visibleIds = new Set();
        programs.forEach((program) => {
          (program.host_ids || []).forEach((id) => visibleIds.add(id));
          (program.assistant_ids || []).forEach((id) => visibleIds.add(id));
        });
        episodes.forEach((episode) => (episode.guest_ids || []).forEach((id) => visibleIds.add(id)));

        const fragment = document.createDocumentFragment();
        [...visibleIds]
          .map((id) => peopleById.get(id))
          .filter(Boolean)
          .forEach((person) => {
            const appearance = episodes
              .filter((episode) => (episode.guest_ids || []).includes(person.id))
              .sort((a, b) => Number(b.episode_number || 0) - Number(a.episode_number || 0))[0] || null;
            fragment.append(makeStreamPersonTile(person, appearance));
          });
        peopleShelf.replaceChildren(fragment);
      }
    } catch (error) {
      console.warn('[RSB] Network home fallback retained.', error);
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-rsb-event]');
    if (!target) return;

    sendEvent(target.dataset.rsbEvent, {
      program_id: target.dataset.programId || null,
      episode_id: target.dataset.episodeId || null,
      person_id: target.dataset.personId || null,
      placement: target.dataset.placement || null,
      destination_type: target.dataset.destinationType || null,
      href: target.getAttribute('href') || null
    });
  });

  renderEpisodeArchives();
  renderProgramGrids();
  renderPeopleGrids();
  renderNetworkHome();
})();
