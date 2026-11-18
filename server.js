require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT || 3000);

const startServer = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  if (!process.env.MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI must be configured in production.');
    }
    console.warn('MONGODB_URI not set; running in local in-memory catalog mode.');
  } else {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');
  }

  app.listen(port, () => {
    console.log(`Library catalog API running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start the library catalog API.', error);
  process.exitCode = 1;
});
