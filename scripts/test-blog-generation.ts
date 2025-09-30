import { dailyBlogScheduler } from './daily-blog-scheduler.js';

console.log('🧪 Testing Blog Generation Script');
console.log('================================\n');

// Run the blog generation immediately
dailyBlogScheduler.runNow()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
