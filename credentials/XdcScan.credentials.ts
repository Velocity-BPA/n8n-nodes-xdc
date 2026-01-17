import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * XDCScan API Credentials
 * 
 * Provides authentication for XDCScan/BlocksScan explorer APIs.
 * Used for transaction history, token transfers, and contract verification.
 */
export class XdcScan implements ICredentialType {
	name = 'xdcScan';
	displayName = 'XDCScan API';
	documentationUrl = 'https://xdc.blocksscan.io/docs';
	
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
					description: 'XDCScan for Mainnet (xdc.blocksscan.io)',
				},
				{
					name: 'XDC Apothem Testnet',
					value: 'apothem',
					description: 'XDCScan for Apothem (apothem.blocksscan.io)',
				},
			],
			description: 'Select the network for explorer API',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'Enter your XDCScan API key',
			description: 'API key for XDCScan/BlocksScan explorer. Get one at xdc.blocksscan.io',
			required: true,
		},
		{
			displayName: 'Custom API URL',
			name: 'customApiUrl',
			type: 'string',
			default: '',
			placeholder: 'https://xdc.blocksscan.io/api',
			description: 'Optional custom API endpoint URL',
		},
	];

	// Test the credential
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.customApiUrl || ($credentials.network === "apothem" ? "https://apothem.blocksscan.io/api" : "https://xdc.blocksscan.io/api")}}',
			method: 'GET',
			qs: {
				module: 'stats',
				action: 'xdcprice',
				apikey: '={{$credentials.apiKey}}',
			},
		},
	};
}
