import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { Link } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const ArchiveView = lazy(() => import('./pages/ArchiveView'));
const TranslatePage = lazy(() => import('./pages/TranslatePage'));
const DetailView = lazy(() => import('./pages/DetailView'));
const MapView = lazy(() => import('./pages/MapView'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminRegister = lazy(() => import('./pages/AdminRegister'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const IntroductionPage = lazy(() => import('./pages/IntroductionPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));

function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const authPage = pathname === '/admin/login' || pathname === '/admin/register';
  return <div className="app-shell">{!authPage && <Navbar />}{children}{!authPage && <Footer />}</div>;
}

function InscriptionDetails() {
  const { id } = useParams();
  return <DetailView key={id} />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <SiteLayout>
          <Suspense fallback={<main className="state-message" role="status">Loading page…</main>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/inscriptions" element={<ArchiveView />} />
            <Route path="/translate" element={<TranslatePage />} />
            <Route path="/inscription/:id" element={<InscriptionDetails />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/introduction" element={<IntroductionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<main className="empty-page"><h1>Page not found</h1><Link className="primary-button" to="/">Back to Home</Link></main>} />
          </Routes>
          </Suspense>
        </SiteLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
