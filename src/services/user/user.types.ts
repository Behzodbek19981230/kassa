import type { ListParams } from '@/services/api/types';

export interface UserRegionDetail {
	id: number;
	name: string;
}

export interface UserDistrictDetail {
	id: number;
	name: string;
}

export interface UserRoleDetail {
	id: number;
	name: string;
}

export interface UserCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
}

export interface User {
	id: number;
	username: string;
	first_name: string;
	last_name: string;
	second_name: string | null;
	gender: string | null;
	date_of_birthday: string | null;
	phone_number: string;
	email: string;
	is_active: boolean;
	date_joined: string;
	role: number | null;
	roles?: UserRoleDetail | null;
	type: number | null;
	region: number | null;
	region_detail?: UserRegionDetail | null;
	district: number | null;
	district_detail?: UserDistrictDetail | null;
	trade_company?: number | null;
	trade_company_detail?: UserCompanyDetail | null;
	current_company?: number | null;
	current_company_detail?: UserCompanyDetail | null;
	companies: number[];
	companies_detail?: UserCompanyDetail[];
	address: string | null;
	avatar: string | null;
	is_login_blocked: boolean;
	send_bot_type: string | null;
	is_send_bot: boolean;
	telegram_connect_code: string | null;
	telegram_id: string | number | null;
}

export interface UserTelegramBotRegisterPayload {
	send_bot_type: string;
	is_send_bot: boolean;
}

export interface UserPayload {
	username: string;
	first_name: string;
	last_name: string;
	second_name: string;
	gender: string;
	date_of_birthday: string;
	phone_number: string;
	email: string;
	is_active: boolean;
	region: number;
	district: number;
	role: number;
	type?: number;
	trade_company?: number;
	current_company?: number;
	companies: number[];
	address: string;
	password?: string;
}

export interface UserListParams extends ListParams {
	is_login_blocked?: boolean;
}

// users_user.type — hodim turi (role'dan alohida).
export const USER_TYPE_OPTIONS = [
	{ value: '1', label: "Do'kon sotuvchisi" },
	{ value: '2', label: 'Sklad sotuvchisi' },
	{ value: '3', label: 'Dastavka sotuvchisi' },
];
