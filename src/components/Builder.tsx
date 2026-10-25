import { useMemo, useState } from 'react';
import { API_HOST, POOLS, TOKENS, type AssetSymbol, type PoolId } from '../data';
import { CodeBlock } from './Copy';

type Output = 'fetch' | 'sdk';

// The factory rejects a vault whose first deposit is below this, per asset (docs: using-the-api).
const MIN_FIRST_DEPOSIT = 1001;
const PLACEHOLDER_ADDRESS = 'G_YOUR_TESTNET_ADDRESS';

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function buildAssets(assets: AssetSymbol[], pools: PoolId[]) {
  return TOKENS.filter((t) => assets.includes(t.symbol)).map((token) => ({
    address: token.address,
    strategies: POOLS.filter((p) => pools.includes(p.id)).map((pool) => ({
      address: pool.strategies[token.symbol],
      name: `${pool.name} ${token.symbol}`,
      paused: false,
    })),
  }));
}

function indent(json: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return json
    .split('\n')
    .map((line, i) => (i === 0 ? line : pad + line))
    .join('\n');
}

function buildBody(assets: AssetSymbol[], pools: PoolId[], name: string, feeBps: number) {
  return {
    roles: {
      manager: PLACEHOLDER_ADDRESS,
      emergencyManager: PLACEHOLDER_ADDRESS,
      rebalanceManager: PLACEHOLDER_ADDRESS,
      feeReceiver: PLACEHOLDER_ADDRESS,
    },
    vaultFeeBps: feeBps,
    assets: buildAssets(assets, pools),
    name,
    symbol: name.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() || 'HACK',
    upgradable: true,
    caller: PLACEHOLDER_ADDRESS,
    depositAmounts: assets.map(() => MIN_FIRST_DEPOSIT),
  };
}

function fetchSnippet(body: object): string {
  return `const API = "${API_HOST}";
const headers = {
  "Content-Type": "application/json",
  Authorization: \`Bearer \${process.env.DEFINDEX_API_KEY}\`,
};

// 1. Build the unsigned transaction. Always pass network=testnet.
const res = await fetch(\`\${API}/factory/create-vault-deposit?network=testnet\`, {
  method: "POST",
  headers,
  body: JSON.stringify(${indent(JSON.stringify(body, null, 2), 2)}),
});
const { xdr, predictedVaultAddress } = await res.json();

// 2. Sign with the caller's wallet (Freighter, Stellar Wallets Kit, Privy...).
const signedXdr = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });

// 3. Submit.
const sent = await fetch(\`\${API}/send?network=testnet\`, {
  method: "POST",
  headers,
  body: JSON.stringify({ xdr: signedXdr }),
});
console.log(predictedVaultAddress, await sent.json());`;
}

function sdkSnippet(body: object): string {
  return `import { DefindexSDK, SupportedNetworks } from "@defindex/sdk";

const sdk = new DefindexSDK({
  apiKey: process.env.DEFINDEX_API_KEY,
  defaultNetwork: SupportedNetworks.TESTNET,
});

const { xdr } = await sdk.createVaultWithDeposit(${indent(JSON.stringify(body, null, 2), 0)});

const signedXdr = await signTransaction(xdr!); // your wallet
const { txHash } = await sdk.sendTransaction(signedXdr);`;
}

export function Builder() {
  const [assets, setAssets] = useState<AssetSymbol[]>(['USDC']);
  const [pools, setPools] = useState<PoolId[]>(['v2', 'v2.1']);
  const [name, setName] = useState('Hack Savings');
  const [feeBps, setFeeBps] = useState(100);
  const [output, setOutput] = useState<Output>('fetch');

  const ready = assets.length > 0 && pools.length > 0;
  const code = useMemo(() => {
    const body = buildBody(assets, pools, name, feeBps);
    return output === 'fetch' ? fetchSnippet(body) : sdkSnippet(body);
  }, [assets, pools, name, feeBps, output]);

  return (
    <div className="builder">
      <form className="builder-controls" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>Assets in your vault</legend>
          <div className="chips">
            {TOKENS.map((t) => (
              <label key={t.symbol} className="chip">
                <input
                  type="checkbox"
                  checked={assets.includes(t.symbol)}
                  onChange={() => setAssets(toggle(assets, t.symbol))}
                />
                <span>{t.symbol}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Blend pools to earn from</legend>
          <div className="chips">
            {POOLS.map((p) => (
              <label key={p.id} className="chip">
                <input
                  type="checkbox"
                  checked={pools.includes(p.id)}
                  onChange={() => setPools(toggle(pools, p.id))}
                />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
          <p className="hint">
            Pick both and every asset gets two strategies. Your rebalance manager can then move
            funds to whichever pool pays more.
          </p>
        </fieldset>

        <div className="builder-row">
          <label className="field">
            <span>Vault name</span>
            <input value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>Your fee on yield: {(feeBps / 100).toFixed(2)}%</span>
            <input
              type="range"
              min={0}
              max={2000}
              step={25}
              value={feeBps}
              onChange={(e) => setFeeBps(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="toggle" role="tablist" aria-label="Snippet style">
          {(['fetch', 'sdk'] as const).map((o) => (
            <button
              key={o}
              type="button"
              role="tab"
              aria-selected={output === o}
              className={output === o ? 'is-on' : ''}
              onClick={() => setOutput(o)}
            >
              {o === 'fetch' ? 'Plain fetch' : '@defindex/sdk'}
            </button>
          ))}
        </div>
      </form>

      {ready ? (
        <CodeBlock code={code} caption="POST /factory/create-vault-deposit on testnet" />
      ) : (
        <div className="builder-empty">
          Pick at least one asset and one pool to get a request you can run.
        </div>
      )}
    </div>
  );
}
