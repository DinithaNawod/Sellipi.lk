import { useSiteContent } from '../context/SiteContentContext';
import { Mail, Phone, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import { navigation } from './Navbar';

export default function Footer() {
  const { t, value } = useSiteContent();
  return <footer className="site-footer">
    <div className="footer-pattern"><div className="footer-grid">
      <div className="footer-contact footer-panel">
        <a href={`mailto:${value('contact_email')}`}><Mail /><span>E-Mail : {value('contact_email')}</span></a>
        <div><Phone /><span>Hotline : {value('contact_hotline')}</span></div>
        <a href={`tel:${value('contact_dial')}`}><PhoneCall /><span>Telephone Number : {value('contact_phone')}</span></a>
        <a href={value('contact_facebook')} target="_blank" rel="noreferrer" className="facebook-link" aria-label="Facebook">{t("f")}</a>
      </div>
      <div className="footer-panel footer-links"><h2>{t("OTHER LINKS")}</h2><nav aria-label="Footer navigation">{navigation.slice(1).map(item => <Link key={item.to} to={item.to}>{t(item.label)}</Link>)}</nav></div>
      <div className="footer-panel footer-links"><h2>{t("MEDIA CENTER")}</h2><nav aria-label="Media center"><span>{t("Special Notice")}</span><span>{t("Events")}</span><Link to="/services#gallery">{t("Photo Gallery")}</Link><span>{t("Video Gallery")}</span></nav></div>
    </div></div>
    <div className="copyright">{t("Copyright © 2025 – Sellipi.lk | All Right Reserved")}</div>
  </footer>;
}
