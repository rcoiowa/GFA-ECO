import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { GFA_CONTACTS } from '@recoveryos/safety';
import './communityCenterJourney.css';

type Service = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  href: string;
  action: string;
  access: 'guest' | 'account';
  keywords: string;
};

const services: Service[] = [
  { id: 'person', title: 'Connect with a person', summary: 'Peer support and a place to begin', detail: 'You can talk through what matters to you and ask about recovery coaching or other peer support.', href: '/community-center/front-desk', action: 'Visit the front desk', access: 'guest', keywords: 'coach peer talk support human' },
  { id: 'housing', title: 'Explore recovery housing', summary: 'Grace House, EJWRH, and next steps', detail: 'Compare the public residence information before choosing an application. A listing does not promise a bed or admission.', href: '/recovery-residences', action: 'View housing options', access: 'guest', keywords: 'home residence grace house ejwrh application' },
  { id: 'circles', title: 'Find a recovery circle', summary: 'Connection and what to expect', detail: 'Learn how a recovery circle works and ask for current meeting details before traveling.', href: '/community-center/circles', action: 'Explore circles', access: 'guest', keywords: 'meeting group gfar c community' },
  { id: 'support', title: 'Support now', summary: 'Immediate options without an account', detail: 'See crisis and warmline options in one place. You can reach support without signing in.', href: '/support', action: 'See support options', access: 'guest', keywords: 'urgent help crisis warmline' },
  { id: 'resources', title: 'Find practical resources', summary: 'Housing, work, transportation, and essentials', detail: 'A person can help you identify a useful first step. This kiosk does not present an unverified statewide directory.', href: '/community-center/front-desk', action: 'Ask the front desk', access: 'guest', keywords: 'food work jobs transport benefits navigation' },
  { id: 'learn', title: 'Explore recovery tools', summary: 'Learning at your own pace', detail: 'RecoveryOS offers participant tools and learning after sign-in. You can decide whether you want an account.', href: '/register', action: 'Explore an account', access: 'account', keywords: 'learn read tools practice recovery' },
  { id: 'account', title: 'Continue my journey', summary: 'Your private RecoveryOS space', detail: 'An account provides a way to return to participant tools and support connections.', href: '/sign-in', action: 'Sign in', access: 'account', keywords: 'account private profile my space' },
];

const path = (segment: string) => `/community-center/${segment}`;

export function CommunityCenterJourney() {
  const location = useLocation();
  const lastSegment = location.pathname.replace(/\/$/, '').split('/').pop();
  const screen = lastSegment === 'community-center' ? 'lobby' : lastSegment || 'lobby';
  const [query, setQuery] = useState('');
  const [access, setAccess] = useState<'all' | 'guest' | 'account'>('all');
  const [steps, setSteps] = useState<string[]>([]);
  const [largerText, setLargerText] = useState(false);
  const addStep = (id: string) => setSteps((current) => current.includes(id) ? current : [...current, id]);
  const clearVisit = () => {
    setSteps([]);
    setQuery('');
    setAccess('all');
  };
  const matches = services.filter((service) =>
    (access === 'all' || service.access === access) &&
    `${service.title} ${service.summary} ${service.keywords}`.toLowerCase().includes(query.toLowerCase().trim()),
  );
  const selected = services.find((service) => service.id === screen);

  return (
    <div className={`rcc-journey ${largerText ? 'rcc-large' : ''}`}>
      <header className="rcc-header">
        <Link to="/" className="rcc-brand" aria-label="Recovery Community Center front door">
          <img src="/images/rco-iowa-logo.jpg" alt="" width="52" height="54" />
          <span><strong>Iowa’s Recovery<br />Community Center</strong><small>Founded and operated by Grace For Addictions · Powered by RecoveryOS</small></span>
        </Link>
        <nav aria-label="Community Center">
          <Link to={path('lobby')} aria-current={screen === 'lobby' ? 'page' : undefined}>Lobby</Link>
          <Link to={path('front-desk')} aria-current={screen === 'front-desk' ? 'page' : undefined}>Front desk</Link>
          <Link to={path('kiosk')} aria-current={screen === 'kiosk' ? 'page' : undefined}>Kiosk</Link>
          <Link to="/support">Support now</Link>
          <Link to="/sign-in">Sign in</Link>
        </nav>
      </header>
      <main id="main-content" className="rcc-main">
        {screen === 'lobby' && (
          <>
            <p className="rcc-eyebrow">01 / The lobby</p>
            <div className="rcc-heading"><div><h1>Welcome. <em>Take your time.</em></h1><p>You do not need to know exactly what to ask for. Choose where you would like to begin.</p></div><span className="rcc-pill">Exploring as a guest</span></div>
            <div className="rcc-lobby">
              <div><div className="rcc-scene"><img src="/images/rco-iowa-lobby.png" alt="Illustrated virtual lobby with a reception desk, seating, and a self-service kiosk" /><Link className="rcc-hotspot rcc-hotspot-desk" to={path('front-desk')}>Visit the front desk</Link><Link className="rcc-hotspot rcc-hotspot-kiosk" to={path('kiosk')}>Open the kiosk</Link></div><p className="rcc-caption">Illustrative virtual environment, not a photograph of an existing facility.</p></div>
              <aside className="rcc-welcome"><div><p className="rcc-eyebrow">A little reassurance</p><h2>You can simply look around.</h2><p>No story to explain. No pressure to sign up. More than one way forward.</p></div><Link className="rcc-button rcc-button-light" to={path('front-desk')}>Help me get started</Link></aside>
            </div>
            <div className="rcc-grid">
              <Link className="rcc-card" to={path('front-desk')}><span>01 · A human connection</span><h2>Start at the front desk</h2><p>Find a person to talk with or ask for help choosing.</p><b>Meet your options →</b></Link>
              <Link className="rcc-card" to={path('kiosk')}><span>02 · Explore at your pace</span><h2>Use the self-service kiosk</h2><p>Explore support, housing, circles, and recovery tools.</p><b>Explore the kiosk →</b></Link>
              <Link className="rcc-card" to={path('circles')}><span>03 · Belonging starts here</span><h2>Find a recovery circle</h2><p>Learn what to expect and how to ask for current details.</p><b>Visit the community board →</b></Link>
            </div>
            <div className="rcc-callout"><p><strong>Need a quiet moment?</strong><br />Taking a pause is a place to start, too.</p><Link className="rcc-button rcc-button-outline" to={path('quiet')}>Visit the quiet corner</Link></div>
          </>
        )}

        {screen === 'front-desk' && (
          <>
            <Link className="rcc-back" to={path('lobby')}>← Lobby</Link>
            <p className="rcc-eyebrow">02 / The front desk</p>
            <h1>Let’s find your <em>next step.</em></h1>
            <p className="rcc-lede">You can reach a person, explore on your own, or get help deciding where to begin.</p>
            <div className="rcc-callout"><p><strong>GFA Warmline</strong><br />Peer support: {GFA_CONTACTS.warmline.display}</p><a className="rcc-button" href={`tel:${GFA_CONTACTS.warmline.number}`}>Call the warmline</a></div>
            <div className="rcc-grid">
              <Link className="rcc-card" to="/support"><h2>I need support now</h2><p>See immediate support options without an account.</p><b>See options →</b></Link>
              <Link className="rcc-card" to={path('kiosk')}><h2>I want to look around</h2><p>Choose the subject that is useful to you today.</p><b>Open the kiosk →</b></Link>
              <Link className="rcc-card" to="/recovery-residences"><h2>I am looking for housing</h2><p>See public residence information and application paths.</p><b>Explore housing →</b></Link>
            </div>
            <p className="rcc-note">Browsing here does not create a request or participant record. Calling uses your device’s phone app; response availability may vary.</p>
          </>
        )}

        {screen === 'kiosk' && (
          <>
            <Link className="rcc-back" to={path('lobby')}>← Lobby</Link>
            <div className="rcc-kiosk"><div className="rcc-kiosk-top"><span>RecoveryOS / Community kiosk</span><Link to={path('lobby')} onClick={clearVisit}>Finish &amp; clear this visit</Link></div>
              <div className="rcc-kiosk-body"><p className="rcc-eyebrow">You choose the starting point</p><h1>What would help you today?</h1>
                <div className="rcc-filters"><label>Search options<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try housing, circles, work…" /></label><label>Show options<select value={access} onChange={(event) => setAccess(event.target.value as typeof access)}><option value="all">All options</option><option value="guest">Explore without an account</option><option value="account">Continue with an account</option></select></label></div>
                {matches.length ? <div className="rcc-grid rcc-tiles">{matches.map((item) => <Link key={item.id} className="rcc-card" to={path(item.id)}><span>{item.access === 'guest' ? 'Explore as a guest' : 'Account for continuity'}</span><h2>{item.title}</h2><p>{item.summary}</p><b>Learn more →</b></Link>)}</div> : <p role="status">No match yet. Try another word or <Link to={path('front-desk')}>visit the front desk</Link>.</p>}
              </div><div className="rcc-kiosk-foot"><span>{steps.length} item{steps.length === 1 ? '' : 's'} in this visit’s next steps</span><Link className="rcc-button rcc-button-light" to={path('next-steps')}>View my next steps</Link></div>
            </div>
            <p className="rcc-note">Choices stay in this browser visit only. Nothing is sent to GFA when you browse or add a next step.</p>
            <button className="rcc-text-button" type="button" aria-pressed={largerText} onClick={() => setLargerText(!largerText)}>Larger text</button>
          </>
        )}

        {screen === 'circles' && (
          <>
            <Link className="rcc-back" to={path('lobby')}>← Lobby</Link><p className="rcc-eyebrow">Recovery circles</p><h1>There’s room for <em>your story.</em></h1>
            <p className="rcc-lede">Recovery circles are a place for connection. You may listen, share when you choose, and honor different recovery pathways.</p>
            <div className="rcc-callout"><p><strong>Ask for current meeting details</strong><br />Locations and schedules can change. Call the warmline before making a trip.</p><a className="rcc-button" href={`tel:${GFA_CONTACTS.warmline.number}`}>Call {GFA_CONTACTS.warmline.display}</a></div>
            <Link className="rcc-button rcc-button-outline" to={path('front-desk')}>Other ways to connect</Link>
          </>
        )}

        {screen === 'quiet' && (
          <>
            <Link className="rcc-back" to={path('lobby')}>← Lobby</Link><p className="rcc-eyebrow">The quiet corner</p><h1>Take a moment.</h1><p className="rcc-lede">You can pause here without an account or a check-in. Notice what feels steady around you, then choose your next step when you are ready.</p>
            <div className="rcc-callout"><p>If you need immediate support, it is available without signing in.</p><Link className="rcc-button" to="/support">Support now</Link></div>
          </>
        )}

        {screen === 'next-steps' && (
          <>
            <Link className="rcc-back" to={path('kiosk')}>← Kiosk</Link><p className="rcc-eyebrow">For this visit only</p><h1>My next steps</h1>
            {steps.length ? <div className="rcc-grid">{steps.map((id) => { const item = services.find((service) => service.id === id); return item && <div className="rcc-card" key={id}><h2>{item.title}</h2><p>{item.summary}</p><Link to={item.href}>{item.action} →</Link><button className="rcc-text-button" type="button" onClick={() => setSteps((current) => current.filter((key) => key !== id))}>Remove</button></div>; })}</div> : <p>You have not added a step. Explore the kiosk to choose one.</p>}
            <p className="rcc-note">This list is only in memory while you browse. It is not a request, referral, saved account plan, or service record.</p>
            <Link className="rcc-button" to={path('kiosk')}>Explore more options</Link>
          </>
        )}

        {selected && !['lobby', 'front-desk', 'kiosk', 'circles', 'quiet', 'next-steps'].includes(screen) && (
          <>
            <Link className="rcc-back" to={path('kiosk')}>← Kiosk</Link><p className="rcc-eyebrow">{selected.title}</p><h1>{selected.summary}</h1><p className="rcc-lede">{selected.detail}</p>
            <div className="rcc-actions"><Link className="rcc-button" to={selected.href}>{selected.action}</Link><button className="rcc-button rcc-button-outline" type="button" onClick={() => addStep(selected.id)}>Add to this visit’s next steps</button></div>
            <p className="rcc-note">Adding a step does not send a request or save it to an account.</p>
          </>
        )}
        {!['lobby', 'front-desk', 'kiosk', 'circles', 'quiet', 'next-steps'].includes(screen) && !selected && (
          <><h1>This room is not available.</h1><Link className="rcc-button" to={path('lobby')}>Return to the lobby</Link></>
        )}
      </main>
      <footer className="rcc-footer"><span>Grace For Addictions · No Shame. No Stigma. Just Grace.</span><Link to="/">Front door</Link></footer>
    </div>
  );
}
