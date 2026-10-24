import { existsSync } from 'node:fs';

export default defineNuxtConfig({
	app: {
		rootAttrs: {
			class: 'min-h-full h-[1px] relative'
		},
		head: {
			viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
			// Installable as a phone app (PWA): manifest + icons, no service worker, so data is never served stale.
			link: [
				{ rel: 'manifest', href: '/manifest.webmanifest' },
				{ rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
				{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
				{ rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }
			],
			meta: [
				{ name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
				{ name: 'theme-color', content: '#1c1917', media: '(prefers-color-scheme: dark)' },
				{ name: 'mobile-web-app-capable', content: 'yes' },
				{ name: 'apple-mobile-web-app-capable', content: 'yes' },
				{ name: 'apple-mobile-web-app-title', content: 'Leopoldlaan' },
				{ name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
			],
			// Chrome fires beforeinstallprompt once, often before Nuxt has booted; park it for usePwaInstall().
			script: [
				{
					innerHTML:
						"window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e;window.dispatchEvent(new Event('installpromptready'))});"
				}
			]
		}
	},

	compatibilityDate: '2026-07-19',

	css: ['~/assets/css/main.css'],

	// HTTPS in dev only when the local certificates exist (they are gitignored).
	devServer: existsSync('./localhost.pem')
		? {
				https: {
					key: './localhost-key.pem',
					cert: './localhost.pem'
				}
			}
		: {},

	devtools: { enabled: true },

	eslint: {
		config: {
			typescript: true
		}
	},

	experimental: {
		defaults: {
			nuxtLink: {
				trailingSlash: 'remove'
			}
		},

		emitRouteChunkError: 'automatic-immediate'
	},

	fonts: {
		experimental: {
			disableLocalFallbacks: true
		},
		families: [
			{
				name: 'Ubuntu',
				// Ubuntu ships 300/400/500/700 — no 600, so `font-semibold` renders with 700.
				// 300 is unused; every listed weight adds @font-face rules to the entry CSS.
				weights: [400, 500, 700],
				styles: ['normal', 'italic'],
				provider: 'google'
			}
		]
	},

	hooks: {
		// Nuxt 4.5.0's own `check-if-page-unused` plugin is transpiled with an
		// aliased default export (`export { plugin as default }`) that its own
		// plugin scanner doesn't recognise, so it emits a false-positive NUXT_B2005
		// warning and ignores the plugin anyway. We drop it here (matching Nuxt's
		// intended "ignored at build time" outcome) to silence the warning. The
		// plugin only powers a dev-only "page rendered without <NuxtPage>"
		// diagnostic, so nothing functional is lost. Remove once Nuxt fixes B2005.
		'app:resolve'(app) {
			app.plugins = app.plugins.filter((plugin) => !plugin.src.includes('check-if-page-unused'));
		}
	},

	hub: {
		db: 'sqlite'
	},

	i18n: {
		defaultLocale: 'nl',
		locales: [
			{
				code: 'nl',
				language: 'nl-BE',
				name: 'Nederlands',
				file: 'nl.json'
			}
		],
		strategy: 'no_prefix',
		langDir: 'locales/',
		vueI18n: './i18n.config.ts',
		detectBrowserLanguage: false
	},

	icon: {
		provider: 'iconify',
		clientBundle: {
			scan: true,
			icons: [
				'lucide:arrow-down',
				'lucide:arrow-left',
				'lucide:arrow-right',
				'lucide:arrow-up-right',
				'lucide:chevron-left',
				'lucide:chevron-up',
				'lucide:chevrons-left',
				'lucide:chevrons-right',
				'lucide:circle-alert',
				'lucide:circle-check',
				'lucide:circle-x',
				'lucide:copy-check',
				'lucide:ellipsis',
				'lucide:eye',
				'lucide:eye-off',
				'lucide:file',
				'lucide:folder',
				'lucide:folder-open',
				'lucide:grip-vertical',
				'lucide:hash',
				'lucide:lightbulb',
				'lucide:loader-circle',
				'lucide:menu',
				'lucide:minus',
				'lucide:monitor',
				'lucide:moon',
				'lucide:panel-left-close',
				'lucide:panel-left-open',
				'lucide:rotate-ccw',
				'lucide:square',
				'lucide:star',
				'lucide:sun',
				'lucide:upload'
			]
		}
	},

	modules: [
		'@nuxt/ui',
		'@nuxtjs/i18n',
		'@nuxt/scripts',
		'@nuxtjs/seo',
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxtjs/turnstile',
		'@vueuse/nuxt',
		'nuxt-auth-utils',
		'@nuxthub/core',
		'oxc-nuxt',
		'nuxt-security'
	],

	nitro: {
		compressPublicAssets: true,
		minify: true,
		preset: process.env.NODE_ENV === 'development' ? undefined : 'cloudflare_module',
		cloudflare: {
			deployConfig: false,
			nodeCompat: true
		}
	},

	// The app lives behind a login, so there is nothing to generate OG images for.
	ogImage: {
		enabled: false
	},

	// Everything is behind a login, so there is nothing to index.
	robots: {
		disallow: ['/']
	},

	routeRules: {
		'/api/**': {
			security: {
				rateLimiter: {
					tokensPerInterval: 240,
					interval: 60_000
				}
			}
		},
		// Credential endpoints get a much tighter budget against brute forcing.
		'/api/auth/**': {
			security: {
				rateLimiter: {
					tokensPerInterval: 10,
					interval: 60_000
				}
			}
		}
	},

	runtimeConfig: {
		// Read by nuxt-auth-utils' Google handler (NUXT_OAUTH_GOOGLE_CLIENT_ID / _SECRET).
		oauth: {
			google: {
				clientId: '',
				clientSecret: ''
			}
		},
		// Encrypts the stored Google Drive refresh token (NUXT_DRIVE_TOKEN_KEY, 32+ random chars).
		driveTokenKey: '',
		turnstile: {
			secretKey: ''
		},
		public: {
			userbackToken: ''
		}
	},

	security: {
		rateLimiter: false,
		ssg: false,
		headers: {
			crossOriginResourcePolicy: 'cross-origin',
			crossOriginEmbedderPolicy: 'unsafe-none',
			// nuxt-security defaults to 180 days, which Lighthouse flags as too short; a year is
			// the floor the HSTS preload list requires. `preload` only emits the directive — the
			// domain is not on the list until someone submits it at hstspreload.org, which also
			// commits every subdomain to HTTPS. Keep that a deliberate step.
			strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true, preload: true },
			contentSecurityPolicy: {
				'font-src': ["'self'", 'https:'],
				'img-src': ["'self'", 'data:', 'blob:', 'https:'],
				'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*.cloudflare.com'],
				'style-src': ["'self'", "'unsafe-inline'"],
				'connect-src': ["'self'", 'https:'],
				'media-src': ["'self'", 'https:'],
				// Drive previews are embedded from drive.google.com.
				'frame-src': ["'self'", '*.cloudflare.com', 'https://drive.google.com'],
				'object-src': ["'none'"],
				'base-uri': ["'self'"]
			}
		}
	},

	/*
	seo: {
		redirectToCanonicalSiteUrl: true
	},
  */

	site: {
		url: process.env.NUXT_SITE_URL,
		trailingSlash: false
	},

	// schema.org (part of @nuxtjs/seo) is disabled: the app emits no structured
	// data and nuxt-schema-org@6.2.3 crashes under the unhead v3 shipped by Nuxt
	// 4.5.0. Re-enable once nuxt-schema-org ships an unhead-v3 fix.
	schemaOrg: {
		enabled: false
	},

	turnstile: {
		siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY
	},

	vite: {
		resolve: {
			dedupe: ['vue']
		},
		optimizeDeps: {
			include: [
				'@userback/widget',
				'zod',
				'zod/locales',
				'sortablejs',
				'xlsx',
				'@internationalized/date',
				'konva',
				'vue-konva'
			]
		}
	}

	/*
  ui: {
    colorMode: false
  },
  */
});
