/**
 * XDC Network - Transaction Resource Operations
 * 
 * Handles all transaction-related operations including sending XDC,
 * retrieving transaction details, gas estimation, and transaction management.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createXdcProvider } from '../../transport/provider';
import { toEthAddress, toXdcAddress, isValidXdcAddress } from '../../utils/addressUtils';
import { fromWei, toWei, XdcUnit, formatGasPrice } from '../../utils/unitConverter';

// Transaction resource operations definition
export const transactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{
				name: 'Broadcast Transaction',
				value: 'broadcastTransaction',
				description: 'Broadcast a signed raw transaction to the network',
				action: 'Broadcast a signed transaction',
			},
			{
				name: 'Build Raw Transaction',
				value: 'buildRawTransaction',
				description: 'Build a raw transaction object without signing',
				action: 'Build a raw transaction',
			},
			{
				name: 'Cancel Transaction',
				value: 'cancelTransaction',
				description: 'Cancel a pending transaction by sending a 0-value transaction with same nonce',
				action: 'Cancel a pending transaction',
			},
			{
				name: 'Decode Transaction Input',
				value: 'decodeTransactionInput',
				description: 'Decode the input data of a transaction using ABI',
				action: 'Decode transaction input data',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas required for a transaction',
				action: 'Estimate gas for a transaction',
			},
			{
				name: 'Get Gas Price',
				value: 'getGasPrice',
				description: 'Get current network gas price',
				action: 'Get current gas price',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction by hash',
			},
			{
				name: 'Get Transaction Receipt',
				value: 'getTransactionReceipt',
				description: 'Get transaction receipt with execution details',
				action: 'Get transaction receipt',
			},
			{
				name: 'Get Transaction Status',
				value: 'getTransactionStatus',
				description: 'Get the status of a transaction (pending, confirmed, failed)',
				action: 'Get transaction status',
			},
			{
				name: 'Send XDC',
				value: 'sendXdc',
				description: 'Send native XDC tokens to an address',
				action: 'Send XDC to an address',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a transaction without broadcasting',
				action: 'Sign a transaction',
			},
			{
				name: 'Speed Up Transaction',
				value: 'speedUpTransaction',
				description: 'Speed up a pending transaction by increasing gas price',
				action: 'Speed up a pending transaction',
			},
			{
				name: 'Wait for Confirmation',
				value: 'waitForConfirmation',
				description: 'Wait for a transaction to be confirmed',
				action: 'Wait for transaction confirmation',
			},
		],
		default: 'getTransaction',
	},
];

// Transaction resource fields
export const transactionFields: INodeProperties[] = [
	// Send XDC fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The recipient address (supports xdc or 0x format)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendXdc', 'buildRawTransaction', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1.5',
		description: 'Amount of XDC to send',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendXdc', 'buildRawTransaction', 'estimateGas'],
			},
		},
	},

	// Transaction hash field for lookups
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The transaction hash to look up',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: [
					'getTransaction',
					'getTransactionReceipt',
					'getTransactionStatus',
					'waitForConfirmation',
					'speedUpTransaction',
					'cancelTransaction',
					'decodeTransactionInput',
				],
			},
		},
	},

	// Speed up transaction fields
	{
		displayName: 'Gas Price Multiplier',
		name: 'gasPriceMultiplier',
		type: 'number',
		required: true,
		default: 1.2,
		description: 'Multiplier for the new gas price (e.g., 1.2 = 20% increase)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['speedUpTransaction'],
			},
		},
	},

	// Wait for confirmation fields
	{
		displayName: 'Confirmations',
		name: 'confirmations',
		type: 'number',
		default: 1,
		description: 'Number of confirmations to wait for',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForConfirmation'],
			},
		},
	},
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeout',
		type: 'number',
		default: 60,
		description: 'Maximum time to wait for confirmation in seconds',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForConfirmation'],
			},
		},
	},

	// Decode transaction input fields
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		default: '[]',
		description: 'Contract ABI (JSON array) for decoding the input data',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['decodeTransactionInput'],
			},
		},
	},

	// Build/Sign transaction fields
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Optional transaction data (hex encoded)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildRawTransaction', 'signTransaction', 'estimateGas'],
			},
		},
	},

	// Sign transaction fields
	{
		displayName: 'Transaction Object',
		name: 'transactionObject',
		type: 'json',
		required: true,
		default: '{}',
		description: 'The transaction object to sign (JSON)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['signTransaction'],
			},
		},
	},

	// Broadcast transaction fields
	{
		displayName: 'Signed Transaction',
		name: 'signedTransaction',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The signed raw transaction hex string',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['broadcastTransaction'],
			},
		},
	},

	// Additional options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendXdc', 'buildRawTransaction', 'signTransaction'],
			},
		},
		options: [
			{
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 21000,
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
				displayName: 'Max Fee Per Gas (Gwei)',
				name: 'maxFeePerGas',
				type: 'string',
				default: '',
				description: 'Maximum fee per gas for EIP-1559 transactions',
			},
			{
				displayName: 'Max Priority Fee (Gwei)',
				name: 'maxPriorityFeePerGas',
				type: 'string',
				default: '',
				description: 'Maximum priority fee per gas for EIP-1559 transactions',
			},
			{
				displayName: 'Nonce',
				name: 'nonce',
				type: 'number',
				default: -1,
				description: 'Transaction nonce (-1 for automatic)',
			},
		],
	},
];

/**
 * Execute transaction operations
 */
export async function executeTransactionOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('xdcNetwork');

	const network = credentials.network as string;
	const rpcUrl = credentials.rpcUrl as string | undefined;
	const privateKey = credentials.privateKey as string | undefined;

	const provider = createXdcProvider({ network, rpcUrl, privateKey });

	let result: any;

	switch (operation) {
		case 'sendXdc': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for sending transactions',
				);
			}

			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
				maxFeePerGas?: string;
				maxPriorityFeePerGas?: string;
				nonce?: number;
			};

			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${toAddress}`);
			}

			const to = toEthAddress(toAddress);
			const value = toWei(amount, XdcUnit.XDC);

			// Build transaction
			const txRequest: ethers.TransactionRequest = {
				to,
				value,
			};

			if (options.gasLimit) {
				txRequest.gasLimit = options.gasLimit;
			}

			if (options.gasPrice) {
				txRequest.gasPrice = toWei(options.gasPrice, XdcUnit.GWEI);
			}

			if (options.maxFeePerGas) {
				txRequest.maxFeePerGas = toWei(options.maxFeePerGas, XdcUnit.GWEI);
			}

			if (options.maxPriorityFeePerGas) {
				txRequest.maxPriorityFeePerGas = toWei(options.maxPriorityFeePerGas, XdcUnit.GWEI);
			}

			if (options.nonce !== undefined && options.nonce >= 0) {
				txRequest.nonce = options.nonce;
			}

			// Send transaction
			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const tx = await wallet.sendTransaction(txRequest);
			const receipt = await tx.wait();

			result = {
				success: true,
				transactionHash: tx.hash,
				from: toXdcAddress(tx.from),
				to: toXdcAddress(to),
				value: amount,
				valueWei: value.toString(),
				gasUsed: receipt?.gasUsed.toString(),
				effectiveGasPrice: receipt?.gasPrice?.toString(),
				blockNumber: receipt?.blockNumber,
				blockHash: receipt?.blockHash,
				status: receipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'getTransaction': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			const tx = await provider.getTransaction(transactionHash);

			if (!tx) {
				throw new NodeOperationError(
					this.getNode(),
					`Transaction not found: ${transactionHash}`,
				);
			}

			result = {
				hash: tx.hash,
				from: toXdcAddress(tx.from),
				to: tx.to ? toXdcAddress(tx.to) : null,
				value: fromWei(tx.value, XdcUnit.XDC),
				valueWei: tx.value.toString(),
				nonce: tx.nonce,
				gasLimit: tx.gasLimit.toString(),
				gasPrice: tx.gasPrice?.toString(),
				maxFeePerGas: tx.maxFeePerGas?.toString(),
				maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
				data: tx.data,
				chainId: tx.chainId?.toString(),
				blockNumber: tx.blockNumber,
				blockHash: tx.blockHash,
				transactionIndex: tx.index,
				type: tx.type,
				accessList: tx.accessList,
			};
			break;
		}

		case 'getTransactionReceipt': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			const receipt = await provider.getTransactionReceipt(transactionHash);

			if (!receipt) {
				throw new NodeOperationError(
					this.getNode(),
					`Transaction receipt not found: ${transactionHash}`,
				);
			}

			result = {
				transactionHash: receipt.hash,
				from: toXdcAddress(receipt.from),
				to: receipt.to ? toXdcAddress(receipt.to) : null,
				contractAddress: receipt.contractAddress
					? toXdcAddress(receipt.contractAddress)
					: null,
				blockNumber: receipt.blockNumber,
				blockHash: receipt.blockHash,
				transactionIndex: receipt.index,
				status: receipt.status === 1 ? 'success' : 'failed',
				gasUsed: receipt.gasUsed.toString(),
				cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
				effectiveGasPrice: receipt.gasPrice?.toString(),
				logsBloom: receipt.logsBloom,
				logs: receipt.logs.map((log) => ({
					address: toXdcAddress(log.address),
					topics: log.topics,
					data: log.data,
					blockNumber: log.blockNumber,
					transactionIndex: log.transactionIndex,
					logIndex: log.index,
				})),
				type: receipt.type,
			};
			break;
		}

		case 'getTransactionStatus': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			const tx = await provider.getTransaction(transactionHash);
			const receipt = await provider.getTransactionReceipt(transactionHash);

			let status: string;
			let confirmations = 0;

			if (!tx) {
				status = 'not_found';
			} else if (!receipt) {
				status = 'pending';
			} else {
				const currentBlock = await provider.getBlockNumber();
				confirmations = currentBlock - receipt.blockNumber;
				status = receipt.status === 1 ? 'success' : 'failed';
			}

			result = {
				transactionHash,
				status,
				confirmations,
				blockNumber: receipt?.blockNumber ?? null,
				gasUsed: receipt?.gasUsed.toString() ?? null,
			};
			break;
		}

		case 'estimateGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;

			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${toAddress}`);
			}

			const txRequest: ethers.TransactionRequest = {
				to: toEthAddress(toAddress),
				value: toWei(amount, XdcUnit.XDC),
			};

			if (data) {
				txRequest.data = data;
			}

			const gasEstimate = await provider.estimateGas(txRequest);
			const gasPrice = await provider.getGasPrice();

			result = {
				gasEstimate: gasEstimate.toString(),
				gasPrice: gasPrice.toString(),
				gasPriceGwei: fromWei(gasPrice, XdcUnit.GWEI),
				estimatedCost: fromWei(gasEstimate * gasPrice, XdcUnit.XDC),
				estimatedCostWei: (gasEstimate * gasPrice).toString(),
			};
			break;
		}

		case 'getGasPrice': {
			const gasPrice = await provider.getGasPrice();
			const feeData = await provider.getProvider().getFeeData();

			result = {
				gasPrice: gasPrice.toString(),
				gasPriceGwei: fromWei(gasPrice, XdcUnit.GWEI),
				gasPriceFormatted: formatGasPrice(gasPrice),
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxFeePerGasGwei: feeData.maxFeePerGas
					? fromWei(feeData.maxFeePerGas, XdcUnit.GWEI)
					: null,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
					? fromWei(feeData.maxPriorityFeePerGas, XdcUnit.GWEI)
					: null,
			};
			break;
		}

		case 'speedUpTransaction': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for speeding up transactions',
				);
			}

			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const gasPriceMultiplier = this.getNodeParameter('gasPriceMultiplier', index) as number;

			const originalTx = await provider.getTransaction(transactionHash);

			if (!originalTx) {
				throw new NodeOperationError(
					this.getNode(),
					`Original transaction not found: ${transactionHash}`,
				);
			}

			const receipt = await provider.getTransactionReceipt(transactionHash);
			if (receipt) {
				throw new NodeOperationError(
					this.getNode(),
					'Transaction is already confirmed and cannot be sped up',
				);
			}

			// Calculate new gas price
			const originalGasPrice = originalTx.gasPrice ?? BigInt(0);
			const newGasPrice = BigInt(Math.floor(Number(originalGasPrice) * gasPriceMultiplier));

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());

			const txRequest: ethers.TransactionRequest = {
				to: originalTx.to,
				value: originalTx.value,
				data: originalTx.data,
				nonce: originalTx.nonce,
				gasLimit: originalTx.gasLimit,
				gasPrice: newGasPrice,
			};

			const tx = await wallet.sendTransaction(txRequest);
			const newReceipt = await tx.wait();

			result = {
				success: true,
				originalTransactionHash: transactionHash,
				newTransactionHash: tx.hash,
				originalGasPrice: originalGasPrice.toString(),
				newGasPrice: newGasPrice.toString(),
				gasPriceIncrease: `${((gasPriceMultiplier - 1) * 100).toFixed(1)}%`,
				blockNumber: newReceipt?.blockNumber,
				status: newReceipt?.status === 1 ? 'success' : 'failed',
			};
			break;
		}

		case 'cancelTransaction': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for canceling transactions',
				);
			}

			const transactionHash = this.getNodeParameter('transactionHash', index) as string;

			const originalTx = await provider.getTransaction(transactionHash);

			if (!originalTx) {
				throw new NodeOperationError(
					this.getNode(),
					`Original transaction not found: ${transactionHash}`,
				);
			}

			const receipt = await provider.getTransactionReceipt(transactionHash);
			if (receipt) {
				throw new NodeOperationError(
					this.getNode(),
					'Transaction is already confirmed and cannot be canceled',
				);
			}

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());

			// Send 0-value transaction to self with same nonce but higher gas price
			const originalGasPrice = originalTx.gasPrice ?? BigInt(0);
			const newGasPrice = BigInt(Math.floor(Number(originalGasPrice) * 1.5));

			const txRequest: ethers.TransactionRequest = {
				to: wallet.address,
				value: 0,
				nonce: originalTx.nonce,
				gasLimit: 21000,
				gasPrice: newGasPrice,
			};

			const tx = await wallet.sendTransaction(txRequest);
			const cancelReceipt = await tx.wait();

			result = {
				success: true,
				originalTransactionHash: transactionHash,
				cancelTransactionHash: tx.hash,
				nonce: originalTx.nonce,
				blockNumber: cancelReceipt?.blockNumber,
				status: cancelReceipt?.status === 1 ? 'cancelled' : 'failed',
			};
			break;
		}

		case 'waitForConfirmation': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const confirmations = this.getNodeParameter('confirmations', index, 1) as number;
			const timeout = this.getNodeParameter('timeout', index, 60) as number;

			const receipt = await provider.waitForTransaction(transactionHash, confirmations, timeout * 1000);

			if (!receipt) {
				throw new NodeOperationError(
					this.getNode(),
					`Transaction confirmation timed out after ${timeout} seconds`,
				);
			}

			const currentBlock = await provider.getBlockNumber();

			result = {
				transactionHash: receipt.hash,
				confirmed: true,
				confirmations: currentBlock - receipt.blockNumber,
				blockNumber: receipt.blockNumber,
				blockHash: receipt.blockHash,
				status: receipt.status === 1 ? 'success' : 'failed',
				gasUsed: receipt.gasUsed.toString(),
			};
			break;
		}

		case 'decodeTransactionInput': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			const abiInput = this.getNodeParameter('abi', index) as string;

			const tx = await provider.getTransaction(transactionHash);

			if (!tx) {
				throw new NodeOperationError(
					this.getNode(),
					`Transaction not found: ${transactionHash}`,
				);
			}

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			const iface = new ethers.Interface(abi);

			try {
				const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });

				result = {
					transactionHash,
					functionName: decoded?.name,
					functionSignature: decoded?.signature,
					selector: decoded?.selector,
					args: decoded?.args.map((arg, i) => ({
						index: i,
						name: decoded.fragment.inputs[i]?.name || `arg${i}`,
						type: decoded.fragment.inputs[i]?.type,
						value: typeof arg === 'bigint' ? arg.toString() : arg,
					})),
					value: fromWei(tx.value, XdcUnit.XDC),
				};
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Could not decode transaction input. Make sure the ABI is correct. Error: ${error}`,
				);
			}
			break;
		}

		case 'buildRawTransaction': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const data = this.getNodeParameter('data', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
				maxFeePerGas?: string;
				maxPriorityFeePerGas?: string;
				nonce?: number;
			};

			if (!isValidXdcAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid address: ${toAddress}`);
			}

			const chainId = await provider.getProvider().getNetwork().then(n => n.chainId);

			const txRequest: ethers.TransactionLike = {
				to: toEthAddress(toAddress),
				value: toWei(amount, XdcUnit.XDC),
				chainId: Number(chainId),
				type: 0,
			};

			if (data) {
				txRequest.data = data;
			}

			if (options.gasLimit) {
				txRequest.gasLimit = options.gasLimit;
			} else {
				const estimated = await provider.estimateGas({
					to: txRequest.to as string,
					value: txRequest.value,
					data: txRequest.data,
				});
				txRequest.gasLimit = estimated;
			}

			if (options.gasPrice) {
				txRequest.gasPrice = toWei(options.gasPrice, XdcUnit.GWEI);
			} else {
				const gasPrice = await provider.getGasPrice();
				txRequest.gasPrice = gasPrice;
			}

			if (options.nonce !== undefined && options.nonce >= 0) {
				txRequest.nonce = options.nonce;
			}

			result = {
				transaction: {
					to: toXdcAddress(txRequest.to as string),
					value: amount,
					valueWei: txRequest.value?.toString(),
					data: txRequest.data || '0x',
					gasLimit: txRequest.gasLimit?.toString(),
					gasPrice: txRequest.gasPrice?.toString(),
					gasPriceGwei: txRequest.gasPrice
						? fromWei(txRequest.gasPrice as bigint, XdcUnit.GWEI)
						: null,
					nonce: txRequest.nonce,
					chainId: txRequest.chainId,
					type: txRequest.type,
				},
				estimatedCost: txRequest.gasLimit && txRequest.gasPrice
					? fromWei(
							BigInt(txRequest.gasLimit.toString()) * BigInt(txRequest.gasPrice.toString()),
							XdcUnit.XDC,
					  )
					: null,
			};
			break;
		}

		case 'signTransaction': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for signing transactions',
				);
			}

			const transactionObject = this.getNodeParameter('transactionObject', index) as string;

			let txRequest: ethers.TransactionRequest;
			try {
				txRequest = JSON.parse(transactionObject);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid transaction object JSON');
			}

			// Convert addresses to 0x format if needed
			if (txRequest.to && typeof txRequest.to === 'string') {
				txRequest.to = toEthAddress(txRequest.to);
			}

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());

			// Populate transaction with defaults
			const populatedTx = await wallet.populateTransaction(txRequest);
			const signedTx = await wallet.signTransaction(populatedTx);

			result = {
				signedTransaction: signedTx,
				from: toXdcAddress(wallet.address),
				transactionDetails: {
					to: populatedTx.to ? toXdcAddress(populatedTx.to) : null,
					value: populatedTx.value?.toString(),
					gasLimit: populatedTx.gasLimit?.toString(),
					gasPrice: populatedTx.gasPrice?.toString(),
					nonce: populatedTx.nonce,
					chainId: populatedTx.chainId?.toString(),
				},
			};
			break;
		}

		case 'broadcastTransaction': {
			const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;

			const txResponse = await provider.getProvider().broadcastTransaction(signedTransaction);

			result = {
				success: true,
				transactionHash: txResponse.hash,
				from: toXdcAddress(txResponse.from),
				to: txResponse.to ? toXdcAddress(txResponse.to) : null,
				nonce: txResponse.nonce,
				gasLimit: txResponse.gasLimit.toString(),
				gasPrice: txResponse.gasPrice?.toString(),
				value: fromWei(txResponse.value, XdcUnit.XDC),
				message: 'Transaction broadcast successfully. Use "Wait for Confirmation" to track status.',
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
