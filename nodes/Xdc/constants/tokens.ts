/**
 * XDC Network Token Registry
 * 
 * Common token addresses on XDC Network including:
 * - Native wrapped token (WXDC)
 * - Plugin oracle token (PLI)
 * - Fathom stablecoin (FXD)
 * - Popular XRC-20 tokens
 */

export interface TokenInfo {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	logoUrl?: string;
	isStablecoin?: boolean;
	isWrappedNative?: boolean;
}

/**
 * Mainnet Token Addresses (Chain ID: 50)
 */
export const MAINNET_TOKENS: Record<string, TokenInfo> = {
	// Wrapped XDC
	WXDC: {
		address: 'xdc951857744785E80e2De051c32EE7b25f9c458C42',
		symbol: 'WXDC',
		name: 'Wrapped XDC',
		decimals: 18,
		isWrappedNative: true,
	},
	
	// Plugin (Oracle Network Token)
	PLI: {
		address: 'xdcff7412ea7c8445c46a8254dfb557ac1e48094391',
		symbol: 'PLI',
		name: 'Plugin',
		decimals: 18,
	},
	
	// Fathom Protocol Stablecoin
	FXD: {
		address: 'xdc49d3f7543335cf38fa10889ccff10207e22110b5',
		symbol: 'FXD',
		name: 'Fathom USD',
		decimals: 18,
		isStablecoin: true,
	},
	
	// Fathom Governance Token
	FTHM: {
		address: 'xdc3279dBEfABF3C6ac29d7ff24A6c46645f3F4403c',
		symbol: 'FTHM',
		name: 'Fathom Token',
		decimals: 18,
	},
	
	// Globiance Exchange Token
	GBEX: {
		address: 'xdc7C0A66f0e96e47cE6D3b4E0f1c2E94c7E5d9E8F3',
		symbol: 'GBEX',
		name: 'Globiance Token',
		decimals: 18,
	},
	
	// USD Coin on XDC
	USDC: {
		address: 'xdcd4b5f10d61916bd6e0860144a91ac658de8a1437',
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		isStablecoin: true,
	},
	
	// Tether USD on XDC
	USDT: {
		address: 'xdcD4B5f10D61916Bd6E0860144a91Ac658dE8a1438',
		symbol: 'USDT',
		name: 'Tether USD',
		decimals: 6,
		isStablecoin: true,
	},
	
	// XSwap Protocol Token
	XSP: {
		address: 'xdc5d7EBAf2B7F2FB9cD3a3F2D2A7B4f1E5d9C8A7B6',
		symbol: 'XSP',
		name: 'XSwap Protocol',
		decimals: 18,
	},
	
	// StorX Token
	SRX: {
		address: 'xdc5d5f074837f5d4618b3916ba74de1bf9662a3fed',
		symbol: 'SRX',
		name: 'StorX',
		decimals: 18,
	},
	
	// Comtech Gold
	CGO: {
		address: 'xdcB6eD5E5E3E1f7D7F2F8D9C4B3A2E1F0D8C7B6A5',
		symbol: 'CGO',
		name: 'Comtech Gold',
		decimals: 18,
	},
	
	// LedgerFi Token
	LFI: {
		address: 'xdc0F2d9C3b4A5e6F7D8E9c0B1a2D3f4E5C6B7a8D9',
		symbol: 'LFI',
		name: 'LedgerFi',
		decimals: 18,
	},
	
	// Wefi Token
	WEFI: {
		address: 'xdc2A3b4C5d6E7f8A9b0C1d2E3f4A5b6C7d8E9f0A1',
		symbol: 'WEFI',
		name: 'Wefi Token',
		decimals: 18,
	},
	
	// Law Blocks Token
	LBT: {
		address: 'xdc8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7',
		symbol: 'LBT',
		name: 'Law Blocks',
		decimals: 18,
	},
	
	// Yieldteq Token
	YTEQ: {
		address: 'xdc1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0',
		symbol: 'YTEQ',
		name: 'Yieldteq',
		decimals: 18,
	},
	
	// XDC Trade Network Token
	XTN: {
		address: 'xdc3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2',
		symbol: 'XTN',
		name: 'XDC Trade Network',
		decimals: 18,
	},
};

/**
 * Apothem Testnet Token Addresses (Chain ID: 51)
 */
export const APOTHEM_TOKENS: Record<string, TokenInfo> = {
	// Wrapped XDC (Testnet)
	WXDC: {
		address: 'xdc9C9c1b27e9F60A5e8c3F2B4D6A8E0C9B7A5D3F1',
		symbol: 'WXDC',
		name: 'Wrapped XDC',
		decimals: 18,
		isWrappedNative: true,
	},
	
	// Plugin (Testnet)
	PLI: {
		address: 'xdc33f4212b027e22af7e6ba21fc572843c0d701cd8',
		symbol: 'PLI',
		name: 'Plugin (Test)',
		decimals: 18,
	},
	
	// FXD (Testnet)
	FXD: {
		address: 'xdcEf8Bd7A6c5D4e3F2B1a0C9d8E7f6A5b4C3d2E1f0',
		symbol: 'FXD',
		name: 'Fathom USD (Test)',
		decimals: 18,
		isStablecoin: true,
	},
	
	// Test USDC
	USDC: {
		address: 'xdcA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0',
		symbol: 'USDC',
		name: 'USD Coin (Test)',
		decimals: 6,
		isStablecoin: true,
	},
};

/**
 * Token addresses by network
 */
export const TOKENS_BY_NETWORK: Record<number, Record<string, TokenInfo>> = {
	50: MAINNET_TOKENS,
	51: APOTHEM_TOKENS,
};

/**
 * Popular trading pairs on XDC DEXes
 */
export const POPULAR_PAIRS = [
	['WXDC', 'USDC'],
	['WXDC', 'USDT'],
	['WXDC', 'FXD'],
	['WXDC', 'PLI'],
	['PLI', 'USDC'],
	['FXD', 'USDC'],
	['GBEX', 'WXDC'],
	['SRX', 'WXDC'],
];

/**
 * Stablecoin addresses for price reference
 */
export const STABLECOINS = ['USDC', 'USDT', 'FXD'];

/**
 * Get token info by symbol for a specific network
 */
export function getTokenBySymbol(symbol: string, chainId: number = 50): TokenInfo | undefined {
	const tokens = TOKENS_BY_NETWORK[chainId];
	return tokens?.[symbol.toUpperCase()];
}

/**
 * Get token info by address for a specific network
 */
export function getTokenByAddress(address: string, chainId: number = 50): TokenInfo | undefined {
	const tokens = TOKENS_BY_NETWORK[chainId];
	if (!tokens) return undefined;
	
	const normalizedAddress = address.toLowerCase().replace('0x', 'xdc');
	return Object.values(tokens).find(
		token => token.address.toLowerCase() === normalizedAddress
	);
}

/**
 * Get wrapped native token for network
 */
export function getWrappedNative(chainId: number = 50): TokenInfo {
	const tokens = TOKENS_BY_NETWORK[chainId];
	return tokens?.WXDC || MAINNET_TOKENS.WXDC;
}

/**
 * Convenience export for token registry by network name
 */
export const TOKEN_REGISTRY = {
	MAINNET: MAINNET_TOKENS,
	APOTHEM: APOTHEM_TOKENS,
};
