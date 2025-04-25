import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
  remember: Yup.boolean()
});

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>
      
      <Formik
        initialValues={{
          email: '',
          password: '',
          remember: false
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await login(values.email, values.password, values.remember);
            navigate('/');
          } catch (err: any) {
            toast.error(err.message || 'Invalid email or password');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
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
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              error={touched.password && errors.password}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <Field
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 block text-sm text-gray-700">
                  Remember me
                </span>
              </label>
              
              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>
            
            <Button
              type="submit"
              isLoading={isLoading || isSubmitting}
              fullWidth
              size="lg"
              icon={<LogIn className="h-5 w-5" />}
            >
              Sign in
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default LoginForm;