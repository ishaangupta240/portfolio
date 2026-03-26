# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## MapKit JWT setup

If your map shows a static grid and logs "authorization token is invalid", generate a fresh token signed with your own Apple key:

1. Create a Maps ID and enable your local domain in Apple Developer (for Vite dev this is usually localhost:5173).
2. Export these environment variables:
	- APPLE_TEAM_ID
	- APPLE_KEY_ID
	- APPLE_PRIVATE_KEY_PATH (path to your AuthKey_<KEY_ID>.p8)
3. Run:

	npm run mapkit:token

This command writes a new jwtToken into src/config/mapkit.json.
