import type { ListParams } from '@/services/api/types';

export interface UserColumn {
	id: number;
	user: number;
	key: string;
	text: string;
}

export interface UserColumnListParams extends ListParams {
	user?: number;
	key?: string;
}

export interface UserColumnPayload {
	user: number;
	key: string;
	text: string;
}
