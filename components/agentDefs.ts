export interface AgentContext {
  artist: string
  tikTok: string
  photoName: string
  trackName: string
  pdfName: string
}

export interface AgentDef {
  id: string
  name: string
  role: string
  specialty: string
  accent: string
  brief: string
  generate: (ctx: AgentContext) => string
}

export const AGENTS: AgentDef[] = [
  {
    id: "brand",
    name: "Nova",
    role: "Brand Strategist",
    specialty: "Identity · Positioning · Audience",
    accent: "#c8ff00",
    brief: "Defines your artist identity, brand pillars, taglines, and the core hashtag set that anchors every campaign.",
    generate: ({ artist, tikTok, photoName }) => {
      const tag = artist.replace(/\s+/g, "")
      const lines = [
        "━━ BRAND PROFILE ━━━━━━━━━━━━━━━━━━━━━",
        "Artist:       " + artist,
        "Genre Lane:   Trap / Hip-Hop · Dark Street",
        "Core Demo:    Ages 16-28 · Urban youth",
        "              Sneaker culture · Late-night",
      ]
      if (photoName) lines.push("Cover Art:    " + photoName + " [ready]")
      lines.push(
        "",
        "━━ BRAND PILLARS ━━━━━━━━━━━━━━━━━━━━",
        "Diamond  Authenticity   Raw, unfiltered storytelling",
        "Diamond  Exclusivity    Limited drops, tight community",
        "Diamond  Grind          Every release is a statement",
        "",
        "━━ TAGLINE OPTIONS ━━━━━━━━━━━━━━━━━━━",
        '1.  "Built different. Sound different."',
        '2.  "No features. All facts."',
        '3.  "From the city. For the city."',
        "",
        "━━ BRAND VOICE ━━━━━━━━━━━━━━━━━━━━━━",
        "Direct  Unapologetic  Confident",
        "",
        "━━ CORE HASHTAG SET ━━━━━━━━━━━━━━━━━",
        "#" + tag + " #NewMusic #HipHop #Trap",
        "#StreetSound #IndieArtist #Underground",
      )
      if (tikTok) {
        lines.push(
          "",
          "━━ TIKTOK BRAND PRESENCE ━━━━━━━━━━━━",
          "Handle:  @" + tikTok.replace(/^@/, ""),
          "Tone:    Authentic BTS + raw studio clips",
          "Post:    1-2x daily during release week",
        )
      }
      return lines.join("\n")
    },
  },
  {
    id: "social",
    name: "Zara",
    role: "Social Media Manager",
    specialty: "Content · TikTok · Calendar",
    accent: "#ff5e78",
    brief: "Writes ready-to-post copy for Instagram, X, and TikTok, plus a full drop-week content calendar.",
    generate: ({ artist, tikTok, trackName }) => {
      const handle = artist.toLowerCase().replace(/\s+/g, "")
      const track = trackName || "new single"
      const lines = [
        "━━ INSTAGRAM - NEW DROP ━━━━━━━━━━━━━━",
        '"' + artist + " just dropped.",
        " Stream " + track + ' on all platforms now."',
        "#" + handle + " #NewMusic #HipHop #Trap",
        "",
        "━━ INSTAGRAM - ENGAGEMENT ━━━━━━━━━━━━",
        '"Which bar from ' + track + " hits different?",
        ' Drop your answer below."',
        "",
        "━━ X / TWITTER ━━━━━━━━━━━━━━━━━━━━━━",
        '"New drop. No warning. Just vibes.',
        " " + track + ' - stream it now."',
      ]
      if (tikTok) {
        const tt = tikTok.replace(/^@/, "")
        lines.push(
          "",
          "━━ TIKTOK (@" + tt + ") ━━━━━━━━━━━━━━━━━",
          "Hook 1:  8-sec clip of the hardest bar",
          "Hook 2:  POV - you discover " + artist + " at 2am",
          "Hook 3:  Raw studio session, no filter",
          "Hook 4:  Rate this beat 1-10 challenge",
          "",
          "  Day 1  Teaser - 8-sec clip",
          "  Day 2  BTS studio footage",
          "  Day 3  RELEASE - full sound drop",
          "  Day 4  Duet / stitch challenge",
          "  Day 5  Fan reaction compilation",
        )
      }
      lines.push(
        "",
        "━━ DROP-WEEK CALENDAR ━━━━━━━━━━━━━━━",
        "Mon  Studio BTS  (Reels + TikTok)",
        "Tue  24-hr countdown story",
        "Wed  Drop announcement post",
        "Thu  Q&A in stories",
        "Fri  Release day - links + artwork",
        "Sat  Repost fan reactions",
        "Sun  Poll: favourite lyric?",
      )
      return lines.join("\n")
    },
  },
  {
    id: "pr",
    name: "Marcus",
    role: "PR & Press Agent",
    specialty: "Press Releases · Media Pitching",
    accent: "#7c9eff",
    brief: "Drafts a press release and cold-pitch email ready to send to blogs, magazines, and music journalists.",
    generate: ({ artist, pdfName, trackName }) => {
      const NAME = artist.toUpperCase()
      const track = trackName || "new single"
      const today = new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
      const lines = [
        "━━ PRESS RELEASE DRAFT ━━━━━━━━━━━━━━",
        "FOR IMMEDIATE RELEASE",
        "",
        NAME + " DELIVERS BOLD NEW SINGLE",
        "",
        today + " -- Rising independent artist",
        artist + ' releases "' + track + '",',
        "a hard-hitting record cementing their",
        "position in the new wave of hip-hop.",
        "",
        'Stream "' + track + '" on all major DSPs now.',
        "",
        "###",
      ]
      if (pdfName) {
        lines.push(
          "",
          "━━ PRESS KIT ATTACHED ━━━━━━━━━━━━━━",
          "File:  " + pdfName + " [ready to send]",
          "Tip:   Include with every media pitch",
        )
      }
      lines.push(
        "",
        "━━ BLOG / MEDIA PITCH EMAIL ━━━━━━━━━",
        "Subject: [PITCH] " + artist + " -- " + track,
        "",
        "Hi [Editor's name],",
        "",
        "I'm writing on behalf of " + artist + ", a rising",
        "independent artist with an authentic street",
        "sound and a rapidly growing fanbase.",
        "",
        '"' + track + '" is out now and would resonate',
        "strongly with your readers.",
        "",
        "  Stream: [link]",
        pdfName
          ? "  Press kit: " + pdfName
          : "  Press kit: [attach PDF]",
        "  Hi-res photos: [link]",
        "",
        "Best,",
        artist + "'s Team",
      )
      return lines.join("\n")
    },
  },
  {
    id: "playlist",
    name: "Kira",
    role: "Playlist Pitcher",
    specialty: "Spotify · Apple Music · Curators",
    accent: "#34d399",
    brief: "Identifies editorial playlist targets and writes curator pitches based on your uploaded track.",
    generate: ({ artist, trackName }) => {
      const track = trackName || "your new single"
      return [
        "━━ SPOTIFY EDITORIAL TARGETS ━━━━━━━━",
        "  Most Necessary",
        "  Trap Nation Picks",
        "  Get Turnt",
        "  New Music Friday",
        "  Unsigned Hype",
        "  Just Good Music",
        "",
        "━━ SPOTIFY FOR ARTISTS PITCH ━━━━━━━━",
        '"' + track + " by " + artist,
        " blends hard-hitting 808s with vivid",
        " street narratives. Best fit: late-night",
        " trap and dark hip-hop playlists.",
        ' BPM: ~142  Mood: Dark, Confident."',
        "",
        "━━ INDEPENDENT CURATOR TARGETS ━━━━━━",
        "  Trap City        2.3M IG followers",
        "  Trap Nation      31M YT subscribers",
        "  Audiomack Charts (free submission)",
        "  DatPiff New Arrivals",
        "  SoundCloud Repost Exchange",
        "",
        "━━ APPLE MUSIC EDITORIAL ━━━━━━━━━━━",
        "  Submit via Apple Music for Artists",
        "  Min. 4 weeks pre-release lead time",
        "  Tag: Hip-Hop/Rap",
        "  Flag: New Artist Spotlight eligible",
        "",
        "━━ SUBMISSION CHECKLIST ━━━━━━━━━━━━",
        "[ ] Upload " + (trackName ? track : "MP3") + " to S4A",
        "[ ] Fill metadata (ISRC, mood, BPM)",
        "[ ] Select 5 most relevant playlists",
        "[ ] Write 250-char pitch (see above)",
        "[ ] Submit 7+ days before release",
      ].join("\n")
    },
  },
  {
    id: "campaign",
    name: "Dexter",
    role: "Campaign Director",
    specialty: "Release Strategy · Timeline",
    accent: "#ffb347",
    brief: "Maps out a complete 6-week release campaign from pre-production through post-release momentum.",
    generate: ({ artist, tikTok, photoName, trackName, pdfName }) => {
      const track = trackName || "single"
      return [
        "━━ 6-WEEK RELEASE CAMPAIGN ━━━━━━━━━━",
        "",
        "WEEK 1-2  PRE-RELEASE",
        "  [" + (trackName ? "x" : " ") + "] Track ready: " + track,
        "  [" + (photoName ? "x" : " ") + "] Cover art: " + (photoName || "needed"),
        "  [" + (pdfName ? "x" : " ") + "] Press kit: " + (pdfName || "needed"),
        "  [ ] Submit to Spotify/AM editorial",
        "  [ ] Set up pre-save SmartLink",
        "  [ ] Build press list (10-20 targets)",
        "",
        "WEEK 3  ANNOUNCEMENT",
        "  [ ] Official drop-date reveal post",
        "  [ ] Send press release to blog list",
        "  [ ] Pitch playlist curators",
        tikTok
          ? "  [ ] TikTok teaser (@" + tikTok.replace(/^@/, "") + ")"
          : "  [ ] Tease 15-sec clips on social",
        "",
        "WEEK 4  RELEASE DAY",
        "  [ ] Midnight drop on all DSPs",
        "  [ ] Launch IG + TikTok ad campaign",
        "  [ ] Go live to celebrate",
        "  [ ] Engage every comment and DM",
        "",
        "WEEK 5  MOMENTUM",
        "  [ ] Push curator playlist adds",
        "  [ ] Run $20/day IG awareness ad",
        "  [ ] Fan repost story campaign",
        "  [ ] Pitch for radio / blog reviews",
        "",
        "WEEK 6  " + artist.toUpperCase() + " NEXT MOVE",
        "  [ ] Announce follow-up project",
        "  [ ] Review streams + analytics",
        "  [ ] Grow email list from listeners",
        "  [ ] Plan next 90-day campaign",
      ].join("\n")
    },
  },
]
