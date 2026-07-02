import { useQuery } from '@tanstack/react-query'
import { currencyService } from '@/services/currency/currency.service'

export function useCurrencyRateQuery(code = 'USD') {
	return useQuery({
		queryKey: ['currency', 'rate', code],
		queryFn: () => currencyService.getRate(code),
		staleTime: 60 * 60 * 1000,
		refetchOnWindowFocus: false,
	})
}
