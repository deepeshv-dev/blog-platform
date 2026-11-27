import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import AuthPage from './pages/AuthPage.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PostEditor from './pages/PostEditor.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="posts/new" element={<ProtectedRoute><PostEditor /></ProtectedRoute>} />
        <Route path="posts/:id/edit" element={<ProtectedRoute><PostEditor editing /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
