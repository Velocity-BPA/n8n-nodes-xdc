import type { IExecuteFunctions, INodeExecutionData, INodeProperties, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createXdcProvider } from '../../transport/provider';
import { XdcExplorerApi } from '../../transport/explorerApi';
import { fromWei } from '../../utils/unitConverter';
import { toXdcAddress } from '../../utils/addressUtils';

export const blockOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['block'] } },
		options: [
			{ name: 'Get Block', value: 'getBlock', description: 'Get block by number or hash', action: 'Get block' },
			{ name: 'Get Latest Block', value: 'getLatestBlock', description: 'Get latest block', action: 'Get latest block' },
			{ name: 'Get Block Transactions', value: 'getBlockTransactions', description: 'Get transactions in a block', action: 'Get block transactions' },
			{ name: 'Get Block Reward', value: 'getBlockReward', description: 'Get block reward info', action: 'Get block reward' },
			{ name: 'Get Block by Timestamp', value: 'getBlockByTimestamp', description: 'Find block closest to timestamp', action: 'Get block by timestamp' },
		],
		default: 'getLatestBlock',
	},
];

export const blockFields: INodeProperties[] = [
	{
		displayName: 'Block Identifier',
		name: 'blockIdentifier',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['block'], operation: ['getBlock', 'getBlockTransactions', 'getBlockReward'] } },
		description: 'Block number or block hash',
	},
	{
		displayName: 'Timestamp',
		name: 'timestamp',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: { resource: ['block'], operation: ['getBlockByTimestamp'] } },
		description: 'Unix timestamp in seconds',
	},
	{
		displayName: 'Closest',
		name: 'closest',
		type: 'options',
		options: [
			{ name: 'Before', value: 'before' },
			{ name: 'After', value: 'after' },
		],
		default: 'before',
		displayOptions: { show: { resource: ['block'], operation: ['getBlockByTimestamp'] } },
		description: 'Find block before or after timestamp',
	},
	{
		displayName: 'Include Transactions',
		name: 'includeTransactions',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['block'], operation: ['getBlock', 'getLatestBlock'] } },
		description: 'Whether to include full transaction objects',
	},
];

export async function executeBlockOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;
	const credentials = await this.getCredentials('xdcNetwork');

	const provider = createXdcProvider({
		network,
		rpcUrl: credentials.rpcUrl as string,
	});

	switch (operation) {
		case 'getLatestBlock': {
			const includeTransactions = this.getNodeParameter('includeTransactions', index, false) as boolean;
			const block = await provider.getLatestBlock();
			if (!block) {
				throw new NodeOperationError(this.getNode(), 'Could not fetch latest block');
			}
			const result: IDataObject = {
				number: block.number,
				hash: block.hash,
				parentHash: block.parentHash,
				timestamp: block.timestamp,
				timestampDate: new Date(Number(block.timestamp) * 1000).toISOString(),
				gasUsed: block.gasUsed?.toString(),
				gasLimit: block.gasLimit?.toString(),
				baseFeePerGas: block.baseFeePerGas ? fromWei(block.baseFeePerGas, 'gwei') + ' gwei' : null,
				miner: block.miner ? toXdcAddress(block.miner) : null,
				transactionCount: block.transactions?.length || 0,
				epoch: Math.floor(block.number / 900),
			};
			if (includeTransactions && block.transactions) {
				result.transactions = block.transactions.slice(0, 100);
			}
			return [{ json: result }];
		}

		case 'getBlock': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;
			const includeTransactions = this.getNodeParameter('includeTransactions', index, false) as boolean;
			const blockTag = blockIdentifier.startsWith('0x') ? blockIdentifier : parseInt(blockIdentifier);
			const block = await provider.getBlock(blockTag);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockIdentifier}`);
			}
			const result: IDataObject = {
				number: block.number,
				hash: block.hash,
				parentHash: block.parentHash,
				timestamp: block.timestamp,
				timestampDate: new Date(Number(block.timestamp) * 1000).toISOString(),
				gasUsed: block.gasUsed?.toString(),
				gasLimit: block.gasLimit?.toString(),
				miner: block.miner ? toXdcAddress(block.miner) : null,
				transactionCount: block.transactions?.length || 0,
				epoch: Math.floor(block.number / 900),
			};
			if (includeTransactions && block.transactions) {
				result.transactions = block.transactions.slice(0, 100);
			}
			return [{ json: result }];
		}

		case 'getBlockTransactions': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;
			const blockTag = blockIdentifier.startsWith('0x') ? blockIdentifier : parseInt(blockIdentifier);
			const block = await provider.getBlock(blockTag, true);
			if (!block) {
				throw new NodeOperationError(this.getNode(), `Block not found: ${blockIdentifier}`);
			}
			const transactions = (block.transactions || []).map((tx: any) => ({
				hash: tx.hash,
				from: tx.from ? toXdcAddress(tx.from) : null,
				to: tx.to ? toXdcAddress(tx.to) : null,
				value: fromWei(tx.value || 0n, 'xdc'),
				gasPrice: tx.gasPrice ? fromWei(tx.gasPrice, 'gwei') : null,
				nonce: tx.nonce,
			}));
			return [{
				json: {
					blockNumber: block.number,
					blockHash: block.hash,
					transactionCount: transactions.length,
					transactions: transactions.slice(0, 100),
				},
			}];
		}

		case 'getBlockReward': {
			const blockIdentifier = this.getNodeParameter('blockIdentifier', index) as string;
			const blockNum = blockIdentifier.startsWith('0x')
				? parseInt(blockIdentifier, 16)
				: parseInt(blockIdentifier);
			const scanCredentials = await this.getCredentials('xdcScan').catch(() => null);
			if (scanCredentials) {
				const explorer = new XdcExplorerApi({
					chainId: network === 'mainnet' ? 50 : 51,
					apiKey: scanCredentials.apiKey as string,
				});
				const reward = await explorer.getBlockReward(blockNum);
				return [{ json: reward }];
			}
			const baseReward = 0.25;
			return [{
				json: {
					blockNumber: blockNum,
					blockReward: baseReward.toString(),
					note: 'Estimated base reward. XdcScan credentials required for actual reward data.',
				},
			}];
		}

		case 'getBlockByTimestamp': {
			const timestamp = this.getNodeParameter('timestamp', index) as number;
			const closest = this.getNodeParameter('closest', index) as 'before' | 'after';
			const scanCredentials = await this.getCredentials('xdcScan').catch(() => null);
			if (scanCredentials) {
				const explorer = new XdcExplorerApi({
					chainId: network === 'mainnet' ? 50 : 51,
					apiKey: scanCredentials.apiKey as string,
				});
				const result = await explorer.getBlockByTimestamp(timestamp, closest);
				return [{ json: { timestamp, closest, blockNumber: parseInt(result) } }];
			}
			const currentBlock = await provider.getBlockNumber();
			const currentTimestamp = Math.floor(Date.now() / 1000);
			const avgBlockTime = 2;
			const blockDiff = Math.floor((currentTimestamp - timestamp) / avgBlockTime);
			const estimatedBlock = Math.max(1, currentBlock - blockDiff);
			return [{
				json: {
					timestamp,
					closest,
					estimatedBlockNumber: estimatedBlock,
					note: 'Estimated block. XdcScan credentials required for exact block.',
				},
			}];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}
