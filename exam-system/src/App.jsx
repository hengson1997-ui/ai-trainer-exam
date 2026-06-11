import { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import ExamPage from './pages/ExamPage';
import WrongBookPage from './pages/WrongBookPage';
import StatsPage from './pages/StatsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});

  const handleNavigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'practice':
        return (
          <PracticePage
            initialCategory={pageParams.category}
            initialType={pageParams.type}
          />
        );
      case 'exam':
        return <ExamPage onNavigate={handleNavigate} />;
      case 'wrong':
        return <WrongBookPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'var(--color-bg)', position: 'relative', zIndex: 0}}>
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;
