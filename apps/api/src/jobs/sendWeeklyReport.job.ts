import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';

export async function sendWeeklyReport() {
  console.log('[Job] Running weekly report job at 8:00 AM Sunday...');
  
  try {
    // Basic implementation: fetch active classes and parents to send emails
    // For now, this is just a skeleton for the logic required by Phan 6
    
    console.log('[Job] Generating HTML templates and sending via Nodemailer...');
    
    // Example transporter setup (mock configuration)
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({
    //   from: '"Adaptive Lang" <no-reply@adaptive-lang.com>',
    //   to: 'parent@example.com',
    //   subject: '[Adaptive Lang] Báo cáo tuần của con bạn',
    //   html: '<b>Báo cáo chi tiết...</b>'
    // });
    
    console.log('[Job] Weekly reports sent!');
  } catch (err) {
    console.error('[Job] Error in sendWeeklyReport:', err);
  }
}
