'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Password, Checkbox, Button, Input, Text } from 'rizzui';
import { useMedia } from '@core/hooks/use-media';
import { Form } from '@core/ui/form';
import { routes } from '@/config/routes';
import { useAuth } from '@/lib/auth-context';

const initialValues = {
  email: '',
  password: '',
  rememberMe: false,
};

type SignInFormData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export default function SignInForm() {
  const router = useRouter();
  const isMedium = useMedia('(max-width: 1200px)', false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { user, loading, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      await login(data.email, data.password);
      // Note: Don't set isLoading to false here - redirect will happen via useEffect
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.';
      setSubmitError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form<SignInFormData>
        onSubmit={onSubmit}
        useFormProps={{
          mode: 'onChange',
          defaultValues: initialValues,
        }}
      >
        {({ register, formState: { errors } }) => (
          <div className="space-y-5 lg:space-y-6">
            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}
            <Input
              type="email"
              size="lg"
              label="Email"
              placeholder="Enter your email"
              className="[&>label>span]:font-medium"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              error={errors.email?.message}
            />
            <Password
              label="Password"
              placeholder="Enter your password"
              size="lg"
              className="[&>label>span]:font-medium"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              error={errors.password?.message}
            />

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
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        )}
      </Form>
    </>
  );
}
