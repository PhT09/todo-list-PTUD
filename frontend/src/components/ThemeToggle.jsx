import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
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
        <Button
            icon={isDark ? 'pi pi-sun' : 'pi pi-moon'}
            rounded
            text
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="absolute right-0 top-1/2 -translate-y-1/2"
            style={{
                width: '2.5rem',
                height: '2.5rem',
                color: 'var(--color-text-main)',
                background: 'var(--color-card-bg)',
                border: '1px solid var(--color-glass-border)',
            }}
        />
    );
};

export default ThemeToggle;
