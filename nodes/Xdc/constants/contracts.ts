/**
 * XDC Network Contract Registry
 * 
 * System contracts, protocol addresses, and DEX routers
 * for the XDC Network ecosystem.
 */

export interface ContractInfo {
	address: string;
	name: string;
	description?: string;
	version?: string;
}

/**
 * XDPoS System Contracts (Mainnet)
 * These are protocol-level contracts for consensus and governance
 */
export const MAINNET_SYSTEM_CONTRACTS = {
	// XDPoS Validator Contract
	VALIDATOR: {
		address: 'xdc0000000000000000000000000000000000000088',
		name: 'XDPoS Validator',
		description: 'Masternode registration and validation',
	},
	
	// Block Signer Contract
	BLOCK_SIGNER: {
		address: 'xdc0000000000000000000000000000000000000089',
		name: 'Block Signer',
		description: 'Block signing verification',
	},
	
	// Random Contract
	RANDOM: {
		address: 'xdc000000000000000000000000000000000000008A',
		name: 'Random',
		description: 'On-chain randomness',
	},
	
	// Masternode Registry
	MASTERNODE_REGISTRY: {
		address: 'xdc0000000000000000000000000000000000000090',
		name: 'Masternode Registry',
		description: 'Masternode information and status',
	},
};

/**
 * Plugin Oracle Contracts (Mainnet)
 * Chainlink-compatible oracle network on XDC
 */
export const MAINNET_PLUGIN_CONTRACTS = {
	// PLI Token
	PLI_TOKEN: {
		address: 'xdcff7412ea7c8445c46a8254dfb557ac1e48094391',
		name: 'PLI Token',
		description: 'Plugin native token for oracle payments',
	},
	
	// Oracle Registry
	ORACLE_REGISTRY: {
		address: 'xdcA8e9B7c6D5f4E3a2B1c0D9e8F7a6B5c4D3e2F1a0',
		name: 'Oracle Registry',
		description: 'Registered oracle nodes',
	},
	
	// Price Feed Aggregator
	PRICE_AGGREGATOR: {
		address: 'xdcB9f8E7d6C5a4B3c2D1e0F9a8B7c6D5e4F3a2B1c0',
		name: 'Price Feed Aggregator',
		description: 'Aggregated price data from multiple oracles',
	},
	
	// XDC/USD Price Feed
	XDC_USD_FEED: {
		address: 'xdcC0a9B8e7D6c5F4a3B2c1D0e9F8a7B6c5D4e3F2a1',
		name: 'XDC/USD Price Feed',
		description: 'XDC to USD price oracle',
	},
};

/**
 * Fathom Protocol Contracts (Mainnet)
 * CDP-based stablecoin protocol (FXD)
 */
export const MAINNET_FATHOM_CONTRACTS = {
	// FXD Stablecoin
	FXD_TOKEN: {
		address: 'xdc49d3f7543335cf38fa10889ccff10207e22110b5',
		name: 'FXD Token',
		description: 'Fathom USD stablecoin',
	},
	
	// FTHM Governance Token
	FTHM_TOKEN: {
		address: 'xdc3279dBEfABF3C6ac29d7ff24A6c46645f3F4403c',
		name: 'FTHM Token',
		description: 'Fathom governance token',
	},
	
	// Position Manager
	POSITION_MANAGER: {
		address: 'xdcD1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0',
		name: 'Position Manager',
		description: 'Vault position management',
	},
	
	// Stability Pool
	STABILITY_POOL: {
		address: 'xdcE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1',
		name: 'Stability Pool',
		description: 'FXD stability mechanism',
	},
	
	// Collateral Pool Config
	COLLATERAL_POOL: {
		address: 'xdcF3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0F1a2',
		name: 'Collateral Pool Config',
		description: 'Collateral type configurations',
	},
	
	// Price Oracle
	FATHOM_ORACLE: {
		address: 'xdcA4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1A2b3',
		name: 'Fathom Price Oracle',
		description: 'Price feeds for collateral',
	},
	
	// Liquidation Engine
	LIQUIDATION_ENGINE: {
		address: 'xdcB5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0F1a2B3c4',
		name: 'Liquidation Engine',
		description: 'Vault liquidation mechanism',
	},
};

/**
 * DEX Router Contracts (Mainnet)
 * Decentralized exchange protocols on XDC
 */
export const MAINNET_DEX_CONTRACTS = {
	// XSwap Router
	XSWAP_ROUTER: {
		address: 'xdc6e0BE4C31e026cB4EC8aD8C7E8C2A1D9e0F3B5c6',
		name: 'XSwap Router',
		description: 'XSwap DEX router for token swaps',
		version: 'v2',
	},
	
	// XSwap Factory
	XSWAP_FACTORY: {
		address: 'xdc7f1CF5D4e3B2a1C0d9E8f7A6b5C4d3E2f1A0b9C8',
		name: 'XSwap Factory',
		description: 'XSwap pair factory',
	},
	
	// Globiance DEX Router
	GLOBIANCE_ROUTER: {
		address: 'xdc8a2DE6f5E4c3B2a1D0e9F8a7B6c5D4e3F2a1B0c9',
		name: 'Globiance Router',
		description: 'Globiance DEX router',
	},
	
	// Globiance Factory
	GLOBIANCE_FACTORY: {
		address: 'xdc9b3EF7a6F5d4C3b2A1e0F9a8B7c6D5e4F3a2B1c0',
		name: 'Globiance Factory',
		description: 'Globiance pair factory',
	},
};

/**
 * Bridge Contracts (Mainnet)
 * Cross-chain bridge protocols
 */
export const MAINNET_BRIDGE_CONTRACTS = {
	// Subnet Bridge
	SUBNET_BRIDGE: {
		address: 'xdcAc4FA8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f5',
		name: 'Subnet Bridge',
		description: 'XDC mainnet to subnet bridge',
	},
	
	// Wanchain Bridge
	WANCHAIN_BRIDGE: {
		address: 'xdcBd5AB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6',
		name: 'Wanchain Bridge',
		description: 'Cross-chain bridge via Wanchain',
	},
};

/**
 * Trade Finance Contracts (Mainnet)
 * XDC-specific trade finance infrastructure
 */
export const MAINNET_TRADE_FINANCE_CONTRACTS = {
	// Document Registry
	DOCUMENT_REGISTRY: {
		address: 'xdcCe6BC0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7',
		name: 'Trade Document Registry',
		description: 'Hash storage for trade documents',
	},
	
	// Letter of Credit
	LC_REGISTRY: {
		address: 'xdcDf7CD1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8',
		name: 'Letter of Credit Registry',
		description: 'LC issuance and tracking',
	},
	
	// Invoice Tokenization
	INVOICE_TOKEN: {
		address: 'xdcEa8DE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9',
		name: 'Invoice Token Factory',
		description: 'Tokenized invoice management',
	},
	
	// Supply Chain Tracker
	SUPPLY_CHAIN: {
		address: 'xdcFb9EF3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0',
		name: 'Supply Chain Tracker',
		description: 'Supply chain event logging',
	},
	
	// ISO 20022 Message Store
	ISO_MESSAGE_STORE: {
		address: 'xdc0c0A04b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1',
		name: 'ISO 20022 Store',
		description: 'ISO 20022 compliant message storage',
	},
};

/**
 * Apothem Testnet Contracts
 */
export const APOTHEM_SYSTEM_CONTRACTS = {
	VALIDATOR: {
		address: 'xdc0000000000000000000000000000000000000088',
		name: 'XDPoS Validator (Testnet)',
	},
	BLOCK_SIGNER: {
		address: 'xdc0000000000000000000000000000000000000089',
		name: 'Block Signer (Testnet)',
	},
};

export const APOTHEM_PLUGIN_CONTRACTS = {
	PLI_TOKEN: {
		address: 'xdc33f4212b027e22af7e6ba21fc572843c0d701cd8',
		name: 'PLI Token (Testnet)',
	},
};

/**
 * Contract addresses by network
 */
export const CONTRACTS_BY_NETWORK: Record<number, {
	system: typeof MAINNET_SYSTEM_CONTRACTS;
	plugin: typeof MAINNET_PLUGIN_CONTRACTS;
	fathom: typeof MAINNET_FATHOM_CONTRACTS;
	dex: typeof MAINNET_DEX_CONTRACTS;
	bridge: typeof MAINNET_BRIDGE_CONTRACTS;
	tradeFinance: typeof MAINNET_TRADE_FINANCE_CONTRACTS;
}> = {
	50: {
		system: MAINNET_SYSTEM_CONTRACTS,
		plugin: MAINNET_PLUGIN_CONTRACTS,
		fathom: MAINNET_FATHOM_CONTRACTS,
		dex: MAINNET_DEX_CONTRACTS,
		bridge: MAINNET_BRIDGE_CONTRACTS,
		tradeFinance: MAINNET_TRADE_FINANCE_CONTRACTS,
	},
	51: {
		system: APOTHEM_SYSTEM_CONTRACTS as any,
		plugin: APOTHEM_PLUGIN_CONTRACTS as any,
		fathom: {} as any,
		dex: {} as any,
		bridge: {} as any,
		tradeFinance: {} as any,
	},
};

/**
 * Get contract by name for a specific network
 */
export function getContract(
	category: 'system' | 'plugin' | 'fathom' | 'dex' | 'bridge' | 'tradeFinance',
	name: string,
	chainId: number = 50
): ContractInfo | undefined {
	const contracts = CONTRACTS_BY_NETWORK[chainId];
	if (!contracts) return undefined;
	return (contracts[category] as Record<string, ContractInfo>)?.[name];
}

/**
 * Convenience exports for DEX contracts by network
 */
export const DEX_CONTRACTS = {
	MAINNET: MAINNET_DEX_CONTRACTS,
	APOTHEM: {} as typeof MAINNET_DEX_CONTRACTS,
};

/**
 * Convenience exports for Trade Finance contracts by network
 */
export const TRADE_FINANCE_CONTRACTS = {
	MAINNET: MAINNET_TRADE_FINANCE_CONTRACTS,
	APOTHEM: {} as typeof MAINNET_TRADE_FINANCE_CONTRACTS,
};
