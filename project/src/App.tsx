import { Suspense, lazy } from 'react'; // Import Suspense and lazy
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './utils/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from 'lucide-react'; // Import loader icon

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const SavedArticlesPage = lazy(() => import('./pages/SavedArticlesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Simple loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
  </div>
);


function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          {/* Wrap Routes with Suspense */}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/articles/:id" element={<ArticleDetailPage />} />
                <Route path="/saved-articles" element={<SavedArticlesPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </Route>
            </Routes>
          </Suspense>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;