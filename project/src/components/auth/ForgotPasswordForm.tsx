import React from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required')
});

const ForgotPasswordForm: React.FC = () => {
  const { forgotPassword, isLoading } = useAuth();

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Forgot your password?</h1>
        <p className="mt-2 text-sm text-gray-600">
          No worries, we'll send you reset instructions.
        </p>
      </div>
      
      <Formik
        initialValues={{ email: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            await forgotPassword(values.email);
            toast.success("We've sent password reset instructions to your email");
            resetForm(); // Optionally clear the form
          } catch (err: any) {
            toast.error(err.message || 'Failed to send reset email');
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
            
            <Button
              type="submit"
              isLoading={isLoading || isSubmitting}
              fullWidth
              size="lg"
              icon={<Send className="h-5 w-5" />}
            >
              Send reset instructions
            </Button>
            
            <Link
              to="/login"
              className="flex items-center justify-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPasswordForm;