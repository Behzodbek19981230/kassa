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
	/** Stable role identifier (e.g. 'super_admin'); compare against this, not `name`. */
	key: string;
	sorting?: number;
}

export interface UserCompanyDetail {
	id: number;
	name: string;
	logo: string | null;
	/** false → the company doesn't use Logistika: its menu and the yuan rate are hidden. */
	is_logistika?: boolean;
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
	/** false → archived ("Arxiv hodimlar" tab). Read-only: it changes only through `archive/` and `restore/`. */
	is_active: boolean;
	/** false for account-only employees (type 4 / 5), who have no login. */
	is_system_user?: boolean;
	date_joined: string;
	role: number | null;
	roles?: UserRoleDetail | null;
	type: number | null;
	type_name?: string | null;
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
	login_blocked_at?: string | null;
	failed_login_attempts?: number;
	send_bot_type: string | null;
	is_send_bot: boolean;
	telegram_connect_code: string | null;
	telegram_id: string | number | null;
	/** Monthly salary in dollars (`"600.00"`). Change it through `POST /payroll/rate/update/` so history is kept. */
	oylik_dollar?: string;
	/** Monthly salary in so'm (`"2500000.00"`). */
	oylik_som?: string;
	/** Sklad turlari (TypeSklad, many-to-many). Ids, or `{ id, name }` objects when the backend expands them. */
	type_sklads?: (number | UserTypeSkladDetail)[];
	type_sklads_detail?: UserTypeSkladDetail[];
}

export interface UserTypeSkladDetail {
	id: number;
	name: string;
}

/** The user's sklad type ids, whether `type_sklads` holds ids or expanded objects. */
export function getUserTypeSkladIds(user: Pick<User, 'type_sklads'>): number[] {
	return (user.type_sklads ?? []).map((t) => (typeof t === 'number' ? t : t.id));
}

/** Current month's salary status across employees, sent alongside `GET /user/`. */
export interface UserPayrollSummary {
	year: number;
	month: number;
	total_employees: number;
	fully_paid: number;
	partially_paid: number;
	unpaid: number;
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
	region: number;
	district: number;
	role: number;
	/** null → no type (sent as an empty value); undefined → left out. */
	type?: number | null;
	trade_company?: number;
	current_company?: number;
	companies: number[];
	/** Omit to leave the user's sklad types untouched (the field isn't appended to the form data). */
	type_sklads?: number[];
	address: string;
	password?: string;
	/** Only sent when creating a user; later changes go through the payroll rate endpoint. */
	oylik_dollar?: string;
	oylik_som?: string;
}

/**
 * An account-only employee (Tab 2 / Tab 3): no login, so no `username`, `password` or `role` —
 * the backend generates the username and answers 400 if a role or password is sent.
 */
export interface EmployeePayload {
	/** Create only; the type can't be changed afterwards. */
	type?: EmployeeType;
	first_name: string;
	last_name: string;
	second_name: string;
	phone_number: string;
	/** Optional fields: an empty string / null clears them. */
	gender: string;
	date_of_birthday: string;
	region: number | null;
	district: number | null;
	address: string;
	/** Create only; later changes go through the payroll rate endpoint. */
	oylik_dollar?: string;
	oylik_som?: string;
}

export interface UserListParams extends ListParams {
	is_login_blocked?: boolean;
	/** true → users who log in (Tab 1); false → account-only employees (Tab 2 + 3). */
	is_system_user?: boolean;
	/** false → the archive (Tab 4). */
	is_active?: boolean;
	type?: number;
	/** Several types, comma-separated: `'4,5'`. */
	type__in?: string;
}

/** Users who can appear as the author of a record (history filters, name lookups); archived ones only reach Super Admin. */
export const SYSTEM_USER_PARAMS = { is_system_user: true } as const satisfies UserListParams;
/** Users who can be picked for something new (dropdowns): active system users. Open to every role. */
export const ACTIVE_SYSTEM_USER_PARAMS = { is_system_user: true, is_active: true } as const satisfies UserListParams;

// users_user.type — hodim turi (role'dan alohida).
export const USER_TYPE = {
	STORE_SELLER: 1,
	SKLAD_SELLER: 2,
	DELIVERY_SELLER: 3,
	/** "Oddiy Sklad Hodim": account-only employee, Tab 3. */
	SKLAD_EMPLOYEE: 4,
	/** "Oddiy Do'kon Hodim": account-only employee, Tab 2. */
	STORE_EMPLOYEE: 5,
} as const;

export type EmployeeType = typeof USER_TYPE.SKLAD_EMPLOYEE | typeof USER_TYPE.STORE_EMPLOYEE;

export function isEmployeeType(type: number | null | undefined): type is EmployeeType {
	return type === USER_TYPE.SKLAD_EMPLOYEE || type === USER_TYPE.STORE_EMPLOYEE;
}

/** Whether the user logs in (Tab 1) rather than being an account-only employee (Tab 2 / 3). */
export function isSystemUser(user: Pick<User, 'type' | 'is_system_user'>) {
	return user.is_system_user ?? !isEmployeeType(user.type);
}

/** Types a system user (Tab 1) may have; leaving it empty sends `null`. Types 4 and 5 are never offered here. */
export const USER_TYPE_OPTIONS = [
	{ value: String(USER_TYPE.STORE_SELLER), label: "Do'kon sotuvchisi" },
	{ value: String(USER_TYPE.SKLAD_SELLER), label: 'Sklad sotuvchisi' },
	{ value: String(USER_TYPE.DELIVERY_SELLER), label: 'Dastavka sotuvchisi' },
];

export const USER_TYPE_LABELS: Record<number, string> = {
	...Object.fromEntries(USER_TYPE_OPTIONS.map((o) => [Number(o.value), o.label])),
	[USER_TYPE.SKLAD_EMPLOYEE]: 'Oddiy Sklad Hodim',
	[USER_TYPE.STORE_EMPLOYEE]: "Oddiy Do'kon Hodim",
};

/** "Familiya Ism", or the login when both are empty. */
export function userFullName(user: Pick<User, 'first_name' | 'last_name' | 'username'>) {
	return `${user.last_name ?? ''} ${user.first_name ?? ''}`.trim() || user.username;
}
