import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './LandingPage.css';

const TERMINAL_COMMANDS = [
  {
    cmd: 'devverse init my-project --template mern',
    output: [
      '✔ Scaffolding production MERN stack...',
      '✔ Setting up Vite, React, Express & MongoDB',
      '⚡ Environment ready in 420ms! Run "devverse run dev".',
    ],
  },
  {
    cmd: 'devverse deploy --production',
    output: [
      '✔ Compiling client assets (38 modules)',
      '✔ Provisioning cloud micro-services...',
      '🚀 Live at https://pulse-ai.devverse.sh [Edge CDN 200 OK]',
    ],
  },
  {
    cmd: 'devverse hackathon join aurora-hacks',
    output: [
      '✔ Joined "Aurora Hacks 2026" — $15,000 Global Prize Pool',
      '✔ Squad matched: 4/4 builders verified',
      '🏆 Ready to build! Hackathon timer is live.',
    ],
  },
  {
    cmd: 'devverse codex publish "Zero-Downtime Microservices"',
    output: [
      '✔ Analyzing engineering architecture log...',
      '✔ Indexed in Codex Developer Knowledge Graph',
      '📖 Published to 14,000+ engineers (+50 Builder XP)',
    ],
  },
];

const FEATURES = [
  {
    id: 'projects',
    title: 'Project Showcase',
    description: 'Ship your applications to a dedicated community of builders. Receive constructive peer feedback, collect upvotes, and build real credibility.',
    badge: 'Showcase',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    id: 'communities',
    title: 'Developer Communities',
    description: 'Join focused tech circles around AI, Web3, Distributed Systems, Rust, and modern UI. Engage in threaded discussions and collaborate on open-source.',
    badge: 'Collaborate',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'codex',
    title: 'The Codex',
    description: 'A crowdsourced archive of engineering logs, deep architectural breakdowns, post-mortems, and hard-won production debugging insights.',
    badge: 'Knowledge',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    id: 'hackathons',
    title: 'Hackathon Hub',
    description: 'Enter high-octane virtual hackathons with real cash bounties. Work against the clock, showcase your prototypes, and gain recognition from top judges.',
    badge: 'Compete',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
        <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
      </svg>
    ),
  },
  {
    id: 'squads',
    title: 'Squad Finder',
    description: 'Never build alone. Find complementary developers by stack, timezone, and project ambition to form high-velocity squads ready to ship.',
    badge: 'Network',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    title: 'Portfolio Builder',
    description: 'Instant, automated developer portfolios linking your verified projects, community reputations, hackathon honors, and commit timelines.',
    badge: 'Showcase',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

export default function LandingPage() {
  // Terminal typing animation state
  const [commandIndex, setCommandIndex] = useState(0);
  const [displayedCommand, setDisplayedCommand] = useState('');
  const [displayedOutput, setDisplayedOutput] = useState([]);
  const [isTyping, setIsTyping] = useState(true);

  // Animated stats state
  const [buildersCount, setBuildersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [hackathonsCount, setHackathonsCount] = useState(0);
  const [communitiesCount, setCommunitiesCount] = useState(0);

  // Terminal typewriter effect
  useEffect(() => {
    const current = TERMINAL_COMMANDS[commandIndex];
    let charIndex = 0;
    setDisplayedOutput([]);
    setDisplayedCommand('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      if (charIndex <= current.cmd.length) {
        setDisplayedCommand(current.cmd.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);

        // Display output lines sequentially
        current.output.forEach((line, idx) => {
          setTimeout(() => {
            setDisplayedOutput((prev) => [...prev, line]);
          }, (idx + 1) * 320);
        });

        // Advance to next command after delay
        const nextTimer = setTimeout(() => {
          setCommandIndex((prev) => (prev + 1) % TERMINAL_COMMANDS.length);
        }, current.output.length * 320 + 2600);

        return () => clearTimeout(nextTimer);
      }
    }, 45);

    return () => clearInterval(typingInterval);
  }, [commandIndex]);

  // Smooth counter animation on mount
  useEffect(() => {
    const duration = 2200; // ms
    const startTime = performance.now();

    const targets = {
      builders: 14280,
      projects: 38500,
      hackathons: 124,
      communities: 460,
    };

    function updateCounts(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setBuildersCount(Math.floor(easeProgress * targets.builders));
      setProjectsCount(Math.floor(easeProgress * targets.projects));
      setHackathonsCount(Math.floor(easeProgress * targets.hackathons));
      setCommunitiesCount(Math.floor(easeProgress * targets.communities));

      if (progress < 1) {
        requestAnimationFrame(updateCounts);
      } else {
        setBuildersCount(targets.builders);
        setProjectsCount(targets.projects);
        setHackathonsCount(targets.hackathons);
        setCommunitiesCount(targets.communities);
      }
    }

    const animId = requestAnimationFrame(updateCounts);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="landing-page">
      {/* Top Navigation */}
      <Navbar />

      <main className="landing-main">
        {/* ================= HERO SECTION ================= */}
        <section className="hero-section" aria-label="Hero">
          {/* Subtle background glow mesh */}
          <div className="hero-glow-orb hero-glow-1" aria-hidden="true" />
          <div className="hero-glow-orb hero-glow-2" aria-hidden="true" />

          <div className="landing-container hero-container">
            <div className="hero-content animate-fade-in">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                <span className="hero-badge-text">v2.4 Platform Release · Built for Builders</span>
              </div>

              <h1 className="hero-headline">
                Where builders become <span className="grad-text">legends.</span>
              </h1>

              <p className="hero-sub">
                DevVerse is the operating system for developers — ship projects, join hackathons,
                build your portfolio, and climb the leaderboard, all in one place.
              </p>

              <div className="hero-actions">
                <Link to="/explore" className="btn btn-primary btn-lg hero-btn-primary">
                  <span>Explore Projects</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>

                <Link to="/portfolio" className="btn btn-ghost btn-lg hero-btn-ghost">
                  <span>Build Your Portfolio</span>
                </Link>
              </div>

              {/* Quick trust metrics */}
              <div className="hero-trust">
                <div className="hero-trust-avatars">
                  <div className="trust-avatar av-1">AJ</div>
                  <div className="trust-avatar av-2">SC</div>
                  <div className="trust-avatar av-3">RK</div>
                  <div className="trust-avatar av-4">EL</div>
                </div>
                <div className="hero-trust-text">
                  <strong>14,000+ engineers</strong> building open-source projects
                </div>
              </div>
            </div>

            {/* Interactive Hero Visual: Terminal + Floating Cards */}
            <div className="hero-visual">
              {/* Terminal Window */}
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="terminal-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    <span>devverse-cli — zsh</span>
                  </div>
                  <div className="terminal-tab">main</div>
                </div>

                <div className="terminal-body" aria-live="polite">
                  <div className="terminal-prompt-line">
                    <span className="t-user">builder@devverse</span>
                    <span className="t-sep">:</span>
                    <span className="t-path">~/workspace</span>
                    <span className="t-symbol">$</span>
                    <span className="t-command">{displayedCommand}</span>
                    <span className={`terminal-caret ${isTyping ? 'typing' : 'blinking'}`} />
                  </div>

                  {displayedOutput.length > 0 && (
                    <div className="terminal-output">
                      {displayedOutput.map((line, i) => (
                        <div key={i} className="terminal-out-line animate-fade-in">
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Preview Card 1: Pulse AI Project */}
              <div className="floating-card float-card-1">
                <div className="float-card-header">
                  <div className="float-card-badge">AI / ML</div>
                  <div className="float-card-likes">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>284</span>
                  </div>
                </div>
                <h4 className="float-card-title">PulseFlow Studio</h4>
                <p className="float-card-desc">Real-time edge neural inference for canvas apps.</p>
                <div className="float-card-tags">
                  <span className="tag">React</span>
                  <span className="tag">PyTorch</span>
                  <span className="tag">Wasm</span>
                </div>
              </div>

              {/* Floating Preview Card 2: Active Hackathon */}
              <div className="floating-card float-card-2">
                <div className="float-card-header">
                  <div className="float-card-badge badge-active">Live Hackathon</div>
                  <span className="float-card-pulse" />
                </div>
                <h4 className="float-card-title">Aurora Global Hacks</h4>
                <div className="float-card-meta">
                  <span className="prize-pool">$15,000 Pool</span>
                  <span className="meta-sep">•</span>
                  <span>42 Squads</span>
                </div>
              </div>

              {/* Floating Preview Card 3: Top Builder Badge */}
              <div className="floating-card float-card-3">
                <div className="builder-pill">
                  <div className="builder-avatar">KV</div>
                  <div className="builder-info">
                    <span className="builder-name">Kavya Sharma</span>
                    <span className="builder-rank">Rank #1 · 3,450 XP</span>
                  </div>
                  <div className="builder-medal">🏆</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS SECTION ================= */}
        <section className="stats-section" aria-label="Platform Statistics">
          <div className="landing-container">
            <div className="stats-card">
              <div className="stats-header">
                <span className="stats-header-badge">DevVerse Network Metrics</span>
                <span className="stats-demo-label">(Platform Live Preview)</span>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">
                    {buildersCount.toLocaleString()}+
                  </div>
                  <div className="stat-label">Active Builders</div>
                  <div className="stat-sub">Across 85+ countries</div>
                </div>

                <div className="stat-item">
                  <div className="stat-number">
                    {projectsCount.toLocaleString()}+
                  </div>
                  <div className="stat-label">Projects Shipped</div>
                  <div className="stat-sub">Open-source & commercial</div>
                </div>

                <div className="stat-item">
                  <div className="stat-number">
                    {hackathonsCount.toLocaleString()}+
                  </div>
                  <div className="stat-label">Hackathons Hosted</div>
                  <div className="stat-sub">With $500k+ in bounties</div>
                </div>

                <div className="stat-item">
                  <div className="stat-number">
                    {communitiesCount.toLocaleString()}+
                  </div>
                  <div className="stat-label">Communities</div>
                  <div className="stat-sub">Niche engineering circles</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="features-section" aria-label="Features">
          <div className="landing-container">
            <div className="section-header">
              <span className="section-kicker">Unified Developer Workspace</span>
              <h2 className="section-title">
                Everything you need to <span className="grad-text">accelerate</span> your craft.
              </h2>
              <p className="section-subtitle">
                Designed from the ground up for software engineers who value speed, craftsmanship,
                and high-impact collaboration.
              </p>
            </div>

            <div className="features-grid">
              {FEATURES.map((feat) => (
                <div key={feat.id} className="feature-card">
                  <div className="feature-icon-wrapper">
                    {feat.icon}
                  </div>
                  <div className="feature-badge">{feat.badge}</div>
                  <h3 className="feature-title">{feat.title}</h3>
                  <p className="feature-desc">{feat.description}</p>
                  <div className="feature-card-accent" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CALL TO ACTION SECTION ================= */}
        <section className="cta-section" aria-label="Call to Action">
          <div className="landing-container">
            <div className="cta-card">
              <div className="cta-glow" aria-hidden="true" />
              <div className="cta-content">
                <span className="cta-kicker">Join The Ecosystem</span>
                <h2 className="cta-headline">
                  Your legend starts with one commit.
                </h2>
                <p className="cta-sub">
                  Join thousands of developers turning side projects into legendary milestones.
                  Claim your handle, showcase your work, and build the future today.
                </p>

                <div className="cta-buttons">
                  <Link to="/register" className="btn btn-primary btn-lg cta-btn-primary">
                    <span>Get Started Free</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>

                  <Link to="/explore" className="btn btn-secondary btn-lg cta-btn-secondary">
                    <span>Explore Community Projects</span>
                  </Link>
                </div>

                <div className="cta-perks">
                  <span>✦ No credit card required</span>
                  <span>✦ Instant portfolio setup</span>
                  <span>✦ 100% Free for individual builders</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
