import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useExchangeRateQuery } from '@/services/exchange-rate/exchange-rate.queries';
import type { ExchangeRateItem } from '@/services/exchange-rate/exchange-rate.types';
import { useUpdateUserMutation, useUserInfoQuery } from '@/services/user/user.queries';
import type { UserPayload } from '@/services/user/user.types';

const SUPER_ADMIN_ROLE_NAME = 'Super Admin';
const MANAGER_ROLE_NAME = 'Manager';

export interface CompanyOption {
	id: number;
	name: string;
	logo?: string | null;
}

interface CompanyContextValue {
	companyId: number | null;
	setCompanyId: (id: number) => Promise<void>;
	companies: CompanyOption[];
	isSuperAdmin: boolean;
	isManager: boolean;
	/** Super Admin or Manager: sees the company selector and can browse other companies' data. */
	isAdminOrManager: boolean;
	/** The company the current user actually belongs to (their own trade_company). */
	ownCompanyId: number | null;
	/** Detail (name/logo) of the user's own trade_company, for display purposes. */
	ownCompany: CompanyOption | null;
	/** Whether the company selector should be shown in the UI. */
	showCompanySelect: boolean;
	/** Whether POST/PUT/PATCH/DELETE actions are allowed for the currently selected company. */
	canWrite: boolean;
	/** Today's exchange rate record for the current company, or null if none has been set yet. */
	exchangeRate: ExchangeRateItem | null;
	/** Whether today's exchange rate has been confirmed (set) for the current company. */
	isExchangeRateSet: boolean;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
	const { data: userInfo } = useUserInfoQuery();
	const isSuperAdmin = userInfo?.roles?.name === SUPER_ADMIN_ROLE_NAME;
	const isManager = userInfo?.roles?.name === MANAGER_ROLE_NAME;
	const isAdminOrManager = isSuperAdmin || isManager;

	const companies: CompanyOption[] = useMemo(() => {
		return (userInfo?.companies_detail ?? []).map((c) => ({ id: c.id, name: c.name, logo: c.logo }));
	}, [userInfo]);

	const ownCompanyId =
		userInfo?.trade_company ?? userInfo?.companies_detail?.[0]?.id ?? userInfo?.companies?.[0] ?? null;
	const tradeCompanyDetail = userInfo?.trade_company_detail;
	const ownCompany: CompanyOption | null = useMemo(() => {
		if (!tradeCompanyDetail) return null;
		return { id: tradeCompanyDetail.id, name: tradeCompanyDetail.name, logo: tradeCompanyDetail.logo };
	}, [tradeCompanyDetail]);

	// current_company tracks the header dropdown's selection and can differ from the
	// user's own trade_company (see setCompanyId below); it falls back to trade_company
	// when the user hasn't browsed to a different company.
	const companyId = userInfo?.current_company ?? ownCompanyId ?? companies[0]?.id ?? null;

	const updateUserMutation = useUpdateUserMutation();

	const setCompanyId = async (id: number) => {
		if (id === companyId) return;

		if (isAdminOrManager && userInfo) {
			const { region, district, role } = userInfo;
			if (region == null || district == null || role == null) {
				throw new Error("Foydalanuvchi ma'lumotlari to'liq emas: viloyat, tuman yoki rol tanlanmagan");
			}
			const payload: UserPayload = {
				username: userInfo.username,
				first_name: userInfo.first_name,
				last_name: userInfo.last_name,
				second_name: userInfo.second_name ?? '',
				gender: userInfo.gender ?? '',
				date_of_birthday: userInfo.date_of_birthday ?? '',
				phone_number: userInfo.phone_number,
				email: userInfo.email,
				is_active: userInfo.is_active,
				region,
				district,
				role,
				trade_company: userInfo.trade_company ?? undefined,
				current_company: id,
				companies: userInfo.companies,
				address: userInfo.address ?? '',
			};
			await updateUserMutation.mutateAsync({ id: userInfo.id, payload });
		}

		window.location.reload();
	};

	const showCompanySelect = isAdminOrManager;

	const { data: exchangeRate, isLoading: isExchangeRateLoading } = useExchangeRateQuery(companyId);
	// Super Admin/Manager set the rate, so the lock never applies to them. While the
	// initial fetch is in flight, don't lock the UI on a guess — wait for a real answer.
	const isExchangeRateSet = isAdminOrManager || isExchangeRateLoading || exchangeRate?.status === true;

	const canWrite = (!isAdminOrManager || companyId === ownCompanyId) && isExchangeRateSet;

	const value = useMemo(
		() => ({
			companyId,
			setCompanyId,
			companies,
			isSuperAdmin,
			isManager,
			isAdminOrManager,
			ownCompanyId,
			ownCompany,
			showCompanySelect,
			canWrite,
			exchangeRate: exchangeRate ?? null,
			isExchangeRateSet,
		}),
		[
			companyId,
			companies,
			isSuperAdmin,
			isManager,
			isAdminOrManager,
			ownCompanyId,
			exchangeRate,
			isExchangeRateSet,
			ownCompany,
			showCompanySelect,
			canWrite,
		],
	);

	return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCurrentCompany() {
	const ctx = useContext(CompanyContext);
	if (!ctx) throw new Error('useCurrentCompany must be used within a CompanyProvider');
	return ctx;
}
0;
