import { useState, type FormEvent } from 'react';
import { MapPin, Phone, Mail, PhoneCall, Printer, Globe, MessageSquare } from 'lucide-react';
import PageHero from '../components/PageHero';
import banner from '../assets/reference/contact-banner.jpg';
import map from '../assets/reference/contact-map.jpg';
export default function ContactPage() {
  const [message, setMessage] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = `Name: ${form.get('name')}\nEmail: ${form.get('email')}\nContact: ${form.get('phone')}\n\n${form.get('feedback')}`;
    window.location.href = `mailto:admin@sellipi.lk?subject=${encodeURIComponent('Sellipi.lk enquiry')}&body=${encodeURIComponent(body)}`;
    setMessage('Your email application will open with your message. Send it there to contact us.');
  }
  return <main><PageHero title="Contact Us" image={banner} /><div className="contact-content wide-content">
    <section className="contact-grid"><a className="contact-map" href="https://www.google.com/maps/search/?api=1&query=Department+of+Examinations+Pelawatta+Sri+Lanka" target="_blank" rel="noreferrer" aria-label="Open the reference location in Google Maps"><img src={map} alt="Map showing the Pelawatta, Battaramulla area" /></a><div className="contact-details"><h2 className="underlined-heading">Contact Details</h2><dl>
      <div><MapPin /><dt>Address</dt><dd>Department of Archaeology Sri Lanka, Pelawatta, Battaramulla, Sri Lanka.</dd></div>
      <div><Phone /><dt>Telephone Number</dt><dd>+94 11 2786200, +94 11 2784201, +94 11 2785202,<br />+94 11 2784204, +94 11 2786205, +94 11 2784206,<br />+94 11 2784207</dd></div>
      <div><Mail /><dt>E-Mail</dt><dd><a href="mailto:admin@sellipi.lk">admin@sellipi.lk</a></dd></div>
      <div><PhoneCall /><dt>Hotline</dt><dd>1911</dd></div>
      <div><Printer /><dt>Fax</dt><dd>+94 11 2785220 (General)<br />+94 11 2784422 (School Exams)<br />+94 11 2784232 (Agency Exams)</dd></div>
      <div><Globe /><dt>Web</dt><dd>www.sellipi.lk</dd></div>
    </dl></div></section>
    <section className="contact-form-section"><h2 className="underlined-heading">Get in Chat</h2><form onSubmit={submit} className="contact-form"><p><MessageSquare fill="currentColor" />You may contact us by filling in this form any time you need for any related questions. We get back to you via email. Thank you!</p><div className="contact-inputs"><input name="name" required placeholder="Your Name" aria-label="Your name" autoComplete="name" /><input name="email" type="email" required placeholder="Email Address" aria-label="Email address" autoComplete="email" /><input name="phone" type="tel" placeholder="Contact Number" aria-label="Contact number" autoComplete="tel" /></div><textarea name="feedback" required placeholder="Add Your Feedback Here" aria-label="Your feedback" rows={7} /><button className="primary-button" type="submit">Send Message</button><p className="form-status" role="status">{message}</p></form></section>
  </div></main>;
}
