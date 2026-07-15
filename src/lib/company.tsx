import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCompanyListQuery } from '@/services/company/company.queries';
import { useUpdateUserMutation, useUserInfoQuery } from '@/services/user/user.queries';
import type { UserPayload } from '@/services/user/user.types';

const STORAGE_KEY = 'ca-selected-company';
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
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

function readStoredCompanyId(): number | null {
	const stored = localStorage.getItem(STORAGE_KEY);
	const parsed = stored ? Number(stored) : NaN;
	return Number.isFinite(parsed) ? parsed : null;
}

export function CompanyProvider({ children }: { children: ReactNode }) {
	const { data: userInfo } = useUserInfoQuery();
	const isSuperAdmin = userInfo?.roles?.name === SUPER_ADMIN_ROLE_NAME;
	const isManager = userInfo?.roles?.name === MANAGER_ROLE_NAME;
	const isAdminOrManager = isSuperAdmin || isManager;

	const { data: allCompaniesData } = useCompanyListQuery({ limit: 100 }, { enabled: isAdminOrManager });

	const companies: CompanyOption[] = useMemo(() => {
		if (isAdminOrManager) {
			return (allCompaniesData?.results ?? []).map((c) => ({ id: c.id, name: c.name, logo: c.logo }));
		}
		return (userInfo?.companies_detail ?? []).map((c) => ({ id: c.id, name: c.name, logo: c.logo }));
	}, [isAdminOrManager, allCompaniesData, userInfo]);

	const ownCompanyId = userInfo?.trade_company ?? userInfo?.companies_detail?.[0]?.id ?? userInfo?.companies?.[0] ?? null;
	const tradeCompanyDetail = userInfo?.trade_company_detail;
	const ownCompany: CompanyOption | null = useMemo(() => {
		if (!tradeCompanyDetail) return null;
		return { id: tradeCompanyDetail.id, name: tradeCompanyDetail.name, logo: tradeCompanyDetail.logo };
	}, [tradeCompanyDetail]);

	const [companyId, setCompanyIdState] = useState<number | null>(readStoredCompanyId);

	useEffect(() => {
		if (companies.length === 0) return;
		if (companyId != null && companies.some((c) => c.id === companyId)) return;
		setCompanyIdState(companies[0].id);
	}, [companies, companyId]);

	useEffect(() => {
		if (companyId != null) localStorage.setItem(STORAGE_KEY, String(companyId));
	}, [companyId]);

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
				trade_company: id,
				companies: userInfo.companies,
				address: userInfo.address ?? '',
			};
			await updateUserMutation.mutateAsync({ id: userInfo.id, payload });
		}

		localStorage.setItem(STORAGE_KEY, String(id));
		window.location.reload();
	};

	const showCompanySelect = isAdminOrManager;
	const canWrite = !isAdminOrManager || companyId === ownCompanyId;

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
		}),
		[
			companyId,
			companies,
			isSuperAdmin,
			isManager,
			isAdminOrManager,
			ownCompanyId,
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
