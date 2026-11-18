import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReadingListProvider } from './context/ReadingListContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookingPage from './pages/BookingPage';
import CatalogPage from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminBooksPage from './pages/admin/AdminBooksPage';
import AdminBorrowRequestsPage from './pages/admin/AdminBorrowRequestsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';

function AppShell() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <nav className="site-nav" aria-label="Main navigation">
        <div className="site-nav__links">
          <NavLink className="site-nav__link" to="/">Catalog</NavLink>
          <NavLink className="site-nav__link" to="/booking">Booking</NavLink>
          {user?.role === 'librarian' && (
            <>
              <NavLink className="site-nav__link" to="/admin/books">Admin books</NavLink>
              <NavLink className="site-nav__link" to="/admin/borrow-requests">Borrow requests</NavLink>
              <NavLink className="site-nav__link" to="/admin/bookings">Bookings</NavLink>
            </>
          )}
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
        <Route path="/admin/books" element={<ProtectedRoute role="librarian"><AdminBooksPage /></ProtectedRoute>} />
        <Route path="/admin/borrow-requests" element={<ProtectedRoute role="librarian"><AdminBorrowRequestsPage /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute role="librarian"><AdminBookingsPage /></ProtectedRoute>} />
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
