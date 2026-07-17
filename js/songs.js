/* THE ERA — song creation & performance
   Two responsibilities: (1) turn player input + artist stats into a song's
   underlying quality values, (2) simulate how that song performs once released. */

const Songs = {
  /** Creates a new song in Draft status based on the artist's current stats. */
  createSong(state, { title, genre, type }) {
    const a = state.artist;
    const s = a.stats;

    // Quality leans on talent/songwriting/creativity, with type-specific weighting.
    const typeWeights = {
      Love: { songwriting: 1.2, creativity: 0.8 },
      Pain: { songwriting: 1.3, creativity: 0.9 },
      Party: { performance: 1.1, charisma: 1.2, songwriting: 0.6 },
      Flex: { charisma: 1.2, performance: 0.9, songwriting: 0.7 },
      Street: { songwriting: 1.1, creativity: 1.0 },
      Storytelling: { songwriting: 1.4, creativity: 1.0 },
      Experimental: { creativity: 1.5, talent: 1.0, songwriting: 0.6 },
      Diss: { charisma: 1.1, songwriting: 1.2 },
      Inspirational: { songwriting: 1.1, charisma: 1.0 }
    };
    const w = typeWeights[type] || { songwriting: 1, creativity: 1 };
    const weightedTalent = s.talent * (w.talent || 0.9);
    const weightedWriting = s.songwriting * (w.songwriting || 1);
    const weightedCreativity = s.creativity * (w.creativity || 1);
    const weightedCharisma = s.charisma * (w.charisma || 0.5);
    const weightedPerformance = s.performance * (w.performance || 0.5);

    const rawQuality = (weightedTalent + weightedWriting + weightedCreativity + weightedCharisma + weightedPerformance) /
      ((w.talent || 0.9) + (w.songwriting || 1) + (w.creativity || 1) + (w.charisma || 0.5) + (w.performance || 0.5));

    const quality = clamp(Math.round(rawQuality + (Math.random() * 10 - 5)));
    const replayValue = clamp(Math.round(s.songwriting * 0.4 + s.creativity * 0.3 + Math.random() * 20));
    const mainstreamAppeal = clamp(Math.round(
      (['Party', 'Flex', 'Love'].includes(type) ? 65 : 40) + s.charisma * 0.3 - s.creativity * 0.1 + (Math.random() * 20 - 10)
    ));
    const fanConnection = clamp(Math.round(s.songwriting * 0.3 + a.industry.fanLoyalty * 0.3 + (Math.random() * 20 - 10)));
    const artisticValue = clamp(Math.round(s.creativity * 0.5 + s.talent * 0.3 + (Math.random() * 15 - 5)));
    const hypePotential = clamp(Math.round(a.industry.hype * 0.4 + mainstreamAppeal * 0.3 + (Math.random() * 20 - 10)));

    const song = {
      id: uid('song'),
      title, genre, type,
      quality, replayValue, mainstreamAppeal, fanConnection, artisticValue, hypePotential,
      status: 'Draft',
      releaseDate: null,
      weeklyStreams: [], // {week, streams}
      totalStreams: 0,
      sales: 0,
      chartHistory: { global100: [], stream100: [] }, // [{week, position}]
      peakPosition: { global100: null, stream100: null },
      performanceTier: null
    };
    state.songs.push(song);
    return song;
  },

  /** Moves a song forward: Draft -> In Production -> Mastered */
  advanceProduction(song) {
    if (song.status === 'Draft') song.status = 'In Production';
    else if (song.status === 'In Production') song.status = 'Mastered';
  },

  /** Schedules a release. Music can only drop on a Friday — if the requested
   *  date isn't a Friday, or has already passed this week, push to next Friday. */
  scheduleRelease(state, { songIds, type, title, requestedDate }) {
    const today = new Date(state.calendar.date);
    let releaseDate = requestedDate ? new Date(requestedDate) : nextFriday(today);
    if (releaseDate.getDay() !== 5 || releaseDate <= today) {
      releaseDate = nextFriday(releaseDate <= today ? today : releaseDate);
    }
    const release = {
      id: uid('release'), type, title,
      songIds, status: 'Scheduled',
      scheduledDate: releaseDate.toISOString()
    };
    state.releases.push(release);
    songIds.forEach(id => {
      const song = state.songs.find(sg => sg.id === id);
      if (song) { song.status = 'Scheduled'; song.releaseDateScheduled = releaseDate.toISOString(); }
    });
    return release;
  },

  /** Called during weekly simulation. If a release's scheduled Friday has
   *  arrived, it goes live and gets its first-week performance calculated. */
  processReleases(state, weekLog) {
    const today = new Date(state.calendar.date);
    state.releases.forEach(release => {
      if (release.status !== 'Scheduled') return;
      const scheduled = new Date(release.scheduledDate);
      if (today >= scheduled) {
        release.status = 'Released';
        release.songIds.forEach(id => {
          const song = state.songs.find(sg => sg.id === id);
          if (song && song.status !== 'Released') {
            song.status = 'Released';
            song.releaseDate = release.scheduledDate;
            this.simulateWeeklyStreams(state, song, true);
          }
        });
        const currentEra = state.eras.find(e => e.id === state.currentEraId);
        if (currentEra) currentEra.releaseIds.push(release.id);
        weekLog.releases.push({ title: release.title, type: release.type, tier: release.songIds.length ? state.songs.find(s => s.id === release.songIds[0]).performanceTier : null });
      }
    });
  },

  /** Core streaming formula for one song for the current week.
   *  isFirstWeek triggers the release-day spike + tier classification. */
  simulateWeeklyStreams(state, song, isFirstWeek) {
    const a = state.artist;
    const potential = (
      song.quality * 0.35 +
      song.mainstreamAppeal * 0.20 +
      song.replayValue * 0.15 +
      song.fanConnection * 0.15 +
      song.hypePotential * 0.15
    ) / 100;

    const industryFactor = (a.industry.fame * 0.4 + a.industry.hype * 0.35 + a.industry.fanLoyalty * 0.25) / 100;
    const audienceBase = a.fans * 0.9 + 3000; // organic discovery floor even at 0 fans

    // Randomness: rare flop, rare viral spike, otherwise a normal-ish spread.
    const roll = Math.random();
    let randomFactor;
    let forcedTier = null;
    if (roll < 0.06) { randomFactor = 0.15 + Math.random() * 0.2; forcedTier = 'FLOP'; }
    else if (roll > 0.965) { randomFactor = 3.2 + Math.random() * 2.5; forcedTier = 'CULTURAL MOMENT'; }
    else if (roll > 0.90) { randomFactor = 1.8 + Math.random() * 1.2; forcedTier = 'VIRAL'; }
    else { randomFactor = 0.7 + Math.random() * 0.7; }

    let weekMultiplier = isFirstWeek ? 1 : this._decayFactor(song);
    const streams = Math.max(0, Math.round(audienceBase * (0.3 + potential * 1.4) * (0.5 + industryFactor) * randomFactor * weekMultiplier));

    song.weeklyStreams.push({ week: state.calendar.week, streams });
    song.totalStreams += streams;

    if (isFirstWeek) {
      song.performanceTier = forcedTier || this._classifyTier(streams, audienceBase);
    }
    return streams;
  },

  _decayFactor(song) {
    const weeksSince = song.weeklyStreams.length; // number of weeks already logged
    if (song.performanceTier === 'VIRAL' || song.performanceTier === 'CULTURAL MOMENT') {
      return Math.max(0.15, 1.1 - weeksSince * 0.08);
    }
    return Math.max(0.05, 0.75 - weeksSince * 0.12);
  },

  _classifyTier(streams, audienceBase) {
    const ratio = streams / Math.max(1, audienceBase);
    if (ratio < 0.25) return 'FLOP';
    if (ratio < 0.5) return 'UNDERPERFORMING';
    if (ratio < 0.9) return 'SOLID';
    if (ratio < 1.4) return 'SUCCESSFUL';
    if (ratio < 2.2) return 'HIT';
    return 'VIRAL';
  },

  /** Recomputes both charts from all songs with streams in the last 12 weeks. */
  updateCharts(state) {
    const week = state.calendar.week;
    const active = state.songs.filter(s => s.status === 'Released' && s.weeklyStreams.length && (week - s.weeklyStreams[s.weeklyStreams.length - 1].week) <= 12);

    const ranked = [...active].sort((a, b) => {
      const aStreams = a.weeklyStreams[a.weeklyStreams.length - 1]?.streams || 0;
      const bStreams = b.weeklyStreams[b.weeklyStreams.length - 1]?.streams || 0;
      return bStreams - aStreams;
    }).slice(0, 100);

    ['global100', 'stream100'].forEach(chartKey => {
      state.charts[chartKey] = ranked.map((song, i) => ({ songId: song.id, title: song.title, position: i + 1 }));
      ranked.forEach((song, i) => {
        const pos = i + 1;
        song.chartHistory[chartKey].push({ week, position: pos });
        if (!song.peakPosition[chartKey] || pos < song.peakPosition[chartKey]) song.peakPosition[chartKey] = pos;
      });
    });
  }
};
