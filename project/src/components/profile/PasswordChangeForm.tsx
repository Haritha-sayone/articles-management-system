import React from 'react'; // Removed useState
import { Lock, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import { Formik, Form, Field, FormikHelpers } from 'formik'; // Import Formik
import * as Yup from 'yup'; // Import Yup

// Define validation schema with Yup
const PasswordChangeSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

// Define Formik values type
interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PasswordChangeForm: React.FC = () => {
  const { changePassword, isLoading } = useAuth();

  // Initial values for Formik
  const initialValues: PasswordChangeFormValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  // Form submission handler for Formik
  const handleFormikSubmit = async (
    values: PasswordChangeFormValues,
    { setSubmitting, resetForm }: FormikHelpers<PasswordChangeFormValues>
  ) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      resetForm(); // Clear form on success
      toast.success('Password changed successfully');
    } catch (err: any) {
      // Handle specific Firebase auth errors if needed
      if (err.code === 'auth/wrong-password') {
        toast.error('Incorrect current password.');
      } else if (err.code === 'auth/requires-recent-login') {
         toast.error('This action requires recent login. Please log out and log back in.');
      }
      else {
        toast.error(err.message || 'Failed to change password');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>

      {/* Wrap form with Formik */}
      <Formik
        initialValues={initialValues}
        validationSchema={PasswordChangeSchema}
        onSubmit={handleFormikSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form className="space-y-4">
            <Field
              as={Input}
              label="Current Password"
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              error={touched.currentPassword && errors.currentPassword}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />

            <Field
              as={Input}
              label="New Password"
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              error={touched.newPassword && errors.newPassword}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />

            <Field
              as={Input}
              label="Confirm New Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              error={touched.confirmPassword && errors.confirmPassword}
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                // Use Formik's isSubmitting or context's isLoading
                isLoading={isSubmitting || isLoading}
                icon={<Save className="h-4 w-4" />}
              >
                Update password
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default PasswordChangeForm;