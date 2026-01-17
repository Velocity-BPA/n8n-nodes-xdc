import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * XDC Network Credentials
 * 
 * Provides connection parameters for XDC Network blockchain.
 * Supports Mainnet, Apothem Testnet, and custom RPC endpoints.
 */
export class XdcNetwork implements ICredentialType {
	name = 'xdcNetwork';
	displayName = 'XDC Network';
	documentationUrl = 'https://docs.xdc.org/';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			default: 'mainnet',
			options: [
				{
					name: 'XDC Mainnet',
					value: 'mainnet',
					description: 'XDC Network main blockchain (Chain ID: 50)',
				},
				{
					name: 'XDC Apothem Testnet',
					value: 'apothem',
					description: 'XDC Network test blockchain (Chain ID: 51)',
				},
				{
					name: 'Custom RPC',
					value: 'custom',
					description: 'Connect to a custom XDC RPC endpoint',
				},
			],
			description: 'Select the XDC network to connect to',
		},
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://erpc.xinfin.network',
			description: 'Custom RPC endpoint URL. Leave empty to use default for selected network.',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Chain ID',
			name: 'chainId',
			type: 'number',
			default: 50,
			description: 'Chain ID for custom network (50 for Mainnet, 51 for Apothem)',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'Enter your wallet private key',
			description: 'Private key for signing transactions. Required for write operations (transfers, contract calls). Never share your private key.',
			hint: 'Leave empty for read-only operations',
		},
		{
			displayName: 'API Key (Optional)',
			name: 'providerApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'Enter API key for enhanced RPC provider',
			description: 'Optional API key for enhanced RPC providers with higher rate limits',
		},
	];

	// Test the credential
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.network === "apothem" ? "https://erpc.apothem.network" : ($credentials.network === "custom" && $credentials.rpcUrl ? $credentials.rpcUrl : "https://erpc.xinfin.network")}}',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 1,
			}),
		},
	};
}
