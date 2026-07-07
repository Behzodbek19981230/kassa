import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useCompanyListQuery } from '@/services/company/company.queries';
import { useUserInfoQuery } from '@/services/user/user.queries';

const STORAGE_KEY = 'ca-selected-company';
const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

export interface CompanyOption {
	id: number;
	name: string;
	logo?: string | null;
}

interface CompanyContextValue {
	companyId: number | null;
	setCompanyId: (id: number) => void;
	companies: CompanyOption[];
	isSuperAdmin: boolean;
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

	const { data: allCompaniesData } = useCompanyListQuery({ limit: 100 }, { enabled: isSuperAdmin });

	const companies: CompanyOption[] = useMemo(() => {
		if (isSuperAdmin) {
			return (allCompaniesData?.results ?? []).map((c) => ({ id: c.id, name: c.name, logo: c.logo }));
		}
		return (userInfo?.companies_detail ?? []).map((c) => ({ id: c.id, name: c.name, logo: c.logo }));
	}, [isSuperAdmin, allCompaniesData, userInfo]);

	const [companyId, setCompanyIdState] = useState<number | null>(readStoredCompanyId);

	useEffect(() => {
		if (companies.length === 0) return;
		if (companyId != null && companies.some((c) => c.id === companyId)) return;
		setCompanyIdState(companies[0].id);
	}, [companies, companyId]);

	useEffect(() => {
		if (companyId != null) localStorage.setItem(STORAGE_KEY, String(companyId));
	}, [companyId]);

	const setCompanyId = (id: number) => {
		if (id === companyId) return;
		localStorage.setItem(STORAGE_KEY, String(id));
		window.location.reload();
	};

	const value = useMemo(
		() => ({ companyId, setCompanyId, companies, isSuperAdmin }),
		[companyId, companies, isSuperAdmin],
	);

	return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCurrentCompany() {
	const ctx = useContext(CompanyContext);
	if (!ctx) throw new Error('useCurrentCompany must be used within a CompanyProvider');
	return ctx;
}
0;
