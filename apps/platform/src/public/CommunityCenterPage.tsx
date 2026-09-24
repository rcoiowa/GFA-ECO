import { Link } from 'react-router';
import { GFA_CONTACTS } from '@recoveryos/safety';

/** A public front door on the shared RecoveryOS deployment. */
export function CommunityCenterPage() {
  const doors = [
    { to: '/support', title: 'I need support now', body: 'See immediate support options and ways to talk with someone. No sign-in required.' },
    { to: '/register', title: 'I want to connect and grow', body: 'Begin with the virtual community, recovery tools, and people who can walk alongside you.' },
    { to: '/recovery-residences', title: 'I am looking for recovery housing', body: 'Explore residence information and application paths.' },
    { to: '/sign-in', title: 'I already have an account', body: 'Sign in to continue in your RecoveryOS experience.' },
  ];
  return (
    <div className="min-h-dvh bg-[#080e1b] text-[#f4f0ff]">
      <header className="border-b border-white/10 bg-[#0b172b]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="text-lg font-semibold">Recovery Community Center</Link>
          <nav aria-label="Quick links" className="flex flex-wrap items-center gap-4">
            <Link to="/support" className="font-medium text-[#8de7e4] underline-offset-4 hover:underline">Support now</Link>
            <Link to="/sign-in" className="font-medium text-[#8de7e4] underline-offset-4 hover:underline">Sign in</Link>
          </nav>
        </div>
      </header>
      <main>
        <section aria-labelledby="center-title" className="mx-auto max-w-6xl px-4 pt-10">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#70d9dd]">Grace For Addictions · Des Moines, Iowa</p>
          <h1 id="center-title" className="mt-4 text-center font-serif text-4xl font-semibold sm:text-6xl">Iowa’s Recovery Community Center</h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-[#d0d7e5]">A place to find connection, peer-led recovery support, and a way forward. You belong here. Start where you are.</p>
          <div className="relative mx-auto mt-9 aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#69d6d6]/20 bg-[#15335d] shadow-2xl shadow-black/40">
            <img src="/images/recovery-community-center-night.png" alt="Illustrated recovery community center with a lit front door beneath a nighttime Iowa sky" className="h-full w-full object-cover" />
            <a href="#front-door" aria-label="Enter the Recovery Community Center and choose what you need" className="absolute left-[44%] top-[56%] h-[23%] w-[12%] rounded-md border-2 border-transparent outline-offset-4 hover:border-[#80eeee] focus-visible:border-[#80eeee] focus-visible:outline-4 focus-visible:outline-[#80eeee]" />
          </div>
          <div className="mt-6 text-center">
            <a href="#front-door" className="inline-flex min-h-12 items-center rounded-md bg-[#28aeb4] px-7 text-lg font-semibold text-[#061525] hover:bg-[#73dfe0] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white">Enter through the front door</a>
          </div>
        </section>
        <section id="front-door" aria-labelledby="front-door-title" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20">
          <h2 id="front-door-title" className="text-center font-serif text-3xl font-semibold sm:text-4xl">What would help you today?</h2>
          <p className="mt-3 text-center text-[#d0d7e5]">Choose a place to begin. You can explore support without creating an account.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {doors.map(({ to, title, body }) => (
              <Link key={to} to={to} className="rounded-xl border border-[#47707d] bg-[#13243b] p-6 hover:border-[#77e0e1] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#77e0e1]">
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-2 text-[#d0d7e5]">{body}</p>
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center text-[#d0d7e5]">Prefer to talk? Call the GFA warmline at{' '}
            <a href={`tel:${GFA_CONTACTS.warmline.number}`} className="font-semibold text-[#8de7e4] underline underline-offset-2">{GFA_CONTACTS.warmline.display}</a>.
          </p>
        </section>
      </main>
      <footer className="border-t border-white/10 px-4 py-6 text-sm text-[#c6d0dc]">
        <p className="mx-auto max-w-6xl">Grace For Addictions · Connection Prevents Crisis · No Shame. No Stigma. Just Grace. · In immediate danger, call 911. <Link to="/support" className="underline underline-offset-2">All support options</Link></p>
      </footer>
    </div>
  );
}
