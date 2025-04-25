import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, User } from '../../contexts/AuthContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { toast } from 'react-toastify';
import { Formik, Form, Field, FormikHelpers } from 'formik'; // Import Formik components
import * as Yup from 'yup'; // Import Yup

// Define validation schema with Yup
const ProfileValidationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters') // 3 is generally a reasonable minimum for names.
    .required('Name is required')
    .max(50, 'Name must be 50 characters or less'),
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less') // Add max length
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  bio: Yup.string().max(200, 'Bio must be 200 characters or less'),
  avatar: Yup.string(), // Avatar validation might be more complex depending on upload strategy
});

// Define Formik values type
interface ProfileFormValues {
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar: string;
}

const ProfileForm: React.FC = () => {
  const { user, updateProfile, isLoading } = useAuth();

  // Initial values for Formik, updated by useEffect
  const [initialValues, setInitialValues] = useState<ProfileFormValues>({
    name: '',
    email: '',
    username: '',
    bio: '',
    avatar: '',
  });

  // Update initial values when user context changes
  useEffect(() => {
    if (user) {
      setInitialValues({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  // Form submission handler for Formik
  const handleFormikSubmit = async (
    values: ProfileFormValues,
    { setSubmitting }: FormikHelpers<ProfileFormValues>
  ) => {
    try {
      const profileData: Partial<User> = {
        name: values.name,
        email: values.email,
        username: values.username,
        bio: values.bio,
        avatar: values.avatar, // Avatar value comes from Formik state
      };
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Avatar change handler updates Formik state
  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Update Formik's avatar field value
        setFieldValue('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link to="/" className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
      </div>

      {/* Wrap form with Formik */}
      <Formik
        initialValues={initialValues}
        validationSchema={ProfileValidationSchema}
        onSubmit={handleFormikSubmit}
        enableReinitialize // Allows form to reinitialize when initialValues change (user loads)
      >
        {({ errors, touched, isSubmitting, values, setFieldValue }) => (
          <Form className="space-y-6">
            {/* Avatar upload */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Use values.avatar from Formik state */}
              <Avatar src={values.avatar} alt={values.name} size="xl" />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Profile Picture</p>
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change avatar
                  <input
                    id="avatar-upload"
                    name="avatar"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    // Pass setFieldValue to the handler
                    onChange={(e) => handleAvatarChange(e, setFieldValue)}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Use Field component for inputs */}
              <Field
                as={Input}
                label="Name"
                id="name"
                name="name"
                type="text"
                placeholder="Your full name"
                error={touched.name && errors.name} // Use Formik errors/touched
              />

              <Field
                as={Input}
                label="Username"
                id="username"
                name="username"
                type="text"
                placeholder="Your username"
                required
                error={touched.username && errors.username}
              />

              <Field
                as={Input}
                label="Email"
                id="email"
                name="email"
                type="email"
                placeholder="Your email"
                required
                className="sm:col-span-2"
                error={touched.email && errors.email}
              />

              <div className="sm:col-span-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bio
                </label>
                {/* Use Field component for textarea */}
                <Field
                  as="textarea"
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Write a short bio about yourself"
                  className={`w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    touched.bio && errors.bio ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                />
                {/* Display bio error */}
                {touched.bio && errors.bio && (
                  <p className="mt-1 text-sm text-red-500">{errors.bio}</p>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isSubmitting} // Disable cancel while submitting
              >
                Cancel
              </Button>
              <Button
                type="submit"
                // Use Formik's isSubmitting or context's isLoading
                isLoading={isSubmitting || isLoading}
                icon={<Save className="h-4 w-4" />}
              >
                Save changes
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ProfileForm;