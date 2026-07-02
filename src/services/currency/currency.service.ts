import axios from 'axios'
import type { CurrencyRate } from '@/services/currency/currency.types'

const CBU_RATES_URL = 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/'

interface CbuRateEntry {
	Ccy: string
	Rate: string
	Diff: string
	Date: string
}

export const currencyService = {
	getRate: async (code = 'USD'): Promise<CurrencyRate | null> => {
		const { data } = await axios.get<CbuRateEntry[]>(CBU_RATES_URL)
		const entry = data.find((item) => item.Ccy === code)
		if (!entry) return null
		return {
			code: entry.Ccy,
			ccy: entry.Ccy,
			rate: Number(entry.Rate),
			diff: Number(entry.Diff),
			date: entry.Date,
		}
	},
}
