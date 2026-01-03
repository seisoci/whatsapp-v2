'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubmitHandler } from 'react-hook-form';
import { Password, Checkbox, Button, Input, Text } from 'rizzui';
import { useMedia } from '@core/hooks/use-media';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { loginSchema, LoginSchema } from '@/validators/login.schema';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import Turnstile, { TurnstileRef } from '@/components/turnstile';

const initialValues: LoginSchema = {
  email: '',
  password: '',
  rememberMe: false,
  turnstileToken: '',
};

export default function SignInForm() {
  const router = useRouter();
  const isMedium = useMedia('(max-width: 1200px)', false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<TurnstileRef>(null);
  const { user, loading, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    if (!turnstileToken) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }

    setIsLoading(true);

    try {
      await login(data.email, data.password, data.rememberMe, turnstileToken);
      toast.success('Login successful!');
      // Redirect will happen in auth context
    } catch (error: any) {
      toast.error(error?.message || 'Login failed. Please check your credentials.');

      setTurnstileToken('');
      turnstileRef.current?.reset();

      setIsLoading(false);
    }
  };

  return (
    <>
      <Form<LoginSchema>
        validationSchema={loginSchema}
        onSubmit={onSubmit}
        useFormProps={{
          mode: 'onChange',
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors }, setValue }) => (
          <div className="space-y-5 lg:space-y-6">
            <Input
              type="email"
              size={isMedium ? 'lg' : 'xl'}
              label="Email"
              placeholder="Enter your email"
              className="[&>label>span]:font-medium"
              {...register('email')}
              error={errors.email?.message}
            />
            <Password
              label="Password"
              placeholder="Enter your password"
              size={isMedium ? 'lg' : 'xl'}
              className="[&>label>span]:font-medium"
              {...register('password')}
              error={errors.password?.message}
            />

            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setValue('turnstileToken', token);
              }}
              onError={() => {
                toast.error('CAPTCHA verification failed. Please try again.');
                setTurnstileToken('');
                setValue('turnstileToken', '');
              }}
              onExpire={() => {
                toast.warning('CAPTCHA expired. Please verify again.');
                setTurnstileToken('');
                setValue('turnstileToken', '');
              }}
              theme="auto"
            />
            {errors.turnstileToken && (
              <p className="text-sm text-red-500">{errors.turnstileToken.message}</p>
            )}

            <div className="flex items-center justify-between pb-1">
              <Checkbox
                {...register('rememberMe')}
                label="Remember Me"
                className="[&>label>span]:font-medium"
              />
              <Link
                href={routes.auth.forgotPassword4}
                className="h-auto p-0 text-sm font-semibold text-gray-700 underline transition-colors hover:text-primary hover:no-underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              className="w-full"
              type="submit"
              size={isMedium ? 'lg' : 'xl'}
              isLoading={isLoading}
              disabled={!turnstileToken}
            >
              Sign In
            </Button>
          </div>
        )}
      </Form>
    </>
  );
}
