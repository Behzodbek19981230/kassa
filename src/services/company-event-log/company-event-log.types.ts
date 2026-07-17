import type { ListParams } from '@/services/api/types';

export type CompanyEventLogAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface CompanyEventLogChangedField {
	old: unknown;
	new: unknown;
}

export interface CompanyEventLogItem {
	id: number;
	company: number;
	company_name: string;
	event_type: string;
	action: CompanyEventLogAction;
	app_label: string;
	model_name: string;
	object_id: string;
	object_label: string;
	user: number | null;
	user_username: string | null;
	user_label: string | null;
	old_values: Record<string, unknown> | null;
	new_values: Record<string, unknown> | null;
	changed_fields: Record<string, CompanyEventLogChangedField> | null;
	metadata: Record<string, unknown> | null;
	created_time: string;
}

export interface CompanyEventLogListParams extends ListParams {
	company?: number;
	event_type?: string;
	action?: CompanyEventLogAction;
	app_label?: string;
	model_name?: string;
	object_id?: string | number;
	user?: number;
	start_date?: string;
	end_date?: string;
}
