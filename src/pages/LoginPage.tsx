import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaLock, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui';
import { setSession } from '@/lib/auth';
import { useLoginMutation } from '@/services/auth/auth.queries';
import { isAxiosError } from 'axios';

const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const navigate = useNavigate();
	const [remember, setRemember] = useState(false);
	const [formError, setFormError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const loginMutation = useLoginMutation();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: { username: '', password: '' },
	});

	const onSubmit = handleSubmit(async ({ username, password }) => {
		setFormError('');
		try {
			const tokens = await loginMutation.mutateAsync({ username, password });
			setSession(tokens, remember);
			const redirectTo = '/warehouse-products';
			navigate(redirectTo, { replace: true });
		} catch (err) {
			const message = isAxiosError(err)
				? ((err.response?.data as { detail?: string } | undefined)?.detail ?? 'Invalid username or password')
				: 'Login failed';
			setFormError(message);
		}
	});

	return (
		<div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#245a94] via-ca-theme to-[#5fb3e8] px-4 py-16'>
			<div className='pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl' />
			<div className='pointer-events-none absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-ca-theme-dark/30 blur-3xl' />
			<div className='pointer-events-none absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl' />

			<div className='relative w-full max-w-105'>
				<div className='rounded-2xl border border-white/40 bg-white/95 px-8 py-9 shadow-[0_20px_50px_rgba(15,23,42,0.3)] backdrop-blur-sm'>
					<div className='my-0 flex w-full justify-center'>
						<img src='/logo.png' alt='Logo' className='h-16 w-full object-cover' />
					</div>
					<div className='mb-6 text-center'>
						<h1 className='text-lg font-semibold text-ca-heading'>Xush kelibsiz</h1>
						<p className='mt-1 text-xs text-ca-text'>Tizimga kirish uchun ma'lumotlaringizni kiriting</p>
					</div>

					{formError && (
						<div className='mb-5 flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-xs text-ca-red'>
							<FaExclamationCircle className='shrink-0' />
							{formError}
						</div>
					)}

					<form onSubmit={onSubmit} noValidate>
						<div className='mb-4'>
							<div className='relative'>
								<FaUser className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ca-text/50' />
								<input
									type='text'
									placeholder='Login'
									autoComplete='username'
									className='h-11.5 w-full rounded-lg border border-ca-border bg-ca-silver pl-10 pr-3 text-sm text-ca-heading placeholder-ca-text/60 transition-colors focus:border-ca-theme focus:bg-white focus:outline-none focus:ring-4 focus:ring-ca-theme/10'
									{...register('username')}
								/>
							</div>
							{errors.username && (
								<p className='mt-1.5 text-[11px] text-ca-red'>{errors.username.message}</p>
							)}
						</div>
						<div className='mb-5'>
							<div className='relative'>
								<FaLock className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ca-text/50' />
								<input
									type={showPassword ? 'text' : 'password'}
									placeholder='Parol'
									autoComplete='current-password'
									className='h-11.5 w-full rounded-lg border border-ca-border bg-ca-silver pl-10 pr-10 text-sm text-ca-heading placeholder-ca-text/60 transition-colors focus:border-ca-theme focus:bg-white focus:outline-none focus:ring-4 focus:ring-ca-theme/10'
									{...register('password')}
								/>
								<button
									type='button'
									onClick={() => setShowPassword((prev) => !prev)}
									aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
									className='absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-ca-text/50 hover:text-ca-theme focus:outline-none'
								>
									{showPassword ? <FaEyeSlash /> : <FaEye />}
								</button>
							</div>
							{errors.password && (
								<p className='mt-1.5 text-[11px] text-ca-red'>{errors.password.message}</p>
							)}
						</div>
						<label className='mb-5 flex cursor-pointer items-center gap-2 text-xs text-ca-text select-none'>
							<input
								type='checkbox'
								checked={remember}
								onChange={(e) => setRemember(e.target.checked)}
								className='h-4 w-4 rounded-sm border-ca-border bg-white accent-ca-theme'
							/>
							Meni eslab qol
						</label>
						<Button
							type='submit'
							variant='theme'
							size='lg'
							className='w-full shadow-[0_8px_20px_rgba(52,143,226,0.35)]'
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Kirilmoqda…' : 'Kirish'}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
