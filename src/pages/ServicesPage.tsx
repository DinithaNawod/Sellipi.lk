import { Link } from 'react-router-dom';
import { ImagePlus, ImageUp, ScanText, Languages, AudioLines, LibraryBig, Filter, Hourglass, UserRound } from 'lucide-react';
import PageHero from '../components/PageHero';
import banner from '../assets/reference/services-banner.jpg';
import gal from '../assets/reference/gal-vihara.jpg';
import dambulla from '../assets/reference/dambulla.jpg';
import yapahuwa from '../assets/reference/yapahuwa.jpg';
import avukana from '../assets/reference/avukana.jpg';
import sigiriya from '../assets/reference/sigiriya.jpg';
import ruwanwelisaya from '../assets/reference/ruwanwelisaya.jpg';
const services = [
  { title: 'Image Upload', icon: ImagePlus, text: 'Upload images of ancient inscriptions directly through the platform for digital preservation and AI processing.', to: '/translate' },
  { title: 'AI Image Enhancement', icon: ImageUp, text: 'Improve faded, damaged, or low-quality inscription images using advanced image processing techniques to reveal hidden characters.', to: '/translate' },
  { title: 'Ancient Script Recognition (OCR)', icon: ScanText, text: 'Automatically recognize Ancient Sinhala and Brahmi characters using AI-powered Optical Character Recognition (OCR).', to: '/translate' },
  { title: 'Translation & Interpretation', icon: Languages, text: 'Translate recognized inscriptions into modern Sinhala and English while providing easy-to-understand historical interpretations.', to: '/translate' },
  { title: 'Text-to-Speech (TTS)', icon: AudioLines, text: 'Listen to translated inscriptions through audio playback, making historical information accessible to visually impaired users and visitors.', to: '/inscriptions' },
  { title: 'Digital Archive', icon: LibraryBig, text: 'Access a centralized digital repository of Sri Lankan inscriptions with detailed historical metadata, including location, period, script type, and description.', to: '/inscriptions' },
  { title: 'Search & Filter', icon: Filter, text: 'Quickly search and filter inscriptions by location, historical period, script type, keywords, or inscription category.', to: '/inscriptions' },
  { title: 'Historical Metadata Viewer', icon: Hourglass, text: 'View detailed information about each inscription, including discovery location, estimated date, script, historical background, and archaeological significance.', to: '/inscriptions' },
  { title: 'User Accounts', icon: UserRound, text: 'Create an account to upload inscriptions, save favorites, manage your submissions and contribute to the preservation of cultural heritage.', to: '/account' },
];
export default function ServicesPage() {
  return <main><PageHero title="Our Services" image={banner} /><div className="services-content content-width">
    <section id="gallery"><h2>Image Gallery</h2><p>Explore our collection of ancient Sri Lankan inscriptions through a rich digital image gallery. Browse high-quality images of inscriptions from different historical periods and locations. Each image is preserved with detailed metadata, allowing users to discover, study, and appreciate Sri Lanka's archaeological heritage in an interactive and accessible way.</p>
    <div className="heritage-gallery">{[{ image: gal, title: 'Gal Vihara' }, { image: dambulla, title: 'Dambulla Cave Temple' }, { image: yapahuwa, title: 'Yapahuwa Rock' }, { image: avukana, title: 'Avukana Buddha statue' }, { image: sigiriya, title: 'Sigiriya Rock' }, { image: ruwanwelisaya, title: 'Ruwanwelisaya Stupa' }].map(item => <Link to="/inscriptions" key={item.title}><figure><img src={item.image} alt={item.title} /><figcaption>{item.title}</figcaption></figure></Link>)}</div><Link to="/inscriptions" className="see-more">See More...</Link></section>
    <section id="services"><h2>Services</h2><div className="service-list">{services.map(({ title, icon: Icon, text, to }) => <Link to={to} key={title} className="service-item"><div className="service-icon"><Icon aria-hidden="true" /></div><div><h3>{title}</h3><p>{text}</p></div></Link>)}</div></section>
  </div></main>;
}
