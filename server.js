require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT || 3000);

const startServer = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB.');
    } catch (error) {
      console.warn('MongoDB connection failed; running in local in-memory catalog mode.');
    }
  } else {
    console.warn('MONGODB_URI not set; running in local in-memory catalog mode.');
  }

  app.listen(port, () => {
    console.log(`Library catalog API running on http://localhost:${port}`);
  });
};

startServer();
