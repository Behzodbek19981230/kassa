import type { ListParams } from '@/services/api/types';

export interface Country {
	id: number;
	name: string;
}

export interface CountryPayload {
	name: string;
   code: string;
}

export type CountryListParams = ListParams;
