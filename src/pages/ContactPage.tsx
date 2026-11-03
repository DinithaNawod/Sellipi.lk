import { useSiteContent } from '../context/SiteContentContext';
import { useState, type FormEvent } from 'react';
import { MapPin, Phone, Mail, PhoneCall, Printer, Globe, MessageSquare } from 'lucide-react';
import PageHero from '../components/PageHero';
import banner from '../assets/reference/contact-banner.jpg';
import map from '../assets/reference/contact-map.jpg';
export default function ContactPage() {
  const { t, image, value } = useSiteContent();
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = `Name: ${form.get('name')}\nEmail: ${form.get('email')}\nContact: ${form.get('phone')}\n\n${form.get('feedback')}`;
    window.location.href = `mailto:${value('contact_email')}?subject=${encodeURIComponent('Sellipi.lk enquiry')}&body=${encodeURIComponent(body)}`;
    setMessage('Your email application will open with your message. Send it there to contact us.');
  }
  return <main><PageHero title={t("Contact Us")} image={image("image_contact_banner", banner)} /><div className="contact-content wide-content">
    <section className="contact-grid"><a className="contact-map" href={value("contact_map")} target="_blank" rel="noreferrer" aria-label="Open the reference location in Google Maps"><img src={image("image_contact_map", map)} alt={t("Map showing the Pelawatta, Battaramulla area")} /></a><div className="contact-details"><h2 className="underlined-heading">{t("Contact Details")}</h2><dl>
      <div><MapPin /><dt>{t("Address")}</dt><dd>{value('contact_address')}</dd></div>
      <div><Phone /><dt>{t("Telephone Number")}</dt><dd>{value('contact_telephones')}</dd></div>
      <div><Mail /><dt>{t("E-Mail")}</dt><dd><a href={`mailto:${value('contact_email')}`}>{value('contact_email')}</a></dd></div>
      <div><PhoneCall /><dt>{t("Hotline")}</dt><dd>{value('contact_hotline')}</dd></div>
      <div><Printer /><dt>{t("Fax")}</dt><dd>{value('contact_fax')}</dd></div>
      <div><Globe /><dt>{t("Web")}</dt><dd>{value('contact_website')}</dd></div>
    </dl></div></section>
    <section className="contact-form-section"><h2 className="underlined-heading">{t("Get in Chat")}</h2><form onSubmit={submit} className="contact-form"><p><MessageSquare fill="currentColor" />{t("You may contact us by filling in this form any time you need for any related questions. We get back to you via email. Thank you!")}</p><div className="contact-inputs"><input name="name" required placeholder={t("Your Name")} aria-label="Your name" autoComplete="name" /><input name="email" type="email" required placeholder={t("Email Address")} aria-label="Email address" autoComplete="email" /><input name="phone" type="tel" placeholder={t("Contact Number")} aria-label="Contact number" autoComplete="tel" /></div><textarea name="feedback" required placeholder={t("Add Your Feedback Here")} aria-label="Your feedback" rows={7} /><button className="primary-button" type="submit">{t("Send Message")}</button><p className="form-status" role="status">{message}</p></form></section>
  </div></main>;
}
