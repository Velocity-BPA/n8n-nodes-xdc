import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { accountOperations, accountFields, executeAccountOperation } from './actions/account/account.operations';
import { transactionOperations, transactionFields, executeTransactionOperation } from './actions/transaction/transaction.operations';
import { tokenOperations, tokenFields, executeTokenOperation } from './actions/token/token.operations';
import { nftOperations, nftFields, executeNftOperation } from './actions/nft/nft.operations';
import { contractOperations, contractFields, executeContractOperation } from './actions/contract/contract.operations';
import { tradeFinanceOperations, tradeFinanceFields, executeTradeFinanceOperation } from './actions/tradeFinance/tradeFinance.operations';
import { masternodeOperations, masternodeFields, executeMasternodeOperation } from './actions/masternode/masternode.operations';
import { defiOperations, defiFields, executeDefiOperation } from './actions/defi/defi.operations';
import { blockOperations, blockFields, executeBlockOperation } from './actions/block/block.operations';
import { utilityOperations, utilityFields, executeUtilityOperation } from './actions/utility/utility.operations';

export class Xdc implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XDC Network',
		name: 'xdc',
		icon: 'file:xdc.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with XDC Network blockchain - Enterprise-grade hybrid blockchain for trade finance, DeFi, and more',
		defaults: {
			name: 'XDC Network',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'xdcNetwork',
				required: true,
			},
			{
				name: 'xdcScan',
				required: false,
			},
		],
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
				description: 'XDC Network to connect to',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account', description: 'Account balance and transaction history' },
					{ name: 'Transaction', value: 'transaction', description: 'Send and query transactions' },
					{ name: 'XRC-20 Token', value: 'token', description: 'Token operations and transfers' },
					{ name: 'XRC-721 NFT', value: 'nft', description: 'NFT metadata and transfers' },
					{ name: 'Smart Contract', value: 'contract', description: 'Contract interactions and deployment' },
					{ name: 'Trade Finance', value: 'tradeFinance', description: 'Trade document verification and LC management' },
					{ name: 'Masternode', value: 'masternode', description: 'XDPoS masternode operations and staking' },
					{ name: 'DeFi', value: 'defi', description: 'DEX swaps, liquidity, and prices' },
					{ name: 'Block', value: 'block', description: 'Block data and rewards' },
					{ name: 'Utility', value: 'utility', description: 'Address conversion, hashing, and signing' },
				],
				default: 'account',
			},
			...accountOperations,
			...accountFields,
			...transactionOperations,
			...transactionFields,
			...tokenOperations,
			...tokenFields,
			...nftOperations,
			...nftFields,
			...contractOperations,
			...contractFields,
			...tradeFinanceOperations,
			...tradeFinanceFields,
			...masternodeOperations,
			...masternodeFields,
			...defiOperations,
			...defiFields,
			...blockOperations,
			...blockFields,
			...utilityOperations,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let result: INodeExecutionData[];

				switch (resource) {
					case 'account':
						result = await executeAccountOperation.call(this, i);
						break;
					case 'transaction':
						result = await executeTransactionOperation.call(this, i);
						break;
					case 'token':
						result = await executeTokenOperation.call(this, i);
						break;
					case 'nft':
						result = await executeNftOperation.call(this, i);
						break;
					case 'contract':
						result = await executeContractOperation.call(this, i);
						break;
					case 'tradeFinance':
						result = await executeTradeFinanceOperation.call(this, i);
						break;
					case 'masternode':
						result = await executeMasternodeOperation.call(this, i);
						break;
					case 'defi':
						result = await executeDefiOperation.call(this, i);
						break;
					case 'block':
						result = await executeBlockOperation.call(this, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
