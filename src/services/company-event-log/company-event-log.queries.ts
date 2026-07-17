import { useQuery } from '@tanstack/react-query';
import { companyEventLogService } from '@/services/company-event-log/company-event-log.service';
import type { CompanyEventLogListParams } from '@/services/company-event-log/company-event-log.types';

export function useCompanyEventLogListQuery(params?: CompanyEventLogListParams) {
	return useQuery({
		queryKey: ['company-event-log', 'list', params] as const,
		queryFn: () => companyEventLogService.list(params),
	});
}

export function useCompanyEventLogQuery(id: number | null) {
	return useQuery({
		queryKey: ['company-event-log', 'detail', id] as const,
		queryFn: () => companyEventLogService.get(id!),
		enabled: id != null,
	});
}
