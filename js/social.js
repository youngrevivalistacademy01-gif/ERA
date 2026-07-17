/* THE ERA — Chattr (fictional social platform) + news generation
   Posts are template-driven but pull real numbers/state so the feed feels
   like it's actually reacting to what the player did that week. */

const CHATTR_HANDLES = {
  press: ['@MusicRadar', '@PopCultureDaily', '@ChartWatch', '@IndustryInsider'],
  fan: ['@FanAccount', '@StreetTeam', '@DailyListener'],
  rival: ['@RivalArtist', '@AnonymousIndustry'],
  neutral: ['@ChattrTrending', '@WeeklyWrap']
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const Social = {
  generateWeeklyFeed(state, weekLog) {
    const posts = [];
    const name = state.artist.stageName;

    if (weekLog.releases.length) {
      weekLog.releases.forEach(r => {
        posts.push(this._post('press', `Is ${name}'s new ${r.type.toLowerCase()} "${r.title}" living up to the hype? Early numbers say ${r.tier || 'the streams'} tell the story.`));
        if (r.tier === 'FLOP' || r.tier === 'UNDERPERFORMING') {
          posts.push(this._post('rival', `Some people need to learn the difference between fame and talent.`));
        } else if (r.tier === 'HIT' || r.tier === 'VIRAL' || r.tier === 'CULTURAL MOMENT') {
          posts.push(this._post('fan', `nobody is talking about how good "${r.title}" actually is. ${name} ATE.`));
        }
      });
    }

    if (weekLog.fanDelta > 500) {
      posts.push(this._post('fan', `${name}'s fanbase is growing so fast right now, what's in the water 👀`));
    } else if (weekLog.fanDelta < -300) {
      posts.push(this._post('press', `${name} has been unusually quiet lately 👀`));
    }

    if (state.artist.industry.hype > 70 && Math.random() < 0.5) {
      posts.push(this._post('press', `Hearing that ${name} has been in the studio with a major producer.`));
    }

    if (state.pendingLabelOffer && Math.random() < 0.4) {
      posts.push(this._post('neutral', `Industry chatter says ${name} is fielding a real label offer right now.`));
    }

    if (!posts.length && Math.random() < 0.3) {
      posts.push(this._post('neutral', `Quiet week for ${name} on the charts.`));
    }

    posts.forEach(p => state.chattrFeed.push({ ...p, week: state.calendar.week, id: uid('post') }));
    return posts;
  },

  _post(type, text) {
    return { author: pick(CHATTR_HANDLES[type]), text, type, likes: Math.floor(Math.random() * 5000) };
  },

  /** A player-authored post. Limited per week from ui.js/main.js. */
  playerPost(state, { text, tone }) {
    const toneEffects = {
      Confident: { hype: 3, credibility: -1 },
      Humble: { fanLoyalty: 2, hype: 1 },
      Controversial: { hype: 8, credibility: -3 },
      Funny: { hype: 4, fanLoyalty: 1 },
      Mysterious: { hype: 5 },
      Emotional: { fanLoyalty: 3, credibility: 1 }
    };
    const fx = toneEffects[tone] || {};
    Object.entries(fx).forEach(([k, v]) => bumpStat(state.artist.industry, k, v));
    state.chattrFeed.push({
      id: uid('post'), week: state.calendar.week, author: `@${state.artist.stageName.replace(/\s+/g, '')}`,
      text, type: 'player', likes: Math.floor(Math.random() * state.artist.fans * 0.05)
    });
  },

  generateNews(state, weekLog) {
    const headlines = [];
    if (weekLog.releases.length) {
      weekLog.releases.forEach(r => {
        headlines.push({
          id: uid('news'), week: state.calendar.week,
          headline: `${state.artist.stageName} Releases New ${r.type}: "${r.title}"`,
          body: `First-week reception is being described as ${r.tier || 'developing'}.`
        });
      });
    }
    if (weekLog.chartHighlights.length) {
      weekLog.chartHighlights.forEach(h => headlines.push({ id: uid('news'), week: state.calendar.week, headline: h, body: '' }));
    }
    headlines.forEach(h => state.newsFeed.push(h));
    return headlines;
  }
};
