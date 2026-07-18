/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        rs: {
          surface: 'var(--rs-surface)',
          'surface-dim': 'var(--rs-surface-dim)',
          'surface-bright': 'var(--rs-surface-bright)',
          'surface-lowest': 'var(--rs-surface-container-lowest)',
          'surface-low': 'var(--rs-surface-container-low)',
          'surface-container': 'var(--rs-surface-container)',
          'surface-high': 'var(--rs-surface-container-high)',
          'surface-highest': 'var(--rs-surface-container-highest)',
          'on-surface': 'var(--rs-on-surface)',
          'on-surface-variant': 'var(--rs-on-surface-variant)',
          outline: 'var(--rs-outline)',
          'outline-variant': 'var(--rs-outline-variant)',
          primary: 'var(--rs-primary)',
          'on-primary': 'var(--rs-on-primary)',
          secondary: 'var(--rs-secondary)',
          'on-secondary': 'var(--rs-on-secondary)',
          'secondary-container': 'var(--rs-secondary-container)',
          'on-secondary-container': 'var(--rs-on-secondary-container)',
          error: 'var(--rs-error)',
          'on-error': 'var(--rs-on-error)',
          'error-container': 'var(--rs-error-container)',
          danger: 'var(--rs-danger)',
          status: {
            placed: 'var(--rs-status-placed)',
            confirmed: 'var(--rs-status-confirmed)',
            shipping: 'var(--rs-status-shipping)',
            delivered: 'var(--rs-status-delivered)',
          },
        },
      },
      fontFamily: {
        display: ['var(--rs-font-display)'],
        sans: ['var(--rs-font-sans)'],
      },
      borderRadius: {
        'rs-sm': 'var(--rs-radius-sm)',
        rs: 'var(--rs-radius)',
        'rs-md': 'var(--rs-radius-md)',
        'rs-lg': 'var(--rs-radius-lg)',
        'rs-xl': 'var(--rs-radius-xl)',
        'rs-full': 'var(--rs-radius-full)',
      },
      spacing: {
        base: 'var(--rs-spacing-base)',
      },
      maxWidth: {
        container: 'var(--rs-container-max)',
      },
      boxShadow: {
        ambient: 'var(--rs-ambient-shadow)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: 'var(--rs-margin-mobile)',
          sm: 'var(--rs-margin-mobile)',
          lg: 'var(--rs-margin-desktop)',
        },
      },
    },
  },
  plugins: [],
};
