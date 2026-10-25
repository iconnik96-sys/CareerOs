import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
    {
        id: 'cosmic',
        name: 'Cosmic Cyber',
        tagline: 'Linear & Raycast Aesthetic',
        description: 'Deep Space Obsidian with Electric Indigo and Hyper-Cyan neon glows.',
        baseBg: '#080b11',
        cardBg: '#0f172a',
        primary: '#6366f1',
        secondary: '#06b6d4',
        accentGradient: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
        glowColor: 'rgba(99, 102, 241, 0.35)',
        badge: 'Popular',
        dotClass: 'bg-indigo'
    },
    {
        id: 'emerald',
        name: 'Emerald Terminal',
        tagline: 'Supabase & Matrix Carbon',
        description: 'Pitch Carbon dark mode with vibrant Cyber Mint and Emerald badges.',
        baseBg: '#070b09',
        cardBg: '#0b1410',
        primary: '#10b981',
        secondary: '#34d399',
        accentGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        glowColor: 'rgba(16, 185, 129, 0.35)',
        badge: 'High Focus',
        dotClass: 'bg-emerald'
    },
    {
        id: 'amethyst',
        name: 'Midnight Amethyst',
        tagline: 'Vercel AI & Discord Luxury',
        description: 'Deep Velvet Violet with Royal Purple and Fluorescent Magenta accents.',
        baseBg: '#090714',
        cardBg: '#110c22',
        primary: '#8b5cf6',
        secondary: '#ec4899',
        accentGradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        glowColor: 'rgba(139, 92, 246, 0.35)',
        badge: 'Creative',
        dotClass: 'bg-purple'
    },
    {
        id: 'sunset',
        name: 'Tokyo Sunset',
        tagline: 'Stripe Radar & Warm Copilot',
        description: 'Dark Titanium with Luminous Amber and Electric Coral Flame accents.',
        baseBg: '#0d0c10',
        cardBg: '#16131d',
        primary: '#f59e0b',
        secondary: '#f43f5e',
        accentGradient: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
        glowColor: 'rgba(245, 158, 11, 0.35)',
        badge: 'High Energy',
        dotClass: 'bg-amber'
    }
];

const ThemeContext = createContext({
    theme: 'cosmic',
    setTheme: () => {},
    themes: THEMES
});

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        try {
            return localStorage.getItem('careeros_theme') || 'cosmic';
        } catch {
            return 'cosmic';
        }
    });

    useEffect(() => {
        try {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('careeros_theme', theme);
        } catch (e) {
            console.error('Failed to set theme in localStorage', e);
        }
    }, [theme]);

    const setTheme = (newTheme) => {
        if (THEMES.some(t => t.id === newTheme)) {
            setThemeState(newTheme);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
