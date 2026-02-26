import { useState, useEffect } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.body.classList.add('dark-theme');
        } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDark(true);
            document.body.classList.add('dark-theme');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
            {isDark ? <FaSun size={18} className="theme-icon sun" /> : <FaMoon size={18} className="theme-icon moon" />}
        </button>
    );
};

export default ThemeToggle;
