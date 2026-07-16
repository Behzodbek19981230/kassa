import type { ListParams } from '@/services/api/types';

export interface Expense {
	id: number;
	nomi: string;
	summa: number;
	date_cr: string;
	company: number;
	type: number;
}

export interface ExpensePayload {
	nomi: string;
	summa: number;
	date_cr: string;
	company: number;
	type: number;
}

export interface ExpenseListParams extends ListParams {
	type?: number;
}
