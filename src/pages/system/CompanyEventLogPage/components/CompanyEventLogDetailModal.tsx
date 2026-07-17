import {
	Badge,
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui';
import { useCompanyEventLogQuery } from '@/services/company-event-log/company-event-log.queries';

interface CompanyEventLogDetailModalProps {
	id: number | null;
	setId: (id: number | null) => void;
}

function formatDateTime(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	const date = d.toLocaleDateString('ru-RU');
	const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	return `${date} ${time}`;
}

function formatValue(value: unknown) {
	if (value === null || value === undefined) return '-';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

const ACTION_LABEL: Record<string, string> = { CREATE: 'Yaratildi', UPDATE: 'Yangilandi', DELETE: "O'chirildi" };
const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
	CREATE: 'success',
	UPDATE: 'warning',
	DELETE: 'danger',
};

export default function CompanyEventLogDetailModal({ id, setId }: CompanyEventLogDetailModalProps) {
	const { data: item, isLoading } = useCompanyEventLogQuery(id);
	const changedFields = item?.changed_fields ? Object.entries(item.changed_fields) : [];

	return (
		<Modal open={id != null} onOpenChange={(next) => !next && setId(null)}>
			<ModalContent className='max-w-2xl'>
				<ModalHeader>
					<ModalTitle>Voqea tafsilotlari</ModalTitle>
				</ModalHeader>
				<ModalBody className='max-h-[70vh] overflow-y-auto'>
					{isLoading && <p className='text-center'>Yuklanmoqda...</p>}
					{!isLoading && item && (
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-x-4 gap-y-2 text-xs'>
								<div>
									<span className='font-semibold text-ca-heading'>Sana:</span>{' '}
									{formatDateTime(item.created_time)}
								</div>
								<div>
									<span className='font-semibold text-ca-heading'>Amal:</span>{' '}
									<Badge variant={ACTION_VARIANT[item.action] ?? 'default'}>
										{ACTION_LABEL[item.action] ?? item.action}
									</Badge>
								</div>
								<div>
									<span className='font-semibold text-ca-heading'>Event turi:</span>{' '}
									{item.event_type}
								</div>
								<div>
									<span className='font-semibold text-ca-heading'>Obyekt:</span> {item.model_name} #
									{item.object_label}
								</div>
								<div>
									<span className='font-semibold text-ca-heading'>Foydalanuvchi:</span>{' '}
									{item.user_label ?? item.user_username ?? '-'}
								</div>
								<div>
									<span className='font-semibold text-ca-heading'>Kompaniya:</span>{' '}
									{item.company_name}
								</div>
							</div>

							{changedFields.length > 0 && (
								<div>
									<h4 className='mb-1.5 text-xs font-semibold text-ca-heading'>O'zgargan maydonlar</h4>
									<div className='overflow-x-auto'>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className='bg-ca-theme text-white'>Maydon</TableHead>
													<TableHead className='bg-ca-theme text-white'>Eski qiymat</TableHead>
													<TableHead className='bg-ca-theme text-white'>Yangi qiymat</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{changedFields.map(([field, change]) => (
													<TableRow key={field}>
														<TableCell className='font-medium'>{field}</TableCell>
														<TableCell>{formatValue(change.old)}</TableCell>
														<TableCell className='font-semibold'>
															{formatValue(change.new)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</div>
							)}

							{item.metadata && Object.keys(item.metadata).length > 0 && (
								<div>
									<h4 className='mb-1.5 text-xs font-semibold text-ca-heading'>Qo'shimcha ma'lumot</h4>
									<pre className='overflow-x-auto rounded border border-ca-border bg-ca-body p-2 text-[11px] whitespace-pre-wrap'>
										{JSON.stringify(item.metadata, null, 2)}
									</pre>
								</div>
							)}
						</div>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
