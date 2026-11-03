import { useNavigate, useSearchParams } from 'react-router-dom';
import SalaryPaymentForm from '@/pages/PayrollPage/SalaryPaymentForm';
import { useYearMonthParams } from '@/pages/PayrollPage/shared/utils';

export default function SalaryPaymentPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [ym, setYm] = useYearMonthParams();
	const userId = Number(searchParams.get('user')) || undefined;

	const setUser = (id: number | undefined) =>
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				if (id) params.set('user', String(id));
				else params.delete('user');
				return params;
			},
			{ replace: true },
		);

	return (
		<>
			<div className='mb-5 flex items-center gap-3'>
				<span className='h-9 w-1.5 rounded-full bg-emerald-600' />
				<h1 className='text-2xl font-bold text-ca-heading'>Pul berish</h1>
			</div>
			<SalaryPaymentForm
				userId={userId}
				onUserChange={setUser}
				ym={ym}
				onYmChange={setYm}
				onCancel={() => navigate(-1)}
			/>
		</>
	);
}
