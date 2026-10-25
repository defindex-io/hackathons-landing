# DeFindex hackathons landing

Static page for hackathons.defindex.io: how hackers use DeFindex vaults and the Blend v2 / v2.1 strategies on Stellar testnet. Vite, React 19, TypeScript, no backend. `npm run build` type-checks and builds to `dist/`; `npm run lint` runs ESLint.

| Path | What |
|---|---|
| `src/data.ts` | Every address on the page (factory, tokens, pools, strategies) and external URLs. Source: stellar-contracts `public/testnet.contracts.json`, verified on chain on `VERIFIED_ON`. |
| `src/App.tsx` | All sections and their copy: quickstart, strategies, SDK snippets, ideas, troubleshooting, sibling links. |
| `src/components/Builder.tsx` | Interactive `create-vault-deposit` request builder (fetch or `@defindex/sdk`). |
| `src/components/Copy.tsx` | Copy-to-clipboard address and code block. |
| `src/styles.css` | DeFindex palette and type (Familjen Grotesk, Inter Tight). |
| `public/brand/` | Logos copied from the context repo's branding folders. |

Rules: every API or SDK name shown must exist in defindex-api / `@defindex/sdk` 0.3.0. Always show `?network=testnet`; the API defaults to mainnet. No em dashes in copy. After a testnet reset, update `src/data.ts` from the new contracts JSON.
