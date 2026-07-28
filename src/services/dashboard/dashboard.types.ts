export interface DashboardCards {
	clients_count: number;
	debtor_clients_count: number;
	products_count: number;
	warehouse_items_count: number;
	users_count: number;
}

export interface DashboardMonthlyItem {
	month: number;
	month_label: string;
	order_all_product_sum: string;
	order_all_summ_dollar: string;
	debt_repayment_all_summ_dollar: string;
}

export interface DashboardStatisticsResponse {
	year: number;
	cards: DashboardCards;
	monthly: DashboardMonthlyItem[];
}

export interface DashboardStatisticsParams {
	year?: number;
	company?: number;
}

export interface DashboardUserStatisticsItem {
	user: number;
	user_name: string;
	username: string;
	phone_number: string;
	order_all_summ_dollar: string;
	order_all_product_sum: string;
	order_all_profit_dollar: string;
	debt_repayment_all_summ_dollar: string;
}

export interface DashboardUserStatisticsFilters {
	fromdate: string;
	todate: string;
	company: number | null;
}

export interface DashboardUserStatisticsResponse {
	filters: DashboardUserStatisticsFilters;
	results: DashboardUserStatisticsItem[];
}

export interface DashboardUserStatisticsParams {
	fromdate: string;
	todate: string;
	company?: number;
}
