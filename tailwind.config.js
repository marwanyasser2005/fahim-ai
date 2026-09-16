/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Fahim's palette is owned by src/styles/tokens.css. Exposing it here means
      // components can write `bg-panel` / `text-muted` instead of `bg-[var(--panel)]`,
      // and every token stays theme-aware because it resolves at runtime.
      colors: {
        surface: 'var(--surface)',
        paper: 'var(--paper)',
        panel: 'var(--panel)',
        soft: 'var(--soft)',
        ink: 'var(--ink)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--border)',
        band: 'var(--band)',
        lapis: 'var(--lapis)',
        nile: 'var(--nile)',
        saffron: 'var(--saffron)',
        vermilion: 'var(--vermilion)',
        'brand-solid': 'var(--brand-solid)',
        'evidence-solid': 'var(--evidence-solid)',
        'danger-solid': 'var(--danger-solid)',
        'warning-solid': 'var(--warning-solid)',
        'on-solid': 'var(--on-solid)',
      },
      borderRadius: {
        control: 'var(--radius-control)',
        input: 'var(--radius-input)',
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        panel: 'var(--shadow-panel)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
      },
      fontFamily: {
        display: 'var(--font-display-ar)',
        body: 'var(--font-body-ar)',
      },
      maxWidth: {
        content: 'var(--content-width)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        nav: 'var(--nav-height)',
      },
    },
  },
  plugins: [],
};
