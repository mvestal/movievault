2:12:29 PM: Netlify Build                                                 
2:12:29 PM: ────────────────────────────────────────────────────────────────
2:12:29 PM: ​
2:12:29 PM: ❯ Version
2:12:29 PM:   @netlify/build 35.13.9
2:12:29 PM: ​
2:12:29 PM: ❯ Flags
2:12:29 PM:   accountId: 58f93fa4d6865d4ca29ec6e5
2:12:29 PM:   baseRelDir: true
2:12:29 PM:   buildId: 6a1c7a01c7e397000802a55c
2:12:29 PM:   deployId: 6a1c7a01c7e397000802a55e
2:12:29 PM: ​
2:12:29 PM: ❯ Current directory
2:12:29 PM:   /opt/build/repo/film-vault
2:12:29 PM: ​
2:12:29 PM: ❯ Config file
2:12:29 PM:   /opt/build/repo/film-vault/netlify.toml
2:12:29 PM: ​
2:12:29 PM: ❯ Context
2:12:29 PM:   production
2:12:29 PM: ​
2:12:29 PM: build.command from netlify.toml                               
2:12:29 PM: ────────────────────────────────────────────────────────────────
2:12:29 PM: ​
2:12:29 PM: $ npm run build
2:12:29 PM: > film-vault@1.0.0 build
2:12:29 PM: > vite build
2:12:30 PM: vite v4.5.14 building for production...
2:12:30 PM: transforming...
2:12:30 PM: ✓ 17 modules transformed.
2:12:30 PM: ✓ built in 179ms
2:12:30 PM: [vite:build-import-analysis] Parse error @:1:1
2:12:30 PM: file: /opt/build/repo/film-vault/src/api.js
2:12:30 PM: error during build:
2:12:30 PM: Error: Parse error @:1:1
2:12:30 PM:     at parse$e (file:///opt/build/repo/film-vault/node_modules/vite/dist/node/chunks/dep-827b23df.js:16498:355)
2:12:30 PM:     at Object.transform (file:///opt/build/repo/film-vault/node_modules/vite/dist/node/chunks/dep-827b23df.js:46657:27)
2:12:30 PM: ​
2:12:30 PM: "build.command" failed                                        
2:12:30 PM: ────────────────────────────────────────────────────────────────
2:12:30 PM: ​
2:12:30 PM:   Error message
2:12:30 PM:   Command failed with exit code 1: npm run build (https://ntl.fyi/exit-code-1)
2:12:30 PM: ​
2:12:30 PM:   Error location
2:12:30 PM:   In build.command from netlify.toml:
2:12:30 PM:   npm run build
2:12:30 PM: ​
2:12:30 PM:   Resolved config
2:12:30 PM:   build:
2:12:30 PM:     base: /opt/build/repo/film-vault
2:12:30 PM:     command: npm run build
2:12:30 PM:     commandOrigin: config
2:12:30 PM:     environment:
2:12:30 PM:       - GEMINI_API_KEY
2:12:30 PM:     publish: /opt/build/repo/film-vault/dist
2:12:30 PM:     publishOrigin: config
2:12:30 PM:   functionsDirectory: /opt/build/repo/film-vault/netlify/functions
2:12:30 PM:   redirects:
2:12:30 PM:     - from: /*
      status: 200
      to: /index.html
  redirectsOrigin: config
2:12:30 PM: Build failed due to a user error: Build script returned non-zero exit code: 2
2:12:30 PM: Failing build: Failed to build site
2:12:30 PM: Finished processing build request in 12.465s
2:12:30 PM: Failed during stage 'building site': Build script returned non-zero exit code: 2 (https://ntl.fyi/exit-code-2)
