import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';
import { fetchPublicStats, type PublicStats } from '../services/api';
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

const numberFormatter = new Intl.NumberFormat();

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useCountUp(target: number | null, duration = 1200): number | null {
  const [display, setDisplay] = useState<number | null>(null);
  const currentRef = useRef(0);

  useEffect(() => {
    if (target === null) return;
    if (prefersReducedMotion()) {
      const id = window.requestAnimationFrame(() => {
        currentRef.current = target;
        setDisplay(target);
      });
      return () => window.cancelAnimationFrame(id);
    }

    const from = currentRef.current;
    const diff = target - from;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + diff * eased);
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, duration]);

  return display;
}

function useHeroTypewriter(line1: string, line2: string) {
  const total = line1.length + line2.length;
  const [typedCount, setTypedCount] = useState(() => (prefersReducedMotion() ? total : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = window.requestAnimationFrame(() => setTypedCount(total));
      return () => window.cancelAnimationFrame(id);
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedCount(index);
      if (index >= total) {
        window.clearInterval(timer);
      }
    }, 36);

    return () => window.clearInterval(timer);
  }, [line1, line2, total]);

  const clamped = Math.min(typedCount, total);
  const typedLine1 = line1.slice(0, Math.min(clamped, line1.length));
  const typedLine2 = clamped > line1.length ? line2.slice(0, clamped - line1.length) : '';
  const activeLine = clamped < line1.length ? 1 : clamped < total ? 2 : 0;

  return { typedLine1, typedLine2, activeLine, isDone: clamped >= total };
}

export default function LandingPage() {
  const { t, image, value: siteValue } = useSiteContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState('');
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  const heroSubtitle = t('Welcome to Inscription Sri Lanka');
  const heroTitle = t('Discover the Stories Written in Stone');
  const { typedLine1, typedLine2, activeLine, isDone } = useHeroTypewriter(heroSubtitle, heroTitle);

  const thirdStatTarget = stats ? (stats.languages > 0 ? stats.languages : stats.scripts) : null;
  const animatedInscriptions = useCountUp(stats ? stats.inscriptions : null, 1300);
  const animatedSites = useCountUp(stats ? stats.sites : null, 1150);
  const animatedThird = useCountUp(thirdStatTarget, 900);

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        const data = await fetchPublicStats();
        if (active) setStats(data);
      } catch {
        // Keep last loaded counts if API is temporarily unreachable
      }
    };
    void loadStats();
    const onFocus = () => { void loadStats(); };
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => { void loadStats(); }, 30000);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, []);

  const heroImage = image('image_home_hero', hero);
  const heroVideo = siteValue('video_home_hero').trim();
  const showVideo = Boolean(heroVideo) && failedVideoUrl !== heroVideo;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  return <main className="home-page">
    <section className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
      {showVideo && (
        <video
          ref={videoRef}
          key={heroVideo}
          className="home-hero-video"
          src={heroVideo}
          poster={heroImage}
          autoPlay
          loop
          muted={muted}
          playsInline
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onError={() => setFailedVideoUrl(heroVideo)}
        />
      )}
      <div className="home-hero-content">
        <div className="home-hero-heading">
          <p className="hero-type-line" aria-label={heroSubtitle}>
            <span className="hero-type-spacer" aria-hidden="true">{heroSubtitle}</span>
            <span className="hero-type-live" aria-hidden="true">
              {typedLine1}
              {activeLine === 1 && <span className="hero-type-cursor" />}
            </span>
          </p>
          <h1 className="hero-type-line" aria-label={heroTitle}>
            <span className="hero-type-spacer" aria-hidden="true">{heroTitle}</span>
            <span className="hero-type-live" aria-hidden="true">
              {typedLine2}
              {(activeLine === 2 || isDone) && (
                <span className={`hero-type-cursor ${isDone ? 'is-done' : ''}`} />
              )}
            </span>
          </h1>
        </div>
        <aside className="home-hero-stats" aria-label="Archive statistics">
          <div className="hero-stat-item">
            <strong>{animatedInscriptions !== null ? numberFormatter.format(animatedInscriptions) : '—'}</strong>
            <span>{t("Inscriptions")}</span>
          </div>
          <div className="hero-stat-item">
            <strong>{animatedSites !== null ? numberFormatter.format(animatedSites) : '—'}</strong>
            <span>{t("Sites")}</span>
          </div>
          <div className="hero-stat-item">
            <strong>{animatedThird !== null ? numberFormatter.format(animatedThird) : '—'}</strong>
            <span>{t(stats && stats.languages > 0 ? "Languages" : "Scripts")}</span>
          </div>
        </aside>
      </div>
      {showVideo && (
        <div className="home-hero-controls">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={paused ? 'Play background video' : 'Pause background video'}
            title={paused ? 'Play video' : 'Pause video'}
          >
            {paused ? <Play /> : <Pause />}
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute background video' : 'Mute background video'}
            title={muted ? 'Unmute video' : 'Mute video'}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
        </div>
      )}
    </section>
    <section className="home-capture content-width"><div><h2>{t("Capture the Past,")}<br />{t("Understand the Present")}</h2>
      <p>{t("Upload or capture an image of an ancient Sri Lankan inscription and experience a new way of exploring history. The system enhances the image and uses advanced Artificial Intelligence to recognize ancient scripts such as Brahmi and early Sinhala, converting them into readable text with high accuracy.")}</p>
      <p>{t("Once the text is identified, it is translated into clear modern English using intelligent language processing, allowing users to easily understand its meaning and historical value. This feature makes ancient knowledge accessible to everyone, transforming inscriptions into meaningful and interactive insights.")}</p>
      <Link className="primary-button" to="/translate">{t("Translate Now >>")}</Link>
    </div><img src={image("image_home_capture", capture)} alt={t("Sri Lankan heritage line illustration")} /></section>
    <section className="home-about" style={{ backgroundImage: `url(${image("image_home_mountain", mountain)})` }}><div className="content-width"><h2>{t("About Inscriptions of")}<br />{t("Sri Lanka")}</h2><blockquote>{t("“Here are some ancient inscriptions carved on the rocks that amaze everyone who sees them. There are various rocks in different parts of the country in the upcountry and in the north. These notes are engraved in large capital letters on the rocks, as indicated by the number of bamboos spread over the ayam. No one can read them or understand what they are.”")}</blockquote><p className="quote-author">{t("Robert Knox")}</p><Link to="/introduction" className="primary-button light-button">{t("More Information >>")}</Link></div></section>
    <div className="home-pattern"><section className="home-database content-width"><img src={image("image_home_seal", seal)} alt={t("Ancient inscription symbol")} /><div><h2>{t("Digitalize Inscription")}<br />{t("Database")}</h2><p>{t("This online database is a beacon of hope for all those who have been studying and interested in the history and archaeology of Sri Lanka for a long time.")}</p><Link to="/inscriptions" className="primary-button">{t("Find Inscriptions >>")}</Link></div></section>
    <section className="home-map content-width"><h2>{t("Archaeology Sites Map")}</h2><div><Link to="/map" className="primary-button">{t("View on Map >>")}</Link><Link to="/map" aria-label="Explore archaeology sites on the map"><img src={image("image_home_map", map)} alt={t("Archaeology sites across Sri Lanka")} /></Link></div></section></div>
    <section className="quick-links content-width"><h2 className="underlined-heading">{t("QUICK LINKS")}</h2><div>{[
      { image: image("image_home_nec", nec), label: 'National Education Commission', url: siteValue("link_bb1e04e1c708773f") },
      { image: image("image_home_edupub", edupub), label: 'Educational Publications Department', url: siteValue("link_b1bfd90467c5e17a") },
      { image: image("image_home_nie", nie), label: 'National Institute of Education', url: siteValue("link_3117e1dac50a7642") },
      { image: image("image_home_archaeology", archaeology), label: 'Department of Archaeology', url: siteValue("link_dee5eb362ccf1d8c") },
    ].map(item => <a href={item.url} target="_blank" rel="noreferrer" key={t(item.label)}><img src={item.image} alt={t(item.label)} /></a>)}</div></section>
  </main>;
}
