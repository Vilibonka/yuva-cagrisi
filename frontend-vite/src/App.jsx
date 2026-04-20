import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Registration from './components/Registration';
import PostsGallery from './components/PostsGallery';
import CreatePost from './components/CreatePost';
import PostDetails from './components/PostDetails';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';

function Navigation() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(decoded.role === 'ADMIN');
      } catch(e) {}
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
    window.location.reload(); // Refresh the app to clear memory
  };

  return (
    <nav className="flex items-center space-x-6">
      <Link to="/posts" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">İlanlar</Link>
      <Link to="/create-post" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">İlan Ver</Link>
      {isAdmin && <Link to="/admin" className="text-red-600 font-bold hover:text-red-700 transition border-b-2 border-transparent hover:border-red-600 pb-1">Yönetim Paneli</Link>}
      
      {token ? (
        <>
          <Link to="/profile" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Profilim</Link>
          <button onClick={handleLogout} className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Çıkış Yap</button>
        </>
      ) : (
        <>
          <Link to="/login" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Giriş Yap</Link>
          <Link to="/register" className="text-white bg-orange-500 hover:bg-orange-600 font-medium transition px-4 py-2 rounded-full">Kayıt Ol</Link>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
        <header className="w-full bg-white shadow-md border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-orange-600 tracking-tight">
              Yuva Çağrısı <span className="font-medium text-gray-500 text-sm ml-2">Sokak Hayvanı Sahiplendirme Platformu</span>
            </h1>
            <Navigation />
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center p-6 sm:p-12">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/posts" element={<PostsGallery />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/posts/:id" element={<PostDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<PostsGallery />} />
          </Routes>
        </main>
        
        <footer className="w-full bg-white border-t border-gray-200 text-center py-4 text-sm text-gray-500">
          © {new Date().getFullYear()} Yuva Çağrısı Platformu. Tüm Hakları Saklıdır.
        </footer>
      </div>
    </Router>
  );
}

export default App;
