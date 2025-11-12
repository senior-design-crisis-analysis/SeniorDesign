import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../public/vite.svg';


export default function Nav() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: 'Data Table',  href: '/datatable' },
    { label: 'Anaylsis',  href: '/anaylsis' },
    { label: 'Information', href: '/info' },
  ];

  return (
    <header className="fixed top-3 left-3 right-3 z-50">
      <nav className="mx-auto flex h-16 items-center justify-between rounded-[20px] bg-white/70 px-6 backdrop-blur md:px-8">
        
        <Link to="/" className="flex gap-[6px] h-8 items-center">
          <img
            src={logo}
            alt="RiskRadar"
            className="h-8 w-auto"
          />
          <h3 className='font-medium text-[20px]'>RiskRadar</h3>
        </Link>

        <div className="flex h-8 items-center"> 
        <ul className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((l) => (
            <li key={l.label}>
                <Link
                  to={l.href}
                  className="font-medium text-[16px]"
                  style={{ color: '#1e293b' }}
                >
                  {l.label}
                </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden grid h-8 w-8 place-items-center rounded-lg bg-transparent"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
            {open ? (
              <>
                <X style={{ color: '#1e293b' }} size={24} className="place-self-center" />
              </>
            ) : (
              <>
                <Menu style={{ color: '#1e293b' }} size={24} className="place-self-center" />
              </>
            )}
        </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <ul className="mt-2 rounded-[20px] bg-white/80 px-6 py-4 backdrop-blur md:hidden" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
          {navLinks.map((l) => (
            <li key={l.label} className="mb-3 last:mb-0">
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}