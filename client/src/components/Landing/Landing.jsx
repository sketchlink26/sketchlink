import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  {
    color: '#3b82f6',
    icon: '⬡',
    title: 'AI Shape Recognition',
    desc: 'Draw freely — our AI transforms sketches into perfect diagrams instantly.',
  },
  {
    color: '#00BFA5',
    icon: '◎',
    title: 'Real-Time Collaboration',
    desc: 'Work together with live cursors and instant updates across your entire team.',
  },
  {
    color: '#8b5cf6',
    icon: '✦',
    title: 'Natural Language to Diagram',
    desc: 'Describe your idea in plain text and watch it come to life automatically.',
  },
  {
    color: '#f97316',
    icon: '⊞',
    title: 'Smart Auto Layout & Summaries',
    desc: 'AI-powered organization and intelligent content summaries for every board.',
  },
];

const STEPS = [
  { icon: '✏', title: 'Sketch',      desc: 'Sign up and create your first whiteboard. Start drawing immediately with no learning curve needed.' },
  { icon: '⬡', title: 'Share',       desc: 'Draw rough shapes and watch AI transform them to perfect diagrams. Experience the magic instantly.' },
  { icon: '◎', title: 'Collaborate', desc: 'Invite your team. Collaborate in real-time with live cursors and instant sync across all devices.' },
  { icon: '✦', title: 'Unlock AI',   desc: 'Unlock advanced features: AI summaries, PM artifacts, Jira export, and much more.' },
];

const FAQS = [
  {
    q: 'How accurate is the AI shape recognition?',
    a: 'Our AI achieves over 95% accuracy on common shapes like rectangles, circles, and arrows. It continuously improves as more users draw on SketchLink, and handles freehand sketches remarkably well.',
  },
  {
    q: 'Can I collaborate with my team in real-time?',
    a: 'Yes! SketchLink supports unlimited real-time collaborators per board. You see each other\'s cursors live, edits sync instantly, and our team chat is built right into the canvas.',
  },
  {
    q: 'Is SketchLink free to use?',
    a: 'SketchLink offers a generous free tier with unlimited boards and up to 5 collaborators per board. Premium plans unlock AI summaries, export options, and advanced integrations.',
  },
  {
    q: 'What file formats can I export to?',
    a: 'You can export boards as PNG images. PDF, SVG, and Figma export are on our roadmap. Premium users will also get Jira and Confluence integration.',
  },
];

const TABLE_ROWS = [
  {
    feature: 'AI Shape Recognition',
    sk: 'Instant & Accurate',
    b: 'None',
    c: 'Manual only',
    s: '—',
  },
  {
    feature: 'Real-time Collaboration',
    sk: 'Live cursors, instant sync',
    b: 'Limited or none',
    c: 'Expensive add-on',
    s: 'None',
  },
  {
    feature: 'Ease of Use',
    sk: 'Intuitive, anyone can start',
    b: 'Simple but limited',
    c: 'Steep learning curve',
    s: 'Easy but no features',
  },
  {
    feature: 'Professional Output',
    sk: 'AI-perfected diagrams',
    b: 'Looks amateur',
    c: 'If you\'re an expert',
    s: 'Hand-drawn only',
  },
];

function WhiteboardMockup() {
  return (
    <div className="hero-mockup">
      {/* Toolbar bar */}
      <div className="mock-toolbar">
        <div className="mock-logo-dot" />
        <span className="mock-title-text">Untitled Board</span>
        <div className="mock-toolbar-right">
          <div className="mock-avatar" style={{ background: '#7c6ef5' }}>AZ</div>
          <div className="mock-avatar" style={{ background: '#34d399', marginLeft: -6 }}>BK</div>
          <div className="mock-btn-outline">↓ Export</div>
          <div className="mock-btn-teal">⬡ Share</div>
          <div className="mock-btn-outline">💬</div>
        </div>
      </div>

      <div className="mock-body">
        {/* Left tool sidebar */}
        <div className="mock-sidebar">
          {['✏','▭','◯','→','◆','T','⊘'].map((ic, i) => (
            <div key={i} className={`mock-tool ${i === 0 ? 'active' : ''}`}>{ic}</div>
          ))}
        </div>

        {/* Canvas */}
        <div className="mock-canvas">
          <svg width="100%" height="100%" viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg">
            {/* Grid dots */}
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 14 }).map((_, c) => (
                <circle key={`${r}-${c}`} cx={12 + c * 24} cy={12 + r * 26} r={1} fill="#e5e7eb" />
              ))
            )}
            {/* Shapes */}
            <rect x={30} y={30} width={90} height={55} rx={6} fill="none" stroke="#7c6ef5" strokeWidth={2} />
            <text x={75} y={62} textAnchor="middle" fill="#7c6ef5" fontSize={10} fontFamily="sans-serif">User Login</text>

            <circle cx={210} cy={57} r={35} fill="none" stroke="#34d399" strokeWidth={2} />
            <text x={210} y={62} textAnchor="middle" fill="#34d399" fontSize={9} fontFamily="sans-serif">Auth</text>

            <line x1={120} y1={57} x2={175} y2={57} stroke="#6b7280" strokeWidth={1.5} markerEnd="url(#arr)" />
            <defs>
              <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#6b7280" />
              </marker>
            </defs>

            <rect x={30} y={120} width={80} height={45} rx={6} fill="none" stroke="#f97316" strokeWidth={2} />
            <text x={70} y={147} textAnchor="middle" fill="#f97316" fontSize={9} fontFamily="sans-serif">Dashboard</text>

            <line x1={75} y1={85} x2={75} y2={120} stroke="#6b7280" strokeWidth={1.5} markerEnd="url(#arr)" />

            <rect x={175} y={120} width={85} height={45} rx={6} fill="none" stroke="#3b82f6" strokeWidth={2} />
            <text x={217} y={147} textAnchor="middle" fill="#3b82f6" fontSize={9} fontFamily="sans-serif">Profile</text>
            <line x1={210} y1={92} x2={210} y2={120} stroke="#6b7280" strokeWidth={1.5} markerEnd="url(#arr)" />

            {/* AI badge */}
            <rect x={60} y={4} width={120} height={16} rx={8} fill="rgba(0,191,165,0.15)" stroke="#00BFA5" strokeWidth={0.8} />
            <text x={120} y={15} textAnchor="middle" fill="#00BFA5" fontSize={8} fontFamily="sans-serif">AI Shape Recognition Active</text>

            {/* Remote cursor */}
            <circle cx={265} cy={80} r={4} fill="#f472b6" />
            <rect x={270} y={72} width={40} height={12} rx={4} fill="#f472b6" />
            <text x={290} y={81} textAnchor="middle" fill="#fff" fontSize={7} fontFamily="sans-serif">Sarah</text>
          </svg>
        </div>

        {/* Right AI panel */}
        <div className="mock-ai-panel">
          <div className="mock-ai-title">✦ AI Assistant</div>
          <div className="mock-ai-chip">Shape: Rectangle ✓</div>
          <div className="mock-ai-chip" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)' }}>Type: Flowchart</div>
          <div className="mock-ai-prompt">Generate diagram…</div>
          <div className="mock-ai-btn">Generate ✦</div>
        </div>
      </div>

      {/* Chat panel overlay strip */}
      <div className="mock-chat">
        <div className="mock-chat-header">💬 Team Chat</div>
        <div className="mock-chat-msg other"><span className="mock-chat-av" style={{ background: '#34d399' }}>BK</span><span className="mock-chat-bubble">Looking great!</span></div>
        <div className="mock-chat-msg own"><span className="mock-chat-bubble own">Thanks, reviewing now</span></div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate      = useNavigate();
  const [scrolled,    setScrolled]    = useState(false);
  const [openFaq,     setOpenFaq]     = useState(null);
  const faqRefs       = useRef([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFaq = (i) => setOpenFaq(prev => (prev === i ? null : i));

  return (
    <div className="lp-root">

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-nav-logo">
          <div className="lp-logo-icon">✦</div>
          <span className="lp-logo-text">SketchLink</span>
        </div>
        <div className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>
        <div className="lp-nav-right">
          <button className="lp-nav-login" onClick={() => navigate('/login')}>Log In</button>
          <button className="lp-nav-cta"   onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Floating badges */}
        <div className="lp-badge lp-badge-green">
          <span className="lp-badge-dot" style={{ background: '#22c55e' }} />
          Team Approved
        </div>
        <div className="lp-badge lp-badge-purple">
          <span className="lp-badge-dot" style={{ background: '#8b5cf6' }} />
          Beta Tester
        </div>
        <div className="lp-badge lp-badge-teal">
          <span className="lp-badge-dot" style={{ background: '#00BFA5' }} />
          Auto Suggested
        </div>

        <div className="lp-hero-content">
          <h1 className="lp-hero-heading">
            Where teams<br />
            <span className="lp-hero-sketch">sketch together</span>
          </h1>
          <p className="lp-hero-sub">
            Transform your sketches into professional diagrams with AI-powered<br />
            collaboration. Draw freely, our AI does the rest.
          </p>
          <div className="lp-hero-btns">
            <button className="lp-btn-dark" onClick={() => navigate('/register')}>Start for Free →</button>
            <button className="lp-btn-outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              See How It Works
            </button>
          </div>

          <WhiteboardMockup />
        </div>
      </section>

      {/* ── MEET SKETCHLINK ────────────────────────────── */}
      <section className="lp-meet">
        <div className="lp-meet-label">Meet SketchLink</div>
        <h2 className="lp-meet-heading">Your AI-Powered Whiteboard,<br />Built for Modern Teams.</h2>
        <p className="lp-meet-sub">
          SketchLink combines freehand drawing, AI shape recognition, and real-time collaboration into one seamless canvas that your whole team will actually use.
        </p>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section className="lp-features" id="features">
        <h2 className="lp-features-heading">One canvas everyone actually uses:</h2>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div className="lp-feature-card" key={i}>
              <div className="lp-feature-icon" style={{ background: f.color + '1a', color: f.color }}>
                {f.icon}
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ─────────────────────────────────── */}
      <section className="lp-compare">
        <div className="lp-compare-left">
          <p className="lp-compare-intro">Traditional tools force you to choose between simplicity and power.</p>
          <h2 className="lp-compare-but">But You Need Both.</h2>
          <p className="lp-compare-deliver">SketchLink delivers both.</p>
          <button className="lp-btn-teal" onClick={() => navigate('/register')}>Try SketchLink Free</button>
        </div>

        <div className="lp-compare-right">
          {[
            {
              label: 'Drawing Tools',
              trad: 'You draw a rough shape by hand. It stays rough. You spend more time cleaning up than creating.',
              sk:   'Draw any rough shape — rectangle, circle, arrow. AI instantly recognizes and perfects it in real time.',
            },
            {
              label: 'Collaboration',
              trad: 'Team members work in isolation. Version conflicts, stale copies, and endless "which file is latest?" emails.',
              sk:   'See your team\'s cursors in real-time. Every edit syncs instantly so the whole team is always on the same page.',
            },
            {
              label: 'AI Intelligence',
              trad: 'Type "create a user login flow" and... nothing happens. You\'re on your own.',
              sk:   'Type "create a user login flow" and watch SketchLink generate the entire flowchart with shapes, labels, and connections.',
            },
          ].map((row, i) => (
            <div className="lp-compare-block" key={i}>
              <div className="lp-compare-block-label">{row.label}</div>
              <div className="lp-compare-trad">
                <div className="lp-compare-tag">Traditional Tools</div>
                {row.trad}
              </div>
              <div className="lp-compare-sk">
                <div className="lp-compare-tag sk">With SketchLink</div>
                {row.sk}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY SKETCHLINK TABLE ───────────────────────── */}
      <section className="lp-table-section" id="pricing">
        <div className="lp-table-label">WHY SKETCHLINK</div>
        <h2 className="lp-table-heading">Why SketchLink Wins — Compared to Alternatives</h2>
        <p className="lp-table-sub">Other tools ask you to compromise between power and simplicity. SketchLink refuses to.</p>
        <div className="lp-table-wrap">
          <table className="lp-table">
            <thead>
              <tr>
                <th className="lp-th-feature">Feature</th>
                <th className="lp-th-sk">SketchLink</th>
                <th>Basic Drawing Apps</th>
                <th>Complex Design Tools</th>
                <th>Static Whiteboard</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => (
                <tr key={i}>
                  <td className="lp-td-feature">{row.feature}</td>
                  <td className="lp-td-sk">
                    <span className="lp-td-sk-inner">
                      <span className="lp-check">✓</span> {row.sk}
                    </span>
                  </td>
                  <td className="lp-td-other">{row.b}</td>
                  <td className="lp-td-other">{row.c}</td>
                  <td className="lp-td-other">{row.s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section className="lp-how" id="about">
        <div className="lp-how-label">HOW IT WORKS</div>
        <h2 className="lp-how-heading">Your Journey to Better Collaboration</h2>
        <p className="lp-how-sub">Getting started with SketchLink is simple — you'll be collaborating in minutes.</p>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div className="lp-step" key={i}>
              <div className="lp-step-circle">{s.icon}</div>
              <div className="lp-step-num">Step {i + 1}</div>
              <div className="lp-step-title">{s.title}</div>
              <p className="lp-step-desc">{s.desc}</p>
              {i < STEPS.length - 1 && <div className="lp-step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section className="lp-faq">
        <div className="lp-faq-label">EASY QUESTIONS</div>
        <h2 className="lp-faq-heading">Frequently Asked Questions</h2>
        <div className="lp-faq-list">
          {FAQS.map((item, i) => (
            <div className="lp-faq-item" key={i}>
              <button className="lp-faq-q" onClick={() => toggleFaq(i)}>
                <span>{item.q}</span>
                <span className={`lp-faq-icon ${openFaq === i ? 'open' : ''}`}>+</span>
              </button>
              <div
                className="lp-faq-a-wrap"
                style={{
                  maxHeight: openFaq === i ? '200px' : '0',
                  opacity:   openFaq === i ? 1 : 0,
                }}
              >
                <p className="lp-faq-a">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo">
              <div className="lp-logo-icon lp-logo-icon-sm">✦</div>
              <span className="lp-logo-text" style={{ color: '#fff' }}>SketchLink</span>
            </div>
            <p className="lp-footer-tagline">Next-generation collaborative whiteboard,<br />powered by AI.</p>
          </div>

          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Product</div>
              <a href="#features">Features</a>
              <a href="#features">Explore</a>
              <a href="#pricing">Pricing</a>
              <a href="#about">Tutorials</a>
              <a href="#about">Integrations</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Company</div>
              <a href="#about">About</a>
              <a href="#about">Blog</a>
              <a href="#about">Careers</a>
              <a href="#about">Contact</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Connect</div>
              <div className="lp-footer-socials">
                <a href="#" className="lp-social" title="Twitter/X">𝕏</a>
                <a href="#" className="lp-social" title="LinkedIn">in</a>
                <a href="#" className="lp-social" title="GitHub">⌥</a>
                <a href="#" className="lp-social" title="Discord">◈</a>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© 2025 SketchLink. All rights reserved.</span>
          <div className="lp-footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
