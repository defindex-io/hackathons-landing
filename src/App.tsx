import { Builder } from './components/Builder';
import { Address, CodeBlock } from './components/Copy';
import {
  API_HOST,
  BLEND_TESTNET_URL,
  CONSOLE_URL,
  DOCS_URL,
  FACTORY,
  FRIENDBOT_URL,
  NEXT_TESTNET_RESET,
  POOLS,
  SOROBAN_TESTNET_RPC,
  SWAGGER_URL,
  TOKENS,
  VERIFIED_ON,
} from './data';

const USAGE_SNIPPET = `import { DefindexSDK, SupportedNetworks } from "@defindex/sdk";

const sdk = new DefindexSDK({
  apiKey: process.env.DEFINDEX_API_KEY,
  defaultNetwork: SupportedNetworks.TESTNET,
});
const vault = "C_YOUR_VAULT";
const user = "G_YOUR_USER";

// Deposit 10 USDC (7 decimals). invest: true invests it following the vault's current split.
const dep = await sdk.depositToVault(vault, { caller: user, amounts: [100_000_000], invest: true, slippageBps: 50 });
await sdk.sendTransaction(await signTransaction(dep.xdr!));

// What the user owns, and what the vault earns.
const balance = await sdk.getVaultBalance(vault, user);
const apy = await sdk.getVaultAPY(vault);

// Withdraw by amount (or by shares with sdk.withdrawShares).
const out = await sdk.withdrawFromVault(vault, { caller: user, amounts: [50_000_000], slippageBps: 50 });
await sdk.sendTransaction(await signTransaction(out.xdr!));`;

const REBALANCE_SNIPPET = `// Signed by the vault's rebalance manager.
const { xdr } = await sdk.rebalanceVault(vault, {
  caller: REBALANCE_MANAGER,
  instructions: [
    { type: "Invest", strategy_address: "${POOLS[1].strategies.USDC}", amount: 1001 },
  ],
});`;

const CURL_SNIPPET = `curl "${API_HOST}/vault/C_YOUR_VAULT?network=testnet" \\
  -H "Authorization: Bearer $DEFINDEX_API_KEY"`;

interface Idea {
  title: string;
  pitch: string;
  calls: string;
}

const IDEAS: Idea[] = [
  {
    title: 'A savings tab for any wallet',
    pitch: 'Idle USDC in a wallet earns yield with one toggle. Users see balance and APY, and withdraw anytime.',
    calls: 'depositToVault, getVaultBalance, getVaultAPY',
  },
  {
    title: 'Round-ups',
    pitch: 'Every payment rounds up to the next dollar and the change goes into a vault. Spare change that compounds.',
    calls: 'depositToVault with invest: true',
  },
  {
    title: 'Group savings circles',
    pitch: 'Tandas, pasanakus, chit funds: the pot earns while it waits for its turn to be paid out.',
    calls: 'one vault per circle, withdrawShares on payout day',
  },
  {
    title: 'Payroll float',
    pitch: 'Funds that sit between payday and payout earn instead of idling. The company keeps the yield or splits it.',
    calls: 'vaultFeeBps and feeReceiver for the split',
  },
  {
    title: 'No-loss lottery',
    pitch: 'Everyone deposits, nobody loses principal, and one winner takes the week’s yield.',
    calls: 'getVaultBalance to measure yield, withdrawFromVault for the prize',
  },
  {
    title: 'Merchant treasury sweep',
    pitch: 'A shop sweeps its daily USDC sales into a vault at close and pulls what it needs in the morning.',
    calls: 'depositToVault, withdrawFromVault',
  },
  {
    title: 'An agent that chases APY',
    pitch: 'An AI agent holds the rebalance manager role and moves funds between Blend v2 and v2.1 when one pays more.',
    calls: 'getVaultAPY, rebalanceVault with Unwind and Invest',
  },
  {
    title: 'Goal jars',
    pitch: 'Save for a trip or a laptop. Each goal is a vault position, and the progress bar includes the interest.',
    calls: 'getVaultBalance per user',
  },
];

interface Problem {
  symptom: string;
  fix: string;
}

const PROBLEMS: Problem[] = [
  {
    symptom: 'The request works but nothing shows up on testnet',
    fix: 'You forgot ?network=testnet. Without it the API builds a mainnet transaction.',
  },
  {
    symptom: 'Simulation fails when depositing BlendUSDC',
    fix: 'Your account has no BlendUSDC trustline. Add it and claim tokens at testnet.blend.capital.',
  },
  {
    symptom: 'StrategyDoesNotSupportAsset (102)',
    fix: 'The strategy belongs to another asset. A USDC strategy only takes BlendUSDC, never mainnet USDC or XLM.',
  },
  {
    symptom: 'RolesIncomplete (104)',
    fix: 'Send all four roles: manager, emergencyManager, rebalanceManager, feeReceiver. One address can hold all of them.',
  },
  {
    symptom: 'FeeTooHigh (406)',
    fix: 'vaultFeeBps above 9000. Keep it at or below 90% of the yield.',
  },
  {
    symptom: 'My deposit sits idle in the vault',
    fix: 'Funds are invested on rebalance. Deposit with invest: true, or call rebalanceVault with an Invest instruction.',
  },
  {
    symptom: 'My vault is missing from console.defindex.io',
    fix: 'Vaults created through the API or SDK are not linked to your console account. Use the address from predictedVaultAddress.',
  },
  {
    symptom: '429 Too Many Requests',
    fix: 'New API keys start on the free tier: about 1 request per second, bursts of 5. Cache reads like APY and balances.',
  },
];

function Nav() {
  return (
    <header className="nav">
      <a href="#top" className="nav-logo" aria-label="DeFindex hackathons home">
        <img src="/brand/defindex-horizontal-color-for-dark.png" alt="DeFindex" width={150} height={30} />
      </a>
      <nav aria-label="Sections">
        <a href="#start">Quickstart</a>
        <a href="#strategies">Strategies</a>
        <a href="#build">Build a vault</a>
        <a href="#ideas">Ideas</a>
        <a href={DOCS_URL} className="nav-docs">
          Docs
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
                <h1>Give your app a yield account in an afternoon.</h1>
        <p className="hero-lede">
          DeFindex vaults take deposits, route them into lending strategies, and track every
          user’s share. You call an API, sign a transaction, and your users earn. Everything on
          this page runs on Stellar testnet with free tokens.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#build">
            Build your first vault
          </a>
          <a className="btn btn-ghost" href={CONSOLE_URL}>
            Get an API key
          </a>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <img src="/brand/glass-03.png" alt="" />
      </div>
      <dl className="hero-facts">
        <div>
          <dt>API</dt>
          <dd>{API_HOST.replace('https://', '')}</dd>
        </div>
        <div>
          <dt>Network param</dt>
          <dd>?network=testnet</dd>
        </div>
        <div>
          <dt>Vault factory</dt>
          <dd>
            <Address address={FACTORY} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Quickstart() {
  return (
    <section className="section" id="start">
      <div className="section-head">
        <h2>From zero to a live vault</h2>
        <p>Four steps. Each one takes a couple of minutes.</p>
      </div>
      <ol className="steps">
        <li>
          <h3>Make a testnet account</h3>
          <p>
            Create a key in Freighter (switch it to Testnet) or with{' '}
            <code>stellar keys generate me --fund --network testnet</code>. Fund it with{' '}
            <a href={FRIENDBOT_URL}>Friendbot</a> to pay fees.
          </p>
        </li>
        <li>
          <h3>Get test tokens</h3>
          <p>
            Open <a href={BLEND_TESTNET_URL}>testnet.blend.capital</a>, connect your wallet, add the
            BlendUSDC trustline and use the faucet. XLM comes from Friendbot. These are the same
            tokens the Blend pools below lend out.
          </p>
        </li>
        <li>
          <h3>Get an API key</h3>
          <p>
            Sign up at <a href={CONSOLE_URL}>console.defindex.io</a>, open API Keys and generate one.
            It starts with <code>sk_</code> and goes in an{' '}
            <code>Authorization: Bearer</code> header.
          </p>
          <CodeBlock code={CURL_SNIPPET} caption="Check it works" />
        </li>
        <li>
          <h3>Create your vault</h3>
          <p>
            Use the builder below. It writes the request with the right strategy addresses for
            the assets and pools you pick. Sign the returned XDR, post it to <code>/send</code>,
            and the vault exists.
          </p>
        </li>
      </ol>
      <aside className="callout">
        <strong>Always send ?network=testnet.</strong> The API defaults to mainnet when the
        parameter is missing. The SDK handles it if you set{' '}
        <code>defaultNetwork: SupportedNetworks.TESTNET</code>.
      </aside>
    </section>
  );
}

function Strategies() {
  return (
    <section className="section section-purple" id="strategies">
      <div className="section-head">
        <h2>Blend strategies on testnet</h2>
        <p>
          A strategy is where a vault puts its money to work. These lend into two Blend pools
          with the same four assets, so you can compare rates or split funds between them. Click
          any address to copy it.
        </p>
      </div>
      <div className="pools">
        {POOLS.map((pool) => (
          <article className="pool" key={pool.id}>
            <header>
              <h3>{pool.name}</h3>
              <p>
                Pool <Address address={pool.address} />
              </p>
            </header>
            <table>
              <thead>
                <tr>
                  <th scope="col">Asset</th>
                  <th scope="col">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {TOKENS.map((t) => (
                  <tr key={t.symbol}>
                    <th scope="row">{t.symbol}</th>
                    <td>
                      <Address address={pool.strategies[t.symbol]} full />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>
      <div className="tokens">
        <h3>Token contracts</h3>
        <ul>
          {TOKENS.map((t) => (
            <li key={t.symbol}>
              <span className="token-name">{t.label}</span>
              <Address address={t.address} />
              <span className="token-source">
                {t.decimals} decimals, from {t.source}
              </span>
            </li>
          ))}
        </ul>
        <p className="fine">
          Verified on chain {VERIFIED_ON}. Stellar resets testnet periodically; the next reset is
          scheduled for {NEXT_TESTNET_RESET}. RPC: <code>{SOROBAN_TESTNET_RPC}</code>
        </p>
      </div>
    </section>
  );
}

function BuildSection() {
  return (
    <section className="section section-dark" id="build">
      <div className="section-head">
        <h2>Build a vault request</h2>
        <p>
          Pick what your vault holds and where it earns. Copy the snippet, put your address where
          it says <code>G_YOUR_TESTNET_ADDRESS</code>, and run it. Your fee is the cut of the
          yield your app keeps.
        </p>
      </div>
      <Builder />
    </section>
  );
}

function UseSection() {
  return (
    <section className="section" id="use">
      <div className="section-head">
        <h2>Deposit, track, withdraw</h2>
        <p>
          Once the vault exists, your users only need these calls. Every write returns an
          unsigned XDR: the user signs it, you submit it.
        </p>
      </div>
      <div className="use-grid">
        <CodeBlock code={USAGE_SNIPPET} caption="npm i @defindex/sdk" />
        <div className="use-notes">
          <h3>Moving money between pools</h3>
          <p>
            A vault with both Blend v2 and v2.1 strategies can shift funds with a rebalance.
            Unwind pulls from one strategy, Invest puts into another.
          </p>
          <CodeBlock code={REBALANCE_SNIPPET} caption="rebalanceVault" />
          <p>
            Browse every endpoint in the <a href={SWAGGER_URL}>API reference</a>, or read the full
            guide in the <a href={DOCS_URL}>DeFindex docs</a>.
          </p>
        </div>
      </div>
    </section>
  );
}

function Ideas() {
  return (
    <section className="section section-green" id="ideas">
      <div className="section-head">
        <h2>Things you could build this weekend</h2>
        <p>Anything that holds money for a while can earn on it. A few to start from.</p>
      </div>
      <ul className="ideas">
        {IDEAS.map((idea) => (
          <li key={idea.title}>
            <h3>{idea.title}</h3>
            <p>{idea.pitch}</p>
            <p className="idea-calls">Uses: {idea.calls}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Troubleshooting() {
  return (
    <section className="section" id="help">
      <div className="section-head">
        <h2>When something breaks</h2>
        <p>The errors hackers hit most on testnet, and what fixes them.</p>
      </div>
      <dl className="problems">
        {PROBLEMS.map((p) => (
          <div key={p.symptom}>
            <dt>{p.symptom}</dt>
            <dd>{p.fix}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Siblings() {
  return (
    <footer className="siblings">
      <h2>Also at this hackathon</h2>
      <div className="sibling-grid">
        <a className="sibling sibling-paltalabs" href="https://hackathons.paltalabs.io">
          <img src="/brand/paltalabs-logo-white.svg" alt="PaltaLabs" width={170} height={35} />
          <span>The team behind DeFindex and Soroswap. Everything PaltaLabs brings to the hackathon.</span>
          <span className="sibling-url">hackathons.paltalabs.io</span>
        </a>
        <a className="sibling sibling-soroswap" href="https://hackathons.soroswap.finance">
          <img src="/brand/soroswap-horizontal-purple.svg" alt="Soroswap" width={150} height={40} />
          <span>How to swap and provide liquidity with Soroswap on testnet.</span>
          <span className="sibling-url">hackathons.soroswap.finance</span>
        </a>
      </div>
      <p className="colophon">
        <img src="/brand/defindex-symbol-color-bg-dark-green.svg" alt="" width={28} height={28} />
        DeFindex, yield infrastructure for neobanks, fintechs and wallets.
      </p>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Quickstart />
        <Strategies />
        <BuildSection />
        <UseSection />
        <Ideas />
        <Troubleshooting />
      </main>
      <Siblings />
    </>
  );
}
