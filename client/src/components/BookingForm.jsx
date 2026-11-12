import { useState } from 'react';

const spaces = [
  'Main Reading Room',
  'Study Room A',
  'Study Room B',
  'Computer Lab',
  'Innovation Hub',
];

export default function BookingForm() {
  const [formData, setFormData] = useState({
    space: '',
    date: '',
    startTime: '',
    endTime: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="space">Space</label>
        <select id="space" name="space" value={formData.space} onChange={handleChange} required>
          <option value="">Select a space</option>
          {spaces.map((space) => (
            <option key={space} value={space}>{space}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="startTime">Start time</label>
          <input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
        </div>

        <div className="field-group">
          <label htmlFor="endTime">End time</label>
          <input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
        </div>
      </div>

      <button type="submit" className="primary-button">Reserve space</button>

      {submitted && (
        <p className="booking-success">
          Booking draft saved locally for {formData.space || 'your selected space'} on {formData.date || 'your chosen date'}.
        </p>
      )}
    </form>
  );
}
