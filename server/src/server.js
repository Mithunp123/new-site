import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import initializeDatabase from './config/schema.js';
import seedDatabase from './config/seed.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initializeDatabase();
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Gradix API server running on http://localhost:${PORT}`);
      console.log(`📧 Demo login: priya@gmail.com / password123`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
