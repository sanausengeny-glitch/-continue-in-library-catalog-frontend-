import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReadingListProvider } from './context/ReadingListContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookingPage from './pages/BookingPage';
import CatalogPage from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav__links">
          <NavLink className="site-nav__link" to="/">Catalog</NavLink>
          <NavLink className="site-nav__link" to="/booking">Booking</NavLink>
        </div>

        <div className="site-nav__links site-nav__links--end">
          {isAuthenticated ? (
            <>
              <span className="user-badge">Hi, {user?.username || 'Reader'}</span>
              <button type="button" className="nav-action" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink className="site-nav__link" to="/login">Log in</NavLink>
              <NavLink className="site-nav__link" to="/register">Register</NavLink>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReadingListProvider>
          <AppShell />
        </ReadingListProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
