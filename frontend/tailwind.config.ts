
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Italian restaurant theme colors
				italian: {
					green: {
						50: '#f0fdf4',
						100: '#dcfce7',
						200: '#bbf7d0',
						300: '#86efac',
						400: '#4ade80',
						500: '#22c55e',
						600: '#16a34a',
						700: '#007A4D', // Main brand color
						800: '#166534',
						900: '#14532d',
						950: '#052e16',
					},
					cream: {
						50: '#fefef9',
						100: '#fefcf0',
						200: '#fef7de',
						300: '#fdefc3',
						400: '#fbe495',
						500: '#f7d065',
						600: '#f0b429',
						700: '#e09617',
						800: '#bc7914',
						900: '#986418',
					},
					red: {
						50: '#fef2f2',
						100: '#fee2e2',
						200: '#fecaca',
						300: '#fca5a5',
						400: '#f87171',
						500: '#ef4444',
						600: '#dc2626',
						700: '#b91c1c',
						800: '#991b1b',
						900: '#7f1d1d',
					}
				}
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #007A4D 0%, #16a34a 100%)',
				'gradient-secondary': 'linear-gradient(135deg, #f0b429 0%, #fbe495 100%)',
				'gradient-hero': 'linear-gradient(135deg, #007A4D 0%, #22c55e 50%, #f0b429 100%)',
				'gradient-card': 'linear-gradient(145deg, #ffffff 0%, #fefef9 100%)',
				'gradient-warm': 'linear-gradient(135deg, #fef7de 0%, #ffffff 100%)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				'serif': ['Playfair Display', 'serif'],
				'sans': ['Inter', 'system-ui', 'sans-serif'],
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-up': {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'bounce-gentle': {
					'0%, 100%': {
						transform: 'translateY(-2%)',
						'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)'
					},
					'50%': {
						transform: 'translateY(0)',
						'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'bounce-gentle': 'bounce-gentle 2s infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
