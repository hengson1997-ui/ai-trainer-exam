import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';

const THEMES = {
  light: {
    name: '浅色模式',
    icon: '☀️',
  },
  dark: {
    name: '深色模式',
    icon: '🌙',
  },
  claude: {
    name: 'Claude 风格',
    icon: '🌀',
  },
  system: {
    name: '跟随系统',
    icon: '💻',
  },
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getItem('theme', 'light'));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    // 清理自定义样式类，再根据选择添加
    root.classList.toggle('claude', newTheme === 'claude');

    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
    
    setItem('theme', newTheme);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-secondary hover:bg-primary-light transition-colors"
        title="切换主题"
      >
        <span className="text-lg">{THEMES[theme].icon}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-surface rounded-lg shadow-lg border border-theme z-50">
            {Object.entries(THEMES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-primary-light first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  theme === key
                    ? 'text-primary bg-primary-light'
                    : 'text-secondary'
                }`}
              >
                <span>{value.icon}</span>
                <span>{value.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
