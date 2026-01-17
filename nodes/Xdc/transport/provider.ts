/**
 * XDC Network Provider
 * 
 * Manages connections to XDC Network nodes using ethers.js.
 * Handles both read-only and signer operations.
 */

import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { XDC_MAINNET, XDC_APOTHEM, NetworkConfig } from '../constants/networks';
import { toEthAddress } from '../utils/addressUtils';

/**
 * Connection options for XDC provider
 */
export interface XdcConnectionOptions {
	network: 'mainnet' | 'apothem' | 'custom';
	rpcUrl?: string;
	privateKey?: string;
	chainId?: number;
	timeout?: number;
}

/**
 * XDC Provider wrapper
 */
export class XdcProvider {
	private provider: JsonRpcProvider;
	private signer: Wallet | null = null;
	private networkConfig: NetworkConfig;
	
	constructor(options: XdcConnectionOptions) {
		// Determine network configuration
		if (options.network === 'custom' && options.rpcUrl) {
			this.networkConfig = {
				...XDC_MAINNET,
				name: 'Custom Network',
				chainId: options.chainId || 50,
				rpcUrl: options.rpcUrl,
			};
		} else if (options.network === 'apothem') {
			this.networkConfig = XDC_APOTHEM;
		} else {
			this.networkConfig = XDC_MAINNET;
		}
		
		// Create provider
		const rpcUrl = options.rpcUrl || this.networkConfig.rpcUrl;
		this.provider = new JsonRpcProvider(rpcUrl, {
			chainId: this.networkConfig.chainId,
			name: this.networkConfig.name,
		});
		
		// Create signer if private key provided
		if (options.privateKey) {
			this.signer = new Wallet(options.privateKey, this.provider);
		}
	}
	
	/**
	 * Get the underlying ethers provider
	 */
	getProvider(): JsonRpcProvider {
		return this.provider;
	}
	
	/**
	 * Get the signer (wallet)
	 */
	getSigner(): Wallet | null {
		return this.signer;
	}
	
	/**
	 * Check if signer is available
	 */
	hasSigner(): boolean {
		return this.signer !== null;
	}
	
	/**
	 * Get network configuration
	 */
	getNetworkConfig(): NetworkConfig {
		return this.networkConfig;
	}
	
	/**
	 * Get chain ID
	 */
	getChainId(): number {
		return this.networkConfig.chainId;
	}
	
	/**
	 * Get connected address (if signer exists)
	 */
	async getAddress(): Promise<string | null> {
		if (!this.signer) return null;
		return this.signer.address;
	}
	
	// ==========================================
	// Account Methods
	// ==========================================
	
	/**
	 * Get XDC balance for address
	 */
	async getBalance(address: string): Promise<bigint> {
		const ethAddress = toEthAddress(address);
		return this.provider.getBalance(ethAddress);
	}
	
	/**
	 * Get transaction count (nonce) for address
	 */
	async getTransactionCount(address: string, blockTag?: string): Promise<number> {
		const ethAddress = toEthAddress(address);
		return this.provider.getTransactionCount(ethAddress, blockTag);
	}
	
	/**
	 * Get code at address (to check if contract)
	 */
	async getCode(address: string): Promise<string> {
		const ethAddress = toEthAddress(address);
		return this.provider.getCode(ethAddress);
	}
	
	// ==========================================
	// Transaction Methods
	// ==========================================
	
	/**
	 * Send native XDC transfer
	 */
	async sendXdc(
		to: string,
		amount: bigint,
		options?: {
			gasLimit?: bigint;
			gasPrice?: bigint;
			nonce?: number;
		}
	): Promise<ethers.TransactionResponse> {
		if (!this.signer) {
			throw new Error('Signer required for transactions');
		}
		
		const tx = {
			to: toEthAddress(to),
			value: amount,
			...options,
		};
		
		return this.signer.sendTransaction(tx);
	}
	
	/**
	 * Get transaction by hash
	 */
	async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
		return this.provider.getTransaction(txHash);
	}
	
	/**
	 * Get transaction receipt
	 */
	async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
		return this.provider.getTransactionReceipt(txHash);
	}
	
	/**
	 * Wait for transaction confirmation
	 */
	async waitForTransaction(
		txHash: string,
		confirmations: number = 1,
		timeout?: number
	): Promise<ethers.TransactionReceipt | null> {
		return this.provider.waitForTransaction(txHash, confirmations, timeout);
	}
	
	/**
	 * Estimate gas for transaction
	 */
	async estimateGas(tx: ethers.TransactionRequest): Promise<bigint> {
		if (tx.to) {
			const toAddress = typeof tx.to === 'string' ? tx.to : await tx.to;
			tx.to = toEthAddress(toAddress as string);
		}
		return this.provider.estimateGas(tx);
	}
	
	/**
	 * Get current gas price
	 */
	async getGasPrice(): Promise<bigint> {
		const feeData = await this.provider.getFeeData();
		return feeData.gasPrice || 0n;
	}
	
	/**
	 * Get fee data (gas price, max fee, etc.)
	 */
	async getFeeData(): Promise<ethers.FeeData> {
		return this.provider.getFeeData();
	}
	
	// ==========================================
	// Block Methods
	// ==========================================
	
	/**
	 * Get current block number
	 */
	async getBlockNumber(): Promise<number> {
		return this.provider.getBlockNumber();
	}
	
	/**
	 * Get block by number or hash
	 */
	async getBlock(
		blockHashOrNumber: string | number,
		includeTransactions: boolean = false
	): Promise<ethers.Block | null> {
		return this.provider.getBlock(blockHashOrNumber, includeTransactions);
	}
	
	/**
	 * Get latest block
	 */
	async getLatestBlock(): Promise<ethers.Block | null> {
		return this.provider.getBlock('latest');
	}
	
	// ==========================================
	// Contract Methods
	// ==========================================
	
	/**
	 * Create contract instance for read operations
	 */
	getContract(address: string, abi: ethers.InterfaceAbi): Contract {
		return new Contract(toEthAddress(address), abi, this.provider);
	}
	
	/**
	 * Create contract instance for write operations
	 */
	getWritableContract(address: string, abi: ethers.InterfaceAbi): Contract {
		if (!this.signer) {
			throw new Error('Signer required for writable contracts');
		}
		return new Contract(toEthAddress(address), abi, this.signer);
	}
	
	/**
	 * Call contract function (read)
	 */
	async callContract(
		address: string,
		abi: ethers.InterfaceAbi,
		functionName: string,
		args: unknown[] = []
	): Promise<unknown> {
		const contract = this.getContract(address, abi);
		return contract[functionName](...args);
	}
	
	/**
	 * Execute contract function (write)
	 */
	async executeContract(
		address: string,
		abi: ethers.InterfaceAbi,
		functionName: string,
		args: unknown[] = [],
		options?: {
			value?: bigint;
			gasLimit?: bigint;
			gasPrice?: bigint;
		}
	): Promise<ethers.TransactionResponse> {
		const contract = this.getWritableContract(address, abi);
		return contract[functionName](...args, options || {});
	}
	
	// ==========================================
	// Event/Log Methods
	// ==========================================
	
	/**
	 * Get logs for filter
	 */
	async getLogs(filter: ethers.Filter): Promise<ethers.Log[]> {
		return this.provider.getLogs(filter);
	}
	
	/**
	 * Subscribe to events (real-time)
	 */
	on(eventName: string, listener: ethers.Listener): void {
		this.provider.on(eventName, listener);
	}
	
	/**
	 * Unsubscribe from events
	 */
	off(eventName: string, listener?: ethers.Listener): void {
		this.provider.off(eventName, listener);
	}
	
	// ==========================================
	// Utility Methods
	// ==========================================
	
	/**
	 * Sign a message
	 */
	async signMessage(message: string): Promise<string> {
		if (!this.signer) {
			throw new Error('Signer required to sign messages');
		}
		return this.signer.signMessage(message);
	}
	
	/**
	 * Sign typed data
	 */
	async signTypedData(
		domain: ethers.TypedDataDomain,
		types: Record<string, ethers.TypedDataField[]>,
		value: Record<string, unknown>
	): Promise<string> {
		if (!this.signer) {
			throw new Error('Signer required to sign typed data');
		}
		return this.signer.signTypedData(domain, types, value);
	}
	
	/**
	 * Get network status
	 */
	async getNetworkStatus(): Promise<{
		chainId: number;
		blockNumber: number;
		gasPrice: string;
		connected: boolean;
	}> {
		try {
			const [blockNumber, gasPrice] = await Promise.all([
				this.getBlockNumber(),
				this.getGasPrice(),
			]);
			
			return {
				chainId: this.networkConfig.chainId,
				blockNumber,
				gasPrice: gasPrice.toString(),
				connected: true,
			};
		} catch {
			return {
				chainId: this.networkConfig.chainId,
				blockNumber: 0,
				gasPrice: '0',
				connected: false,
			};
		}
	}
	
	/**
	 * Disconnect provider
	 */
	disconnect(): void {
		this.provider.removeAllListeners();
	}
}

/**
 * Create XDC provider from credentials
 */
export function createXdcProvider(credentials: {
	network: string;
	rpcUrl?: string;
	privateKey?: string;
	chainId?: number;
}): XdcProvider {
	return new XdcProvider({
		network: credentials.network as 'mainnet' | 'apothem' | 'custom',
		rpcUrl: credentials.rpcUrl,
		privateKey: credentials.privateKey,
		chainId: credentials.chainId,
	});
}

/**
 * Validate RPC connection
 */
export async function validateConnection(rpcUrl: string): Promise<{
	valid: boolean;
	chainId?: number;
	error?: string;
}> {
	try {
		const provider = new JsonRpcProvider(rpcUrl);
		const network = await provider.getNetwork();
		
		return {
			valid: true,
			chainId: Number(network.chainId),
		};
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Connection failed',
		};
	}
}
