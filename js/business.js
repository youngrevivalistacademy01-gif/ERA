/* THE ERA — business systems
   Shows, festivals, team, labels, and music videos. Kept together since
   they're all "spend money/energy now, move stats or income" actions
   triggered from the Business/Live tabs rather than the weekly pipeline. */

const Business = {
  eligibleVenue(state) {
    const fame = state.artist.industry.fame;
    const tiers = VENUE_TIERS.filter(v => fame >= v.fameReq);
    return tiers.length ? tiers[tiers.length - 1] : null;
  },

  bookShow(state) {
    const venue = this.eligibleVenue(state);
    if (!venue) return { ok: false, text: 'Not enough fame to book any venue yet.' };
    const attendanceCap = venue.capMin + Math.random() * (venue.capMax - venue.capMin);
    const demandFactor = clamp((state.artist.industry.fanLoyalty * 0.5 + state.artist.industry.fame * 0.5) / 100, 0.1, 1);
    const attendance = Math.round(attendanceCap * (0.4 + demandFactor * 0.6));
    const ticketPrice = 15 + state.artist.industry.fame * 0.4;
    const revenue = Math.round(attendance * ticketPrice * 0.6); // 60% net after venue cut
    const perfRoll = (state.artist.stats.performance * 0.6 + state.artist.stats.charisma * 0.4) / 100;
    const perfScore = clamp(Math.round(perfRoll * 100 + (Math.random() * 20 - 10)));

    state.finances.balance += revenue;
    state.artist.energy = clamp(state.artist.energy - 15);
    bumpStat(state.artist.industry, 'fanLoyalty', perfScore > 65 ? 2 : perfScore < 35 ? -2 : 0);
    state.artist.fans += Math.round(attendance * 0.05);

    return {
      ok: true,
      text: `Played a ${venue.name} show — ${attendance.toLocaleString()} attendance, ${formatMoney(revenue)} net.`,
      venue: venue.name, attendance, revenue, perfScore
    };
  },

  applyFestivalSlot(state) {
    const fame = state.artist.industry.fame;
    const eligibleSlots = FESTIVAL_SLOTS.filter(s => fame >= s.fameReq);
    if (!eligibleSlots.length) return { ok: false, text: 'No festival is interested yet — build more fame.' };
    const slot = eligibleSlots[eligibleSlots.length - 1];
    const candidates = FESTIVALS.filter(f => !f.genreFocus || f.genreFocus.includes(state.artist.primaryGenre));
    const festival = (candidates.length ? candidates : FESTIVALS)[Math.floor(Math.random() * (candidates.length ? candidates.length : FESTIVALS.length))];

    const fee = Math.round(festival.prestige * 200 * (slot.fameReq / 50));
    state.finances.balance += fee;
    bumpStat(state.artist.industry, 'fame', slot.id === 'headliner' ? 6 : slot.id === 'mainstage' ? 4 : 2);
    bumpStat(state.artist.industry, 'hype', 8);
    state.artist.fans += Math.round(state.artist.fans * 0.03) + 200;
    state.artist.energy = clamp(state.artist.energy - 20);

    return { ok: true, text: `Booked as ${slot.name} at ${festival.name} — paid ${formatMoney(fee)}.`, festival: festival.name, slot: slot.name, fee };
  },

  createMusicVideo(state, songId, budget) {
    const song = state.songs.find(s => s.id === songId);
    if (!song || song.status !== 'Released') return { ok: false, text: 'Pick a released song for the video.' };
    if (state.finances.balance < budget) return { ok: false, text: 'Not enough money for that budget.' };
    state.finances.balance -= budget;
    const dirBonus = state.team.creativeDirector ? 15 : 0;
    const quality = clamp(Math.round(budget / 500 + dirBonus + Math.random() * 15));
    const hypeGain = Math.round(quality * 0.25);
    bumpStat(state.artist.industry, 'hype', hypeGain);
    // A strong video gives the song a second-wind streaming bump next week.
    song.weeklyStreams.push({ week: state.calendar.week, streams: Math.round((song.weeklyStreams[0]?.streams || 1000) * (quality / 100)) });
    song.totalStreams += song.weeklyStreams[song.weeklyStreams.length - 1].streams;
    return { ok: true, text: `Music video for "${song.title}" shot at ${quality}/100 quality (+${hypeGain} hype).`, quality };
  },

  hireTeamMember(state, roleId) {
    const role = TEAM_ROLES.find(r => r.id === roleId);
    if (!role) return { ok: false, text: 'Unknown role.' };
    if (state.team[roleId]) return { ok: false, text: 'Already hired.' };
    const meetsFame = state.artist.industry.fame >= role.fameReq;
    const canAffordFee = state.finances.balance >= role.fee;
    if (!meetsFame && !canAffordFee) {
      return { ok: false, text: `Needs ${role.fameReq} fame or ${formatMoney(role.fee)} to hire without it.` };
    }
    if (!meetsFame) state.finances.balance -= role.fee; // paying the fee waives the fame requirement
    state.team[roleId] = { name: `${pick(NAME_POOL.first)} ${pick(NAME_POOL.last)}`, salary: role.salary, roleId };
    return { ok: true, text: `Hired a ${role.name}.` };
  },

  fireTeamMember(state, roleId) {
    state.team[roleId] = null;
    return { ok: true, text: 'Let them go.' };
  },

  fireManager(state) {
    if (!state.manager) return { ok: false, text: 'No manager to fire.' };
    const loyalty = state.manager.loyalty;
    state.manager = null;
    if (loyalty > 70) bumpStat(state.artist.industry, 'industryRespect', -3);
    return { ok: true, text: 'You parted ways with your manager.' };
  },

  acceptLabelOffer(state) {
    const offer = state.pendingLabelOffer;
    if (!offer) return { ok: false, text: 'No offer pending.' };
    state.finances.balance += offer.advance;
    state.label = {
      name: offer.labelName,
      contract: {
        albumsOwed: offer.albums, albumsDelivered: 0,
        royaltyPct: offer.royalty, creativeControl: offer.creativeControl,
        weeklyOverhead: 100
      }
    };
    state.pendingLabelOffer = null;
    return { ok: true, text: `Signed with ${state.label.name}.` };
  },

  negotiateLabelOffer(state) {
    const offer = state.pendingLabelOffer;
    if (!offer) return { ok: false, text: 'No offer pending.' };
    const lawyerBonus = state.team.lawyer ? 1.15 : 1.0;
    const success = Math.random() < (0.35 + (state.artist.stats.business / 300)) * lawyerBonus;
    if (success) {
      offer.advance = Math.round(offer.advance * 1.2);
      offer.royalty = Math.min(35, offer.royalty + 3);
      return { ok: true, text: 'Negotiation worked — better terms on the table.' };
    }
    offer.advance = Math.round(offer.advance * 0.95);
    return { ok: true, text: 'They held firm and shaved the advance slightly.' };
  },

  rejectLabelOffer(state) {
    state.pendingLabelOffer = null;
    return { ok: true, text: 'Offer rejected. Staying independent for now.' };
  },

  leaveLabel(state) {
    if (!state.label) return { ok: false, text: 'Not signed to a label.' };
    const penalty = Math.round(state.label.contract.albumsOwed * 5000);
    state.finances.balance -= penalty;
    bumpStat(state.artist.industry, 'credibility', -5);
    state.label = null;
    return { ok: true, text: `Left the label. Buyout cost ${formatMoney(penalty)}.` };
  },

  /** Independent release via Distributr — flat cheap distribution fee, no label cut. */
  distributrFee(release) {
    const perSong = { single: 25, ep: 60, album: 120, mixtape: 90 };
    return perSong[release.type] || 40;
  }
};
