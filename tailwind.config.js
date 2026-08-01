/** @type {import('tailwindcss').Config} */
module.exports = { content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'], presets: [require('nativewind/preset')], theme: { extend: { colors: { brand: '#F97316', ink: '#1E293B', canvas: '#F8FAFC', success: '#16A34A' }, fontFamily: { display: ['System'], body: ['System'] } } }, plugins: [] };
