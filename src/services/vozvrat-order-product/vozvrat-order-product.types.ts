export interface VozvratOrderProductCreatePayload {
	vozvrat_order: number;
	warehouse: number;
	count: number;
	price: string | number;
}

export interface VozvratOrderProductItem {
	id: number;
	vozvrat_order: number;
	warehouse: number;
	count: number;
	price: string;
}
