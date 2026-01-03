import AuthWrapperFour from '@/app/shared/auth-layout/auth-wrapper-four';
import SignInForm from './sign-in-form';
import { metaObject } from '@/config/site.config';

export const metadata = {
  ...metaObject('Masuk'),
};

export default function SignInPage() {
  return (
    <AuthWrapperFour
      title={
        <>
          Selamat Datang! <br /> Smart ITN
        </>
      }
      isSignIn
      isSocialLoginActive={false}
    >
      <SignInForm />
    </AuthWrapperFour>
  );
}
