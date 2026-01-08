import { routes } from '@/config/routes';
import { DUMMY_ID } from '@/config/constants';

export const pageLinks = [
  {
    name: 'Home',
  },


  {
    name: 'Apps',
  },






  {
    name: 'Access Denied',
    href: routes.accessDenied,
  },
  {
    name: 'Not Found',
    href: routes.notFound,
  },
  {
    name: 'Maintenance',
    href: routes.maintenance,
  },
  {
    name: 'Blank',
    href: routes.blank,
  },
  {
    name: 'Authentication',
  },
  {
    name: 'Modern Sign Up',
    href: routes.auth.signUp1,
  },
  {
    name: 'Vintage Sign Up',
    href: routes.auth.signUp2,
  },
  {
    name: 'Trendy Sign Up',
    href: routes.auth.signUp3,
  },
  {
    name: 'Elegant Sign Up',
    href: routes.auth.signUp4,
  },
  {
    name: 'Classic Sign Up',
    href: routes.auth.signUp5,
  },
  {
    name: 'Modern Sign In',
    href: routes.auth.signIn1,
  },
  {
    name: 'Vintage Sign In',
    href: routes.auth.signIn2,
  },
  {
    name: 'Trendy Sign In',
    href: routes.auth.signIn3,
  },
  {
    name: 'Elegant Sign In',
    href: routes.auth.signIn4,
  },
  {
    name: 'Classic Sign In',
    href: routes.auth.signIn5,
  },
  {
    name: 'Modern Forgot Password',
    href: routes.auth.forgotPassword1,
  },
  {
    name: 'Vintage Forgot Password',
    href: routes.auth.forgotPassword2,
  },
  {
    name: 'Trendy Forgot Password',
    href: routes.auth.forgotPassword3,
  },
  {
    name: 'Elegant Forgot Password',
    href: routes.auth.forgotPassword4,
  },
  {
    name: 'Classic Forgot Password',
    href: routes.auth.forgotPassword5,
  },
  {
    name: 'Modern OTP Page',
    href: routes.auth.otp1,
  },
  {
    name: 'Vintage OTP Page',
    href: routes.auth.otp2,
  },
  {
    name: 'Trendy OTP Page',
    href: routes.auth.otp3,
  },
  {
    name: 'Elegant OTP Page',
    href: routes.auth.otp4,
  },
  {
    name: 'Classic OTP Page',
    href: routes.auth.otp5,
  },
];
