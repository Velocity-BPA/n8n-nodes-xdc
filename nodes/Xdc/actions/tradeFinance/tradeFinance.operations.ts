import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { generateDocumentHash, verifyDocumentHash, generateLCReference, validateISO20022Data, ISO20022MessageType } from '../../utils/tradeFinanceUtils';

export const tradeFinanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tradeFinance'] } },
		options: [
			{ name: 'Generate Document Hash', value: 'generateHash', description: 'Generate hash for trade document', action: 'Generate document hash' },
			{ name: 'Verify Document Hash', value: 'verifyHash', description: 'Verify document hash', action: 'Verify document hash' },
			{ name: 'Generate LC Reference', value: 'generateLCRef', description: 'Generate Letter of Credit reference', action: 'Generate LC reference' },
			{ name: 'Validate ISO 20022', value: 'validateISO', description: 'Validate ISO 20022 message data', action: 'Validate ISO 20022 data' },
		],
		default: 'generateHash',
	},
];

export const tradeFinanceFields: INodeProperties[] = [
	{
		displayName: 'Document Content',
		name: 'documentContent',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['generateHash', 'verifyHash'] } },
		description: 'Document content to hash or verify',
	},
	{
		displayName: 'Hash Algorithm',
		name: 'hashAlgorithm',
		type: 'options',
		options: [
			{ name: 'SHA256', value: 'SHA256' },
			{ name: 'Keccak256', value: 'KECCAK256' },
		],
		default: 'SHA256',
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['generateHash', 'verifyHash'] } },
	},
	{
		displayName: 'Expected Hash',
		name: 'expectedHash',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['verifyHash'] } },
		description: 'Hash to verify against',
	},
	{
		displayName: 'Bank Code',
		name: 'bankCode',
		type: 'string',
		default: 'XDCB',
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['generateLCRef'] } },
		description: 'Issuing bank code',
	},
	{
		displayName: 'Year',
		name: 'lcYear',
		type: 'number',
		default: new Date().getFullYear(),
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['generateLCRef'] } },
		description: 'Year for LC reference',
	},
	{
		displayName: 'Sequence Number',
		name: 'sequenceNumber',
		type: 'number',
		default: 1,
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['generateLCRef'] } },
		description: 'Sequential number for LC reference',
	},
	{
		displayName: 'ISO 20022 Data',
		name: 'isoData',
		type: 'json',
		default: '{}',
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['validateISO'] } },
		description: 'ISO 20022 message data to validate',
	},
	{
		displayName: 'Message Type',
		name: 'messageType',
		type: 'options',
		options: [
			{ name: 'PACS.008 (FI to FI)', value: 'pacs.008' },
			{ name: 'PACS.009 (FI Credit Transfer)', value: 'pacs.009' },
			{ name: 'CAMT.053 (Statement)', value: 'camt.053' },
			{ name: 'PAIN.001 (Credit Initiation)', value: 'pain.001' },
		],
		default: 'pacs.008',
		displayOptions: { show: { resource: ['tradeFinance'], operation: ['validateISO'] } },
	},
];

export async function executeTradeFinanceOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	switch (operation) {
		case 'generateHash': {
			const content = this.getNodeParameter('documentContent', index) as string;
			const algorithm = this.getNodeParameter('hashAlgorithm', index) as 'SHA256' | 'KECCAK256';
			const hash = generateDocumentHash(content, algorithm);
			return [{ json: { hash, algorithm, contentLength: content.length, timestamp: new Date().toISOString() } }];
		}

		case 'verifyHash': {
			const content = this.getNodeParameter('documentContent', index) as string;
			const expectedHash = this.getNodeParameter('expectedHash', index) as string;
			const algorithm = this.getNodeParameter('hashAlgorithm', index) as 'SHA256' | 'KECCAK256';
			const isValid = verifyDocumentHash(content, expectedHash, algorithm);
			const computedHash = generateDocumentHash(content, algorithm);
			return [{ json: { isValid, expectedHash, computedHash, algorithm } }];
		}

		case 'generateLCRef': {
			const bankCode = this.getNodeParameter('bankCode', index, 'XDCB') as string;
			const year = this.getNodeParameter('lcYear', index, new Date().getFullYear()) as number;
			const sequence = this.getNodeParameter('sequenceNumber', index, 1) as number;
			const reference = generateLCReference(bankCode, year, sequence);
			return [{ json: { reference, bankCode, year, sequence, generatedAt: new Date().toISOString() } }];
		}

		case 'validateISO': {
			const isoData = this.getNodeParameter('isoData', index) as Record<string, unknown>;
			const messageTypeStr = this.getNodeParameter('messageType', index) as string;
			
			// Map string to enum value
			const messageTypeMap: Record<string, ISO20022MessageType> = {
				'pacs.008': ISO20022MessageType.PACS_008,
				'pacs.009': ISO20022MessageType.PACS_008, // Use PACS_008 as fallback
				'camt.053': ISO20022MessageType.CAMT_053,
				'pain.001': ISO20022MessageType.PAIN_001,
			};
			const messageType = messageTypeMap[messageTypeStr] || ISO20022MessageType.PACS_008;
			const validation = validateISO20022Data(isoData, messageType);
			return [{ json: { ...validation, messageType: messageTypeStr, data: isoData } }];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}
}
