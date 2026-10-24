export default defineNuxtConfig({
	app: {
		rootAttrs: {
			class: 'min-h-full h-[1px] relative'
		},
		head: {
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1.0',
			meta: [{ property: 'og:type', content: 'website' }]
		}
	},

	compatibilityDate: '2026-07-19',

	content: {
		database: {
			type: 'd1',
			bindingName: 'DB'
		},
		renderer: {
			anchorLinks: {
				h2: false,
				h3: false,
				h4: false
			}
		},
		build: {
			markdown: {
				highlight: false
			}
		}
	},

	css: ['~/assets/css/main.css'],

	devServer: {
		https: {
			key: './localhost-key.pem',
			cert: './localhost.pem'
		}
	},

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
		// @nuxt/content's mdc module injects `@nuxtjs/mdc > <dep>` entries into
		// vite.optimizeDeps.include that Vite 8 can't resolve (two @nuxtjs/mdc
		// versions in the tree), producing the NUXT_B7002 warning. They're
		// unresolvable so Vite already skips pre-bundling them — stripping them is
		// behaviour-neutral and just silences the warning. Remove once @nuxt/content
		// ships a fix.
		'vite:extendConfig'(viteConfig) {
			if (viteConfig.optimizeDeps?.include) {
				viteConfig.optimizeDeps.include = viteConfig.optimizeDeps.include.filter(
					(dep) => !dep.startsWith('@nuxtjs/mdc >')
				);
			}
		},

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
		baseUrl: process.env.SITE_URL,
		defaultLocale: 'nl',
		locales: [
			{
				code: 'nl',
				language: 'nl-BE',
				name: 'Nederlands',
				file: 'nl.json'
			},
			{
				code: 'fr',
				language: 'fr-BE',
				name: 'Francais',
				file: 'fr.json'
			}
		],
		strategy: 'prefix',
		langDir: 'locales/',
		vueI18n: './i18n.config.ts',
		detectBrowserLanguage: false
	},

	icon: {
		provider: 'iconify',
		clientBundle: {
			scan: true,
			includeCustomCollections: true,
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
		},
		customCollections: [
			{
				prefix: 'logo',
				dir: './app/assets/svg/logos',
				normalizeIconName: true
			}
		]
	},

	modules: [
		'@nuxt/ui',
		'@nuxtjs/i18n',
		'@nuxt/scripts',
		'@nuxt/content',
		'@nuxtjs/seo',
		'@nuxt/eslint',
		'@nuxt/image',
		'@nuxtjs/turnstile',
		'@vueuse/nuxt',
		'nuxt-auth-utils',
		'@nuxthub/core',
		'oxc-nuxt',
		'nuxt-studio',
		'nuxt-security'
	],

	nitro: {
		compressPublicAssets: true,
		minify: true,
		preset: process.env.NODE_ENV === 'development' ? undefined : 'cloudflare_module',
		prerender: {
			crawlLinks: false,
			failOnError: false,
			ignore: ['/']
		},
		cloudflare: {
			deployConfig: false,
			nodeCompat: true
		}
	},

	robots: {
		disallow: process.env.NUXT_SITE_ENV === 'production' ? [] : ['/'],
		sitemap: '/sitemap_index.xml'
	},

	routeRules: {
		'/api/*': {
			security: {
				rateLimiter: {
					tokensPerInterval: 10,
					interval: 60_000
				}
			}
		}
	},

	runtimeConfig: {
		turnstile: {
			secretKey: ''
		},
		public: {
			userbackToken: ''
		}
	},

	/*
	scripts: {
		registry: {
			googleTagManager: {
				id: process.env.GOOGLE_TAG_MANAGER_ID,
				scriptInput: {
					fetchpriority: 'high'
				}
			}
		}
	},
  */

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
				'font-src': ["'self'", 'https:', '*.cloudflare.com', '*.cookiefirst.com'],
				'img-src': [
					"'self'",
					'data:',
					'https:',
					'*.googletagmanager.com',
					'*.google-analytics.com',
					'*.cookiefirst.com'
				],
				'script-src': [
					"'self'",
					"'unsafe-inline'",
					"'unsafe-eval'",
					'*.googletagmanager.com',
					'*.cloudflare.com',
					'*.cookiefirst.com'
				],
				'style-src': ["'self'", "'unsafe-inline'", '*.cookiefirst.com'],
				'connect-src': [
					"'self'",
					'https:',
					'http:',
					'*.googletagmanager.com',
					'*.google-analytics.com',
					'*.cookiefirst.com'
				],
				'media-src': ["'self'", 'https:'],
				'frame-src': ["'self'", '*.googletagmanager.com', '*.cloudflare.com', '*.cookiefirst.com'],
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

	studio: {
		i18n: {
			defaultLocale: 'nl'
		}
		/*
		repository: {
			provider: 'github',
			owner: 'wotzebra',
			repo: 'wotz-nuxt-starter',
			branch: 'preview'
		}
    */
	},

	turnstile: {
		siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY
	},

	vite: {
		resolve: {
			dedupe: ['vue']
		},
		optimizeDeps: {
			include: ['@userback/widget', 'zod', 'zod/locales']
		}
	}

	/*
  ui: {
    colorMode: false
  },
  */
});
