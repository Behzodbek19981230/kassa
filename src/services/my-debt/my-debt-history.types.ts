import type { ListParams } from '@/services/api/types';
import type { MyDebtCompanyDetail, MyDebtItem, MyDebtUserDetail } from '@/services/my-debt/my-debt.types';

export interface MyDebtHistoryItem {
	id: number;
	company_detail: MyDebtCompanyDetail;
	my_total_debt_detail: MyDebtItem;
	created_by_detail: MyDebtUserDetail | null;
	updated_by_detail: MyDebtUserDetail | null;
	created_time: string;
	updated_time: string;
	cr_date: string;
	total_debt: string;
	discount_amount: string;
	exchange_rate: string;
	all_summ_dollar: string;
	created_by: number;
	updated_by: number | null;
	company: number;
	my_total_debt: number;
}

export interface MyDebtHistoryListParams extends ListParams {
	my_total_debt?: number;
}
