/* THE ERA — career event system
   rollEvent() picks a weighted, requirement-filtered event each week (if any).
   resolveChoice() applies the named effect handler. Handlers live in EFFECTS
   so the event data (data.js) stays pure data, no inline logic. */

const Events = {
  /** Rolls at most one new event per week, respecting requirements + weights. */
  rollEvent(state) {
    if (state.pendingEvent) return null; // don't stack events
    const eligible = EVENT_POOL.filter(e => e.requirement(state));
    if (!eligible.length) return null;

    // ~55% chance no event happens at all in a given week, to avoid overload.
    if (Math.random() < 0.55) return null;

    const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const e of eligible) {
      roll -= e.weight;
      if (roll <= 0) {
        const instance = {
          id: uid('evt'), templateId: e.id, category: e.category,
          title: e.title, description: e.description(state),
          choices: e.choices, week: state.calendar.week, resolved: false, outcome: null
        };
        state.pendingEvent = instance;
        return instance;
      }
    }
    return null;
  },

  /** Player resolves the pending event by choosing one option. */
  resolveChoice(state, choiceId) {
    const evt = state.pendingEvent;
    if (!evt) return null;
    const choice = evt.choices.find(c => c.id === choiceId);
    if (!choice) return null;

    const handler = EFFECTS[choice.effect] || EFFECTS.none;
    const outcome = handler(state);

    evt.resolved = true;
    evt.chosenId = choiceId;
    evt.outcome = outcome;
    state.eventLog.push(evt);
    state.pendingEvent = null;
    return outcome;
  }
};

function bumpStat(obj, key, amount, min = 0, max = 100) {
  obj[key] = clamp(obj[key] + amount, min, max);
}

const EFFECTS = {
  none: () => ({ text: 'You let it pass.' }),

  hireStarterManager: (state) => {
    state.manager = {
      name: `${NAME_POOL.first[Math.floor(Math.random() * NAME_POOL.first.length)]} ${NAME_POOL.last[Math.floor(Math.random() * NAME_POOL.last.length)]}`,
      age: 24 + Math.floor(Math.random() * 8),
      connections: 15 + Math.floor(Math.random() * 15),
      negotiation: 25 + Math.floor(Math.random() * 20),
      loyalty: 60 + Math.floor(Math.random() * 25),
      experience: 10,
      reputation: 10,
      salary: 150,
      personality: MANAGER_PERSONALITIES[Math.floor(Math.random() * MANAGER_PERSONALITIES.length)],
      weeksTogether: 0
    };
    return { text: `You hired ${state.manager.name} as your manager.` };
  },
  revealManagerInfo: () => ({ text: 'You get a bit more background but the offer stays on the table for next time.' }),

  localProducerBoost: (state) => {
    state.finances.balance -= 400;
    state.artist.stats.songwriting = clamp(state.artist.stats.songwriting + 1);
    return { text: 'The session went well — small but real improvement to your songwriting.', money: -400 };
  },

  smallInterviewBoost: (state) => {
    bumpStat(state.artist.industry, 'fame', 2);
    bumpStat(state.artist.industry, 'hype', 3);
    return { text: 'The interview gave you a small visibility bump.' };
  },

  openingSlotBoost: (state) => {
    bumpStat(state.artist.industry, 'fame', 5);
    bumpStat(state.artist.industry, 'fanLoyalty', 3);
    state.artist.energy = clamp(state.artist.energy - 10);
    state.artist.fans += Math.round(state.artist.fans * 0.02) + 50;
    return { text: 'You held your own opening for a bigger artist.' };
  },

  localRadioBoost: (state) => {
    bumpStat(state.artist.industry, 'hype', 4);
    state.artist.fans += Math.round(state.artist.fans * 0.015) + 30;
    return { text: 'Radio rotation brought in new listeners.' };
  },

  labelMeeting: (state) => {
    const eligible = RECORD_LABELS.filter(l => l.focus.includes(state.artist.primaryGenre)) || RECORD_LABELS;
    const label = (eligible.length ? eligible : RECORD_LABELS)[Math.floor(Math.random() * (eligible.length ? eligible.length : RECORD_LABELS.length))];
    const advance = Math.round((state.artist.industry.fame * 800 + state.artist.fans * 0.4) * (0.7 + Math.random() * 0.6));
    const royalty = Math.round(12 + Math.random() * 10);
    state.pendingLabelOffer = {
      labelId: label.id, labelName: label.name,
      advance, royalty, albums: 2 + Math.floor(Math.random() * 2),
      creativeControl: label.creativeFreedom
    };
    bumpStat(state.artist.industry, 'industryRespect', 2);
    return { text: `${label.name} made contact. Review the offer in the Label tab.` };
  },

  collabAccept: (state) => {
    bumpStat(state.artist.industry, 'fame', 4);
    bumpStat(state.artist.industry, 'hype', 6);
    const riskRoll = Math.random();
    if (riskRoll < 0.25) {
      bumpStat(state.artist.industry, 'credibility', -3);
      return { text: 'The collab did numbers, but some called it a reach for clout.' };
    }
    return { text: 'The collaboration landed well for both artists.' };
  },
  sponsorAccept: (state) => {
    const pay = Math.round(1000 + state.artist.industry.fame * 60 + Math.random() * 1000);
    state.finances.balance += pay;
    if (Math.random() < 0.3) bumpStat(state.artist.industry, 'credibility', -4);
    return { text: `Sponsorship paid ${formatMoney(pay)}.`, money: pay };
  },

  familyAddress: (state) => {
    state.artist.energy = clamp(state.artist.energy + 5);
    return { text: 'You made space for family. It cost you studio time but you feel steadier.' };
  },
  familyIgnore: (state) => {
    state.artist.energy = clamp(state.artist.energy - 12);
    bumpStat(state.artist.industry, 'fanLoyalty', -1);
    return { text: 'You pushed through, but it wore on you.' };
  },
  friendGive: (state) => {
    state.finances.balance -= 500;
    bumpStat(state.artist.industry, 'fanLoyalty', 1);
    return { text: 'You helped them out.', money: -500 };
  },
  friendRefuse: () => ({ text: 'You said no. It was the right call financially.' }),
  restWeek: (state) => {
    state.artist.energy = clamp(state.artist.energy + 30);
    return { text: 'You rested. Energy restored.' };
  },
  pushThrough: (state) => {
    state.artist.energy = clamp(state.artist.energy - 15);
    if (Math.random() < 0.3) bumpStat(state.artist.stats, 'creativity', -2);
    return { text: 'You pushed through on fumes.' };
  },
  creativeReset: (state) => {
    state.artist.energy = clamp(state.artist.energy + 8);
    bumpStat(state.artist.stats, 'creativity', 2);
    return { text: 'The break gave you clarity.' };
  },
  creativeForce: (state) => {
    if (Math.random() < 0.5) bumpStat(state.artist.stats, 'creativity', -3);
    return { text: 'You forced it out. Mixed results.' };
  },

  leakEmbrace: (state) => {
    bumpStat(state.artist.industry, 'hype', 8);
    bumpStat(state.artist.industry, 'credibility', -2);
    return { text: 'You leaned into the leak — hype spiked.' };
  },
  leakControl: (state) => {
    state.finances.balance -= 300;
    bumpStat(state.artist.industry, 'hype', 2);
    return { text: 'You contained most of the damage.', money: -300 };
  },
  driveFailure: (state) => {
    const draft = state.songs.find(s => s.status === 'Draft' || s.status === 'In Production');
    if (draft) { state.songs = state.songs.filter(s => s.id !== draft.id); }
    state.artist.energy = clamp(state.artist.energy - 10);
    return { text: 'The work is gone. All you can do is start again.' };
  },
  badInterviewAddress: (state) => {
    bumpStat(state.artist.industry, 'credibility', 2);
    bumpStat(state.artist.industry, 'hype', -2);
    return { text: 'Addressing it head-on cooled things down.' };
  },
  badInterviewIgnore: (state) => {
    bumpStat(state.artist.industry, 'publicImage_dummy', 0); // no-op placeholder for symmetry
    if (Math.random() < 0.4) bumpStat(state.artist.industry, 'credibility', -3);
    return { text: 'You said nothing. It mostly blew over.' };
  },
  rivalClapback: (state) => {
    bumpStat(state.artist.industry, 'hype', 6);
    if (Math.random() < 0.4) bumpStat(state.artist.industry, 'industryRespect', -3);
    return { text: 'The clapback got attention — and made an enemy.' };
  },
  rivalIgnore: (state) => {
    bumpStat(state.artist.industry, 'industryRespect', 3);
    return { text: 'Rising above it earned quiet respect.' };
  },
  rumorDeny: (state) => {
    if (Math.random() < 0.5) bumpStat(state.artist.industry, 'credibility', -1);
    else bumpStat(state.artist.industry, 'credibility', 2);
    return { text: 'You denied it publicly. Reaction was mixed.' };
  },
  rumorIgnore: (state) => {
    bumpStat(state.artist.industry, 'hype', 2);
    return { text: 'It faded on its own, mostly.' };
  },

  viralRide: (state) => {
    bumpStat(state.artist.industry, 'hype', 15);
    state.artist.fans += Math.round(state.artist.fans * 0.08) + 500;
    return { text: 'You capitalized on the moment. Fanbase jumped.' };
  },
  celebRepost: (state) => {
    bumpStat(state.artist.industry, 'fame', 8);
    bumpStat(state.artist.industry, 'hype', 12);
    state.artist.fans += Math.round(state.artist.fans * 0.12) + 1000;
    return { text: 'The repost sent your numbers soaring.' };
  },
  greatBeat: (state) => {
    state.finances.balance -= 300;
    bumpStat(state.artist.stats, 'creativity', 1);
    state.notes.push({ week: state.calendar.week, text: 'You banked a great unused beat for a future song.' });
    return { text: 'You secured the beat for a future release.', money: -300 };
  }
};
