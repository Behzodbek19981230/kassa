import { FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PreviewRow } from '@/pages/kassa/KassaClosePage/closeForm';
import { InfoStrip, KTable, KTd, KTh } from '@/pages/kassa/shared';
import { channelLabel, fmtAmount, fmtSigned } from '@/pages/kassa/utils';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** "Dastavka sotuvchisi": the kassa being closed. */
	typeLabel: string;
	rows: PreviewRow[];
	diffCount: number;
	isInitial: boolean;
	/** "17.11.2026 19:45": when the new period starts. */
	newPeriodStart: string;
	/** Server's 409 message: the kassa changed after the form was opened. */
	conflict: string | null;
	submitting: boolean;
	onConfirm: () => void;
}

/** 04: last look at the counted amounts before the closing is written (it can't be edited afterwards). */
export default function ConfirmCloseModal({
	open,
	onOpenChange,
	typeLabel,
	rows,
	diffCount,
	isInitial,
	newPeriodStart,
	conflict,
	submitting,
	onConfirm,
}: Props) {
	return (
		<Modal open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
			<ModalContent className='max-w-190'>
				<ModalHeader>
					<ModalTitle className='flex items-center gap-2.5'>
						<span className='flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-500'>
							<FaExclamationTriangle />
						</span>
						<span>
							{isInitial ? "Boshlang'ich qoldiqni tasdiqlang" : 'Kassani topshirishni tasdiqlang'}
							<span className='block text-xs font-normal text-ca-text'>Kassa: {typeLabel}</span>
						</span>
					</ModalTitle>
				</ModalHeader>
				<ModalBody className='space-y-3'>
					{conflict && (
						<InfoStrip tone='red'>
							<b>Forma ochilgandan keyin kassa o'zgardi.</b> "Dasturda" va "Farq" ustunlari yangi summalar bilan
							yangilandi — tekshirib, qayta tasdiqlang.
							<span className='mt-1 block text-ca-text'>{conflict}</span>
						</InfoStrip>
					)}
					<InfoStrip tone='orange'>
						{isInitial ? (
							<>Sanalgan summalar kassaning boshlang'ich qoldig'i sifatida yoziladi. </>
						) : diffCount > 0 ? (
							<>{diffCount} ta kanalda farq bor. </>
						) : (
							<>Barcha kanallar dasturdagi summa bilan mos. </>
						)}
						Tasdiqlangandan keyin topshirish <b>o'zgartirilmaydi</b>, yangi davr {newPeriodStart} dan boshlanadi.
					</InfoStrip>

					<KTable>
						<thead>
							<tr>
								<KTh>Kanal</KTh>
								{!isInitial && <KTh align='right'>Dasturda</KTh>}
								<KTh align='right'>Qo'limda</KTh>
								{!isInitial && <KTh align='right'>Farq</KTh>}
								<KTh align='right'>Topshirildi</KTh>
								<KTh align='right'>Qoldiq</KTh>
							</tr>
						</thead>
						<tbody>
							{rows.map((r) => (
								<tr key={r.channel.code}>
									<KTd>{channelLabel(r.channel, true)}</KTd>
									{!isInitial && <KTd align='right'>{fmtAmount(r.expected)}</KTd>}
									<KTd align='right'>{fmtAmount(r.actual)}</KTd>
									{!isInitial && (
										<KTd
											align='right'
											className={cn(
												(r.diff ?? 0) < 0 && 'text-red-500',
												(r.diff ?? 0) > 0 && 'text-emerald-500',
											)}
										>
											{fmtSigned(r.diff)}
										</KTd>
									)}
									<KTd align='right'>{fmtAmount(r.handed)}</KTd>
									<KTd align='right'>{fmtAmount(r.rest)}</KTd>
								</tr>
							))}
						</tbody>
					</KTable>

					{!conflict && !isInitial && (
						<InfoStrip tone='red'>
							Agar shu oynani ochganingizdan keyin yangi buyurtma/qarz/xarajat kiritilgan bo'lsa, server "Dasturda"
							summasini qayta hisoblaydi va farq o'zgarganini aytib, qayta tasdiq so'raydi.
						</InfoStrip>
					)}
				</ModalBody>
				<ModalFooter>
					<div className='flex gap-2'>
						<Button type='button' variant='white' size='sm' disabled={submitting} onClick={() => onOpenChange(false)}>
							Ortga
						</Button>
						<Button type='button' variant='success' size='sm' loading={submitting} onClick={onConfirm}>
							{!submitting && <FaCheck className='mr-1.5' />} Tasdiqlayman
						</Button>
					</div>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
