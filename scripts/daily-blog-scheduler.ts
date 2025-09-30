import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron'; // ✅ type-only import
import { blogService } from '../services/blog-service.js';

class DailyBlogScheduler {
  private isRunning = false;
  private cronJob: ScheduledTask | null = null; // ✅ typed correctly

  constructor() {
    console.log('📅 Daily Blog Scheduler initialized');
  }

  start() {
    if (this.cronJob) {
      console.log('⚠️ Scheduler already running.');
      return;
    }

    this.cronJob = cron.schedule(
    '31 12 * * *',
      async () => {
        if (this.isRunning) {
          console.log('⏳ Blog generation already in progress, skipping...');
          return;
        }

        this.isRunning = true;
        console.log('🌅 Starting daily blog generation at 6:00 AM...');

        try {
          await blogService.generateAndSaveBlogs();
          console.log('✅ Daily blog generation completed successfully');
        } catch (error) {
          console.error('❌ Daily blog generation failed:', error);
        } finally {
          this.isRunning = false;
        }
      },
      {
       
        timezone: 'Asia/Kolkata',
      }
    );

    console.log('⏰ Daily blog scheduler started - will run every day at 6:00 AM IST');
  }

  async runNow() {
    if (this.isRunning) {
      console.log('⏳ Blog generation already in progress...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Manually triggering blog generation...');

    try {
      await blogService.generateAndSaveBlogs();
      console.log('✅ Manual blog generation completed successfully');
    } catch (error) {
      console.error('❌ Manual blog generation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop(); // ✅ correct method
      this.cronJob = null;
    }
    console.log('🛑 Daily blog scheduler stopped');
  }
}

export const dailyBlogScheduler = new DailyBlogScheduler();

if (import.meta.url === `file://${process.argv[1]}`) {
  dailyBlogScheduler.start();

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down scheduler...');
    dailyBlogScheduler.stop();
    process.exit(0);
  });

  console.log('🔄 Scheduler is running. Press Ctrl+C to stop.');
}
