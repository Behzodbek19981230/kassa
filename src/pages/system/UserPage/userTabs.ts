import {
	isSystemUser,
	USER_TYPE,
	type EmployeeType,
	type User,
	type UserListParams,
} from '@/services/user/user.types';

/** The "Hodimlar" page's tabs, in display order; the active one lives in the URL (`?tab=`). */
export const USER_TABS = ['system', 'store', 'sklad', 'archive'] as const;
export type UserTab = (typeof USER_TABS)[number];

export const USER_TAB_CONFIG: Record<
	UserTab,
	{
		label: string;
		/** What the tab's list asks `GET /user/` for. */
		params: UserListParams;
		/** Tab 2 / Tab 3 add account-only employees of this type; the form sends it itself. */
		employeeType?: EmployeeType;
	}
> = {
	system: { label: 'Tizim foydalanuvchilari', params: { is_system_user: true, is_active: true } },
	store: {
		label: "Oddiy Do'kon Hodim",
		params: { type: USER_TYPE.STORE_EMPLOYEE, is_active: true },
		employeeType: USER_TYPE.STORE_EMPLOYEE,
	},
	sklad: {
		label: 'Oddiy Sklad Hodim',
		params: { type: USER_TYPE.SKLAD_EMPLOYEE, is_active: true },
		employeeType: USER_TYPE.SKLAD_EMPLOYEE,
	},
	archive: { label: 'Arxiv hodimlar', params: { is_active: false } },
};

export function isUserTab(value: string | null): value is UserTab {
	return (USER_TABS as readonly string[]).includes(value ?? '');
}

/** The tab a user is listed in. */
export function getUserTab(user: Pick<User, 'is_active' | 'is_system_user' | 'type'>): UserTab {
	if (!user.is_active) return 'archive';
	if (isSystemUser(user)) return 'system';
	return user.type === USER_TYPE.STORE_EMPLOYEE ? 'store' : 'sklad';
}
