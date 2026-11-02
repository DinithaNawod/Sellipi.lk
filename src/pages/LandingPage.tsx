import { Link } from 'react-router-dom';
import hero from '../assets/reference/hero-banner.jpg';
import mountain from '../assets/reference/about-mountain.jpg';
import capture from '../assets/reference/capture-illustration.jpg';
import seal from '../assets/reference/database-seal.jpg';
import map from '../assets/landing/sri-lanka-map.png';
import nie from '../assets/landing/partner-nie.png';
import edupub from '../assets/landing/partner-edupub.png';
import nec from '../assets/landing/partner-nec.png';
import archaeology from '../assets/landing/partner-arc-flag.png';

export default function LandingPage() {
  return <main className="home-page">
    <section className="home-hero" style={{ backgroundImage: `url(${hero})` }}><div><p>Welcome to Inscription Sri Lanka</p><h1>Discover the Stories Written in Stone</h1></div></section>
    <section className="home-capture content-width"><div><h2>Capture the Past,<br />Understand the Present</h2>
      <p>Upload or capture an image of an ancient Sri Lankan inscription and experience a new way of exploring history. The system enhances the image and uses advanced Artificial Intelligence to recognize ancient scripts such as Brahmi and early Sinhala, converting them into readable text with high accuracy.</p>
      <p>Once the text is identified, it is translated into clear modern English using intelligent language processing, allowing users to easily understand its meaning and historical value. This feature makes ancient knowledge accessible to everyone, transforming inscriptions into meaningful and interactive insights.</p>
      <Link className="primary-button" to="/translate">Translate Now &gt;&gt;</Link>
    </div><img src={capture} alt="Sri Lankan heritage line illustration" /></section>
    <section className="home-about" style={{ backgroundImage: `url(${mountain})` }}><div className="content-width"><h2>About Inscriptions of<br />Sri Lanka</h2><blockquote>“Here are some ancient inscriptions carved on the rocks that amaze everyone who sees them. There are various rocks in different parts of the country in the upcountry and in the north. These notes are engraved in large capital letters on the rocks, as indicated by the number of bamboos spread over the ayam. No one can read them or understand what they are.”</blockquote><p className="quote-author">Robert Knox</p><Link to="/introduction" className="primary-button light-button">More Information &gt;&gt;</Link></div></section>
    <div className="home-pattern"><section className="home-database content-width"><img src={seal} alt="Ancient inscription symbol" /><div><h2>Digitalize Inscription<br />Database</h2><p>This online database is a beacon of hope for all those who have been studying and interested in the history and archaeology of Sri Lanka for a long time.</p><Link to="/inscriptions" className="primary-button">Find Inscriptions &gt;&gt;</Link></div></section>
    <section className="home-map content-width"><h2>Archaeology Sites Map</h2><div><Link to="/map" className="primary-button">View on Map &gt;&gt;</Link><Link to="/map" aria-label="Explore archaeology sites on the map"><img src={map} alt="Archaeology sites across Sri Lanka" /></Link></div></section></div>
    <section className="quick-links content-width"><h2 className="underlined-heading">QUICK LINKS</h2><div>{[
      { image: nec, label: 'National Education Commission', url: 'https://nec.gov.lk/' },
      { image: edupub, label: 'Educational Publications Department', url: 'https://www.edupub.gov.lk/' },
      { image: nie, label: 'National Institute of Education', url: 'https://www.nie.ac.lk/' },
      { image: archaeology, label: 'Department of Archaeology', url: 'https://archaeology.gov.lk/' },
    ].map(item => <a href={item.url} target="_blank" rel="noreferrer" key={item.label}><img src={item.image} alt={item.label} /></a>)}</div></section>
  </main>;
}
