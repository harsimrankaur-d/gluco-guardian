import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout, getLatestLog } from "@/lib/glucosense";
import EmergencySOSModal from "./EmergencySOSModal";
import { Bell, Menu } from "lucide-react";

export default function Navbar() {
  const [sosOpen, setSosOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const latestLog = getLatestLog();

  const initials = session?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setScrolled(scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/predictor', label: 'Risk Predictor' },
    { to: '/timeline', label: 'Timeline' },
    { to: '/settings', label: 'Settings' },
  ];

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20"
        style={{ borderRadius: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to={session ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div
              className="transition-all duration-500 overflow-hidden flex items-center gap-2"
              style={{
                maxWidth: scrolled ? '300px' : '0px',
                opacity: scrolled ? 1 : 0,
                transition: 'max-width 0.5s ease, opacity 0.5s ease',
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-heading text-primary text-xs font-bold">GG</span>
              </div>
              <span
                className="font-heading text-sm hidden sm:block whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 30%, #00F5D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                GlucoGuardian
              </span>
            </div>
          </Link>

          {/* Nav links — only when logged in */}
          {session && (
            <div className="hidden md:flex items-center gap-6">
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-sm font-body transition-colors ${
                    location.pathname === l.to
                      ? 'text-primary'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <button className="relative text-foreground/60 hover:text-foreground transition-colors">
                  <Bell size={18} />
                  {latestLog && latestLog.riskScore > 55 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => setSosOpen(true)}
                  className="btn-primary-glow text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                  style={{ background: 'hsl(356,82%,56%)', boxShadow: '0 0 15px rgba(230,57,70,0.4)' }}
                >
                  🆘 SOS
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-heading text-primary">
                  {initials}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                >
                  Logout
                </button>
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden text-foreground/60"
                >
                  <Menu size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Login */}
                <Link
                  to="/auth"
                  className="flex items-center gap-2 text-xs font-heading uppercase tracking-widest transition-all duration-200 hover:scale-105"
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: '100px',
                    border: '1.5px solid rgba(0,255,204,0.45)',
                    color: '#00ffcc',
                    background: 'rgba(0,255,204,0.07)',
                    backdropFilter: 'blur(6px)',
                    letterSpacing: '0.12em',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  Login
                </Link>

                {/* Sign Up */}
                <Link
                  to="/auth"
                  className="flex items-center gap-2 text-xs font-heading uppercase tracking-widest transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    padding: '0.5rem 1.2rem',
                    borderRadius: '100px',
                    border: 'none',
                    color: '#0a0020',
                    background: 'linear-gradient(135deg, #00ffcc, #a97ff0)',
                    boxShadow: '0 0 18px #00ffcc44',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && session && (
          <div className="md:hidden glass-card p-4 mx-4 mb-2 mt-1" style={{ borderRadius: 12 }}>
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="mt-2 text-sm text-destructive">
              Logout
            </button>
          </div>
        )}
      </nav>

      <EmergencySOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </>
  );
}
