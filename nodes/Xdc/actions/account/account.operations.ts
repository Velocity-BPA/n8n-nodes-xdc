import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createXdcProvider } from '../../transport/provider';
import { XdcExplorerApi } from '../../transport/explorerApi';
import { ABIS } from '../../constants';
import { toXdcAddress, toEthAddress, isValidXdcAddress, normalizeAddress } from '../../utils/addressUtils';
import { fromWei, formatTokenAmount } from '../../utils/unitConverter';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{ name: 'Get XDC Balance', value: 'getBalance', description: 'Get native XDC balance', action: 'Get XDC balance' },
			{ name: 'Get Token Balance', value: 'getTokenBalance', description: 'Get XRC-20 token balance', action: 'Get token balance' },
			{ name: 'Get All Token Balances', value: 'getAllTokenBalances', description: 'Get all token balances', action: 'Get all token balances' },
			{ name: 'Get Transaction History', value: 'getTransactionHistory', description: 'Get transaction history', action: 'Get transaction history' },
			{ name: 'Get Token Transfers', value: 'getTokenTransfers', description: 'Get token transfer history', action: 'Get token transfers' },
			{ name: 'Get Transaction Count', value: 'getTransactionCount', description: 'Get nonce', action: 'Get transaction count' },
			{ name: 'Validate Address', value: 'validateAddress', description: 'Validate address format', action: 'Validate address' },
			{ name: 'Convert Address', value: 'convertAddress', description: 'Convert xdc/0x format', action: 'Convert address' },
		],
		default: 'getBalance',
	},
];

export const accountFields: INodeProperties[] = [
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'xdc... or 0x...',
		displayOptions: { show: { resource: ['account'], operation: ['getBalance', 'getTokenBalance', 'getAllTokenBalances', 'getTransactionHistory', 'getTokenTransfers', 'getTransactionCount', 'validateAddress', 'convertAddress'] } },
		description: 'XDC address to query',
	},
	{
		displayName: 'Token Contract Address',
		name: 'tokenAddress',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['account'], operation: ['getTokenBalance'] } },
		description: 'XRC-20 token contract address',
	},
	{
		displayName: 'Target Format',
		name: 'targetFormat',
		type: 'options',
		options: [
			{ name: 'XDC (xdc...)', value: 'xdc' },
			{ name: 'Ethereum (0x...)', value: '0x' },
		],
		default: 'xdc',
		displayOptions: { show: { resource: ['account'], operation: ['convertAddress'] } },
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		displayOptions: { show: { resource: ['account'], operation: ['getTransactionHistory', 'getTokenTransfers'] } },
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 50,
		displayOptions: { show: { resource: ['account'], operation: ['getTransactionHistory', 'getTokenTransfers'] } },
	},
];

export async function executeAccountOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const credentials = await this.getCredentials('xdcNetwork');

	const provider = createXdcProvider({
		network,
		rpcUrl: credentials.rpcUrl as string,
		privateKey: credentials.privateKey as string,
	});

	switch (operation) {
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid XDC address: ${address}`);
			}
			const balance = await provider.getBalance(toEthAddress(address));
			const xdcBalance = fromWei(balance, 'xdc');
			return [{
				json: {
					address: toXdcAddress(address),
					balanceWei: balance.toString(),
					balanceXdc: xdcBalance,
					formattedBalance: `${parseFloat(xdcBalance).toLocaleString()} XDC`,
				},
			}];
		}

		case 'getTokenBalance': {
			const address = this.getNodeParameter('address', index) as string;
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			if (!isValidXdcAddress(address) || !isValidXdcAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid address format');
			}
			const tokenContract = provider.getContract(toEthAddress(tokenAddress), ABIS.XRC20);
			const [balance, name, symbol, decimals] = await Promise.all([
				tokenContract.balanceOf(toEthAddress(address)),
				tokenContract.name().catch(() => 'Unknown'),
				tokenContract.symbol().catch(() => '???'),
				tokenContract.decimals().catch(() => 18),
			]);
			const formattedBalance = formatTokenAmount(balance, Number(decimals));
			return [{
				json: {
					address: toXdcAddress(address),
					tokenAddress: toXdcAddress(tokenAddress),
					tokenName: name,
					tokenSymbol: symbol,
					tokenDecimals: Number(decimals),
					balanceRaw: balance.toString(),
					balance: formattedBalance,
				},
			}];
		}

		case 'getAllTokenBalances': {
			const address = this.getNodeParameter('address', index) as string;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid XDC address: ${address}`);
			}
			const scanCredentials = await this.getCredentials('xdcScan').catch(() => null);
			if (!scanCredentials) {
				return [{ json: { address: toXdcAddress(address), tokens: [], note: 'XdcScan credentials required for token discovery' } }];
			}
			const explorer = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: scanCredentials.apiKey as string,
			});
			const transfers = await explorer.getTokenTransfers(toEthAddress(address), { page: 1, offset: 1000 });
			const tokenAddresses = [...new Set(transfers.map(t => t.contractAddress))];
			const balances = await Promise.all(
				tokenAddresses.slice(0, 20).map(async (tokenAddr) => {
					try {
						const tokenContract = provider.getContract(tokenAddr, ABIS.XRC20);
						const [balance, name, symbol, decimals] = await Promise.all([
							tokenContract.balanceOf(toEthAddress(address)),
							tokenContract.name().catch(() => 'Unknown'),
							tokenContract.symbol().catch(() => '???'),
							tokenContract.decimals().catch(() => 18),
						]);
						if (balance > 0n) {
							return {
								tokenAddress: toXdcAddress(tokenAddr),
								name,
								symbol,
								decimals: Number(decimals),
								balance: formatTokenAmount(balance, Number(decimals)),
							};
						}
						return null;
					} catch {
						return null;
					}
				}),
			);
			return [{
				json: {
					address: toXdcAddress(address),
					tokenCount: balances.filter(b => b !== null).length,
					tokens: balances.filter(b => b !== null),
				},
			}];
		}

		case 'getTransactionHistory': {
			const address = this.getNodeParameter('address', index) as string;
			const page = this.getNodeParameter('page', index, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', index, 50) as number;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid XDC address: ${address}`);
			}
			const scanCredentials = await this.getCredentials('xdcScan').catch(() => null);
			if (!scanCredentials) {
				return [{ json: { address: toXdcAddress(address), transactions: [], note: 'XdcScan credentials required' } }];
			}
			const explorer = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: scanCredentials.apiKey as string,
			});
			const transactions = await explorer.getTransactions(toEthAddress(address), { page, offset: pageSize });
			return [{
				json: {
					address: toXdcAddress(address),
					page,
					pageSize,
					transactionCount: transactions.length,
					transactions: transactions.map(tx => ({
						hash: tx.hash,
						from: toXdcAddress(tx.from),
						to: tx.to ? toXdcAddress(tx.to) : null,
						value: fromWei(BigInt(tx.value || '0'), 'xdc'),
						blockNumber: tx.blockNumber,
						timestamp: tx.timeStamp,
						isError: tx.isError === '1',
					})),
				},
			}];
		}

		case 'getTokenTransfers': {
			const address = this.getNodeParameter('address', index) as string;
			const page = this.getNodeParameter('page', index, 1) as number;
			const pageSize = this.getNodeParameter('pageSize', index, 50) as number;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid XDC address: ${address}`);
			}
			const scanCredentials = await this.getCredentials('xdcScan').catch(() => null);
			if (!scanCredentials) {
				return [{ json: { address: toXdcAddress(address), transfers: [], note: 'XdcScan credentials required' } }];
			}
			const explorer = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: scanCredentials.apiKey as string,
			});
			const transfers = await explorer.getTokenTransfers(toEthAddress(address), { page, offset: pageSize });
			return [{
				json: {
					address: toXdcAddress(address),
					page,
					pageSize,
					transferCount: transfers.length,
					transfers: transfers.map(t => ({
						hash: t.hash,
						from: toXdcAddress(t.from),
						to: toXdcAddress(t.to),
						tokenAddress: toXdcAddress(t.contractAddress),
						tokenName: t.tokenName,
						tokenSymbol: t.tokenSymbol,
						value: formatTokenAmount(BigInt(t.value || '0'), Number(t.tokenDecimal || 18)),
						blockNumber: t.blockNumber,
					})),
				},
			}];
		}

		case 'getTransactionCount': {
			const address = this.getNodeParameter('address', index) as string;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid XDC address: ${address}`);
			}
			const count = await provider.getTransactionCount(toEthAddress(address));
			return [{
				json: {
					address: toXdcAddress(address),
					transactionCount: count,
					nonce: count,
				},
			}];
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const isValid = isValidXdcAddress(address);
			let isContract = false;
			if (isValid) {
				try {
					const code = await provider.getCode(toEthAddress(address));
					isContract = code !== '0x' && code.length > 2;
				} catch {
					isContract = false;
				}
			}
			return [{
				json: {
					address,
					isValid,
					normalized: isValid ? normalizeAddress(address) : null,
					xdcFormat: isValid ? toXdcAddress(address) : null,
					ethFormat: isValid ? toEthAddress(address) : null,
					isContract,
					type: isContract ? 'contract' : 'wallet',
				},
			}];
		}

		case 'convertAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const targetFormat = this.getNodeParameter('targetFormat', index) as string;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), `Invalid XDC address: ${address}`);
			}
			const converted = targetFormat === 'xdc' ? toXdcAddress(address) : toEthAddress(address);
			return [{
				json: {
					original: address,
					converted,
					targetFormat,
				},
			}];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}
