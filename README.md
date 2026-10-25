# DeFindex hackathons landing

The page at hackathons.defindex.io: how hackers use DeFindex on Stellar testnet. Vite, React, TypeScript, no backend.

```bash
npm install
npm run dev      # local
npm run build    # type-check + static build into dist/
```

## Where the content comes from

- `src/data.ts` holds every address on the page: factory, tokens, Blend v2 and v2.1 pools and strategies. They come from stellar-contracts `public/testnet.contracts.json` and were checked on chain on the date in `VERIFIED_ON`. After a testnet reset, redeploy the strategies, update that JSON, then this file.
- API and SDK snippets follow defindex-api and `@defindex/sdk` 0.3.0. If an endpoint or SDK signature changes, update `src/App.tsx` and `src/components/Builder.tsx`.
- Brand assets in `public/brand/` are copies from `projects/defindex/branding`, `projects/soroswap/branding` and the paltalabs landing-page logo.
