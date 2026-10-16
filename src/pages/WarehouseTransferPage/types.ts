import type { TransferMode } from '@/services/warehouse-transfer/warehouse-transfer.types';

export interface TransferCartSide {
	/** The product card (warehouse) id sent to the create endpoint. */
	warehouseId: number;
	typeSkladName: string;
	brandName: string;
	categoryName: string;
	size: number;
	typeName: string;
	quantity: number;
}

export interface TransferCartRow {
	key: string;
	mode: TransferMode;
	source: TransferCartSide;
	target: TransferCartSide;
}
