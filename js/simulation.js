/* THE ERA — weekly simulation pipeline
   simulateWeek() runs the full 9-step order from the spec and returns a
   weekLog object the UI renders as "THIS WEEK IN YOUR CAREER". */

const Simulation = {
  simulateWeek(state) {
    if (state.pendingEvent) {
      throw new Error('Resolve the current event before simulating the next week.');
    }

    const weekLog = {
      week: state.calendar.week,
      moneyIn: 0, moneyOut: 0,
      fanDelta: 0, fansBefore: state.artist.fans,
      streamsThisWeek: 0,
      releases: [],
      chartHighlights: [],
      hypeDelta: 0, fameDelta: 0,
      newEvent: null,
      chattrPosts: [], news: []
    };

    // 1. Resolve current events — manager weekly tick, energy regen baseline.
    this._resolveOngoing(state, weekLog);

    // 2. Process passive stats and finances (recurring costs/income before release income).
    this._processFinancesPre(state, weekLog);

    // 3. Process music performance (release day + ongoing decay streams).
    const hypeBefore = state.artist.industry.hype;
    const fameBefore = state.artist.industry.fame;
    Songs.processReleases(state, weekLog);
    state.songs.filter(s => s.status === 'Released' && s.releaseDate !== null)
      .forEach(s => {
        const alreadyLoggedThisWeek = s.weeklyStreams.length && s.weeklyStreams[s.weeklyStreams.length - 1].week === state.calendar.week;
        if (!alreadyLoggedThisWeek) {
          const streams = Songs.simulateWeeklyStreams(state, s, false);
          weekLog.streamsThisWeek += streams;
        } else {
          weekLog.streamsThisWeek += s.weeklyStreams[s.weeklyStreams.length - 1].streams;
        }
      });

    // 4. Process chart movement.
    const prevPositions = {};
    state.charts.global100.forEach(c => { prevPositions[c.songId] = c.position; });
    Songs.updateCharts(state);
    state.charts.global100.forEach(c => {
      const prev = prevPositions[c.songId];
      if (prev === undefined && c.position <= 40) {
        weekLog.chartHighlights.push(`"${c.title}" debuts at #${c.position} on The Global 100`);
      } else if (prev !== undefined && c.position === 1 && prev !== 1) {
        weekLog.chartHighlights.push(`"${c.title}" hits #1 on The Global 100`);
      }
    });

    // 5. Process fan growth/loss.
    this._processFans(state, weekLog);

    // 6. Process industry relationships (manager growth, label attitude, decay of hype toward baseline).
    this._processIndustry(state, weekLog);
    weekLog.hypeDelta = state.artist.industry.hype - hypeBefore;
    weekLog.fameDelta = state.artist.industry.fame - fameBefore;

    // 7. Generate new weekly events.
    weekLog.newEvent = Events.rollEvent(state);

    // 8. Generate news and social media activity.
    weekLog.chattrPosts = Social.generateWeeklyFeed(state, weekLog);
    weekLog.news = Social.generateNews(state, weekLog);

    // 9. Advance the calendar by exactly one week.
    this._advanceCalendar(state);

    this._detectEra(state, weekLog);

    weekLog.fanDeltaFinal = state.artist.fans - weekLog.fansBefore;
    state.weeklyLog.push(weekLog);
    if (state.weeklyLog.length > 200) state.weeklyLog.shift(); // cap history size
    return weekLog;
  },

  _resolveOngoing(state, weekLog) {
    // Natural energy regeneration if not exhausted.
    state.artist.energy = clamp(state.artist.energy + 6);
    if (state.manager) state.manager.weeksTogether += 1;
  },

  _processFinancesPre(state, weekLog) {
    let expenses = 0;
    if (state.manager) expenses += state.manager.salary;
    Object.values(state.team).forEach(member => { if (member) expenses += member.salary || 0; });
    if (state.label) expenses += state.label.contract.weeklyOverhead || 0;

    // Passive lifestyle upkeep scales gently with fame (staying relevant costs money).
    const lifestyle = 50 + state.artist.industry.fame * 3;
    expenses += lifestyle;

    state.finances.balance -= expenses;
    weekLog.moneyOut += expenses;
  },

  _processFans(state, weekLog) {
    const a = state.artist;
    // Streams convert to new fans at a small rate, scaled by hype/credibility.
    const conversionRate = 0.002 * (0.5 + a.industry.hype / 100) * (0.6 + a.industry.credibility / 150);
    let gained = Math.round(weekLog.streamsThisWeek * conversionRate);

    // Passive churn: low fan loyalty bleeds fans slowly.
    let churn = Math.round(a.fans * (0.004 + (100 - a.industry.fanLoyalty) * 0.00006));

    a.fans = Math.max(0, a.fans + gained - churn);
    weekLog.fanDelta = gained - churn;
  },

  _processIndustry(state, weekLog) {
    const ind = state.artist.industry;
    // Hype decays toward a baseline related to fame if nothing is happening.
    const hypeBaseline = ind.fame * 0.3;
    ind.hype = clamp(ind.hype + (hypeBaseline - ind.hype) * 0.08);

    // Fame creeps up slowly if hype has been sustained high, and can never regress below what's "earned".
    if (ind.hype > 60) ind.fame = clamp(ind.fame + 0.4);

    if (state.manager) {
      // Manager slowly improves the longer you work together.
      if (state.manager.weeksTogether % 8 === 0) {
        bumpStat(state.manager, 'connections', 2);
        bumpStat(state.manager, 'negotiation', 2);
        bumpStat(state.manager, 'reputation', 3);
      }
    }
  },

  _advanceCalendar(state) {
    const d = new Date(state.calendar.date);
    d.setDate(d.getDate() + 7);
    state.calendar.date = d.toISOString();
    state.calendar.week += 1;
  },

  _detectEra(state, weekLog) {
    const ind = state.artist.industry;
    const current = state.eras.find(e => e.id === state.currentEraId);
    if (!current || current.custom) return; // player-named eras persist until they end it manually

    let suggested = null;
    if (ind.fame >= 80 && state.calendar.week - (state.eras[0].startWeek || 1) >= 260) suggested = 'legacy';
    else if (weekLog.fameDelta < -3 && ind.hype < 25) suggested = 'fall';
    else if (ind.fame >= 60) suggested = 'supernova';
    else if (ind.fame >= 20) suggested = 'rise';
    else suggested = 'unknown';

    const template = ERA_TEMPLATES.find(e => e.id === suggested);
    const currentTemplateMatchesName = ERA_TEMPLATES.some(e => e.name === current.name);
    if (template && current.name !== template.name && currentTemplateMatchesName) {
      current.endWeek = state.calendar.week - 1;
      const newEra = {
        id: uid('era'), name: template.name, color: template.color,
        sound: state.artist.primaryGenre, theme: template.id, startWeek: state.calendar.week,
        endWeek: null, custom: false, releaseIds: []
      };
      state.eras.push(newEra);
      state.currentEraId = newEra.id;
      weekLog.eraChange = newEra.name;
    }
  },

  /** Player can rename/claim the current era as a custom one, freezing auto-detection. */
  nameCurrentEra(state, name, color) {
    const current = state.eras.find(e => e.id === state.currentEraId);
    if (current) { current.name = name; current.color = color || current.color; current.custom = true; }
  }
};
