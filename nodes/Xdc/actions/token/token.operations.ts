/**
 * XDC Network - XRC-20 Token Resource Operations
 * 
 * Handles all XRC-20 token operations including transfers, approvals,
 * balance queries, and token information retrieval.
 * 
 * XRC-20 is XDC's equivalent to ERC-20 on Ethereum.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createXdcProvider } from '../../transport/provider';
import { XdcExplorerApi } from '../../transport/explorerApi';
import { toEthAddress, toXdcAddress, isValidXdcAddress } from '../../utils/addressUtils';
import { formatTokenAmount, parseTokenAmount } from '../../utils/unitConverter';
import { ABIS } from '../../constants/abis';

// Token resource operations definition
export const tokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Approve Spending',
				value: 'approveSpending',
				description: 'Approve an address to spend tokens on your behalf',
				action: 'Approve token spending',
			},
			{
				name: 'Get Allowance',
				value: 'getAllowance',
				description: 'Get the amount of tokens approved for spending',
				action: 'Get token allowance',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get XRC-20 token balance for an address',
				action: 'Get token balance',
			},
			{
				name: 'Get Token Holders',
				value: 'getTokenHolders',
				description: 'Get list of token holders',
				action: 'Get token holders',
			},
			{
				name: 'Get Token Info',
				value: 'getTokenInfo',
				description: 'Get token information (name, symbol, decimals, supply)',
				action: 'Get token info',
			},
			{
				name: 'Get Token Total Supply',
				value: 'getTokenTotalSupply',
				description: 'Get the total supply of a token',
				action: 'Get token total supply',
			},
			{
				name: 'Get Token Transfers',
				value: 'getTokenTransfers',
				description: 'Get token transfer history',
				action: 'Get token transfers',
			},
			{
				name: 'Transfer From',
				value: 'transferFrom',
				description: 'Transfer tokens from one address to another using approval',
				action: 'Transfer tokens from',
			},
			{
				name: 'Transfer Token',
				value: 'transferToken',
				description: 'Transfer XRC-20 tokens to an address',
				action: 'Transfer token',
			},
		],
		default: 'getTokenInfo',
	},
];

// Token resource fields
export const tokenFields: INodeProperties[] = [
	// Token contract address field
	{
		displayName: 'Token Contract Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The XRC-20 token contract address',
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
	},

	// Wallet address field for balance queries
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The wallet address to check',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenBalance', 'getTokenTransfers'],
			},
		},
	},

	// Transfer fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The recipient address',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken', 'transferFrom'],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '',
		placeholder: '100',
		description: 'Amount of tokens to transfer (in token units, not wei)',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken', 'transferFrom', 'approveSpending'],
			},
		},
	},

	// Transfer from fields
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The address to transfer tokens from',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferFrom'],
			},
		},
	},

	// Approval fields
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The address to approve for spending',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['approveSpending', 'getAllowance'],
			},
		},
	},

	// Owner address for allowance check
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The token owner address',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getAllowance'],
			},
		},
	},

	// Token holders pagination
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number for pagination',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenHolders', 'getTokenTransfers'],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 100,
		description: 'Number of results per page',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenHolders', 'getTokenTransfers'],
			},
		},
	},

	// Additional options for transfers
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferToken', 'transferFrom', 'approveSpending'],
			},
		},
		options: [
			{
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 100000,
				description: 'Gas limit for the transaction',
			},
			{
				displayName: 'Gas Price (Gwei)',
				name: 'gasPrice',
				type: 'string',
				default: '',
				description: 'Gas price in Gwei (leave empty for automatic)',
			},
			{
				displayName: 'Use Max Approval',
				name: 'useMaxApproval',
				type: 'boolean',
				default: false,
				description: 'Whether to approve the maximum amount (type(uint256).max)',
				displayOptions: {
					show: {
						'/operation': ['approveSpending'],
					},
				},
			},
		],
	},
];

/**
 * Execute token operations
 */
export async function executeTokenOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('xdcNetwork');

	const network = credentials.network as string;
	const rpcUrl = credentials.rpcUrl as string | undefined;
	const privateKey = credentials.privateKey as string | undefined;

	const provider = createXdcProvider({ network, rpcUrl, privateKey });
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

	if (!isValidXdcAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`);
	}

	const tokenContract = provider.getContract(toEthAddress(tokenAddress), ABIS.XRC20);

	let result: any;

	switch (operation) {
		case 'getTokenInfo': {
			const [name, symbol, decimals, totalSupply] = await Promise.all([
				tokenContract.name().catch(() => 'Unknown'),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
				tokenContract.decimals().catch(() => 18),
				tokenContract.totalSupply().catch(() => BigInt(0)),
			]);

			result = {
				address: toXdcAddress(tokenAddress),
				name,
				symbol,
				decimals: Number(decimals),
				totalSupply: formatTokenAmount(totalSupply, decimals),
				totalSupplyRaw: totalSupply.toString(),
			};
			break;
		}

		case 'getTokenBalance': {
			const walletAddress = this.getNodeParameter('walletAddress', index) as string;

			if (!isValidXdcAddress(walletAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid wallet address: ${walletAddress}`);
			}

			const [balance, name, symbol, decimals] = await Promise.all([
				tokenContract.balanceOf(toEthAddress(walletAddress)),
				tokenContract.name().catch(() => 'Unknown'),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
				tokenContract.decimals().catch(() => 18),
			]);

			result = {
				address: toXdcAddress(walletAddress),
				tokenAddress: toXdcAddress(tokenAddress),
				tokenName: name,
				tokenSymbol: symbol,
				balance: formatTokenAmount(balance, decimals),
				balanceRaw: balance.toString(),
				decimals: Number(decimals),
			};
			break;
		}

		case 'getTokenTotalSupply': {
			const [totalSupply, decimals, symbol] = await Promise.all([
				tokenContract.totalSupply(),
				tokenContract.decimals().catch(() => 18),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
			]);

			result = {
				tokenAddress: toXdcAddress(tokenAddress),
				symbol,
				totalSupply: formatTokenAmount(totalSupply, decimals),
				totalSupplyRaw: totalSupply.toString(),
				decimals: Number(decimals),
			};
			break;
		}

		case 'transferToken': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for token transfers',
				);
			}

			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
			};

			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid recipient address: ${toAddress}`);
			}

			const decimals = await tokenContract.decimals().catch(() => 18);
			const amountWei = parseTokenAmount(amount, decimals);

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const writableContract = new ethers.Contract(
				toEthAddress(tokenAddress),
				ABIS.XRC20,
				wallet,
			);

			const txOptions: any = {};
			if (options.gasLimit) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}

			const tx = await writableContract.transfer(toEthAddress(toAddress), amountWei, txOptions);
			const receipt = await tx.wait();

			const symbol = await tokenContract.symbol().catch(() => 'UNKNOWN');

			result = {
				success: true,
				transactionHash: tx.hash,
				from: toXdcAddress(wallet.address),
				to: toXdcAddress(toAddress),
				tokenAddress: toXdcAddress(tokenAddress),
				tokenSymbol: symbol,
				amount,
				amountRaw: amountWei.toString(),
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'approveSpending': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for token approvals',
				);
			}

			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
				useMaxApproval?: boolean;
			};

			if (!isValidXdcAddress(spenderAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid spender address: ${spenderAddress}`);
			}

			const decimals = await tokenContract.decimals().catch(() => 18);
			
			// Use max uint256 for unlimited approval if specified
			let amountWei: bigint;
			if (options.useMaxApproval) {
				amountWei = ethers.MaxUint256;
			} else {
				amountWei = parseTokenAmount(amount, decimals);
			}

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const writableContract = new ethers.Contract(
				toEthAddress(tokenAddress),
				ABIS.XRC20,
				wallet,
			);

			const txOptions: any = {};
			if (options.gasLimit) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}

			const tx = await writableContract.approve(toEthAddress(spenderAddress), amountWei, txOptions);
			const receipt = await tx.wait();

			const symbol = await tokenContract.symbol().catch(() => 'UNKNOWN');

			result = {
				success: true,
				transactionHash: tx.hash,
				owner: toXdcAddress(wallet.address),
				spender: toXdcAddress(spenderAddress),
				tokenAddress: toXdcAddress(tokenAddress),
				tokenSymbol: symbol,
				approvedAmount: options.useMaxApproval ? 'unlimited' : amount,
				approvedAmountRaw: amountWei.toString(),
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'getAllowance': {
			const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
			const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;

			if (!isValidXdcAddress(ownerAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`);
			}
			if (!isValidXdcAddress(spenderAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid spender address: ${spenderAddress}`);
			}

			const [allowance, decimals, symbol] = await Promise.all([
				tokenContract.allowance(toEthAddress(ownerAddress), toEthAddress(spenderAddress)),
				tokenContract.decimals().catch(() => 18),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
			]);

			const isUnlimited = allowance === ethers.MaxUint256;

			result = {
				owner: toXdcAddress(ownerAddress),
				spender: toXdcAddress(spenderAddress),
				tokenAddress: toXdcAddress(tokenAddress),
				tokenSymbol: symbol,
				allowance: isUnlimited ? 'unlimited' : formatTokenAmount(allowance, decimals),
				allowanceRaw: allowance.toString(),
				isUnlimited,
				decimals: Number(decimals),
			};
			break;
		}

		case 'transferFrom': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for transferFrom operations',
				);
			}

			const fromAddress = this.getNodeParameter('fromAddress', index) as string;
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
			};

			if (!isValidXdcAddress(fromAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid from address: ${fromAddress}`);
			}
			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`);
			}

			const decimals = await tokenContract.decimals().catch(() => 18);
			const amountWei = parseTokenAmount(amount, decimals);

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const writableContract = new ethers.Contract(
				toEthAddress(tokenAddress),
				ABIS.XRC20,
				wallet,
			);

			// Check allowance first
			const allowance = await tokenContract.allowance(
				toEthAddress(fromAddress),
				wallet.address,
			);

			if (allowance < amountWei) {
				throw new NodeOperationError(
					this.getNode(),
					`Insufficient allowance. Required: ${amount}, Available: ${formatTokenAmount(allowance, decimals)}`,
				);
			}

			const txOptions: any = {};
			if (options.gasLimit) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}

			const tx = await writableContract.transferFrom(
				toEthAddress(fromAddress),
				toEthAddress(toAddress),
				amountWei,
				txOptions,
			);
			const receipt = await tx.wait();

			const symbol = await tokenContract.symbol().catch(() => 'UNKNOWN');

			result = {
				success: true,
				transactionHash: tx.hash,
				from: toXdcAddress(fromAddress),
				to: toXdcAddress(toAddress),
				spender: toXdcAddress(wallet.address),
				tokenAddress: toXdcAddress(tokenAddress),
				tokenSymbol: symbol,
				amount,
				amountRaw: amountWei.toString(),
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'getTokenHolders': {
			// This requires explorer API
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for getting token holders',
				);
			}

			const page = this.getNodeParameter('page', index, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', index, 100) as number;

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const holders = await explorerApi.getTokenHolders(
				toEthAddress(tokenAddress),
				{ page, offset: pageSize },
			);

			const [decimals, symbol, name] = await Promise.all([
				tokenContract.decimals().catch(() => 18),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
				tokenContract.name().catch(() => 'Unknown'),
			]);

			result = {
				tokenAddress: toXdcAddress(tokenAddress),
				tokenName: name,
				tokenSymbol: symbol,
				page,
				pageSize,
				holders: holders.map((holder: any) => ({
					address: toXdcAddress(holder.address),
					balance: formatTokenAmount(BigInt(holder.value || '0'), decimals),
					balanceRaw: holder.value,
				})),
			};
			break;
		}

		case 'getTokenTransfers': {
			// This requires explorer API
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for getting token transfers',
				);
			}

			const walletAddress = this.getNodeParameter('walletAddress', index) as string;
			const page = this.getNodeParameter('page', index, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', index, 100) as number;

			if (!isValidXdcAddress(walletAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid wallet address: ${walletAddress}`);
			}

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const transfers = await explorerApi.getTokenTransfers(
				toEthAddress(walletAddress),
				{ contractAddress: toEthAddress(tokenAddress), page, offset: pageSize },
			);

			const [decimals, symbol] = await Promise.all([
				tokenContract.decimals().catch(() => 18),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
			]);

			result = {
				address: toXdcAddress(walletAddress),
				tokenAddress: toXdcAddress(tokenAddress),
				tokenSymbol: symbol,
				page,
				pageSize,
				transfers: transfers.map((transfer: any) => ({
					hash: transfer.hash,
					from: toXdcAddress(transfer.from),
					to: toXdcAddress(transfer.to),
					value: formatTokenAmount(BigInt(transfer.value || '0'), Number(transfer.tokenDecimal || decimals)),
					valueRaw: transfer.value,
					blockNumber: transfer.blockNumber,
					timestamp: transfer.timeStamp,
					tokenName: transfer.tokenName,
					tokenSymbol: transfer.tokenSymbol,
				})),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}
