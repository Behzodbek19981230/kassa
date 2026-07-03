import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
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
	const location = useLocation();
	const [remember, setRemember] = useState(false);
	const [formError, setFormError] = useState('');
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
			const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
			navigate(redirectTo, { replace: true });
		} catch (err) {
			const message = isAxiosError(err)
				? ((err.response?.data as { detail?: string } | undefined)?.detail ?? 'Invalid username or password')
				: 'Login failed';
			setFormError(message);
		}
	});

	return (
		<div className='flex min-h-screen items-center justify-center bg-ca-body px-4 py-16'>
			<div className='w-full max-w-[450px]'>
				<div className='relative mb-0 px-2.5 w-full justify-center flex'>
					<img src='/logo.png' alt='Logo' className='mr-2  h-32 ' />
				</div>

				<div className='rounded-[3px] border border-ca-border bg-white px-10 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'>
					{formError && (
						<div className='mb-5 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs text-ca-red'>
							{formError}
						</div>
					)}

					<form onSubmit={onSubmit} noValidate>
						<div className='mb-5'>
							<input
								type='text'
								placeholder='Username'
								autoComplete='username'
								className='h-[46px] w-full rounded-[3px] border border-ca-border bg-white px-3 text-sm text-ca-heading placeholder-ca-text/70 focus:border-ca-theme focus:outline-none'
								{...register('username')}
							/>
							{errors.username && (
								<p className='mt-1 text-[11px] text-ca-red'>{errors.username.message}</p>
							)}
						</div>
						<div className='mb-5'>
							<input
								type='password'
								placeholder='Password'
								autoComplete='current-password'
								className='h-[46px] w-full rounded-[3px] border border-ca-border bg-white px-3 text-sm text-ca-heading placeholder-ca-text/70 focus:border-ca-theme focus:outline-none'
								{...register('password')}
							/>
							{errors.password && (
								<p className='mt-1 text-[11px] text-ca-red'>{errors.password.message}</p>
							)}
						</div>
						<label className='mb-5 flex cursor-pointer items-center gap-2 text-xs text-ca-text'>
							<input
								type='checkbox'
								checked={remember}
								onChange={(e) => setRemember(e.target.checked)}
								className='h-4 w-4 rounded-sm border-ca-border bg-white accent-ca-theme'
							/>
							Remember Me
						</label>
						<Button type='submit' variant='success' size='lg' className='w-full' disabled={isSubmitting}>
							{isSubmitting ? 'Signing in…' : 'Sign me in'}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
