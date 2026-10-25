// Every address here was read from stellar-contracts `public/testnet.contracts.json`
// or verified on testnet on 2026-10-25. Update this file after a testnet reset.

export const VERIFIED_ON = '2026-10-25';
export const NEXT_TESTNET_RESET = 'December 16, 2026';

export const API_HOST = 'https://api.defindex.io';
export const DOCS_URL = 'https://docs.defindex.io';
export const CONSOLE_URL = 'https://console.defindex.io';
export const SWAGGER_URL = 'https://api.defindex.io/docs';
export const BLEND_TESTNET_URL = 'https://testnet.blend.capital';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';
export const SOROBAN_TESTNET_RPC = 'https://soroban-testnet.stellar.org';

export const FACTORY = 'CDSCWE4GLNBYYTES2OCYDFQA2LLY4RBIAX6ZI32VSUXD7GO6HRPO4A32';

export type AssetSymbol = 'USDC' | 'XLM' | 'wETH' | 'wBTC';

export interface Token {
  symbol: AssetSymbol;
  label: string;
  address: string;
  decimals: number;
  source: string;
}

export const TOKENS: Token[] = [
  {
    symbol: 'USDC',
    label: 'BlendUSDC',
    address: 'CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU',
    decimals: 7,
    source: 'the faucet at testnet.blend.capital',
  },
  {
    symbol: 'XLM',
    label: 'XLM (native)',
    address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    decimals: 7,
    source: 'Friendbot',
  },
  {
    symbol: 'wETH',
    label: 'wETH (Blend test token)',
    address: 'CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE',
    decimals: 7,
    source: 'Blend testnet app',
  },
  {
    symbol: 'wBTC',
    label: 'wBTC (Blend test token)',
    address: 'CAP5AMC2OHNVREO66DFIN6DHJMPOBAJ2KCDDIMFBR7WWJH5RZBFM3UEI',
    decimals: 7,
    source: 'Blend testnet app',
  },
];

export type PoolId = 'v2' | 'v2.1';

export interface Pool {
  id: PoolId;
  name: string;
  address: string;
  strategies: Record<AssetSymbol, string>;
}

export const POOLS: Pool[] = [
  {
    id: 'v2',
    name: 'Blend v2',
    address: 'CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF',
    strategies: {
      USDC: 'CALLOM5I7XLQPPOPQMYAHUWW4N7O3JKT42KQ4ASEEVBXDJQNJOALFSUY',
      XLM: 'CDVLOSPJPQOTB6ZCWO5VSGTOLGMKTXSFWYTUP572GTPNOWX4F76X3HPM',
      wETH: 'CCYY7E4WPMS2FPPDI35T74CP2U3LJDAKA4UIXP2LN3TN5TXOJRNE67YM',
      wBTC: 'CBTZLEHSQYEIR3WAGBCTPKFIIX2HGD7PJPFJDOHX5W7P3SFVGJYFZJ7D',
    },
  },
  {
    id: 'v2.1',
    name: 'Blend v2.1',
    address: 'CB3447A446DY3USGWPIDXTNQHF5EX24XDQA2EN6TAZP62JTPBTNOA52Q',
    strategies: {
      USDC: 'CDY2C6TLNPDNETNU5Z6764MJ7WXOX7EB77YGH6HT73XCWA6ANFZJDXIF',
      XLM: 'CAV2UD4OIEZFICBDMIKCRMDSOEAFGUNBOIJDLBCLV5FZDEMIJILKOLBU',
      wETH: 'CAS2JNLFCUSS4QPL6323CFPRQETRGJEF5OIROE4P5IBG5VXOP7HJF23P',
      wBTC: 'CATJO4RHEMHZ5A3PV3KNZMCBQGTGWYKG5AQQ4A6FYFV5PN4QQE6ZRIAT',
    },
  },
];

export const shorten = (address: string): string => `${address.slice(0, 6)}…${address.slice(-6)}`;
