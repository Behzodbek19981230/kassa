import { useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import {
	Button,
	FormField,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	MultiCombobox,
	RadioGroup,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useNotification,
	type ComboboxLoadParams,
	type ComboboxLoadResult,
} from '@/components/ui';
import { loadBlobIntoTab, openPendingTab } from '@/lib/blob';
import { getApiErrorMessageAsync } from '@/lib/errors';
import { currentYearMonth, MONTH_NAMES } from '@/pages/system/UserPayrollPage/utils';
import { payrollService } from '@/services/payroll/payroll.service';
import { userService } from '@/services/user/user.service';
import { userFullName, type UserListParams } from '@/services/user/user.types';

interface PayrollPdfExportModalProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	/** `export_url` from the tab's `GET /user/`: it already carries the tab's filters and search. */
	exportUrl: string;
	/** The tab's list params, so only the tab's employees can be picked. */
	listParams: UserListParams;
	/** The tab's current search: it is in `export_url` and narrows "Barcha xodimlar". */
	search?: string;
}

/** Month value of the "Butun yil" option: the yearly report is asked for with `month: null`. */
const WHOLE_YEAR = 0;

/**
 * "Xodimlar oyligi hisoboti" PDF for one month or a whole year: every employee of the tab, or only the picked ones.
 * A yearly report of the current year covers January up to this month; a future year has none (400).
 */
export default function PayrollPdfExportModal({ open, setOpen, exportUrl, listParams, search }: PayrollPdfExportModalProps) {
	const { notify } = useNotification();
	const current = currentYearMonth();
	const [year, setYear] = useState(current.year);
	const [month, setMonth] = useState(current.month);
	const [target, setTarget] = useState<'all' | 'selected'>('all');
	const [userIds, setUserIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	const years = Array.from({ length: 6 }, (_, i) => current.year - i);
	const isYearly = month === WHOLE_YEAR;
	const canSubmit = target === 'all' || userIds.length > 0;

	const loadUserOptions = async ({ search: term, page }: ComboboxLoadParams): Promise<ComboboxLoadResult> => {
		const result = await userService.list({
			...listParams,
			search: term || undefined,
			page,
			limit: 20,
		});
		return {
			options: result.results.map((u) => ({ value: String(u.id), label: userFullName(u) })),
			hasMore: result.pagination.currentPage < result.pagination.lastPage,
		};
	};

	async function handleExport() {
		if (!canSubmit || loading) return;
		// Opened before the request so the browser still counts it as a user-initiated popup.
		const tab = openPendingTab();
		setLoading(true);
		try {
			const blob = await payrollService.exportEmployeesPdf(exportUrl, {
				year,
				month: isYearly ? null : month,
				// Picked employees are exported as they are: the tab's search would reject those it doesn't match.
				...(target === 'selected' ? { users: userIds.map(Number), search: null } : { users: [] }),
			});
			loadBlobIntoTab(blob, tab);
			setOpen(false);
		} catch (err) {
			tab?.close();
			notify({ title: 'Xatolik', text: await getApiErrorMessageAsync(err, "PDF yuklab bo'lmadi") });
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal open={open} onOpenChange={setOpen}>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>Xodimlar oyligi hisoboti (PDF)</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<div className='grid grid-cols-2 gap-3'>
						<FormField horizontal={false} label='Yil'>
							<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{years.map((y) => (
										<SelectItem key={y} value={String(y)}>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormField>
						<FormField horizontal={false} label='Oy'>
							<Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={String(WHOLE_YEAR)}>Butun yil</SelectItem>
									{MONTH_NAMES.map((name, i) => (
										<SelectItem key={name} value={String(i + 1)}>
											{name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormField>
					</div>

					{isYearly && (
						<p className='mb-4 -mt-2 text-xs text-ca-text'>
							{year === current.year
								? `Yillik hisobot: Yanvar – ${MONTH_NAMES[current.month - 1]} ${year}`
								: `Yillik hisobot: ${year} yil, 12 oy`}
						</p>
					)}

					<FormField horizontal={false} label='Xodimlar'>
						<RadioGroup
							name='payroll-pdf-target'
							value={target}
							onChange={(v) => setTarget(v as 'all' | 'selected')}
							inline
							options={[
								{ value: 'all', label: 'Barcha xodimlar' },
								{ value: 'selected', label: 'Tanlangan xodimlar' },
							]}
						/>
					</FormField>

					{target === 'selected' && (
						<FormField horizontal={false} label='Xodimlarni tanlang'>
							<MultiCombobox
								value={userIds}
								onChange={setUserIds}
								loadOptions={loadUserOptions}
								placeholder='Tanlang...'
								searchPlaceholder='Qidirish...'
							/>
						</FormField>
					)}

					{target === 'all' && search && (
						<p className='text-xs text-ca-text'>Faqat qidiruvga mos xodimlar: «{search}»</p>
					)}
				</ModalBody>
				<ModalFooter>
					<Button variant='white' onClick={() => setOpen(false)}>
						Bekor qilish
					</Button>
					<Button variant='danger' onClick={handleExport} loading={loading} disabled={!canSubmit}>
						<FaFilePdf className='mr-1.5' /> PDF yuklash
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
