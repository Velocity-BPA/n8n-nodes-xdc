/**
 * XDC Network Configurations
 * 
 * XDC Network is an enterprise-grade hybrid blockchain platform
 * optimized for international trade and finance. It uses XDPoS
 * (XinFin Delegated Proof of Stake) consensus with 108 masternodes.
 */

export interface NetworkConfig {
	name: string;
	chainId: number;
	rpcUrl: string;
	wsUrl: string;
	explorerUrl: string;
	explorerApiUrl: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	isTestnet: boolean;
	blockTime: number; // Average block time in seconds
	epochBlocks: number; // Blocks per epoch for rewards distribution
}

/**
 * XDC Mainnet Configuration
 * Chain ID: 50
 * Native Token: XDC
 */
export const XDC_MAINNET: NetworkConfig = {
	name: 'XDC Mainnet',
	chainId: 50,
	rpcUrl: 'https://erpc.xinfin.network',
	wsUrl: 'wss://ws.xinfin.network',
	explorerUrl: 'https://explorer.xinfin.network',
	explorerApiUrl: 'https://xdc.blocksscan.io/api',
	nativeCurrency: {
		name: 'XDC',
		symbol: 'XDC',
		decimals: 18,
	},
	isTestnet: false,
	blockTime: 2,
	epochBlocks: 900,
};

/**
 * XDC Apothem Testnet Configuration
 * Chain ID: 51
 * Native Token: TXDC (Test XDC)
 */
export const XDC_APOTHEM: NetworkConfig = {
	name: 'XDC Apothem Testnet',
	chainId: 51,
	rpcUrl: 'https://erpc.apothem.network',
	wsUrl: 'wss://ws.apothem.network',
	explorerUrl: 'https://explorer.apothem.network',
	explorerApiUrl: 'https://apothem.blocksscan.io/api',
	nativeCurrency: {
		name: 'Test XDC',
		symbol: 'TXDC',
		decimals: 18,
	},
	isTestnet: true,
	blockTime: 2,
	epochBlocks: 900,
};

/**
 * Alternative RPC endpoints for XDC Mainnet
 * Use these as fallbacks or for load balancing
 */
export const XDC_MAINNET_RPCS = [
	'https://erpc.xinfin.network',
	'https://rpc.xinfin.network',
	'https://rpc1.xinfin.network',
	'https://rpc-xdc.icecreamswap.com',
	'https://xdc-mainnet.public.blastapi.io',
	'https://xinfin-network.public.blastapi.io',
];

/**
 * Alternative RPC endpoints for Apothem Testnet
 */
export const XDC_APOTHEM_RPCS = [
	'https://erpc.apothem.network',
	'https://rpc.apothem.network',
	'https://rpc-apothem.xinfin.org',
];

/**
 * Network configuration map by chain ID
 */
export const NETWORKS_BY_CHAIN_ID: Record<number, NetworkConfig> = {
	50: XDC_MAINNET,
	51: XDC_APOTHEM,
};

/**
 * Network configuration map by name
 */
export const NETWORKS_BY_NAME: Record<string, NetworkConfig> = {
	mainnet: XDC_MAINNET,
	apothem: XDC_APOTHEM,
	testnet: XDC_APOTHEM,
};

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK = XDC_MAINNET;

/**
 * XDC Network specific constants
 */
export const XDC_CONSTANTS = {
	// XDPoS Consensus Constants
	MASTERNODE_COUNT: 108,
	VALIDATOR_COUNT: 108,
	MIN_MASTERNODE_STAKE: 10000000, // 10 million XDC
	BLOCK_REWARD: 0.25, // XDC per block
	EPOCH_BLOCKS: 900,
	
	// Transaction Constants
	DEFAULT_GAS_LIMIT: 21000,
	TOKEN_TRANSFER_GAS: 65000,
	CONTRACT_DEPLOY_GAS: 3000000,
	MAX_GAS_LIMIT: 50000000,
	
	// Address Prefix
	XDC_PREFIX: 'xdc',
	ETH_PREFIX: '0x',
	
	// Decimals
	XDC_DECIMALS: 18,
	GWEI_DECIMALS: 9,
	
	// Confirmation requirements
	DEFAULT_CONFIRMATIONS: 1,
	SAFE_CONFIRMATIONS: 12,
};

/**
 * Get network configuration by name or chain ID
 */
export function getNetworkConfig(networkOrChainId: string | number): NetworkConfig {
	if (typeof networkOrChainId === 'number') {
		return NETWORKS_BY_CHAIN_ID[networkOrChainId] || XDC_MAINNET;
	}
	return NETWORKS_BY_NAME[networkOrChainId.toLowerCase()] || XDC_MAINNET;
}
