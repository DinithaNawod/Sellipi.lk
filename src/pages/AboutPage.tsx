import PageHero from '../components/PageHero';
import banner from '../assets/reference/about-banner.jpg';
const objectives = [
  'Digitally preserve ancient Sri Lankan inscriptions in a secure online repository.',
  'Enhance degraded inscription images using AI-powered image processing techniques.',
  'Recognize Ancient Sinhala and Brahmi characters using OCR and deep learning models.',
  'Translate ancient inscriptions into modern Sinhala and English using Natural Language Processing (NLP).',
  'Store inscription metadata such as location, historical period, script type, and descriptions.',
  'Improve accessibility through Text-to-Speech (TTS) functionality.',
  'Provide efficient search and filtering to help users discover inscriptions easily.',
  'Support researchers, students, historians, and tourists with accurate and accessible historical information.',
  'Provide administrators with tools to manage inscriptions, metadata, users, and system content.',
];
export default function AboutPage() {
  return <main><PageHero title="About Us" image={banner} /><article className="editorial-content content-width about-content">
    <section><h2>Vision</h2><p>To become Sri Lanka's leading digital platform for preserving, interpreting, and promoting ancient inscriptions through Artificial Intelligence, making the nation's archaeological heritage accessible to researchers, students, tourists, and future generations.</p></section>
    <section><h2>Mission</h2><p>To preserve Sri Lanka's ancient inscriptions by providing an AI-powered web platform that enhances inscription images, recognizes ancient scripts, translates historical content into modern languages, and offers an accessible digital archive for education, research, and cultural preservation.</p></section>
    <section><h2>Objectives</h2><ol>{objectives.map(item => <li key={item}>{item}</li>)}</ol></section>
  </article></main>;
}
