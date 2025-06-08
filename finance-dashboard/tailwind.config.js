/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          750: '#374151',
          850: '#1f2937',
          950: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
    // Override default font sizes with 15% reduction
    fontSize: {
      'xs': ['0.625rem', { lineHeight: '1rem' }],      // 10px (was 12px)
      'sm': ['0.75rem', { lineHeight: '1rem' }],       // 12px (was 14px)
      'base': ['0.875rem', { lineHeight: '1.25rem' }], // 14px (was 16px)
      'lg': ['0.9375rem', { lineHeight: '1.375rem' }], // 15px (was 18px)
      'xl': ['1.0625rem', { lineHeight: '1.5rem' }],   // 17px (was 20px)
      '2xl': ['1.275rem', { lineHeight: '1.75rem' }],  // ~20.4px (was 24px)
      '3xl': ['1.594rem', { lineHeight: '2rem' }],     // ~25.5px (was 30px)
      '4xl': ['1.913rem', { lineHeight: '2.25rem' }],  // ~30.6px (was 36px)
      '5xl': ['2.55rem', { lineHeight: '1' }],         // ~40.8px (was 48px)
      '6xl': ['3.188rem', { lineHeight: '1' }],        // ~51px (was 60px)
      '7xl': ['3.825rem', { lineHeight: '1' }],        // ~61.2px (was 72px)
      '8xl': ['4.25rem', { lineHeight: '1' }],         // ~68px (was 96px)
      '9xl': ['6.375rem', { lineHeight: '1' }],        // ~102px (was 128px)
    },
  },
  plugins: [],
}