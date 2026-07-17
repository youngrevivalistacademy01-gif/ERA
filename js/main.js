/* THE ERA — app init & event wiring
   Holds the single mutable `state` object and re-renders after every
   mutation. All DOM events are handled through delegated listeners using
   data-action attributes so ui.js can stay pure-render. */

const App = { state: null };

const root = document.getElementById('app-root');

function boot() {
  if (hasSave()) {
    root.innerHTML = `
      <div class="creation-screen boot-screen">
        <div class="creation-hero">
          <div class="eyebrow">THE ERA</div>
          <h1>WELCOME BACK</h1>
        </div>
        <div class="btn-col">
          <button class="btn btn-primary btn-large" data-action="continue-game">Continue Career</button>
          <button class="btn btn-ghost btn-large" data-action="new-game">Start New Career</button>
        </div>
      </div>`;
  } else {
    UI.renderCreation(root);
  }
}

function startGame(state) {
  App.state = state;
  saveGame(state);
  UI.flash = null;
  UI.renderGame(root, App.state);
}

function rerender() {
  saveGame(App.state);
  UI.renderGame(root, App.state);
}

function showFlash(title, body) {
  UI.flash = { title, body };
  UI.renderGame(root, App.state);
}

function weekSummaryHtml(weekLog) {
  const lines = [];
  lines.push(`<div class="summary-row"><span>Money in / out</span><span>${formatMoney(weekLog.moneyIn - weekLog.moneyOut)}</span></div>`);
  lines.push(`<div class="summary-row"><span>Fans</span><span>${weekLog.fanDeltaFinal >= 0 ? '+' : ''}${weekLog.fanDeltaFinal}</span></div>`);
  lines.push(`<div class="summary-row"><span>Streams this week</span><span>${weekLog.streamsThisWeek.toLocaleString()}</span></div>`);
  lines.push(`<div class="summary-row"><span>Hype</span><span>${weekLog.hypeDelta >= 0 ? '+' : ''}${weekLog.hypeDelta.toFixed(1)}</span></div>`);
  lines.push(`<div class="summary-row"><span>Fame</span><span>${weekLog.fameDelta >= 0 ? '+' : ''}${weekLog.fameDelta.toFixed(1)}</span></div>`);
  if (weekLog.releases.length) lines.push(`<div class="summary-row"><span>Releases</span><span>${weekLog.releases.map(r => `${esc(r.title)} (${r.tier || '—'})`).join(', ')}</span></div>`);
  if (weekLog.chartHighlights.length) lines.push(`<div class="summary-row"><span>Charts</span><span>${weekLog.chartHighlights.map(esc).join('; ')}</span></div>`);
  if (weekLog.eraChange) lines.push(`<div class="summary-row highlight"><span>New Era</span><span>${esc(weekLog.eraChange)}</span></div>`);
  if (weekLog.newEvent) lines.push(`<div class="summary-row highlight"><span>New Event</span><span>${esc(weekLog.newEvent.title)}</span></div>`);
  return lines.join('');
}

document.addEventListener('submit', (ev) => {
  const form = ev.target;

  if (form.id === 'creation-form') {
    ev.preventDefault();
    const data = UI.readCreationForm(root);
    if (data.error) { alert(data.error); return; }
    if (!data.stageName || !data.realName || !data.country || !data.city) { alert('Please fill in all required fields.'); return; }
    const state = createNewGame(data);
    startGame(state);
    return;
  }

  if (form.id === 'song-form') {
    ev.preventDefault();
    const fd = new FormData(form);
    Songs.createSong(App.state, { title: fd.get('title').trim(), genre: fd.get('genre'), type: fd.get('type') });
    rerender();
    return;
  }

  if (form.id === 'release-form') {
    ev.preventDefault();
    const fd = new FormData(form);
    const songIds = fd.getAll('songIds');
    const type = fd.get('type');
    const minCounts = { single: 1, ep: 4, album: 8, mixtape: 5 };
    if (songIds.length < minCounts[type]) {
      alert(`A ${type} needs at least ${minCounts[type]} mastered song(s). You selected ${songIds.length}.`);
      return;
    }
    Songs.scheduleRelease(App.state, { songIds, type, title: fd.get('title').trim() });
    rerender();
    return;
  }

  if (form.id === 'video-form') {
    ev.preventDefault();
    const fd = new FormData(form);
    const result = Business.createMusicVideo(App.state, fd.get('songId'), parseInt(fd.get('budget'), 10) || 0);
    rerender();
    if (!result.ok) alert(result.text);
    return;
  }

  if (form.id === 'post-form') {
    ev.preventDefault();
    const fd = new FormData(form);
    if ((App.state.plannedActions.socialPosts || 0) >= 2) { alert('No posts left this week.'); return; }
    Social.playerPost(App.state, { text: fd.get('text').trim(), tone: fd.get('tone') });
    App.state.plannedActions.socialPosts = (App.state.plannedActions.socialPosts || 0) + 1;
    form.reset();
    rerender();
    return;
  }
});

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'continue-game') { const s = loadGame(); if (s) startGame(s); return; }
  if (action === 'new-game') { deleteSave(); UI.renderCreation(root); return; }

  if (action === 'dismiss-flash') {
    if (ev.target.closest('[data-stop]') && ev.target !== el) return;
    UI.flash = null;
    UI.renderGame(root, App.state);
    return;
  }

  if (!App.state) return;

  switch (action) {
    case 'tab':
      UI.activeTab = el.dataset.tab;
      UI.renderGame(root, App.state);
      return;

    case 'simulate': {
      if (App.state.pendingEvent) return;
      App.state.plannedActions.socialPosts = 0;
      const weekLog = Simulation.simulateWeek(App.state);
      rerender();
      if (!App.state.pendingEvent) showFlash(`Week ${weekLog.week} Complete`, weekSummaryHtml(weekLog));
      return;
    }

    case 'event-choice': {
      Events.resolveChoice(App.state, el.dataset.choice);
      rerender();
      return;
    }

    case 'advance-song': {
      const song = App.state.songs.find(s => s.id === el.dataset.id);
      if (!song) return;
      if (App.state.finances.balance < 200) { alert('Not enough money to advance production.'); return; }
      App.state.finances.balance -= 200;
      Songs.advanceProduction(song);
      rerender();
      return;
    }

    case 'book-show': {
      const result = Business.bookShow(App.state);
      rerender();
      if (!result.ok) alert(result.text); else showFlash('Show Results', `<p>${esc(result.text)}</p>`);
      return;
    }
    case 'apply-festival': {
      const result = Business.applyFestivalSlot(App.state);
      rerender();
      if (!result.ok) alert(result.text); else showFlash('Festival Booked', `<p>${esc(result.text)}</p>`);
      return;
    }

    case 'hire-team': {
      const result = Business.hireTeamMember(App.state, el.dataset.role);
      rerender();
      if (!result.ok) alert(result.text);
      return;
    }
    case 'fire-team': {
      Business.fireTeamMember(App.state, el.dataset.role);
      rerender();
      return;
    }
    case 'fire-manager': {
      Business.fireManager(App.state);
      rerender();
      return;
    }

    case 'accept-label': Business.acceptLabelOffer(App.state); rerender(); return;
    case 'negotiate-label': { const r = Business.negotiateLabelOffer(App.state); rerender(); alert(r.text); return; }
    case 'reject-label': Business.rejectLabelOffer(App.state); rerender(); return;
    case 'leave-label': {
      if (confirm('Buying out your contract costs money and hurts credibility. Continue?')) { Business.leaveLabel(App.state); rerender(); }
      return;
    }

    case 'rename-era': {
      const name = prompt('Name this era:');
      if (name && name.trim()) {
        const color = prompt('Pick a hex color for this era (e.g. #C9A24B):', '#C9A24B') || '#C9A24B';
        Simulation.nameCurrentEra(App.state, name.trim(), color);
        rerender();
      }
      return;
    }
    default: return;
  }
});

boot();
