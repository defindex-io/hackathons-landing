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
  XLM_DEMO_VAULT,
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

const IMPORT_SNIPPET = `# Download the vault's WASM from testnet (any DeFindex vault works, they share one WASM)
stellar contract fetch --id ${XLM_DEMO_VAULT} \\
  --network testnet -o defindex_vault.wasm

# src/lib.rs: generates a typed defindex_vault::Client from the WASM
mod defindex_vault {
    soroban_sdk::contractimport!(file = "defindex_vault.wasm");
}`;

// Ran from a deployed contract against XLM_DEMO_VAULT on 2026-10-25.
// Signatures: stellar-contracts vault/src/interface.rs (deposit, withdraw).
const CONTRACT_DEPOSIT_SNIPPET = `use soroban_sdk::{
    auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation},
    vec, Address, Env, IntoVal, Symbol,
};

// Deposit \`amount\` of a token this contract holds into a single-asset vault.
// Returns the vault shares minted to this contract.
pub fn deposit_to_vault(e: &Env, vault: &Address, asset: &Address, amount: i128) -> i128 {
    let me = e.current_contract_address();

    // The vault pulls the deposit with token.transfer(me, vault, amount).
    // That call is one level below us, so we pre-authorize exactly it.
    e.authorize_as_current_contract(vec![
        e,
        InvokerContractAuthEntry::Contract(SubContractInvocation {
            context: ContractContext {
                contract: asset.clone(),
                fn_name: Symbol::new(e, "transfer"),
                args: (me.clone(), vault.clone(), amount).into_val(e),
            },
            sub_invocations: vec![e],
        }),
    ]);

    let client = defindex_vault::Client::new(e, vault);
    let (_amounts, shares, _allocations) = client.deposit(
        &vec![e, amount], // amounts_desired, one entry per vault asset
        &vec![e, amount], // amounts_min
        &me,              // from: this contract pays and receives the shares
        &true,            // invest now, following the vault's strategy split
    );
    shares
}`;

const CONTRACT_WITHDRAW_SNIPPET = `// Burn shares and get the asset back. No pre-auth here: the vault calls
// from.require_auth() itself, and this contract is its direct caller.
pub fn withdraw_from_vault(e: &Env, vault: &Address, shares: i128, min_out: i128) -> i128 {
    let client = defindex_vault::Client::new(e, vault);
    let me = e.current_contract_address();
    let amounts = client.withdraw(&shares, &vec![e, min_out], &me);
    amounts.get(0).unwrap()
}

// Read-only: the position in shares, and what those shares are worth now.
pub fn position(e: &Env, vault: &Address) -> (i128, i128) {
    let client = defindex_vault::Client::new(e, vault);
    let shares = client.balance(&e.current_contract_address());
    let underlying = client.get_asset_amounts_per_shares(&shares).get(0).unwrap_or(0);
    (shares, underlying)
}`;

const CURL_SNIPPET =`curl "${API_HOST}/vault/C_YOUR_VAULT?network=testnet" \\
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
    symptom: 'Error(Auth, InvalidAction) when my contract deposits',
    fix: 'The vault pulls the tokens from your contract one call deeper. Call authorize_as_current_contract for that exact transfer first, with the same amount.',
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
        <a href="#contracts">From a contract</a>
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

function ContractSection() {
  return (
    <section className="section" id="contracts">
      <div className="section-head">
        <h2>Call a vault from your contract</h2>
        <p>
          Cross-contract calls let your Soroban contract deposit and withdraw by itself, with
          nobody signing off-chain: a savings circle that holds the pot, a game treasury, a DAO
          parking idle funds. The vault treats your contract like any other depositor and mints
          the shares to it.
        </p>
      </div>
      <ol className="steps">
        <li>
          <h3>Import the vault interface</h3>
          <p>
            Fetch the WASM once and let <code>contractimport!</code> generate the client and
            types. The path is relative to your <code>Cargo.toml</code>.
          </p>
          <CodeBlock code={IMPORT_SNIPPET} caption="stellar CLI + Rust" />
        </li>
        <li>
          <h3>Deposit what your contract holds</h3>
          <p>
            <code>deposit</code> calls <code>from.require_auth()</code>, which passes because
            your contract is the caller. Then the vault calls the token’s{' '}
            <code>transfer</code> on your contract’s funds. That is one level deeper, so your
            contract has to authorize it in advance.
          </p>
          <CodeBlock code={CONTRACT_DEPOSIT_SNIPPET} caption="deposit" />
        </li>
        <li>
          <h3>Read the position and withdraw</h3>
          <p>
            Vault shares are a token: <code>balance</code> gives your contract’s shares. Note
            that <code>withdraw</code> takes shares, not an asset amount.
          </p>
          <CodeBlock code={CONTRACT_WITHDRAW_SNIPPET} caption="withdraw, balance" />
        </li>
      </ol>
      <aside className="callout">
        <strong>Test against a live vault.</strong> The XLM vault{' '}
        <Address address={XLM_DEMO_VAULT} /> runs on testnet: send XLM to your contract and
        deposit into it. The pre-auth above fits single-asset vaults, where the vault pulls
        exactly <code>amounts_desired</code>. Multi-asset vaults can adjust the amounts to the
        vault’s ratio, so the transfer would not match. When a user should own the shares
        instead, pass the user as <code>from</code>, skip the pre-auth, and have the user sign:
        simulation builds the whole authorization tree. <code>env.mock_all_auths()</code> in
        tests hides a missing pre-auth, so run it once on testnet.
      </aside>
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
        <a className="sibling sibling-paltalabs" href="https://links.paltalabs.io/hackathons">
          <img src="/brand/paltalabs-logo-white.svg" alt="PaltaLabs" width={170} height={35} />
          <span>The team behind DeFindex and Soroswap. Everything PaltaLabs brings to the hackathon.</span>
          <span className="sibling-url">links.paltalabs.io/hackathons</span>
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
        <ContractSection />
        <Ideas />
        <Troubleshooting />
      </main>
      <Siblings />
    </>
  );
}
