import { Mail, Phone, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

const OTHER_LINKS = [
  { label: 'Introduction to Inscription', to: '/#about' },
  { label: 'Find Inscriptions', to: '/inscriptions' },
  { label: 'Translate', to: '/inscriptions' },
];

const MEDIA_LINKS = [
  { label: 'Special Notice', to: '#' },
  { label: 'Events', to: '#' },
  { label: 'Photo Gallery', to: '#' },
  { label: 'Video Gallery', to: '#' },
];

export default function Footer() {
  return (
    <footer id="contact" className="mt-auto bg-stone-900 text-white font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border border-white/30 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 shrink-0" />
            <a href="mailto:admin@sellipi.lk" className="hover:opacity-80 transition-opacity">
              E-Mail : admin@sellipi.lk
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 shrink-0" />
            <span>Hotline : 1911</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Telephone Number : +94 11 2786200, +94 11 2784203-4</span>
          </div>
          <a
            href="https://www.facebook.com/doe.gov.lk"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <FacebookIcon className="w-5 h-5" />
          </a>
        </div>

        <div className="border border-white/30 rounded-2xl p-6">
          <h3 className="font-display text-xl mb-4">OTHER LINKS</h3>
          <ul className="flex flex-col gap-3 text-sm font-light">
            {OTHER_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-maroon transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-white/30 rounded-2xl p-6">
          <h3 className="font-display text-xl mb-4">MEDIA CENTER</h3>
          <ul className="flex flex-col gap-3 text-sm font-light">
            {MEDIA_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-maroon transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white text-stone-900 text-center text-sm py-4">
        Copyright © 2025 – Sellipi.lk | All Right Reserved
      </div>
    </footer>
  );
}
