import BookingForm from '../components/BookingForm';

export default function BookingPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">Reserve a room</p>
        <h1>Book a space</h1>
      </header>

      <section className="booking-panel">
        <BookingForm />
      </section>
    </main>
  );
}
