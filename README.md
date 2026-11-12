# Linggle Lab

A small, glassmorphism interface for the Linggle notebook APIs. Three icon tabs: grammar suggestions, phrase frequency, and example sentences. Selecting a suggestion searches phrases; selecting a phrase opens examples. Keyboard: Left/Right/Home/End switches tabs, Enter searches. No sample data is substituted for live API responses.

## Run

```sh
pnpm install
pnpm dev
pnpm build
```

## Deploy

GitHub Actions checks the build on main and pull requests. GitHub Pages serves the compiled `gh-pages` branch. Publish changes with `sh scripts/deploy.sh` from the authenticated owner account. The script builds first and replaces only the deployment branch. The Vite base is `/linggle-lab/`.

Linggle does not send CORS headers. The browser uses the public, narrowly scoped Vercel bridge at `https://linggle-api-bridge.vercel.app/api/query`. Search terms and phrases pass through Vercel and Linggle. No API key or account is required. The bridge only permits gp, ngram and example requests to the fixed Linggle origin, with a 240-character limit and 20-second upstream timeout. It is not an arbitrary URL proxy. Availability depends on Linggle and Vercel; failures are displayed in the UI.

To redeploy the bridge from the authenticated owner account:

```sh
cd proxy
vercel deploy --prod
```

The proxy allows the GitHub Pages origin. For local end-to-end queries, use `pnpm dev -- --host` with an explicitly configured local CORS origin, or test through the deployed Pages URL. No notebook files, credentials, or private course material are included in this repository.

Lucide icons: ISC license. Language results belong to their respective sources.
