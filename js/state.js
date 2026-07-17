/* THE ERA — game state
   Single source of truth. Nothing outside this file should hold
   authoritative game data; systems read/mutate the shared `state` object
   passed into them. */

const SAVE_KEY = 'the_era_save_v1';

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatMoney(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}€${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextFriday(fromDate) {
  const d = new Date(fromDate);
  const day = d.getDay(); // 0 Sun .. 6 Sat, Friday = 5
  let add = (5 - day + 7) % 7;
  if (add === 0) add = 7; // must be a future/upcoming Friday, not "today" edge case handled by caller
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Creates a fresh game state from artist-creation choices. */
function createNewGame({ stageName, realName, age, gender, country, city, primaryGenre, secondaryGenres, bio, storyId, statPoints }) {
  const story = STARTING_STORIES.find(s => s.id === storyId);
  const startDate = new Date('2027-01-04T00:00:00'); // Monday, Jan 4 2027, per spec

  const baseStats = { talent: 20, songwriting: 20, performance: 20, charisma: 20, dance: 20, business: 20, creativity: 20 };
  const stats = {};
  for (const k of Object.keys(baseStats)) {
    stats[k] = clamp(baseStats[k] + (statPoints[k] || 0) + (story.stats[k] || 0), 1, 100);
  }

  const industry = {
    fame: clamp(story.industry.fame),
    hype: clamp(story.industry.hype),
    credibility: clamp(story.industry.credibility),
    fanLoyalty: clamp(story.industry.fanLoyalty),
    industryRespect: clamp(story.industry.industryRespect),
    publicImage: story.industry.publicImage
  };

  const state = {
    version: 1,
    artist: {
      stageName, realName, age, gender, country, city,
      primaryGenre, secondaryGenres: secondaryGenres.slice(0, 2),
      bio, storyId,
      stats, industry,
      fans: story.fans,
      energy: 85
    },
    calendar: { week: 1, date: startDate.toISOString() },
    eras: [{
      id: uid('era'), name: 'The Unknown Era', color: ERA_TEMPLATES[0].color,
      sound: primaryGenre, theme: 'Origins', startWeek: 1, endWeek: null, custom: false, releaseIds: []
    }],
    currentEraId: null,
    songs: [],
    releases: [],
    manager: null,
    team: { producer: null, publicist: null, lawyer: null, bookingAgent: null, creativeDirector: null, assistant: null },
    label: null,
    finances: {
      balance: story.money,
      history: [] // {week, income, expenses, net}
    },
    charts: { global100: [], stream100: [] },
    chattrFeed: [],
    newsFeed: [],
    eventLog: [],
    pendingEvent: null,
    weeklyLog: [],
    plannedActions: { studioSessions: [], socialPosts: 0 },
    notes: []
  };
  state.currentEraId = state.eras[0].id;
  return state;
}

function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Save failed', e);
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Load failed', e);
    return null;
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}
