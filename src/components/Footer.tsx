import { Mail, Phone, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navigation } from './Navbar';

export default function Footer() {
  return <footer className="site-footer">
    <div className="footer-pattern"><div className="footer-grid">
      <div className="footer-contact footer-panel">
        <a href="mailto:admin@sellipi.lk"><Mail /><span>E-Mail : admin@sellipi.lk</span></a>
        <div><Phone /><span>Hotline : 1911</span></div>
        <a href="tel:+94112786200"><PhoneCall /><span>Telephone Number : +94 11 2786200, +94 11 2784203-4</span></a>
        <a href="https://www.facebook.com/doe.gov.lk" target="_blank" rel="noreferrer" className="facebook-link" aria-label="Facebook">f</a>
      </div>
      <div className="footer-panel footer-links"><h2>OTHER LINKS</h2><nav aria-label="Footer navigation">{navigation.slice(1).map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}</nav></div>
      <div className="footer-panel footer-links"><h2>MEDIA CENTER</h2><nav aria-label="Media center"><span>Special Notice</span><span>Events</span><Link to="/services#gallery">Photo Gallery</Link><span>Video Gallery</span></nav></div>
    </div></div>
    <div className="copyright">Copyright © 2025 – Sellipi.lk | All Right Reserved</div>
  </footer>;
}
