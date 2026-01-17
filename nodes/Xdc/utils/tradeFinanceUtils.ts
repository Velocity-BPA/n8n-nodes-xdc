/**
 * XDC Trade Finance Utilities
 * 
 * XDC Network is optimized for international trade finance.
 * These utilities support document verification, ISO 20022 compliance,
 * and trade asset management.
 */

import { ethers } from 'ethers';

/**
 * Trade document types supported on XDC
 */
export enum TradeDocumentType {
	BILL_OF_LADING = 'BILL_OF_LADING',
	COMMERCIAL_INVOICE = 'COMMERCIAL_INVOICE',
	PACKING_LIST = 'PACKING_LIST',
	CERTIFICATE_OF_ORIGIN = 'CERTIFICATE_OF_ORIGIN',
	INSURANCE_CERTIFICATE = 'INSURANCE_CERTIFICATE',
	LETTER_OF_CREDIT = 'LETTER_OF_CREDIT',
	BANK_GUARANTEE = 'BANK_GUARANTEE',
	WAREHOUSE_RECEIPT = 'WAREHOUSE_RECEIPT',
	CUSTOMS_DECLARATION = 'CUSTOMS_DECLARATION',
	INSPECTION_CERTIFICATE = 'INSPECTION_CERTIFICATE',
}

/**
 * Letter of Credit status types
 */
export enum LCStatus {
	DRAFT = 'DRAFT',
	ISSUED = 'ISSUED',
	ADVISED = 'ADVISED',
	CONFIRMED = 'CONFIRMED',
	DOCUMENTS_PRESENTED = 'DOCUMENTS_PRESENTED',
	DOCUMENTS_ACCEPTED = 'DOCUMENTS_ACCEPTED',
	PAYMENT_PENDING = 'PAYMENT_PENDING',
	PAID = 'PAID',
	EXPIRED = 'EXPIRED',
	CANCELLED = 'CANCELLED',
}

/**
 * Supply chain event types
 */
export enum SupplyChainEvent {
	ORDER_PLACED = 'ORDER_PLACED',
	PRODUCTION_STARTED = 'PRODUCTION_STARTED',
	PRODUCTION_COMPLETED = 'PRODUCTION_COMPLETED',
	QUALITY_INSPECTION = 'QUALITY_INSPECTION',
	PACKED = 'PACKED',
	SHIPPED = 'SHIPPED',
	IN_TRANSIT = 'IN_TRANSIT',
	CUSTOMS_CLEARANCE = 'CUSTOMS_CLEARANCE',
	ARRIVED_AT_PORT = 'ARRIVED_AT_PORT',
	DELIVERED = 'DELIVERED',
	RECEIVED = 'RECEIVED',
}

/**
 * ISO 20022 Message Types relevant to trade finance
 */
export enum ISO20022MessageType {
	// Trade Services
	TSMT_001 = 'tsmt.001', // Baseline Report
	TSMT_002 = 'tsmt.002', // Forward Data Set Submission
	TSMT_003 = 'tsmt.003', // Data Set Match Report
	TSMT_012 = 'tsmt.012', // Status Report
	
	// Letters of Credit
	TREA_001 = 'trea.001', // LC Issuance
	TREA_002 = 'trea.002', // LC Amendment
	TREA_003 = 'trea.003', // LC Notification
	
	// Bank Guarantees
	BGRT_001 = 'bgrt.001', // Guarantee Issuance
	BGRT_002 = 'bgrt.002', // Guarantee Amendment
	
	// Payments
	PAIN_001 = 'pain.001', // Customer Credit Transfer Initiation
	PAIN_002 = 'pain.002', // Payment Status Report
	PACS_008 = 'pacs.008', // FI to FI Customer Credit Transfer
	CAMT_053 = 'camt.053', // Bank to Customer Statement
}

/**
 * Document hash structure
 */
export interface DocumentHash {
	hash: string;
	algorithm: 'SHA256' | 'KECCAK256';
	timestamp: number;
	issuer: string;
}

/**
 * Trade document metadata
 */
export interface TradeDocumentMetadata {
	documentId: string;
	type: TradeDocumentType;
	hash: string;
	issuer: string;
	issuedAt: number;
	expiresAt?: number;
	reference?: string;
	parties?: string[];
	amount?: string;
	currency?: string;
	additionalData?: Record<string, string>;
}

/**
 * Generate document hash from content
 * @param content - Document content (string or buffer)
 * @param algorithm - Hash algorithm
 * @returns Hash string
 */
export function generateDocumentHash(
	content: string | Buffer,
	algorithm: 'SHA256' | 'KECCAK256' = 'KECCAK256'
): string {
	const data = typeof content === 'string' ? content : content.toString();
	
	if (algorithm === 'KECCAK256') {
		return ethers.keccak256(ethers.toUtf8Bytes(data));
	}
	
	// SHA256 using ethers sha256
	return ethers.sha256(ethers.toUtf8Bytes(data));
}

/**
 * Verify document hash
 * @param content - Original content
 * @param hash - Expected hash
 * @param algorithm - Hash algorithm used
 * @returns True if hash matches
 */
export function verifyDocumentHash(
	content: string | Buffer,
	hash: string,
	algorithm: 'SHA256' | 'KECCAK256' = 'KECCAK256'
): boolean {
	const computedHash = generateDocumentHash(content, algorithm);
	return computedHash.toLowerCase() === hash.toLowerCase();
}

/**
 * Create document registration data
 * @param metadata - Document metadata
 * @returns Encoded data for blockchain registration
 */
export function encodeDocumentRegistration(metadata: TradeDocumentMetadata): string {
	const abiCoder = ethers.AbiCoder.defaultAbiCoder();
	
	return abiCoder.encode(
		['string', 'string', 'bytes32', 'address', 'uint256', 'uint256', 'string'],
		[
			metadata.documentId,
			metadata.type,
			metadata.hash,
			metadata.issuer,
			metadata.issuedAt,
			metadata.expiresAt || 0,
			JSON.stringify(metadata.additionalData || {}),
		]
	);
}

/**
 * Parse ISO 20022 message type
 * @param messageType - ISO message type string
 * @returns Parsed message info
 */
export function parseISO20022MessageType(messageType: string): {
	domain: string;
	messageId: string;
	description: string;
} {
	const messageInfo: Record<string, { domain: string; description: string }> = {
		'tsmt.001': { domain: 'Trade Services', description: 'Baseline Report' },
		'tsmt.002': { domain: 'Trade Services', description: 'Forward Data Set Submission' },
		'tsmt.003': { domain: 'Trade Services', description: 'Data Set Match Report' },
		'tsmt.012': { domain: 'Trade Services', description: 'Status Report' },
		'trea.001': { domain: 'Treasury', description: 'LC Issuance' },
		'trea.002': { domain: 'Treasury', description: 'LC Amendment' },
		'pain.001': { domain: 'Payments Initiation', description: 'Customer Credit Transfer' },
		'pacs.008': { domain: 'Payments Clearing', description: 'FI Credit Transfer' },
		'camt.053': { domain: 'Cash Management', description: 'Bank Statement' },
	};
	
	const info = messageInfo[messageType.toLowerCase()];
	
	return {
		domain: info?.domain || 'Unknown',
		messageId: messageType,
		description: info?.description || 'Unknown message type',
	};
}

/**
 * Validate ISO 20022 compliance data
 * @param data - Data to validate
 * @param messageType - Expected message type
 * @returns Validation result
 */
export function validateISO20022Data(
	data: Record<string, unknown>,
	messageType: ISO20022MessageType
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	
	// Common required fields
	const requiredFields = ['MessageId', 'CreationDateTime'];
	
	for (const field of requiredFields) {
		if (!data[field]) {
			errors.push(`Missing required field: ${field}`);
		}
	}
	
	// Message-specific validation
	switch (messageType) {
		case ISO20022MessageType.PAIN_001:
			if (!data['PaymentInformation']) {
				errors.push('Missing PaymentInformation for PAIN.001');
			}
			break;
			
		case ISO20022MessageType.TREA_001:
			if (!data['LCDetails']) {
				errors.push('Missing LCDetails for LC Issuance');
			}
			break;
			
		default:
			// Generic validation passed
			break;
	}
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Generate Letter of Credit reference number
 * @param bankCode - Issuing bank code
 * @param year - Year
 * @param sequence - Sequence number
 * @returns LC reference number
 */
export function generateLCReference(
	bankCode: string,
	year: number,
	sequence: number
): string {
	const paddedSequence = sequence.toString().padStart(6, '0');
	return `${bankCode.toUpperCase()}-LC-${year}-${paddedSequence}`;
}

/**
 * Calculate trade finance metrics
 * @param documents - Array of document metadata
 * @returns Metrics summary
 */
export function calculateTradeMetrics(documents: TradeDocumentMetadata[]): {
	totalDocuments: number;
	byType: Record<string, number>;
	totalValue: string;
	currencies: string[];
	avgProcessingTime: number;
} {
	const byType: Record<string, number> = {};
	let totalValueUSD = 0n;
	const currencies = new Set<string>();
	let totalProcessingTime = 0;
	
	for (const doc of documents) {
		// Count by type
		byType[doc.type] = (byType[doc.type] || 0) + 1;
		
		// Sum values (simplified - would need FX rates)
		if (doc.amount) {
			totalValueUSD += BigInt(doc.amount);
		}
		
		// Collect currencies
		if (doc.currency) {
			currencies.add(doc.currency);
		}
		
		// Calculate processing time
		if (doc.expiresAt && doc.issuedAt) {
			totalProcessingTime += doc.expiresAt - doc.issuedAt;
		}
	}
	
	return {
		totalDocuments: documents.length,
		byType,
		totalValue: totalValueUSD.toString(),
		currencies: Array.from(currencies),
		avgProcessingTime: documents.length > 0 
			? totalProcessingTime / documents.length 
			: 0,
	};
}

/**
 * Create supply chain event log
 * @param event - Event type
 * @param assetId - Asset identifier
 * @param location - Event location
 * @param additionalData - Extra event data
 * @returns Encoded event data
 */
export function encodeSupplyChainEvent(
	event: SupplyChainEvent,
	assetId: string,
	location: string,
	additionalData?: Record<string, string>
): string {
	const abiCoder = ethers.AbiCoder.defaultAbiCoder();
	
	return abiCoder.encode(
		['string', 'string', 'string', 'uint256', 'string'],
		[
			event,
			assetId,
			location,
			Math.floor(Date.now() / 1000),
			JSON.stringify(additionalData || {}),
		]
	);
}

/**
 * Validate trade asset status transition
 * @param currentStatus - Current status
 * @param newStatus - Proposed new status
 * @returns True if transition is valid
 */
export function isValidStatusTransition(
	currentStatus: SupplyChainEvent,
	newStatus: SupplyChainEvent
): boolean {
	const validTransitions: Record<SupplyChainEvent, SupplyChainEvent[]> = {
		[SupplyChainEvent.ORDER_PLACED]: [
			SupplyChainEvent.PRODUCTION_STARTED,
		],
		[SupplyChainEvent.PRODUCTION_STARTED]: [
			SupplyChainEvent.PRODUCTION_COMPLETED,
		],
		[SupplyChainEvent.PRODUCTION_COMPLETED]: [
			SupplyChainEvent.QUALITY_INSPECTION,
			SupplyChainEvent.PACKED,
		],
		[SupplyChainEvent.QUALITY_INSPECTION]: [
			SupplyChainEvent.PACKED,
			SupplyChainEvent.PRODUCTION_STARTED, // Rework
		],
		[SupplyChainEvent.PACKED]: [
			SupplyChainEvent.SHIPPED,
		],
		[SupplyChainEvent.SHIPPED]: [
			SupplyChainEvent.IN_TRANSIT,
		],
		[SupplyChainEvent.IN_TRANSIT]: [
			SupplyChainEvent.CUSTOMS_CLEARANCE,
			SupplyChainEvent.ARRIVED_AT_PORT,
		],
		[SupplyChainEvent.CUSTOMS_CLEARANCE]: [
			SupplyChainEvent.ARRIVED_AT_PORT,
			SupplyChainEvent.IN_TRANSIT,
		],
		[SupplyChainEvent.ARRIVED_AT_PORT]: [
			SupplyChainEvent.DELIVERED,
		],
		[SupplyChainEvent.DELIVERED]: [
			SupplyChainEvent.RECEIVED,
		],
		[SupplyChainEvent.RECEIVED]: [],
	};
	
	return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Format trade document summary
 * @param metadata - Document metadata
 * @returns Formatted summary string
 */
export function formatDocumentSummary(metadata: TradeDocumentMetadata): string {
	const lines = [
		`Document ID: ${metadata.documentId}`,
		`Type: ${metadata.type}`,
		`Issuer: ${metadata.issuer}`,
		`Issued: ${new Date(metadata.issuedAt * 1000).toISOString()}`,
	];
	
	if (metadata.amount && metadata.currency) {
		lines.push(`Amount: ${metadata.amount} ${metadata.currency}`);
	}
	
	if (metadata.expiresAt) {
		lines.push(`Expires: ${new Date(metadata.expiresAt * 1000).toISOString()}`);
	}
	
	return lines.join('\n');
}
