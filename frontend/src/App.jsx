import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Registration from './components/Registration';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
        <header className="w-full bg-white shadow-md border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-orange-600 tracking-tight">
              Yuva Çağrısı <span className="font-medium text-gray-500 text-sm ml-2">Sokak Hayvanı Sahiplendirme Platformu</span>
            </h1>
            <nav className="flex space-x-6">
              <Link to="/login" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Giriş Yap</Link>
              <Link to="/register" className="text-gray-600 font-medium hover:text-orange-500 transition border-b-2 border-transparent hover:border-orange-500 pb-1">Kayıt Ol</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full flex items-center justify-center p-6 sm:p-12">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="*" element={<Login />} />
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
