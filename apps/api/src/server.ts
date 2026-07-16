import './instrument'; // Must be the first import
import app from './app';
import dotenv from 'dotenv';
import { startCronJobs } from './jobs/scheduler';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
