import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { createXdcProvider } from '../../transport/provider';
import { toXdcAddress, toEthAddress, isValidXdcAddress, normalizeAddress } from '../../utils/addressUtils';
import { fromWei } from '../../utils/unitConverter';
import { ethers } from 'ethers';

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['utility'] } },
		options: [
			{ name: 'Convert Units', value: 'convertUnits', description: 'Convert between XDC units', action: 'Convert units' },
			{ name: 'Convert Address', value: 'convertAddress', description: 'Convert address format (xdc/0x)', action: 'Convert address' },
			{ name: 'Validate Address', value: 'validateAddress', description: 'Validate XDC address', action: 'Validate address' },
			{ name: 'Keccak256 Hash', value: 'keccak256', description: 'Calculate Keccak256 hash', action: 'Calculate keccak256' },
			{ name: 'Encode ABI', value: 'encodeAbi', description: 'Encode function call data', action: 'Encode ABI' },
			{ name: 'Decode ABI', value: 'decodeAbi', description: 'Decode function call data', action: 'Decode ABI' },
			{ name: 'Sign Message', value: 'signMessage', description: 'Sign a message with private key', action: 'Sign message' },
			{ name: 'Verify Signature', value: 'verifySignature', description: 'Verify message signature', action: 'Verify signature' },
			{ name: 'Get Network Status', value: 'getNetworkStatus', description: 'Get network health status', action: 'Get network status' },
			{ name: 'Generate Wallet', value: 'generateWallet', description: 'Generate new wallet', action: 'Generate wallet' },
		],
		default: 'convertUnits',
	},
];

export const utilityFields: INodeProperties[] = [
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
		description: 'Value to convert',
	},
	{
		displayName: 'From Unit',
		name: 'fromUnit',
		type: 'options',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Gwei', value: 'gwei' },
			{ name: 'XDC', value: 'xdc' },
		],
		default: 'xdc',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
	},
	{
		displayName: 'To Unit',
		name: 'toUnit',
		type: 'options',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Gwei', value: 'gwei' },
			{ name: 'XDC', value: 'xdc' },
		],
		default: 'wei',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['utility'], operation: ['convertAddress', 'validateAddress'] } },
	},
	{
		displayName: 'Target Format',
		name: 'targetFormat',
		type: 'options',
		options: [
			{ name: 'XDC (xdc...)', value: 'xdc' },
			{ name: 'Ethereum (0x...)', value: 'eth' },
		],
		default: 'xdc',
		displayOptions: { show: { resource: ['utility'], operation: ['convertAddress'] } },
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['utility'], operation: ['keccak256'] } },
		description: 'Data to hash',
	},
	{
		displayName: 'Function Signature',
		name: 'functionSignature',
		type: 'string',
		default: '',
		placeholder: 'transfer(address,uint256)',
		displayOptions: { show: { resource: ['utility'], operation: ['encodeAbi', 'decodeAbi'] } },
	},
	{
		displayName: 'Parameters',
		name: 'parameters',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: ['utility'], operation: ['encodeAbi'] } },
		description: 'Array of parameters to encode',
	},
	{
		displayName: 'Encoded Data',
		name: 'encodedData',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['utility'], operation: ['decodeAbi'] } },
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['utility'], operation: ['signMessage', 'verifySignature'] } },
	},
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['utility'], operation: ['verifySignature'] } },
	},
	{
		displayName: 'Expected Signer',
		name: 'expectedSigner',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['utility'], operation: ['verifySignature'] } },
	},
];

export async function executeUtilityOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const network = this.getNodeParameter('network', index, 'mainnet') as string;

	switch (operation) {
		case 'convertUnits': {
			const value = this.getNodeParameter('value', index) as string;
			const fromUnit = this.getNodeParameter('fromUnit', index) as string;
			const toUnit = this.getNodeParameter('toUnit', index) as string;
			let weiValue: bigint;
			if (fromUnit === 'wei') {
				weiValue = BigInt(value);
			} else if (fromUnit === 'gwei') {
				weiValue = BigInt(Math.floor(parseFloat(value) * 1e9));
			} else {
				weiValue = BigInt(Math.floor(parseFloat(value) * 1e18));
			}
			let result: string;
			if (toUnit === 'wei') {
				result = weiValue.toString();
			} else if (toUnit === 'gwei') {
				result = (Number(weiValue) / 1e9).toString();
			} else {
				result = (Number(weiValue) / 1e18).toString();
			}
			return [{ json: { originalValue: value, fromUnit, toUnit, result } }];
		}

		case 'convertAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const targetFormat = this.getNodeParameter('targetFormat', index) as string;
			if (!isValidXdcAddress(address)) {
				throw new NodeOperationError(this.getNode(), 'Invalid address format');
			}
			const converted = targetFormat === 'xdc' ? toXdcAddress(address) : toEthAddress(address);
			return [{ json: { original: address, converted, format: targetFormat } }];
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const isValid = isValidXdcAddress(address);
			const normalized = isValid ? normalizeAddress(address) : null;
			const format = address.toLowerCase().startsWith('xdc') ? 'xdc' : address.startsWith('0x') ? 'eth' : 'unknown';
			return [{ json: { address, isValid, normalized, format } }];
		}

		case 'keccak256': {
			const data = this.getNodeParameter('data', index) as string;
			const isHex = data.startsWith('0x');
			const hash = isHex ? ethers.keccak256(data) : ethers.keccak256(ethers.toUtf8Bytes(data));
			return [{ json: { data, hash, inputType: isHex ? 'hex' : 'utf8' } }];
		}

		case 'encodeAbi': {
			const functionSignature = this.getNodeParameter('functionSignature', index) as string;
			const parameters = this.getNodeParameter('parameters', index) as unknown[];
			const iface = new ethers.Interface([`function ${functionSignature}`]);
			const funcName = functionSignature.split('(')[0];
			const encoded = iface.encodeFunctionData(funcName, parameters);
			const selector = encoded.slice(0, 10);
			return [{ json: { functionSignature, parameters, encoded, selector } }];
		}

		case 'decodeAbi': {
			const functionSignature = this.getNodeParameter('functionSignature', index) as string;
			const encodedData = this.getNodeParameter('encodedData', index) as string;
			const iface = new ethers.Interface([`function ${functionSignature}`]);
			const funcName = functionSignature.split('(')[0];
			const decoded = iface.decodeFunctionData(funcName, encodedData);
			const result = Array.from(decoded).map((v: any) => typeof v === 'bigint' ? v.toString() : v);
			return [{ json: { functionSignature, encodedData, decoded: result } }];
		}

		case 'signMessage': {
			const credentials = await this.getCredentials('xdcNetwork');
			if (!credentials.privateKey) {
				throw new NodeOperationError(this.getNode(), 'Private key required for signing');
			}
			const message = this.getNodeParameter('message', index) as string;
			const wallet = new ethers.Wallet(credentials.privateKey as string);
			const signature = await wallet.signMessage(message);
			return [{ json: { message, signature, signer: toXdcAddress(wallet.address) } }];
		}

		case 'verifySignature': {
			const message = this.getNodeParameter('message', index) as string;
			const signature = this.getNodeParameter('signature', index) as string;
			const expectedSigner = this.getNodeParameter('expectedSigner', index) as string;
			const recoveredAddress = ethers.verifyMessage(message, signature);
			const expectedNormalized = normalizeAddress(expectedSigner);
			const isValid = recoveredAddress.toLowerCase() === expectedNormalized?.toLowerCase();
			return [{
				json: {
					message,
					signature,
					recoveredSigner: toXdcAddress(recoveredAddress),
					expectedSigner: expectedSigner ? toXdcAddress(expectedSigner) : null,
					isValid,
				},
			}];
		}

		case 'getNetworkStatus': {
			const credentials = await this.getCredentials('xdcNetwork');
			const provider = createXdcProvider({ network, rpcUrl: credentials.rpcUrl as string });
			const status = await provider.getNetworkStatus();
			return [{
				json: {
					network,
					chainId: status.chainId,
					blockNumber: status.blockNumber,
					gasPrice: fromWei(status.gasPrice, 'gwei') + ' gwei',
					connected: status.connected,
					epoch: Math.floor(status.blockNumber / 900),
				},
			}];
		}

		case 'generateWallet': {
			const wallet = ethers.Wallet.createRandom();
			return [{
				json: {
					address: toXdcAddress(wallet.address),
					addressEth: wallet.address,
					privateKey: wallet.privateKey,
					mnemonic: wallet.mnemonic?.phrase,
					warning: 'Store these credentials securely. Never share your private key or mnemonic.',
				},
			}];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}
