import type { ArtistData } from "../ArtistLaunchpad"

export interface AgentDef {
  id: string
  name: string
  role: string
  specialty: string
  accent: string
  brief: string
  generate: (data: ArtistData) => string
}

export const AGENTS: AgentDef[] = [
  {
    id: "brand",
    name: "Nova",
    role: "Brand Strategist",
    specialty: "Identity · Positioning · Audience",
    accent: "#6c63ff",
    brief: "Defines your artist identity, brand pillars, taglines, and the core hashtag set that anchors every campaign.",
    generate: (data) => {
      const n = data.name.trim() || "Artist"
      const tag = n.replace(/\s+/g, "")
      return [
        "━━ BRAND PROFILE ━━━━━━━━━━━━━━━━━━━━━━",
        `Artist:        ${n}`,
        "Genre Lane:    Trap / Hip-Hop · Dark Street",
        "Core Demo:     Ages 16–28 · Urban youth",
        "               Sneaker culture · Late-night",
        "",
        "━━ BRAND PILLARS ━━━━━━━━━━━━━━━━━━━━━",
        "◆  Authenticity   Raw, unfiltered storytelling",
        "◆  Exclusivity    Limited drops, tight community",
        "◆  Grind          Every release is a statement",
        "",
        "━━ TAGLINE OPTIONS ━━━━━━━━━━━━━━━━━━━",
        `1.  "Built different. Sound different."`,
        `2.  "No features. All facts."`,
        `3.  "From the city. For the city."`,
        "",
        "━━ BRAND VOICE ━━━━━━━━━━━━━━━━━━━━━━━",
        "Direct · Unapologetic · Confident",
        "",
        "━━ CORE HASHTAG SET ━━━━━━━━━━━━━━━━━━",
        `#${tag} #NewMusic #HipHop #Trap`,
        "#StreetSound #IndependentArtist #Underground",
      ].join("\n")
    },
  },
  {
    id: "social",
    name: "Zara",
    role: "Social Media Manager",
    specialty: "Content · Calendar · Engagement",
    accent: "#ff3cac",
    brief: "Writes ready-to-post copy for Instagram, X, and TikTok, plus a 7-day drop-week content calendar.",
    generate: (data) => {
      const n = data.name.trim() || "Artist"
      const handle = n.toLowerCase().replace(/\s+/g, "")
      const spotify = data.spotifyUrl || "[streaming link]"
      return [
        "━━ INSTAGRAM — NEW DROP ━━━━━━━━━━━━━━━",
        `"${n} just dropped 🔥`,
        ` Stream it on all platforms now."`,
        `#${handle} #NewMusic #HipHop #Trap`,
        "",
        "━━ INSTAGRAM — ENGAGEMENT ━━━━━━━━━━━━",
        '"Which track hits different at 2am?',
        ' Drop a 🔥 below 👇"',
        "",
        "━━ X / TWITTER ━━━━━━━━━━━━━━━━━━━━━━━",
        `"New drop. No warning. Just vibes. 🎧`,
        ` ${spotify}"`,
        "",
        "━━ TIKTOK HOOK ━━━━━━━━━━━━━━━━━━━━━━━",
        `"POV: ${n} just dropped`,
        ` and nobody was ready…"`,
        "",
        "━━ WEEK-1 CONTENT CALENDAR ━━━━━━━━━━━",
        "Mon  Studio BTS clip  (Reels + TikTok)",
        "Tue  Countdown story  (24-hr timer)",
        "Wed  Drop announcement post",
        "Thu  Fan engagement — Q&A in stories",
        "Fri  Release day: streaming links + art",
        "Sat  Repost best fan reactions",
        "Sun  Story poll: favourite lyric?",
      ].join("\n")
    },
  },
  {
    id: "pr",
    name: "Marcus",
    role: "PR & Press Agent",
    specialty: "Press Releases · Media Pitching",
    accent: "#38bdf8",
    brief: "Drafts a press release and a cold-pitch email template ready to send to blogs, magazines, and music journalists.",
    generate: (data) => {
      const n = data.name.trim() || "Artist"
      const NAME = n.toUpperCase()
      const today = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      return [
        "━━ PRESS RELEASE DRAFT ━━━━━━━━━━━━━━━",
        "FOR IMMEDIATE RELEASE",
        "",
        `${NAME} DELIVERS BOLD NEW SINGLE`,
        "",
        `${today} — Rising independent artist`,
        `${n} releases their latest offering,`,
        "a hard-hitting record cementing their",
        "position in the new wave of hip-hop.",
        "",
        `Stream "${n}" on Spotify, Apple Music,`,
        "and all major DSPs now.",
        "",
        "###",
        "",
        "━━ BLOG / MEDIA PITCH EMAIL ━━━━━━━━━━",
        `Subject: [ARTIST PITCH] ${n} — New Single`,
        "",
        "Hi [Editor's name],",
        "",
        `I'm writing on behalf of ${n}, a rising`,
        "independent artist with an authentic voice",
        "and a rapidly growing fanbase.",
        "",
        "Their new single is out now and would",
        "resonate strongly with your readers.",
        "",
        "• Stream: [link]",
        "• Press kit + hi-res photos: [link]",
        "• For features / interviews: [email]",
        "",
        `Best,`,
        `${n}'s Team`,
      ].join("\n")
    },
  },
  {
    id: "playlist",
    name: "Kira",
    role: "Playlist Pitcher",
    specialty: "Spotify · Apple Music · Curators",
    accent: "#4ade80",
    brief: "Identifies target editorial playlists on Spotify and Apple Music, and writes submission pitches for independent curators.",
    generate: (data) => {
      const n = data.name.trim() || "Artist"
      return [
        "━━ SPOTIFY EDITORIAL TARGETS ━━━━━━━━━",
        "• Most Necessary",
        "• Trap Nation Picks",
        "• Get Turnt",
        "• New Music Friday",
        "• Unsigned Hype",
        "• Just Good Music (mood fit)",
        "",
        "━━ SPOTIFY FOR ARTISTS PITCH ━━━━━━━━━",
        `"${n}'s new release blends hard-hitting`,
        " 808s with vivid street narratives.",
        " Best fit: late-night trap and dark",
        " hip-hop editorial playlists.",
        " BPM: ~142 · Mood: Dark, Confident.",
        "",
        "━━ INDEPENDENT CURATOR TARGETS ━━━━━━━",
        "• Trap City        2.3M IG followers",
        "• Trap Nation      31M YT subscribers",
        "• Audiomack Charts (free submission)",
        "• DatPiff New Arrivals",
        "• SoundCloud Repost Exchange",
        "",
        "━━ APPLE MUSIC EDITORIAL ━━━━━━━━━━━━",
        "Submit via Apple Music for Artists",
        "Minimum 4 weeks pre-release lead time",
        "Tag genre: Hip-Hop/Rap",
        "Flag: New Artist Spotlight eligible",
      ].join("\n")
    },
  },
  {
    id: "campaign",
    name: "Dexter",
    role: "Campaign Director",
    specialty: "Release Strategy · Timeline",
    accent: "#fbbf24",
    brief: "Maps out a complete 6-week release campaign from pre-production through post-release momentum building.",
    generate: (data) => {
      const n = data.name.trim() || "Artist"
      return [
        "━━ 6-WEEK RELEASE CAMPAIGN ━━━━━━━━━━━",
        "",
        "WEEK 1–2  ·  PRE-RELEASE",
        "  ✦ Finalize single + cover artwork",
        "  ✦ Submit to Spotify/AM editorial",
        "  ✦ Tease 15-sec clips on IG/TikTok",
        "  ✦ Set up pre-save SmartLink",
        "  ✦ Build press list (10–20 targets)",
        "",
        "WEEK 3  ·  ANNOUNCEMENT",
        "  ✦ Official drop-date reveal post",
        "  ✦ Send press release to blog list",
        "  ✦ Pitch independent playlist curators",
        "  ✦ Behind-the-scenes content week",
        "",
        "WEEK 4  ·  RELEASE DAY",
        "  ✦ Midnight drop on all DSPs",
        "  ✦ Launch IG + TikTok ad campaign",
        "  ✦ Go live to celebrate the release",
        "  ✦ Engage every comment and DM",
        "",
        "WEEK 5  ·  MOMENTUM",
        "  ✦ Push curator playlist adds",
        "  ✦ Run $20/day IG awareness ad",
        "  ✦ Fan repost story campaign",
        "  ✦ Pitch for radio / blog reviews",
        "",
        "WEEK 6  ·  " + n.toUpperCase() + " NEXT MOVE",
        "  ✦ Announce follow-up project",
        "  ✦ Review streams + audience analytics",
        "  ✦ Grow email list from new listeners",
        "  ✦ Plan next 90-day campaign cycle",
      ].join("\n")
    },
  },
]
