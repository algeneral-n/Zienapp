import React, { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OnboardingWizard from './pages/OnboardingWizard';
import FounderPage from './pages/FounderPage';
import EmployeePortal from './pages/EmployeePortal';
import LoginPage from './pages/public/LoginPage';
import FeaturesPage from './pages/public/FeaturesPage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';
import IndustriesPage from './pages/public/IndustriesPage';
import AcademyPage from './pages/public/AcademyPage';
import HelpCenterPage from './pages/public/HelpCenterPage';
import LegalPage from './pages/public/LegalPage';
import FeatureDetailPage from './pages/public/FeatureDetailPage';
import FloatingActions from './components/FloatingActions';
import Header from './components/Header';

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [user, setUser] = useState<any>(null);

  // Simple router for demo purposes
  React.useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setRoute(to);
    window.scrollTo(0, 0);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    if (userData.role === 'founder') {
      navigate('/owner');
    } else {
      navigate('/portal');
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const renderRoute = () => {
    if (route.startsWith('/owner')) {
      return user?.role === 'founder' ? <BrowserRouter basename="/owner"><FounderPage /></BrowserRouter> : <LoginPage onLogin={handleLogin} />;
    }
    if (route.startsWith('/portal')) {
      return user ? <BrowserRouter basename="/portal"><EmployeePortal user={user} /></BrowserRouter> : <LoginPage onLogin={handleLogin} />;
    }
    if (route.startsWith('/features/')) {
      const id = route.split('/')[2];
      return <FeatureDetailPage id={id} onNavigate={navigate} />;
    }

    switch (route) {
      case '/register': return <OnboardingWizard />;
      case '/login': return <LoginPage onLogin={handleLogin} />;
      case '/features': return <FeaturesPage onNavigate={navigate} />;
      case '/faq': return <FAQPage />;
      case '/contact': return <ContactPage />;
      case '/industries': return <IndustriesPage />;
      case '/academy': return <AcademyPage />;
      case '/help': return <HelpCenterPage />;
      case '/privacy':
      case '/terms': return <LegalPage />;
      default: return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="relative pt-20">
        <Header 
          onNavigate={navigate} 
          onLogout={handleLogout}
          showBackButton={route !== '/' && route !== ''} 
          user={user} 
        />
        <FloatingActions 
          showBack={route !== '/' && route !== ''} 
          onBack={() => navigate('/')} 
          user={user}
        />
        <div className="pt-20">
          {renderRoute()}
        </div>
      </div>
    </ThemeProvider>
  );
}
