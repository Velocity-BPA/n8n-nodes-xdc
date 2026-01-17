/**
 * XDC Network - Smart Contract Resource Operations
 * 
 * Handles all smart contract interactions including reading/writing state,
 * deploying contracts, encoding/decoding data, and event handling.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createXdcProvider } from '../../transport/provider';
import { XdcExplorerApi } from '../../transport/explorerApi';
import { toEthAddress, toXdcAddress, isValidXdcAddress } from '../../utils/addressUtils';
import { fromWei, toWei, XdcUnit } from '../../utils/unitConverter';

// Contract resource operations definition
export const contractOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contract'],
			},
		},
		options: [
			{
				name: 'Decode Function Result',
				value: 'decodeFunctionResult',
				description: 'Decode the return value of a function call',
				action: 'Decode function result',
			},
			{
				name: 'Deploy Contract',
				value: 'deployContract',
				description: 'Deploy a new smart contract',
				action: 'Deploy contract',
			},
			{
				name: 'Encode Function Call',
				value: 'encodeFunctionCall',
				description: 'Encode function parameters for a contract call',
				action: 'Encode function call',
			},
			{
				name: 'Estimate Contract Gas',
				value: 'estimateContractGas',
				description: 'Estimate gas for a contract function call',
				action: 'Estimate contract gas',
			},
			{
				name: 'Get Contract ABI',
				value: 'getContractAbi',
				description: 'Get the ABI of a verified contract',
				action: 'Get contract ABI',
			},
			{
				name: 'Get Contract Events',
				value: 'getContractEvents',
				description: 'Get events emitted by a contract',
				action: 'Get contract events',
			},
			{
				name: 'Get Contract Source Code',
				value: 'getContractSourceCode',
				description: 'Get source code of a verified contract',
				action: 'Get contract source code',
			},
			{
				name: 'Read Contract',
				value: 'readContract',
				description: 'Call a view/pure function on a contract',
				action: 'Read from contract',
			},
			{
				name: 'Verify Contract',
				value: 'verifyContract',
				description: 'Verify contract source code on explorer',
				action: 'Verify contract',
			},
			{
				name: 'Write Contract',
				value: 'writeContract',
				description: 'Execute a state-changing function on a contract',
				action: 'Write to contract',
			},
		],
		default: 'readContract',
	},
];

// Contract resource fields
export const contractFields: INodeProperties[] = [
	// Contract address field
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'xdc... or 0x...',
		description: 'The smart contract address',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'getContractAbi',
					'getContractEvents',
					'getContractSourceCode',
					'estimateContractGas',
					'verifyContract',
				],
			},
		},
	},

	// ABI field
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Contract ABI (JSON array)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'encodeFunctionCall',
					'decodeFunctionResult',
					'getContractEvents',
					'estimateContractGas',
					'deployContract',
				],
			},
		},
	},

	// Function name field
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'balanceOf',
		description: 'Name of the function to call',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'encodeFunctionCall',
					'decodeFunctionResult',
					'estimateContractGas',
				],
			},
		},
	},

	// Function arguments
	{
		displayName: 'Function Arguments',
		name: 'functionArgs',
		type: 'json',
		default: '[]',
		placeholder: '["arg1", "arg2"]',
		description: 'Function arguments as JSON array',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'readContract',
					'writeContract',
					'encodeFunctionCall',
					'estimateContractGas',
				],
			},
		},
	},

	// Decode function result fields
	{
		displayName: 'Encoded Data',
		name: 'encodedData',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The encoded function result to decode',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['decodeFunctionResult'],
			},
		},
	},

	// Deploy contract fields
	{
		displayName: 'Bytecode',
		name: 'bytecode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Contract bytecode (compiled code)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deployContract'],
			},
		},
	},
	{
		displayName: 'Constructor Arguments',
		name: 'constructorArgs',
		type: 'json',
		default: '[]',
		placeholder: '["arg1", "arg2"]',
		description: 'Constructor arguments as JSON array',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deployContract'],
			},
		},
	},

	// Event filter fields
	{
		displayName: 'Event Name',
		name: 'eventName',
		type: 'string',
		default: '',
		placeholder: 'Transfer',
		description: 'Name of the event to filter (leave empty for all events)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getContractEvents'],
			},
		},
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'number',
		default: 0,
		description: 'Start block number (0 for genesis)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getContractEvents'],
			},
		},
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'string',
		default: 'latest',
		description: 'End block number or "latest"',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getContractEvents'],
			},
		},
	},

	// Verify contract fields
	{
		displayName: 'Contract Name',
		name: 'contractName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MyContract',
		description: 'Name of the contract',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verifyContract'],
			},
		},
	},
	{
		displayName: 'Source Code',
		name: 'sourceCode',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		required: true,
		default: '',
		description: 'Solidity source code',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verifyContract'],
			},
		},
	},
	{
		displayName: 'Compiler Version',
		name: 'compilerVersion',
		type: 'string',
		required: true,
		default: 'v0.8.19+commit.7dd6d404',
		description: 'Solidity compiler version',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verifyContract'],
			},
		},
	},
	{
		displayName: 'Optimization Enabled',
		name: 'optimizationEnabled',
		type: 'boolean',
		default: false,
		description: 'Whether optimization was enabled during compilation',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verifyContract'],
			},
		},
	},
	{
		displayName: 'Optimization Runs',
		name: 'optimizationRuns',
		type: 'number',
		default: 200,
		description: 'Number of optimization runs',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verifyContract'],
			},
		},
	},

	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['writeContract', 'deployContract', 'estimateContractGas'],
			},
		},
		options: [
			{
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 0,
				description: 'Gas limit (0 for automatic estimation)',
			},
			{
				displayName: 'Gas Price (Gwei)',
				name: 'gasPrice',
				type: 'string',
				default: '',
				description: 'Gas price in Gwei (leave empty for automatic)',
			},
			{
				displayName: 'Value (XDC)',
				name: 'value',
				type: 'string',
				default: '0',
				description: 'Amount of XDC to send with the transaction',
			},
		],
	},
];

/**
 * Execute contract operations
 */
export async function executeContractOperation(
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
		case 'readContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiInput = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsInput = this.getNodeParameter('functionArgs', index, '[]') as string;

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			let args: any[];
			try {
				args = JSON.parse(functionArgsInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON format');
			}

			// Convert XDC addresses in args to 0x format
			args = args.map((arg) => {
				if (typeof arg === 'string' && isValidXdcAddress(arg)) {
					return toEthAddress(arg);
				}
				return arg;
			});

			const contract = provider.getContract(toEthAddress(contractAddress), abi);
			const callResult = await contract[functionName](...args);

			// Convert result for JSON serialization
			const formatResult = (res: any): any => {
				if (typeof res === 'bigint') {
					return res.toString();
				}
				if (Array.isArray(res)) {
					return res.map(formatResult);
				}
				if (typeof res === 'object' && res !== null) {
					const formatted: any = {};
					for (const key in res) {
						if (isNaN(Number(key))) {
							formatted[key] = formatResult(res[key]);
						}
					}
					return formatted;
				}
				return res;
			};

			result = {
				contractAddress: toXdcAddress(contractAddress),
				functionName,
				arguments: args,
				result: formatResult(callResult),
			};
			break;
		}

		case 'writeContract': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for write operations',
				);
			}

			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiInput = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsInput = this.getNodeParameter('functionArgs', index, '[]') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
				value?: string;
			};

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			let args: any[];
			try {
				args = JSON.parse(functionArgsInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON format');
			}

			// Convert XDC addresses in args to 0x format
			args = args.map((arg) => {
				if (typeof arg === 'string' && isValidXdcAddress(arg)) {
					return toEthAddress(arg);
				}
				return arg;
			});

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const contract = new ethers.Contract(toEthAddress(contractAddress), abi, wallet);

			const txOptions: any = {};
			if (options.gasLimit && options.gasLimit > 0) {
				txOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				txOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}
			if (options.value && options.value !== '0') {
				txOptions.value = toWei(options.value, XdcUnit.XDC);
			}

			const tx = await contract[functionName](...args, txOptions);
			const receipt = await tx.wait();

			result = {
				success: true,
				transactionHash: tx.hash,
				contractAddress: toXdcAddress(contractAddress),
				functionName,
				arguments: args,
				from: toXdcAddress(wallet.address),
				gasUsed: receipt?.gasUsed.toString(),
				blockNumber: receipt?.blockNumber,
				status: receipt?.status === 1 ? 'success' : 'failed',
				events: receipt?.logs.map((log: any) => ({
					address: toXdcAddress(log.address),
					topics: log.topics,
					data: log.data,
				})),
			};
			break;
		}

		case 'getContractAbi': {
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for getting contract ABI',
				);
			}

			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const abi = await explorerApi.getContractABI(toEthAddress(contractAddress));

			result = {
				contractAddress: toXdcAddress(contractAddress),
				abi: JSON.parse(abi),
				abiString: abi,
			};
			break;
		}

		case 'encodeFunctionCall': {
			const abiInput = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsInput = this.getNodeParameter('functionArgs', index, '[]') as string;

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			let args: any[];
			try {
				args = JSON.parse(functionArgsInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON format');
			}

			// Convert XDC addresses in args to 0x format
			args = args.map((arg) => {
				if (typeof arg === 'string' && isValidXdcAddress(arg)) {
					return toEthAddress(arg);
				}
				return arg;
			});

			const iface = new ethers.Interface(abi);
			const encoded = iface.encodeFunctionData(functionName, args);
			const selector = encoded.slice(0, 10);

			result = {
				functionName,
				arguments: args,
				encoded,
				selector,
			};
			break;
		}

		case 'decodeFunctionResult': {
			const abiInput = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const encodedData = this.getNodeParameter('encodedData', index) as string;

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			const iface = new ethers.Interface(abi);

			try {
				const decoded = iface.decodeFunctionResult(functionName, encodedData);

				// Format the result
				const formatResult = (res: any): any => {
					if (typeof res === 'bigint') {
						return res.toString();
					}
					if (Array.isArray(res)) {
						return res.map(formatResult);
					}
					return res;
				};

				result = {
					functionName,
					decoded: formatResult(decoded),
				};
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Failed to decode function result: ${error}`,
				);
			}
			break;
		}

		case 'getContractEvents': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiInput = this.getNodeParameter('abi', index) as string;
			const eventName = this.getNodeParameter('eventName', index, '') as string;
			const fromBlock = this.getNodeParameter('fromBlock', index, 0) as number;
			const toBlockInput = this.getNodeParameter('toBlock', index, 'latest') as string;

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			const toBlock = toBlockInput === 'latest' ? 'latest' : parseInt(toBlockInput, 10);

			const contract = provider.getContract(toEthAddress(contractAddress), abi);
			const iface = new ethers.Interface(abi);

			// Build filter
			let filter;
			if (eventName) {
				filter = contract.filters[eventName]?.();
				if (!filter) {
					throw new NodeOperationError(
						this.getNode(),
						`Event "${eventName}" not found in ABI`,
					);
				}
			} else {
				filter = { address: toEthAddress(contractAddress) };
			}

			const logs = await provider.getLogs({
				...filter,
				fromBlock,
				toBlock,
			});

			// Parse logs
			const events = logs.map((log) => {
				try {
					const parsed = iface.parseLog({
						topics: log.topics as string[],
						data: log.data,
					});

					return {
						eventName: parsed?.name,
						signature: parsed?.signature,
						args: parsed?.args.map((arg, i) => ({
							name: parsed.fragment.inputs[i]?.name || `arg${i}`,
							value: typeof arg === 'bigint' ? arg.toString() : arg,
						})),
						blockNumber: log.blockNumber,
						transactionHash: log.transactionHash,
						logIndex: log.index,
					};
				} catch {
					return {
						eventName: 'Unknown',
						topics: log.topics,
						data: log.data,
						blockNumber: log.blockNumber,
						transactionHash: log.transactionHash,
						logIndex: log.index,
					};
				}
			});

			result = {
				contractAddress: toXdcAddress(contractAddress),
				fromBlock,
				toBlock,
				eventCount: events.length,
				events,
			};
			break;
		}

		case 'estimateContractGas': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const abiInput = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsInput = this.getNodeParameter('functionArgs', index, '[]') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				value?: string;
			};

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			let args: any[];
			try {
				args = JSON.parse(functionArgsInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON format');
			}

			// Convert XDC addresses in args to 0x format
			args = args.map((arg) => {
				if (typeof arg === 'string' && isValidXdcAddress(arg)) {
					return toEthAddress(arg);
				}
				return arg;
			});

			// Create interface for encoding (don't need contract instance for just encoding)
			const iface = new ethers.Interface(abi);
			const data = iface.encodeFunctionData(functionName, args);

			const txRequest: ethers.TransactionRequest = {
				to: toEthAddress(contractAddress),
				data,
			};

			if (options.value && options.value !== '0') {
				txRequest.value = toWei(options.value, XdcUnit.XDC);
			}

			const gasEstimate = await provider.estimateGas(txRequest);
			const gasPrice = await provider.getGasPrice();

			result = {
				contractAddress: toXdcAddress(contractAddress),
				functionName,
				gasEstimate: gasEstimate.toString(),
				gasPrice: gasPrice.toString(),
				gasPriceGwei: fromWei(gasPrice, XdcUnit.GWEI),
				estimatedCost: fromWei(gasEstimate * gasPrice, XdcUnit.XDC),
				estimatedCostWei: (gasEstimate * gasPrice).toString(),
			};
			break;
		}

		case 'deployContract': {
			if (!privateKey) {
				throw new NodeOperationError(
					this.getNode(),
					'Private key is required for deploying contracts',
				);
			}

			const abiInput = this.getNodeParameter('abi', index) as string;
			const bytecode = this.getNodeParameter('bytecode', index) as string;
			const constructorArgsInput = this.getNodeParameter('constructorArgs', index, '[]') as string;
			const options = this.getNodeParameter('options', index, {}) as {
				gasLimit?: number;
				gasPrice?: string;
				value?: string;
			};

			let abi: any[];
			try {
				abi = JSON.parse(abiInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON format');
			}

			let constructorArgs: any[];
			try {
				constructorArgs = JSON.parse(constructorArgsInput);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid constructor arguments JSON format');
			}

			// Convert XDC addresses in args to 0x format
			constructorArgs = constructorArgs.map((arg) => {
				if (typeof arg === 'string' && isValidXdcAddress(arg)) {
					return toEthAddress(arg);
				}
				return arg;
			});

			const wallet = new ethers.Wallet(privateKey, provider.getProvider());
			const factory = new ethers.ContractFactory(abi, bytecode, wallet);

			const deployOptions: any = {};
			if (options.gasLimit && options.gasLimit > 0) {
				deployOptions.gasLimit = options.gasLimit;
			}
			if (options.gasPrice) {
				deployOptions.gasPrice = ethers.parseUnits(options.gasPrice, 'gwei');
			}
			if (options.value && options.value !== '0') {
				deployOptions.value = toWei(options.value, XdcUnit.XDC);
			}

			const contract = await factory.deploy(...constructorArgs, deployOptions);
			const deployTx = contract.deploymentTransaction();
			await contract.waitForDeployment();

			const deployedAddress = await contract.getAddress();

			result = {
				success: true,
				contractAddress: toXdcAddress(deployedAddress),
				transactionHash: deployTx?.hash,
				deployer: toXdcAddress(wallet.address),
				constructorArgs,
				blockNumber: deployTx?.blockNumber,
			};
			break;
		}

		case 'getContractSourceCode': {
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for getting contract source code',
				);
			}

			const contractAddress = this.getNodeParameter('contractAddress', index) as string;

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const source = await explorerApi.getContractSource(toEthAddress(contractAddress));

			result = {
				contractAddress: toXdcAddress(contractAddress),
				...source,
			};
			break;
		}

		case 'verifyContract': {
			let explorerCredentials;
			try {
				explorerCredentials = await this.getCredentials('xdcScan');
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'XDCScan API credentials are required for contract verification',
				);
			}

			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const contractName = this.getNodeParameter('contractName', index) as string;
			const sourceCode = this.getNodeParameter('sourceCode', index) as string;
			const compilerVersion = this.getNodeParameter('compilerVersion', index) as string;
			const optimizationEnabled = this.getNodeParameter('optimizationEnabled', index) as boolean;
			const optimizationRuns = this.getNodeParameter('optimizationRuns', index) as number;

			if (!isValidXdcAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`);
			}

			const explorerApi = new XdcExplorerApi({
				chainId: network === 'mainnet' ? 50 : 51,
				apiKey: explorerCredentials.apiKey as string,
			});

			const verificationResult = await explorerApi.verifyContract({
				address: toEthAddress(contractAddress),
				contractName,
				sourceCode,
				compilerVersion,
				optimizationUsed: optimizationEnabled,
				runs: optimizationRuns,
			});

			result = {
				contractAddress: toXdcAddress(contractAddress),
				contractName,
				verificationGuid: verificationResult,
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
