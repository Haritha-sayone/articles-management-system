import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password')
});

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create a new account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
      
      <Formik
        initialValues={{
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await signup(values.username, values.email, values.password);
            navigate('/');
          } catch (err: any) {
            toast.error(err.message || 'Failed to create account');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <Field
              as={Input}
              label="Username"
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Choose a username"
              error={touched.username && errors.username}
              icon={<User className="h-5 w-5 text-gray-400" />}
            />
            
            <Field
              as={Input}
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              error={touched.email && errors.email}
              icon={<Mail className="h-5 w-5 text-gray-400" />}
            />
            
            <Field
              as={Input}
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Create a password"
              error={touched.password && errors.password}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />
            
            <Field
              as={Input}
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
              error={touched.confirmPassword && errors.confirmPassword}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />
            
            <Button
              type="submit"
              isLoading={isLoading || isSubmitting}
              fullWidth
              size="lg"
              icon={<UserPlus className="h-5 w-5" />}
            >
              Create account
            </Button>
          </Form>
        )}
      </Formik>
      
      <p className="text-xs text-center text-gray-500">
        By creating an account, you agree to our{' '}
        <Link to="/terms" className="text-blue-600 hover:text-blue-500">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};

export default SignupForm;