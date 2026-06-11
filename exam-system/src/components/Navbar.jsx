import ThemeToggle from './ThemeToggle';

const navItems = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'practice', label: '练习模式', icon: '📝' },
  { id: 'exam', label: '模拟考试', icon: '📋' },
  { id: 'wrong', label: '错题本', icon: '❌' },
  { id: 'stats', label: '统计', icon: '📊' },
];

export default function Navbar({ currentPage, onNavigate }) {
  return (
    <nav className="glass-strong sticky top-0 z-50" style={{borderRadius: 0}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background: 'linear-gradient(135deg, #9b8a7a, #7a8a9a)', boxShadow: '0 4px 12px rgba(125, 107, 93, 0.3)'}}>
              AI
            </div>
            <span className="ml-3 text-lg font-medium text-primary">
              人工智能训练师三级
            </span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  currentPage === item.id
                    ? 'btn-glass text-primary'
                    : 'text-secondary hover:text-primary hover:bg-primary-light'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button className="p-2 rounded-xl text-secondary hover:bg-primary-light transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
