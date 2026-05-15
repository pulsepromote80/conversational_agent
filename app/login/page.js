"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { RiPlayCircleLine, RiMoonLine, RiSunLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { useTheme } from '../components/ThemeProvider';
// import { appLogin } from '@/app/redux/slices/authSlice';
import toast from 'react-hot-toast';

const loginSchema = Yup.object().shape({
  username: Yup.string()
    .email('Please enter a valid email address (must include @)')
    .email('Please enter a valid email address (must include @)')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});


const Login = () => {
  const router = useRouter();
  // const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const initialValues = {
    username: '',
    password: ''
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // try {
    //   const result = await dispatch(appLogin(values)).unwrap();
    //   if (result.statusCode === 200) {
    //     toast.success(result.message);
    //     resetForm();
    //     router.push('/chat');
    //   }
    // } catch (err) {
    //   resetForm()
    // } finally {
    //   setSubmitting(false);
    // }
  };

  return (
    <div id="root">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1"></div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer flex-shrink-0"
            >
              {isDark ? <RiSunLine className="text-lg" /> : <RiMoonLine className="text-lg" />}
            </button>
          </div>
          <div className="text-center -mt-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue your conversations
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <Formik
              initialValues={initialValues}
              validationSchema={loginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6" noValidate>
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email Address
                    </label>

                    <Field
                      id="username"
                      name="username"
                      type="email"
                      placeholder="Enter Your Email"
                      className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700
    ${errors.username && touched.username
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                        }`}
                    />

                    <ErrorMessage
                      name="username"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>


                  <div className="relative">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Your Password"
                        className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all ${errors.password && touched.password
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="text-sm text-emerald-600 cursor-pointer dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0d9488] py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>

          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                // Set demo user in localStorage
                const demoUser = {
                  name: 'Demo User',
                  email: 'demo@example.com'
                };
                localStorage.setItem('currentUser', JSON.stringify(demoUser));
                // Navigate to chat page
                router.push('/demo');
              }}
              className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-sm cursor-pointer"
            >
              <RiPlayCircleLine className="mr-2 text-lg" />
              Try Demo Mode
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;