/**
 * XDC Explorer API Client
 * 
 * Interface for XDCScan/BlocksScan explorer APIs.
 * Provides account history, token transfers, and contract verification.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { XDC_MAINNET, XDC_APOTHEM } from '../constants/networks';
import { toEthAddress, toXdcAddress } from '../utils/addressUtils';

/**
 * Explorer API response wrapper
 */
export interface ExplorerResponse<T> {
	status: string;
	message: string;
	result: T;
}

/**
 * Transaction from explorer
 */
export interface ExplorerTransaction {
	hash: string;
	blockNumber: string;
	timeStamp: string;
	from: string;
	to: string;
	value: string;
	gas: string;
	gasPrice: string;
	gasUsed: string;
	input: string;
	isError: string;
	txreceipt_status: string;
	contractAddress?: string;
	confirmations: string;
	nonce: string;
}

/**
 * Token transfer from explorer
 */
export interface ExplorerTokenTransfer {
	hash: string;
	blockNumber: string;
	timeStamp: string;
	from: string;
	to: string;
	value: string;
	tokenName: string;
	tokenSymbol: string;
	tokenDecimal: string;
	contractAddress: string;
	gas: string;
	gasPrice: string;
	gasUsed: string;
}

/**
 * Internal transaction from explorer
 */
export interface ExplorerInternalTx {
	hash: string;
	blockNumber: string;
	timeStamp: string;
	from: string;
	to: string;
	value: string;
	type: string;
	traceId: string;
	isError: string;
	errCode?: string;
}

/**
 * Token holder info
 */
export interface TokenHolder {
	address: string;
	balance: string;
	share: string;
}

/**
 * Contract source code
 */
export interface ContractSource {
	SourceCode: string;
	ABI: string;
	ContractName: string;
	CompilerVersion: string;
	OptimizationUsed: string;
	Runs: string;
	ConstructorArguments: string;
	EVMVersion: string;
	Library: string;
	LicenseType: string;
	Proxy: string;
	Implementation: string;
	SwarmSource: string;
}

/**
 * XDC Explorer API Client
 */
export class XdcExplorerApi {
	private client: AxiosInstance;
	private apiKey?: string;
	private chainId: number;
	
	constructor(options: {
		chainId?: number;
		apiKey?: string;
		baseUrl?: string;
	} = {}) {
		this.chainId = options.chainId || 50;
		this.apiKey = options.apiKey;
		
		const baseUrl = options.baseUrl || (
			this.chainId === 51 
				? XDC_APOTHEM.explorerApiUrl 
				: XDC_MAINNET.explorerApiUrl
		);
		
		this.client = axios.create({
			baseURL: baseUrl,
			timeout: 30000,
		});
	}
	
	/**
	 * Make API request
	 */
	private async request<T>(
		module: string,
		action: string,
		params: Record<string, string | number | undefined> = {}
	): Promise<T> {
		const queryParams: Record<string, string> = {
			module,
			action,
		};
		
		// Add API key if available
		if (this.apiKey) {
			queryParams.apikey = this.apiKey;
		}
		
		// Add other params
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) {
				queryParams[key] = String(value);
			}
		}
		
		try {
			const response = await this.client.get<ExplorerResponse<T>>('', {
				params: queryParams,
			});
			
			if (response.data.status === '0' && response.data.message !== 'No transactions found') {
				throw new Error(response.data.message || 'API request failed');
			}
			
			return response.data.result;
		} catch (error) {
			if (error instanceof AxiosError) {
				throw new Error(`Explorer API error: ${error.message}`);
			}
			throw error;
		}
	}
	
	// ==========================================
	// Account Methods
	// ==========================================
	
	/**
	 * Get XDC balance for address
	 */
	async getBalance(address: string): Promise<string> {
		return this.request<string>('account', 'balance', {
			address: toEthAddress(address),
			tag: 'latest',
		});
	}
	
	/**
	 * Get XDC balance for multiple addresses
	 */
	async getBalanceMulti(addresses: string[]): Promise<Array<{ account: string; balance: string }>> {
		const ethAddresses = addresses.map(a => toEthAddress(a)).join(',');
		return this.request('account', 'balancemulti', {
			address: ethAddresses,
			tag: 'latest',
		});
	}
	
	/**
	 * Get normal transactions for address
	 */
	async getTransactions(
		address: string,
		options: {
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {}
	): Promise<ExplorerTransaction[]> {
		return this.request('account', 'txlist', {
			address: toEthAddress(address),
			startblock: options.startBlock,
			endblock: options.endBlock,
			page: options.page,
			offset: options.offset,
			sort: options.sort,
		});
	}
	
	/**
	 * Get internal transactions for address
	 */
	async getInternalTransactions(
		address: string,
		options: {
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {}
	): Promise<ExplorerInternalTx[]> {
		return this.request('account', 'txlistinternal', {
			address: toEthAddress(address),
			startblock: options.startBlock,
			endblock: options.endBlock,
			page: options.page,
			offset: options.offset,
			sort: options.sort,
		});
	}
	
	/**
	 * Get XRC-20 token transfers for address
	 */
	async getTokenTransfers(
		address: string,
		options: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {}
	): Promise<ExplorerTokenTransfer[]> {
		return this.request('account', 'tokentx', {
			address: toEthAddress(address),
			contractaddress: options.contractAddress ? toEthAddress(options.contractAddress) : undefined,
			startblock: options.startBlock,
			endblock: options.endBlock,
			page: options.page,
			offset: options.offset,
			sort: options.sort,
		});
	}
	
	/**
	 * Get XRC-721 NFT transfers for address
	 */
	async getNftTransfers(
		address: string,
		options: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {}
	): Promise<ExplorerTokenTransfer[]> {
		return this.request('account', 'tokennfttx', {
			address: toEthAddress(address),
			contractaddress: options.contractAddress ? toEthAddress(options.contractAddress) : undefined,
			startblock: options.startBlock,
			endblock: options.endBlock,
			page: options.page,
			offset: options.offset,
			sort: options.sort,
		});
	}
	
	/**
	 * Get token balance for address
	 */
	async getTokenBalance(address: string, contractAddress: string): Promise<string> {
		return this.request<string>('account', 'tokenbalance', {
			address: toEthAddress(address),
			contractaddress: toEthAddress(contractAddress),
			tag: 'latest',
		});
	}
	
	// ==========================================
	// Contract Methods
	// ==========================================
	
	/**
	 * Get contract ABI
	 */
	async getContractABI(address: string): Promise<string> {
		return this.request<string>('contract', 'getabi', {
			address: toEthAddress(address),
		});
	}
	
	/**
	 * Get contract source code
	 */
	async getContractSource(address: string): Promise<ContractSource[]> {
		return this.request('contract', 'getsourcecode', {
			address: toEthAddress(address),
		});
	}
	
	/**
	 * Verify contract source code
	 */
	async verifyContract(params: {
		address: string;
		sourceCode: string;
		contractName: string;
		compilerVersion: string;
		optimizationUsed?: boolean;
		runs?: number;
		constructorArguments?: string;
		evmVersion?: string;
	}): Promise<string> {
		return this.request('contract', 'verifysourcecode', {
			contractaddress: toEthAddress(params.address),
			sourceCode: params.sourceCode,
			contractname: params.contractName,
			compilerversion: params.compilerVersion,
			optimizationUsed: params.optimizationUsed ? '1' : '0',
			runs: params.runs,
			constructorArguements: params.constructorArguments,
			evmversion: params.evmVersion,
		});
	}
	
	/**
	 * Check contract verification status
	 */
	async checkVerificationStatus(guid: string): Promise<string> {
		return this.request<string>('contract', 'checkverifystatus', {
			guid,
		});
	}
	
	// ==========================================
	// Transaction Methods
	// ==========================================
	
	/**
	 * Get transaction status
	 */
	async getTransactionStatus(txHash: string): Promise<{
		isError: string;
		errDescription: string;
	}> {
		return this.request('transaction', 'getstatus', {
			txhash: txHash,
		});
	}
	
	/**
	 * Get transaction receipt status
	 */
	async getTransactionReceiptStatus(txHash: string): Promise<{
		status: string;
	}> {
		return this.request('transaction', 'gettxreceiptstatus', {
			txhash: txHash,
		});
	}
	
	// ==========================================
	// Block Methods
	// ==========================================
	
	/**
	 * Get block reward for miner
	 */
	async getBlockReward(blockNumber: number): Promise<{
		blockNumber: string;
		timeStamp: string;
		blockMiner: string;
		blockReward: string;
		uncles: unknown[];
		uncleInclusionReward: string;
	}> {
		return this.request('block', 'getblockreward', {
			blockno: blockNumber,
		});
	}
	
	/**
	 * Get block countdown time
	 */
	async getBlockCountdown(blockNumber: number): Promise<{
		CurrentBlock: string;
		CountdownBlock: string;
		RemainingBlock: string;
		EstimateTimeInSec: string;
	}> {
		return this.request('block', 'getblockcountdown', {
			blockno: blockNumber,
		});
	}
	
	/**
	 * Get block number by timestamp
	 */
	async getBlockByTimestamp(
		timestamp: number,
		closest: 'before' | 'after' = 'before'
	): Promise<string> {
		return this.request<string>('block', 'getblocknobytime', {
			timestamp,
			closest,
		});
	}
	
	// ==========================================
	// Token Methods
	// ==========================================
	
	/**
	 * Get token info
	 */
	async getTokenInfo(contractAddress: string): Promise<{
		name: string;
		symbol: string;
		decimals: string;
		totalSupply: string;
		owner: string;
	}> {
		return this.request('token', 'tokeninfo', {
			contractaddress: toEthAddress(contractAddress),
		});
	}
	
	/**
	 * Get token holders
	 */
	async getTokenHolders(
		contractAddress: string,
		options: {
			page?: number;
			offset?: number;
		} = {}
	): Promise<TokenHolder[]> {
		return this.request('token', 'tokenholderlist', {
			contractaddress: toEthAddress(contractAddress),
			page: options.page,
			offset: options.offset,
		});
	}
	
	/**
	 * Get token holder count
	 */
	async getTokenHolderCount(contractAddress: string): Promise<string> {
		return this.request<string>('token', 'tokenholdercount', {
			contractaddress: toEthAddress(contractAddress),
		});
	}
	
	// ==========================================
	// Stats Methods
	// ==========================================
	
	/**
	 * Get total XDC supply
	 */
	async getTotalSupply(): Promise<string> {
		return this.request<string>('stats', 'xdcsupply', {});
	}
	
	/**
	 * Get XDC price
	 */
	async getXdcPrice(): Promise<{
		xdcbtc: string;
		xdcbtc_timestamp: string;
		xdcusd: string;
		xdcusd_timestamp: string;
	}> {
		return this.request('stats', 'xdcprice', {});
	}
	
	// ==========================================
	// Logs Methods
	// ==========================================
	
	/**
	 * Get logs by address
	 */
	async getLogs(
		address: string,
		options: {
			fromBlock?: number;
			toBlock?: number;
			topic0?: string;
			topic1?: string;
			topic2?: string;
			topic3?: string;
			page?: number;
			offset?: number;
		} = {}
	): Promise<Array<{
		address: string;
		topics: string[];
		data: string;
		blockNumber: string;
		timeStamp: string;
		gasPrice: string;
		gasUsed: string;
		logIndex: string;
		transactionHash: string;
		transactionIndex: string;
	}>> {
		return this.request('logs', 'getLogs', {
			address: toEthAddress(address),
			fromBlock: options.fromBlock,
			toBlock: options.toBlock,
			topic0: options.topic0,
			topic1: options.topic1,
			topic2: options.topic2,
			topic3: options.topic3,
			page: options.page,
			offset: options.offset,
		});
	}
	
	// ==========================================
	// Utility Methods
	// ==========================================
	
	/**
	 * Format addresses in response to XDC format
	 */
	formatTransactions(transactions: ExplorerTransaction[]): ExplorerTransaction[] {
		return transactions.map(tx => ({
			...tx,
			from: toXdcAddress(tx.from),
			to: tx.to ? toXdcAddress(tx.to) : tx.to,
			contractAddress: tx.contractAddress ? toXdcAddress(tx.contractAddress) : tx.contractAddress,
		}));
	}
	
	/**
	 * Format token transfers to XDC format
	 */
	formatTokenTransfers(transfers: ExplorerTokenTransfer[]): ExplorerTokenTransfer[] {
		return transfers.map(tx => ({
			...tx,
			from: toXdcAddress(tx.from),
			to: toXdcAddress(tx.to),
			contractAddress: toXdcAddress(tx.contractAddress),
		}));
	}
}

/**
 * Create explorer API client from credentials
 */
export function createExplorerApi(credentials: {
	network?: string;
	apiKey?: string;
	chainId?: number;
}): XdcExplorerApi {
	const chainId = credentials.chainId || (
		credentials.network === 'apothem' ? 51 : 50
	);
	
	return new XdcExplorerApi({
		chainId,
		apiKey: credentials.apiKey,
	});
}
