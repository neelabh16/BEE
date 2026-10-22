import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TECH_GRADIENTS = [
  'linear-gradient(135deg,#7c6fff,#4fe3c1)',
  'linear-gradient(135deg,#ff6b5b,#7c6fff)',
  'linear-gradient(135deg,#4fe3c1,#ffb86b)',
  'linear-gradient(135deg,#ffb86b,#ff6b5b)',
  'linear-gradient(135deg,#7c6fff,#ff6b5b)',
];

const DEFAULT_PROJECTS = [
  {
    _id: 'p1',
    slug: 'nebula-ui-kit',
    title: 'Nebula UI Kit',
    description: 'A glassmorphic component library for ambitious dashboards and web apps.',
    category: 'web',
    difficulty: 'Intermediate',
    technologies: ['React', 'CSS', 'Framer Motion'],
    likesCount: 842,
    views: 12400,
    coverImage: '/assets/img/project-cards/project-7.png',
    gradient: 0,
  },
  {
    _id: 'p2',
    slug: 'pulsedb',
    title: 'PulseDB',
    description: 'A lightweight time-series database engine written for edge devices.',
    category: 'devtools',
    difficulty: 'Advanced',
    technologies: ['Rust', 'WASM'],
    likesCount: 1290,
    views: 30100,
    coverImage: '/assets/img/project-cards/project-3.png',
    gradient: 1,
  },
  {
    _id: 'p3',
    slug: 'origami-auth',
    title: 'Origami Auth',
    description: 'Drop-in passwordless auth with WebAuthn, passkeys, and secure sessions.',
    category: 'devtools',
    difficulty: 'Intermediate',
    technologies: ['Node.js', 'Express', 'JWT'],
    likesCount: 511,
    views: 8900,
    coverImage: '/assets/img/project-cards/project-9.png',
    gradient: 2,
  },
  {
    _id: 'p4',
    slug: 'voxel-garden',
    title: 'Voxel Garden',
    description: 'A procedurally generated voxel world renderer running smoothly in the browser.',
    category: 'gamedev',
    difficulty: 'Advanced',
    technologies: ['Three.js', 'WebGL', 'Canvas'],
    likesCount: 2043,
    views: 51200,
    coverImage: '/assets/img/project-cards/project-1.png',
    gradient: 3,
  },
  {
    _id: 'p5',
    slug: 'flowline',
    title: 'Flowline',
    description: 'A visual workflow automation canvas for agile engineering teams.',
    category: 'web',
    difficulty: 'Beginner',
    technologies: ['React', 'Node.js', 'REST API'],
    likesCount: 322,
    views: 6100,
    coverImage: '/assets/img/project-cards/project-8.png',
    gradient: 4,
  },
  {
    _id: 'p6',
    slug: 'shard',
    title: 'Shard Engine',
    description: 'A distributed key-value store built for resilience and chaos engineering.',
    category: 'cloud',
    difficulty: 'Advanced',
    technologies: ['Go', 'gRPC', 'Distributed'],
    likesCount: 987,
    views: 21300,
    coverImage: '/assets/img/project-cards/project-4.png',
    gradient: 0,
  },
];

const CATEGORIES = [
  { name: 'Web Dev', slug: 'web', icon: '⬡', count: 142 },
  { name: 'AI & ML', slug: 'ai-ml', icon: '◆', count: 98 },
  { name: 'Dev Tools', slug: 'devtools', icon: '●', count: 86 },
  { name: 'Cloud & Systems', slug: 'cloud', icon: '◈', count: 64 },
  { name: 'Cybersecurity', slug: 'cybersecurity', icon: '▲', count: 42 },
  { name: 'Mobile Apps', slug: 'mobile', icon: '⬡', count: 77 },
  { name: 'Game Dev', slug: 'gamedev', icon: '◆', count: 35 },
  { name: 'Blockchain', slug: 'blockchain', icon: '●', count: 29 },
];

const TOP_DEVS = [
  { name: 'Kavya Sharma', handle: 'kmori', projects: 12, followers: '4.8k', seed: 'kmori', points: 3450 },
  { name: 'Aris Thorne', handle: 'ari-devs', projects: 9, followers: '3.2k', seed: 'aridevs', points: 2890 },
  { name: 'Sena Park', handle: 'senapark', projects: 8, followers: '2.9k', seed: 'senapark', points: 2640 },
  { name: 'Lumen Cross', handle: 'lumencross', projects: 14, followers: '5.1k', seed: 'lumencross', points: 2420 },
  { name: 'Noa Chen', handle: 'noa-ml', projects: 7, followers: '1.8k', seed: 'noachen', points: 2190 },
];

const FEATURED_HACKATHONS = [
  {
    slug: 'aurora-hacks-2026',
    title: 'Aurora Global Hacks 2026',
    desc: 'Build next-generation developer tooling and agentic systems. 48 hours, fully virtual.',
    tag: 'Global',
    prize: '$25,000',
    participants: 1240,
  },
  {
    slug: 'genesis-web3-sprint',
    title: 'Genesis Distributed Sprint',
    desc: 'Create high-throughput decentralized protocols and censorship-resistant apps.',
    tag: 'Web3',
    prize: '$15,000',
    participants: 860,
  },
  {
    slug: 'neural-jam',
    title: 'Neural Jam — AI Interfaces',
    desc: 'Reimagine human-computer interaction with real-time neural models on edge hardware.',
    tag: 'AI/ML',
    prize: '$20,000',
    participants: 950,
  },
];

const TECH_SHOWCASE = [
  { name: 'React', icon: '⚛', count: 18400 },
  { name: 'TypeScript', icon: 'TS', count: 15200 },
  { name: 'Node.js', icon: '⬢', count: 14100 },
  { name: 'Rust', icon: '⚙', count: 9800 },
  { name: 'Python', icon: '🐍', count: 12300 },
  { name: 'Go', icon: '🐹', count: 7400 },
  { name: 'WASM', icon: '🕸', count: 4200 },
  { name: 'Docker', icon: '🐳', count: 11600 },
];

const COMMUNITY_HIGHLIGHTS = [
  { name: 'Frontend Guild', members: 4200, online: 340, gradient: 0 },
  { name: 'Distributed Systems', members: 3100, online: 280, gradient: 1 },
  { name: 'AI & Neural Labs', members: 5800, online: 610, gradient: 2 },
];

const INITIAL_ACTIVITIES = [
  { text: 'sena.codes starred Voxel Garden', time: '1m ago', seed: 'senapark' },
  { text: 'ari-devs submitted Nebula UI Kit', time: '3m ago', seed: 'aridevs' },
  { text: 'kmori registered for Aurora Hacks', time: '7m ago', seed: 'kmori' },
  { text: 'lumencross pushed an update to Shard', time: '11m ago', seed: 'lumencross' },
  { text: 'noa.ml joined AI & Neural Labs', time: '14m ago', seed: 'noachen' },
];

const ACTIVITY_TEMPLATES = [
  (dev, proj) => `${dev} starred ${proj}`,
  (dev, proj) => `${dev} added ${proj} to bookmarks`,
  (dev, proj) => `${dev} shipped an update to ${proj}`,
  (dev) => `${dev} registered for Aurora Global Hacks`,
  (dev) => `${dev} joined the Frontend Guild`,
  (dev) => `${dev} reached Rank 5 on Leaderboard`,
];

export default function LandingPage() {
  // Terminal typing loop
  const [terminalText, setTerminalText] = useState('');
  const commands = [
    'devverse init --builder',
    'devverse deploy legend.exe',
    'devverse join hackathon aurora',
    'devverse squad find --role frontend',
  ];

  useEffect(() => {
    let cmdIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeoutId;

    const tick = () => {
      const currentCmd = commands[cmdIdx];
      if (!isDeleting) {
        charIdx++;
        setTerminalText(currentCmd.slice(0, charIdx));
        if (charIdx === currentCmd.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 1800);
          return;
        }
        timeoutId = setTimeout(tick, 45);
      } else {
        charIdx--;
        setTerminalText(currentCmd.slice(0, charIdx));
        if (charIdx === 0) {
          isDeleting = false;
          cmdIdx = (cmdIdx + 1) % commands.length;
          timeoutId = setTimeout(tick, 500);
          return;
        }
        timeoutId = setTimeout(tick, 25);
      }
    };

    timeoutId = setTimeout(tick, 600);
    return () => clearTimeout(timeoutId);
  }, []);

  // Live activity stream
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  useEffect(() => {
    const devs = ['sena.codes', 'ari-devs', 'kmori', 'lumencross', 'noa.ml', 'alex.sh'];
    const projs = ['Voxel Garden', 'PulseDB', 'Nebula UI Kit', 'Origami Auth', 'Flowline', 'Shard'];

    const interval = setInterval(() => {
      const dev = devs[Math.floor(Math.random() * devs.length)];
      const proj = projs[Math.floor(Math.random() * projs.length)];
      const tpl = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];

      const newItem = {
        text: tpl(dev, proj),
        time: 'Just now',
        seed: dev.replace(/[^a-z0-9]/gi, ''),
      };

      setActivities((prev) => [newItem, ...prev.slice(0, 5)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // GitHub Trending Live Fetch (Syllabus: Fetch API, Promise handling, async/await, JSON)
  const [ghRepos, setGhRepos] = useState([]);
  const [ghLoading, setGhLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('https://api.github.com/search/repositories?q=stars:>25000&sort=stars&order=desc&per_page=3')
      .then((res) => {
        if (!res.ok) throw new Error('API limit');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.items) {
          setGhRepos(data.items);
          setGhLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Graceful fallback from local data
          setGhRepos([
            { id: 1, full_name: 'facebook/react', stargazers_count: 228000, html_url: 'https://github.com/facebook/react', owner: { avatar_url: 'https://avatars.githubusercontent.com/u/69631' } },
            { id: 2, full_name: 'vercel/next.js', stargazers_count: 125000, html_url: 'https://github.com/vercel/next.js', owner: { avatar_url: 'https://avatars.githubusercontent.com/u/14985020' } },
            { id: 3, full_name: 'torvalds/linux', stargazers_count: 178000, html_url: 'https://github.com/torvalds/linux', owner: { avatar_url: 'https://avatars.githubusercontent.com/u/1024025' } },
          ]);
          setGhLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  // Fetch real projects from backend with fallback
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);

  useEffect(() => {
    api.get('/projects?limit=6')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          // Map backend project schema
          const mapped = res.data.data.map((p, idx) => ({
            _id: p._id,
            slug: p.slug || p._id,
            title: p.title,
            description: p.description,
            category: p.category,
            difficulty: 'Intermediate',
            technologies: p.technologies?.length ? p.technologies : ['Fullstack'],
            likesCount: p.likesCount || 0,
            views: (p.likesCount || 10) * 14 + 120,
            coverImage: p.coverImage || `/assets/img/project-cards/project-${(idx % 16) + 1}.png`,
            gradient: idx % TECH_GRADIENTS.length,
          }));
          setProjects(mapped);
        }
      })
      .catch(() => {
        // Keeps DEFAULT_PROJECTS
      });
  }, []);

  return (
    <div className="home-page-container">
      {/* ================= HERO ================= */}
      <section className="hero wrap">
        <div className="hero-kicker">
          <span className="dot" /> SYSTEM STATUS: 42,800 builders online
        </div>

        <h1>
          <span className="line"><span>Where builders</span></span>
          <span className="line"><span>become <span className="grad-text">legends.</span></span></span>
        </h1>

        <p className="hero-sub">
          DevVerse is the operating system for developers — ship projects, join hackathons,
          build your portfolio, and climb the leaderboard, all in one place.
        </p>

        <div className="hero-cta">
          <Link to="/explore" className="btn btn-primary">Explore Projects</Link>
          <Link to="/portfolio" className="btn btn-ghost">Build Your Portfolio</Link>
        </div>

        <div className="hero-terminal glass">
          <div className="terminal-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="terminal-body">
            <span className="prompt">$</span>{' '}
            <span id="terminal-line">{terminalText}</span>
            <span className="terminal-caret" />
          </div>
        </div>

        <div className="hero-robot" aria-hidden="true">
          <img src="/assets/img/hero-robot-dark.png" alt="DevVerse Robot" className="hero-robot-img hero-robot-img-dark" />
          <img src="/assets/img/hero-robot-light.png" alt="DevVerse Robot" className="hero-robot-img hero-robot-img-light" />
        </div>

        <div className="hero-float-cards">
          <div className="float-card glass" style={{ top: '12%', right: '8%', animationDelay: '0s' }}>
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=lumencross&backgroundColor=transparent" alt="" />
            <div>
              <div className="fc-title">Voxel Garden</div>
              <div className="fc-sub">↑ 2,043 likes</div>
            </div>
          </div>
          <div className="float-card glass" style={{ top: '38%', right: '1%', animationDelay: '1.4s' }}>
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=senapark&backgroundColor=transparent" alt="" />
            <div>
              <div className="fc-title">Sena shipped Mural</div>
              <div className="fc-sub">3m ago</div>
            </div>
          </div>
          <div className="float-card glass" style={{ top: '70%', right: '1%', animationDelay: '2.6s' }}>
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=kmori&backgroundColor=transparent" alt="" />
            <div>
              <div className="fc-title">Aurora Hacks</div>
              <div className="fc-sub">$25,000 pool</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS STRIP ================= */}
      <section className="wrap section-tight">
        <div className="stat-strip">
          <div className="stat-cell">
            <div className="stat-num">42,800</div>
            <div className="stat-label">Active builders</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">18,400</div>
            <div className="stat-label">Projects shipped</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">640</div>
            <div className="stat-label">Hackathons hosted</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">2.4M</div>
            <div className="stat-label">Lines committed / wk</div>
          </div>
        </div>
      </section>

      {/* ================= TRENDING PROJECTS ================= */}
      <section className="wrap section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Trending this week</div>
            <h2>Projects everyone's shipping</h2>
          </div>
          <Link to="/explore" className="btn btn-outline btn-sm">View all projects</Link>
        </div>

        <div className="grid grid-3">
          {projects.map((p, idx) => (
            <Link key={p._id || idx} to={`/projects/${p.slug}`} className="project-card glass card-lift">
              <div className="pc-thumb" style={{ background: TECH_GRADIENTS[p.gradient || 0] }}>
                <img
                  className="pc-art"
                  src={p.coverImage || `/assets/img/project-cards/project-${(idx % 16) + 1}.png`}
                  alt=""
                  aria-hidden="true"
                />
                <span className="chip pc-diff">{p.difficulty || 'Intermediate'}</span>
              </div>
              <div>
                <div className="pc-title">{p.title}</div>
                <div className="pc-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </div>
              </div>
              <div className="pc-tags">
                {(p.technologies || []).slice(0, 3).map((t, i) => (
                  <span key={i} className="chip">{t}</span>
                ))}
              </div>
              <div className="pc-stats">
                <span className="pc-stat" style={{ color: 'var(--coral)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{p.likesCount?.toLocaleString() || '0'}</span>
                </span>
                <span className="pc-stat">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{p.views ? `${(p.views / 1000).toFixed(1)}k` : '1.2k'}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="wrap section-tight">
        <div className="section-head">
          <div>
            <div className="eyebrow">Browse by discipline</div>
            <h2>Categories</h2>
          </div>
        </div>
        <div className="grid grid-4">
          {CATEGORIES.map((c, i) => (
            <Link key={i} to={`/explore?category=${c.slug}`} className="tech-tile glass card-lift">
              <div className="tt-icon">{c.icon}</div>
              <div className="tt-name">{c.name}</div>
              <div className="tt-count">{c.count} projects</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= TOP DEVELOPERS + LIVE ACTIVITY ================= */}
      <section className="wrap section">
        <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start', gap: '24px' }}>
          <div>
            <div className="section-head">
              <div>
                <div className="eyebrow">Ranked this month</div>
                <h2>Top developers</h2>
              </div>
              <Link to="/leaderboard" className="btn btn-outline btn-sm">Leaderboard</Link>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {TOP_DEVS.map((d, i) => (
                <Link key={i} to={`/profile/${d.handle}`} className="dev-card glass card-lift" style={{ padding: '18px 12px', textAlign: 'center' }}>
                  <div className="dev-avatar-ring" style={{ margin: '0 auto 10px', width: '56px', height: '56px' }}>
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${d.seed}&backgroundColor=transparent`}
                      alt={d.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="dev-name" style={{ fontWeight: 600, fontSize: '14px' }}>{d.name}</div>
                  <div className="dev-handle" style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>@{d.handle}</div>
                  <div className="dev-meta" style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    <div><b>{d.projects}</b> projs</div>
                    <div><b>{d.followers}</b> fans</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="section-head" style={{ marginBottom: '24px' }}>
              <div>
                <div className="eyebrow">Live Pulse</div>
                <h2 style={{ fontSize: '26px' }}>Activity feed</h2>
              </div>
            </div>
            <div className="glass feed" style={{ padding: '12px 18px', maxHeight: '420px', overflowY: 'auto' }}>
              {activities.map((act, i) => (
                <div key={i} className="feed-item" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <img
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${act.seed}&backgroundColor=transparent`}
                    alt=""
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-hover)', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="feed-text" style={{ fontSize: '13px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {act.text}
                    </div>
                    <div className="feed-time" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {act.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED HACKATHONS ================= */}
      <section className="wrap section-tight">
        <div className="section-head">
          <div>
            <div className="eyebrow">Compete &amp; win</div>
            <h2>Featured hackathons</h2>
          </div>
          <Link to="/hackathons" className="btn btn-outline btn-sm">All hackathons</Link>
        </div>
        <div className="grid grid-3">
          {FEATURED_HACKATHONS.map((h, i) => (
            <Link key={i} to={`/hackathons/${h.slug}`} className="glass card-lift" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span className="chip chip-accent" style={{ alignSelf: 'flex-start' }}>{h.tag}</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{h.title}</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', flex: 1 }}>{h.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <span>{h.prize} prize pool</span>
                <span>{h.participants.toLocaleString()} joined</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= TECH SHOWCASE ================= */}
      <section className="wrap section-tight">
        <div className="section-head">
          <div>
            <div className="eyebrow">The stack of DevVerse</div>
            <h2>Trending technologies</h2>
          </div>
        </div>
        <div className="grid grid-4">
          {TECH_SHOWCASE.map((t, i) => (
            <div key={i} className="tech-tile glass card-lift">
              <div className="tt-icon">{t.icon}</div>
              <div className="tt-name">{t.name}</div>
              <div className="tt-count">{t.count.toLocaleString()} builders</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= GITHUB LIVE (Fetch API Showcase) ================= */}
      <section className="wrap section-tight">
        <div className="section-head">
          <div>
            <div className="eyebrow">Live from GitHub</div>
            <h2>What the world is starring right now</h2>
          </div>
        </div>
        <div className="grid grid-3">
          {ghLoading ? (
            <>
              <div className="glass" style={{ height: '70px', opacity: 0.5 }} />
              <div className="glass" style={{ height: '70px', opacity: 0.5 }} />
              <div className="glass" style={{ height: '70px', opacity: 0.5 }} />
            </>
          ) : (
            ghRepos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass card-lift"
                style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}
              >
                <img src={repo.owner?.avatar_url} alt="" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {repo.full_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    ★ {repo.stargazers_count?.toLocaleString()}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      {/* ================= COMMUNITY HIGHLIGHTS ================= */}
      <section className="wrap section-tight">
        <div className="section-head">
          <div>
            <div className="eyebrow">Find your people</div>
            <h2>Community highlights</h2>
          </div>
          <Link to="/communities" className="btn btn-outline btn-sm">All communities</Link>
        </div>
        <div className="grid grid-3">
          {COMMUNITY_HIGHLIGHTS.map((c, i) => (
            <Link key={i} to="/communities" className="glass card-lift" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: TECH_GRADIENTS[c.gradient], flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {c.online} online now · {c.members.toLocaleString()} members
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section className="wrap section">
        <div
          className="glass"
          style={{
            padding: '60px 40px',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            background: 'radial-gradient(circle at 50% 0%, var(--accent-soft), transparent 60%)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700 }}>Your legend starts with one commit.</h2>
          <p className="lede" style={{ margin: '14px auto 0', maxWidth: '640px' }}>
            Build your portfolio, join a hackathon, or just explore what other developers are shipping today.
          </p>
          <div className="hero-cta" style={{ justifyContent: 'center', marginTop: '30px' }}>
            <Link to="/portfolio" className="btn btn-primary">Start building</Link>
            <Link to="/squads" className="btn btn-ghost">Find your squad</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
