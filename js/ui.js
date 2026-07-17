/* THE ERA — UI rendering
   Pure render functions driven by state. main.js owns the event wiring
   (via data-action attributes handled through one delegated listener)
   and calls UI.renderGame() again after every mutation. */

const UI = { activeTab: 'studio', flash: null };

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function statBar(label, value, max = 100) {
  const pct = clamp((value / max) * 100);
  return `
    <div class="stat-row">
      <div class="stat-label">${label}</div>
      <div class="stat-track"><div class="stat-fill" style="width:${pct}%"></div></div>
      <div class="stat-value">${Math.round(value)}</div>
    </div>`;
}

UI.renderCreation = function (root) {
  root.innerHTML = `
    <div class="creation-screen">
      <div class="creation-hero">
        <div class="eyebrow">THE ERA</div>
        <h1>BUILD YOUR SOUND. BUILD YOUR NAME.<br/>SURVIVE THE INDUSTRY.</h1>
      </div>
      <form id="creation-form" class="creation-form">
        <section class="creation-section">
          <h2>Artist</h2>
          <div class="field-grid">
            <label>Stage Name <input required name="stageName" maxlength="24" placeholder="e.g. Nova Reign"/></label>
            <label>Real Name <input required name="realName" maxlength="30"/></label>
            <label>Age <input required name="age" type="number" min="16" max="30" value="21"/></label>
            <label>Gender <input name="gender" maxlength="20" placeholder="optional"/></label>
            <label>Country <input required name="country" maxlength="30"/></label>
            <label>City <input required name="city" maxlength="30"/></label>
          </div>
          <div class="field-grid">
            <label>Primary Genre
              <select required name="primaryGenre">${GENRES.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
            </label>
            <label class="span-2">Secondary Genres (pick up to 2)
              <select multiple name="secondaryGenres" size="4">${GENRES.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
            </label>
          </div>
          <label class="span-2">Bio
            <textarea name="bio" maxlength="280" rows="2" placeholder="Who is this artist?"></textarea>
          </label>
        </section>

        <section class="creation-section">
          <h2>Starting Story</h2>
          <div class="story-grid">
            ${STARTING_STORIES.map(s => `
              <label class="story-card">
                <input type="radio" name="storyId" value="${s.id}" ${s.id === 'bedroom' ? 'checked' : ''}/>
                <div class="story-card-inner">
                  <h3>${s.name}</h3>
                  <p>${s.blurb}</p>
                  <div class="story-meta">${formatMoney(s.money)} · ${s.fans.toLocaleString()} fans</div>
                </div>
              </label>`).join('')}
          </div>
        </section>

        <section class="creation-section">
          <h2>Skill Points <span class="points-remaining" id="points-remaining">100 remaining</span></h2>
          <div class="stat-alloc-grid">
            ${['talent', 'songwriting', 'performance', 'charisma', 'dance', 'business', 'creativity'].map(k => `
              <label class="stat-alloc">
                ${k[0].toUpperCase() + k.slice(1)}
                <input type="number" min="0" max="100" value="0" data-stat="${k}" class="stat-input"/>
              </label>`).join('')}
          </div>
        </section>

        <button type="submit" class="btn btn-primary btn-large">Start Your Career</button>
      </form>
    </div>`;

  const inputs = root.querySelectorAll('.stat-input');
  const remainingEl = root.querySelector('#points-remaining');
  function updateRemaining() {
    let used = 0;
    inputs.forEach(i => used += (parseInt(i.value, 10) || 0));
    const remaining = 100 - used;
    remainingEl.textContent = `${remaining} remaining`;
    remainingEl.classList.toggle('over', remaining < 0);
  }
  inputs.forEach(i => i.addEventListener('input', updateRemaining));
  updateRemaining();
};

UI.readCreationForm = function (root) {
  const form = root.querySelector('#creation-form');
  const fd = new FormData(form);
  const statPoints = {};
  let used = 0;
  root.querySelectorAll('.stat-input').forEach(i => {
    const v = parseInt(i.value, 10) || 0;
    statPoints[i.dataset.stat] = v;
    used += v;
  });
  if (used !== 100) return { error: `Skill points must total exactly 100 (currently ${used}).` };

  const secondaryGenres = Array.from(fd.getAll('secondaryGenres'));
  return {
    stageName: fd.get('stageName').trim(),
    realName: fd.get('realName').trim(),
    age: parseInt(fd.get('age'), 10),
    gender: fd.get('gender').trim(),
    country: fd.get('country').trim(),
    city: fd.get('city').trim(),
    primaryGenre: fd.get('primaryGenre'),
    secondaryGenres,
    bio: fd.get('bio').trim(),
    storyId: fd.get('storyId'),
    statPoints
  };
};

/* ---------------- Main game screen ---------------- */

UI.renderGame = function (root, state) {
  root.innerHTML = `
    ${UI._timeline(state)}
    <div class="game-layout">
      <aside class="sidebar">${UI._artistCard(state)}${UI._statsPanel(state)}${UI._industryPanel(state)}${UI._financePanel(state)}</aside>
      <main class="main-col">${UI._tabBar()}<div class="tab-content">${UI._tabContent(state)}</div></main>
      <aside class="feed-col">${UI._chartsPanel(state)}${UI._feedPanel(state)}</aside>
    </div>
    <div class="bottom-bar">
      <div class="week-display">Week ${state.calendar.week} — ${formatDate(new Date(state.calendar.date))}</div>
      <button class="btn btn-primary btn-simulate" data-action="simulate" ${state.pendingEvent ? 'disabled title="Resolve the current event first"' : ''}>SIMULATE NEXT WEEK</button>
    </div>
    ${state.pendingEvent ? UI._eventModal(state) : ''}
    ${UI.flash ? UI._flashModal(UI.flash) : ''}
  `;
};

UI._timeline = function (state) {
  return `<div class="timeline">
    ${state.eras.map(e => `
      <div class="timeline-era ${e.id === state.currentEraId ? 'active' : ''}" style="--era-color:${e.color}">
        <span class="dot"></span>${esc(e.name)}
      </div>`).join('<span class="timeline-sep">→</span>')}
    <button class="btn btn-ghost btn-tiny" data-action="rename-era">Name This Era</button>
  </div>`;
};

UI._artistCard = function (state) {
  const a = state.artist;
  const initials = a.stageName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `<div class="panel artist-card">
    <div class="avatar">${initials}</div>
    <h2>${esc(a.stageName)}</h2>
    <div class="text-dim">${esc(a.primaryGenre)}${a.secondaryGenres.length ? ' · ' + a.secondaryGenres.map(esc).join(', ') : ''}</div>
    <div class="text-dim">${esc(a.city)}, ${esc(a.country)} · Age ${a.age}</div>
    <div class="artist-metrics">
      <div><span class="metric-value">${a.fans.toLocaleString()}</span><span class="metric-label">Fans</span></div>
      <div><span class="metric-value">${Math.round(a.energy)}</span><span class="metric-label">Energy</span></div>
    </div>
  </div>`;
};

UI._statsPanel = function (state) {
  const s = state.artist.stats;
  return `<div class="panel">
    <h3>Core Skills</h3>
    ${statBar('Talent', s.talent)}
    ${statBar('Songwriting', s.songwriting)}
    ${statBar('Performance', s.performance)}
    ${statBar('Charisma', s.charisma)}
    ${statBar('Dance', s.dance)}
    ${statBar('Business', s.business)}
    ${statBar('Creativity', s.creativity)}
  </div>`;
};

UI._industryPanel = function (state) {
  const i = state.artist.industry;
  return `<div class="panel">
    <h3>Industry Standing</h3>
    ${statBar('Fame', i.fame)}
    ${statBar('Hype', i.hype)}
    ${statBar('Credibility', i.credibility)}
    ${statBar('Fan Loyalty', i.fanLoyalty)}
    ${statBar('Industry Respect', i.industryRespect)}
    <div class="public-image-badge">${esc(i.publicImage)}</div>
  </div>`;
};

UI._financePanel = function (state) {
  return `<div class="panel finance-panel">
    <h3>Balance</h3>
    <div class="money ${state.finances.balance < 0 ? 'negative' : ''}">${formatMoney(state.finances.balance)}</div>
    ${state.manager ? `<div class="text-dim">Manager: ${esc(state.manager.name)} (${esc(state.manager.personality)})</div>` : `<div class="text-dim">No manager</div>`}
    ${state.label ? `<div class="text-dim">Label: ${esc(state.label.name)}</div>` : `<div class="text-dim">Independent</div>`}
  </div>`;
};

UI._tabBar = function () {
  const tabs = [['studio', 'Studio'], ['business', 'Business'], ['live', 'Live'], ['social', 'Chattr']];
  return `<div class="tab-bar">
    ${tabs.map(([id, label]) => `<button class="tab-btn ${UI.activeTab === id ? 'active' : ''}" data-action="tab" data-tab="${id}">${label}</button>`).join('')}
  </div>`;
};

UI._tabContent = function (state) {
  switch (UI.activeTab) {
    case 'studio': return UI._studioTab(state);
    case 'business': return UI._businessTab(state);
    case 'live': return UI._liveTab(state);
    case 'social': return UI._socialTab(state);
    default: return '';
  }
};

UI._studioTab = function (state) {
  const drafts = state.songs.filter(s => s.status !== 'Released');
  const mastered = state.songs.filter(s => s.status === 'Mastered');
  return `
    <div class="panel">
      <h3>Write a New Song</h3>
      <form id="song-form" class="inline-form">
        <input name="title" required maxlength="40" placeholder="Song title"/>
        <select name="genre">${GENRES.map(g => `<option ${g === state.artist.primaryGenre ? 'selected' : ''}>${g}</option>`).join('')}</select>
        <select name="type">${SONG_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
        <button class="btn btn-primary" type="submit">Write</button>
      </form>
    </div>
    <div class="panel">
      <h3>Catalog</h3>
      ${drafts.length ? drafts.map(s => `
        <div class="song-row">
          <div>
            <div class="song-title">${esc(s.title)} <span class="tag">${s.genre} · ${s.type}</span></div>
            <div class="text-dim small">Quality ${s.quality} · Status: ${s.status}</div>
          </div>
          ${s.status !== 'Mastered' ? `<button class="btn btn-ghost" data-action="advance-song" data-id="${s.id}">Advance (-€200)</button>` : `<span class="tag tag-ready">Ready</span>`}
        </div>`).join('') : '<p class="text-dim">No songs in the works. Write one above.</p>'}
    </div>
    <div class="panel">
      <h3>Schedule a Release</h3>
      ${mastered.length ? `
      <form id="release-form" class="release-form">
        <select name="type" id="release-type">
          <option value="single">Single (1 song)</option>
          <option value="ep">EP (4–7 songs)</option>
          <option value="album">Album (8–20 songs)</option>
          <option value="mixtape">Mixtape (5–15 songs)</option>
        </select>
        <input name="title" required maxlength="40" placeholder="Release title"/>
        <div class="song-checklist">
          ${mastered.map(s => `<label><input type="checkbox" name="songIds" value="${s.id}"/> ${esc(s.title)}</label>`).join('')}
        </div>
        <button class="btn btn-primary" type="submit">Schedule for Next Friday</button>
      </form>
      <p class="text-dim small">All releases drop on Fridays only — this will land on the next available one.</p>
      ` : '<p class="text-dim">Master a song first.</p>'}
    </div>
    ${state.releases.filter(r => r.status === 'Scheduled').length ? `
    <div class="panel">
      <h3>Upcoming Releases</h3>
      ${state.releases.filter(r => r.status === 'Scheduled').map(r => `
        <div class="song-row"><div>${esc(r.title)} <span class="tag">${r.type}</span></div><div class="text-dim small">${formatDate(new Date(r.scheduledDate))}</div></div>
      `).join('')}
    </div>` : ''}
  `;
};

UI._businessTab = function (state) {
  return `
    <div class="panel">
      <h3>Manager</h3>
      ${state.manager ? `
        <p>${esc(state.manager.name)} — ${esc(state.manager.personality)}</p>
        <p class="text-dim small">Connections ${state.manager.connections} · Negotiation ${state.manager.negotiation} · Loyalty ${state.manager.loyalty} · Salary ${formatMoney(state.manager.salary)}/wk</p>
        <button class="btn btn-ghost" data-action="fire-manager">Fire Manager</button>
      ` : '<p class="text-dim">No manager yet. Managers appear as career opportunities.</p>'}
    </div>
    <div class="panel">
      <h3>Team</h3>
      <div class="team-grid">
        ${TEAM_ROLES.map(r => {
    const hired = state.team[r.id];
    return `<div class="team-card">
            <div><strong>${r.name}</strong><div class="text-dim small">${r.boosts}</div></div>
            ${hired
        ? `<button class="btn btn-ghost" data-action="fire-team" data-role="${r.id}">${esc(hired.name)} — Let go</button>`
        : `<button class="btn btn-ghost" data-action="hire-team" data-role="${r.id}">Hire — ${formatMoney(r.fee)} or ${r.fameReq} fame</button>`}
          </div>`;
  }).join('')}
      </div>
    </div>
    <div class="panel">
      <h3>Record Label</h3>
      ${state.label ? `
        <p>Signed to ${esc(state.label.name)}</p>
        <p class="text-dim small">${state.label.contract.royaltyPct}% royalty · ${state.label.contract.albumsOwed} albums owed · ${state.label.contract.creativeControl}% creative freedom</p>
        <button class="btn btn-ghost" data-action="leave-label">Buy Out Contract</button>
      ` : state.pendingLabelOffer ? `
        <p>${esc(state.pendingLabelOffer.labelName)} offer: ${formatMoney(state.pendingLabelOffer.advance)} advance, ${state.pendingLabelOffer.royalty}% royalty, ${state.pendingLabelOffer.albums} albums</p>
        <div class="btn-row">
          <button class="btn btn-primary" data-action="accept-label">Accept</button>
          <button class="btn btn-ghost" data-action="negotiate-label">Negotiate</button>
          <button class="btn btn-ghost" data-action="reject-label">Reject</button>
        </div>
      ` : '<p class="text-dim">Independent via Distributr. Label interest appears as your fame grows.</p>'}
    </div>
  `;
};

UI._liveTab = function (state) {
  const venue = Business.eligibleVenue(state);
  const releasedSongs = state.songs.filter(s => s.status === 'Released');
  return `
    <div class="panel">
      <h3>Book a Show</h3>
      <p class="text-dim small">${venue ? `Currently eligible for: ${venue.name}` : 'Not enough fame for any venue yet.'}</p>
      <button class="btn btn-primary" data-action="book-show" ${venue ? '' : 'disabled'}>Book Show (-15 energy)</button>
    </div>
    <div class="panel">
      <h3>Festivals</h3>
      <button class="btn btn-primary" data-action="apply-festival">Apply for a Festival Slot</button>
    </div>
    <div class="panel">
      <h3>Music Video</h3>
      ${releasedSongs.length ? `
      <form id="video-form" class="inline-form">
        <select name="songId">${releasedSongs.map(s => `<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select>
        <input name="budget" type="number" min="500" step="100" value="2000"/>
        <button class="btn btn-primary" type="submit">Shoot Video</button>
      </form>` : '<p class="text-dim">Release a song first.</p>'}
    </div>
  `;
};

UI._socialTab = function (state) {
  const tones = ['Confident', 'Humble', 'Controversial', 'Funny', 'Mysterious', 'Emotional'];
  const postsUsed = state.plannedActions.socialPosts || 0;
  return `
    <div class="panel">
      <h3>Post on Chattr <span class="text-dim small">(${2 - postsUsed} left this week)</span></h3>
      <form id="post-form" class="inline-form">
        <select name="tone">${tones.map(t => `<option>${t}</option>`).join('')}</select>
        <input name="text" maxlength="140" required placeholder="What's on your mind?"/>
        <button class="btn btn-primary" type="submit" ${postsUsed >= 2 ? 'disabled' : ''}>Post</button>
      </form>
    </div>
  `;
};

UI._chartsPanel = function (state) {
  const top = state.charts.global100.slice(0, 8);
  return `<div class="panel">
    <h3>The Global 100</h3>
    ${top.length ? top.map(c => `<div class="chart-row"><span class="chart-pos">#${c.position}</span>${esc(c.title)}</div>`).join('') : '<p class="text-dim small">No charting songs yet.</p>'}
  </div>`;
};

UI._feedPanel = function (state) {
  const items = [
    ...state.newsFeed.map(n => ({ ...n, kind: 'news' })),
    ...state.chattrFeed.map(p => ({ ...p, kind: 'post' }))
  ].sort((a, b) => b.week - a.week).slice(0, 25);
  return `<div class="panel feed-panel">
    <h3>This Week In Your Career</h3>
    ${items.length ? items.map(i => i.kind === 'news' ? `
      <div class="feed-item news"><div class="feed-head">${esc(i.headline)}</div>${i.body ? `<div class="text-dim small">${esc(i.body)}</div>` : ''}</div>
    ` : `
      <div class="feed-item post"><div class="feed-head">${esc(i.author)}</div><div class="text-dim small">${esc(i.text)}</div></div>
    `).join('') : '<p class="text-dim small">The feed is quiet. Simulate a week to get started.</p>'}
  </div>`;
};

UI._eventModal = function (state) {
  const e = state.pendingEvent;
  return `<div class="modal-overlay">
    <div class="modal event-modal">
      <div class="modal-eyebrow">${e.category.toUpperCase()}</div>
      <h2>${esc(e.title)}</h2>
      <p>${esc(e.description)}</p>
      <div class="btn-col">
        ${e.choices.map(c => `<button class="btn btn-primary" data-action="event-choice" data-choice="${c.id}">${esc(c.label)}</button>`).join('')}
      </div>
    </div>
  </div>`;
};

UI._flashModal = function (flash) {
  return `<div class="modal-overlay" data-action="dismiss-flash">
    <div class="modal flash-modal" data-stop>
      <h2>${esc(flash.title)}</h2>
      <div class="flash-body">${flash.body}</div>
      <button class="btn btn-primary" data-action="dismiss-flash">Continue</button>
    </div>
  </div>`;
};
