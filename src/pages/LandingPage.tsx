import { Link } from 'react-router-dom';
import heroBanner from '../assets/landing/hero-banner.png';
import aboutMountain from '../assets/landing/about-mountain.png';
import captureIllustration from '../assets/landing/capture-illustration.png';
import databaseSeal from '../assets/landing/database-seal.png';
import sriLankaMap from '../assets/landing/sri-lanka-map.png';
import maoriPattern from '../assets/landing/maori-pattern.png';
import partnerNie from '../assets/landing/partner-nie.png';
import partnerEdupub from '../assets/landing/partner-edupub.png';
import partnerNec from '../assets/landing/partner-nec.png';
import partnerArcFlag from '../assets/landing/partner-arc-flag.png';

const QUICK_LINKS = [
  { href: 'https://nec.gov.lk/', img: partnerNec, alt: 'National Education Commission' },
  { href: 'https://www.nie.ac.lk/', img: partnerNie, alt: 'National Institute of Education' },
  { href: 'http://www.edupub.gov.lk/', img: partnerEdupub, alt: 'Educational Publications Department' },
  { href: 'https://nec.gov.lk/', img: partnerArcFlag, alt: 'Department of Archaeology' },
];

export default function LandingPage() {
  return (
    <main className="flex-1 font-poppins text-stone-900">
      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[420px] max-h-[634px] overflow-hidden">
        <img src={heroBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center gap-2 text-white">
          <p className="text-2xl sm:text-3xl">Welcome to Inscription Sri Lanka</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold">Discover the Stories Written in Stone</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-maroon" />
      </section>

      {/* Capture the Past */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-maroon leading-tight mb-6">
            Capture the Past,
            <br />
            Understand the Present
          </h2>
          <p className="text-[#808080] leading-relaxed mb-4">
            Upload or capture an image of an ancient Sri Lankan inscription and experience a new
            way of exploring history. The system enhances the image and uses advanced Artificial
            Intelligence to recognize ancient scripts such as Brahmi and early Sinhala, converting
            them into readable text with high accuracy.
          </p>
          <p className="text-[#808080] leading-relaxed mb-8">
            Once the text is identified, it is translated into clear modern English using
            intelligent language processing, allowing users to easily understand its meaning and
            historical value. This feature makes ancient knowledge accessible to everyone,
            transforming inscriptions into meaningful and interactive insights.
          </p>
          <Link
            to="/inscriptions"
            className="inline-block bg-maroon text-white font-bold px-6 py-3 rounded-[10px] shadow-md hover:bg-maroon-dark transition-colors"
          >
            Translate Now &gt;&gt;
          </Link>
        </div>
        <img src={captureIllustration} alt="Ancient inscription illustration" className="w-full max-w-md mx-auto" />
      </section>

      {/* About Inscriptions of Sri Lanka */}
      <section
        id="about"
        className="relative py-24 bg-cover bg-center"
        style={{ backgroundImage: `url(${aboutMountain})` }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-8">
            About Inscriptions of
            <br />
            Sri Lanka
          </h2>
          <p className="text-white/90 leading-relaxed mb-4">
            “Here are some ancient inscriptions carved on the rocks that amaze everyone who sees
            them. There are various rocks in different parts of the country in the upcountry and
            in the north. These notes are engraved in large capital letters on the rocks, as
            indicated by the number of bamboos spread over the ayam. No one can read them or
            understand what they are.”
          </p>
          <p className="font-display text-2xl text-white mb-8">Robert Knox</p>
          <Link
            to="#about"
            className="inline-block bg-white text-maroon font-bold px-8 py-4 rounded-[10px] shadow-md hover:bg-stone-100 transition-colors"
          >
            More Information &gt;&gt;
          </Link>
        </div>
        </div>
      </section>

      {/* Digitalize Inscription Database */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <img src={databaseSeal} alt="Digitalized inscription database" className="w-full max-w-md mx-auto order-2 md:order-1" />
        <div className="order-1 md:order-2 md:text-right">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-maroon leading-tight mb-6">
            Digitalize Inscription
            <br />
            Database
          </h2>
          <p className="text-[#808080] leading-relaxed mb-8">
            This online database is a beacon of hope for all those who have been studying and
            interested in the history and archaeology of Sri Lanka for a long time.
          </p>
          <Link
            to="/inscriptions"
            className="inline-block bg-maroon text-white font-bold px-6 py-3 rounded-[10px] shadow-md hover:bg-maroon-dark transition-colors"
          >
            Find Inscriptions &gt;&gt;
          </Link>
        </div>
      </section>

      {/* Archaeology Sites Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-maroon mb-12">
          Archaeology Sites Map
        </h2>
        <img
          src={sriLankaMap}
          alt="Map of archaeology sites in Sri Lanka"
          className="mx-auto max-w-sm w-full rounded-[40px] shadow-lg mb-10"
        />
        {/* <Link
          to="/map"
          className="inline-block bg-maroon text-white font-bold px-6 py-3 rounded-[10px] shadow-md hover:bg-maroon-dark transition-colors"
        >
          View on Map &gt;&gt;
        </Link> */}
      </section>

      {/* Quick Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div
          className="relative rounded-[50px] overflow-hidden bg-maroon px-8 py-12 sm:px-16"
          style={{ backgroundImage: `url(${maoriPattern})`, backgroundSize: 'cover', backgroundBlendMode: 'overlay' }}
        >
          <h2 className="font-display text-2xl sm:text-3xl text-white text-center mb-8">
            QUICK LINKS
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.alt}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="bg-white rounded-xl p-4 flex items-center justify-center hover:scale-[1.02] transition-transform"
              >
                <img src={link.img} alt={link.alt} className="max-h-16 w-auto object-contain" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
