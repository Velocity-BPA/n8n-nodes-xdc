import type {
	IPollFunctions,
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
} from 'n8n-workflow';
import { createXdcProvider } from './transport/provider';
import { toXdcAddress } from './utils/addressUtils';
import { fromWei } from './utils/unitConverter';

export class XdcTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XDC Network Trigger',
		name: 'xdcTrigger',
		icon: 'file:xdc.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on XDC Network blockchain events',
		defaults: {
			name: 'XDC Network Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'xdcNetwork',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Network',
				name: 'network',
				type: 'options',
				options: [
					{ name: 'XDC Mainnet', value: 'mainnet' },
					{ name: 'Apothem Testnet', value: 'apothem' },
				],
				default: 'mainnet',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{ name: 'New Block', value: 'newBlock', description: 'Trigger on new blocks' },
					{ name: 'New Transaction', value: 'newTransaction', description: 'Trigger on new transactions to/from address' },
					{ name: 'Token Transfer', value: 'tokenTransfer', description: 'Trigger on XRC-20 token transfers' },
					{ name: 'New Epoch', value: 'newEpoch', description: 'Trigger on new XDPoS epoch (every 900 blocks)' },
				],
				default: 'newBlock',
			},
			{
				displayName: 'Watch Address',
				name: 'watchAddress',
				type: 'string',
				default: '',
				displayOptions: {
					show: { event: ['newTransaction', 'tokenTransfer'] },
				},
				description: 'Address to watch for transactions',
			},
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				displayOptions: {
					show: { event: ['tokenTransfer'] },
				},
				description: 'XRC-20 token contract address (optional)',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const network = this.getNodeParameter('network') as string;
		const credentials = await this.getCredentials('xdcNetwork');

		const provider = createXdcProvider({
			network,
			rpcUrl: credentials.rpcUrl as string,
		});

		const workflowStaticData = this.getWorkflowStaticData('node');
		const lastProcessedBlock = (workflowStaticData.lastProcessedBlock as number) || 0;

		const currentBlock = await provider.getBlockNumber();

		if (currentBlock <= lastProcessedBlock) {
			return null;
		}

		const results: INodeExecutionData[] = [];

		switch (event) {
			case 'newBlock': {
				const fromBlock = lastProcessedBlock > 0 ? lastProcessedBlock + 1 : currentBlock;
				for (let blockNum = fromBlock; blockNum <= currentBlock && results.length < 10; blockNum++) {
					const block = await provider.getBlock(blockNum);
					if (block) {
						results.push({
							json: {
								blockNumber: block.number,
								blockHash: block.hash,
								timestamp: block.timestamp,
								timestampDate: new Date(Number(block.timestamp) * 1000).toISOString(),
								miner: block.miner ? toXdcAddress(block.miner) : null,
								transactionCount: block.transactions?.length || 0,
								gasUsed: block.gasUsed?.toString(),
								epoch: Math.floor(block.number / 900),
							},
						});
					}
				}
				break;
			}

			case 'newEpoch': {
				const currentEpoch = Math.floor(currentBlock / 900);
				const lastEpoch = Math.floor(lastProcessedBlock / 900);
				if (currentEpoch > lastEpoch) {
					const epochStartBlock = currentEpoch * 900;
					const block = await provider.getBlock(epochStartBlock);
					results.push({
						json: {
							epoch: currentEpoch,
							startBlock: epochStartBlock,
							endBlock: epochStartBlock + 899,
							timestamp: block?.timestamp,
							timestampDate: block ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
						},
					});
				}
				break;
			}

			case 'newTransaction': {
				const watchAddress = this.getNodeParameter('watchAddress') as string;
				if (!watchAddress) break;
				const normalizedWatch = watchAddress.toLowerCase().replace('xdc', '0x');
				const fromBlock = lastProcessedBlock > 0 ? lastProcessedBlock + 1 : currentBlock - 10;
				for (let blockNum = fromBlock; blockNum <= currentBlock && results.length < 50; blockNum++) {
					const block = await provider.getBlock(blockNum, true);
					if (block && block.transactions) {
						for (const tx of block.transactions as any[]) {
							const txFrom = tx.from?.toLowerCase();
							const txTo = tx.to?.toLowerCase();
							if (txFrom === normalizedWatch || txTo === normalizedWatch) {
								results.push({
									json: {
										hash: tx.hash,
										from: tx.from ? toXdcAddress(tx.from) : null,
										to: tx.to ? toXdcAddress(tx.to) : null,
										value: fromWei(tx.value || 0n, 'xdc'),
										blockNumber: blockNum,
										direction: txFrom === normalizedWatch ? 'outgoing' : 'incoming',
									},
								});
							}
						}
					}
				}
				break;
			}

			case 'tokenTransfer': {
				const watchAddress = this.getNodeParameter('watchAddress') as string;
				const tokenAddress = this.getNodeParameter('tokenAddress', '') as string;
				if (!watchAddress) break;
				const normalizedWatch = watchAddress.toLowerCase().replace('xdc', '0x');
				const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
				const fromBlock = lastProcessedBlock > 0 ? lastProcessedBlock + 1 : currentBlock - 100;
				const filter: any = {
					fromBlock,
					toBlock: currentBlock,
					topics: [transferTopic],
				};
				if (tokenAddress) {
					filter.address = tokenAddress.toLowerCase().replace('xdc', '0x');
				}
				const logs = await provider.getLogs(filter);
				for (const log of logs) {
					if (log.topics && log.topics.length >= 3) {
						const from = '0x' + log.topics[1].slice(26);
						const to = '0x' + log.topics[2].slice(26);
						if (from.toLowerCase() === normalizedWatch || to.toLowerCase() === normalizedWatch) {
							results.push({
								json: {
									tokenAddress: toXdcAddress(log.address),
									from: toXdcAddress(from),
									to: toXdcAddress(to),
									value: log.data !== '0x' ? BigInt(log.data).toString() : '0',
									blockNumber: log.blockNumber,
									transactionHash: log.transactionHash,
									direction: from.toLowerCase() === normalizedWatch ? 'outgoing' : 'incoming',
								},
							});
						}
					}
					if (results.length >= 50) break;
				}
				break;
			}
		}

		workflowStaticData.lastProcessedBlock = currentBlock;

		if (results.length === 0) {
			return null;
		}

		return [results];
	}
}
