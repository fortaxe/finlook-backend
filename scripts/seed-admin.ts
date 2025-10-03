import { AuthService } from '../services/auth-service.js';

// Admin credentials to seed
const adminCredentials = {
  name: "FinLook Admin",
  username: "finlook_admin",
  email: "finlook@gmail.com",
  mobileNumber: "9876543210",
  password: "finlook@123", // Strong password with uppercase, lowercase, number
};

/**
 * Seed admin function
 * This function creates a default admin user for the system
 */
export async function seedAdmin() {
  try {
    console.log('Starting to seed admin user...');
    console.log('Admin credentials:');
    console.log(`  Email: ${adminCredentials.email}`);
    console.log(`  Password: ${adminCredentials.password}`);
    console.log(`  Username: ${adminCredentials.username}`);
    console.log(`  Mobile: ${adminCredentials.mobileNumber}`);
    
    const result = await AuthService.createAdmin(adminCredentials);
    
    console.log('✅ Admin user created successfully:');
    console.log(`  ID: ${result.user.id}`);
    console.log(`  Name: ${result.user.name}`);
    console.log(`  Email: ${result.user.email}`);
    console.log(`  Role: ${result.user.role}`);
    console.log(`  Created at: ${result.user.createdAt}`);
    console.log('\n🔑 Admin access token generated');
    console.log('📝 Save these credentials for admin access');
    
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️  Admin user already exists, skipping creation');
      return null;
    }
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
}

// If this script is run directly, execute the seed function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin()
    .then((result) => {
      if (result) {
        console.log('\n🎉 Admin seeding completed successfully');
      } else {
        console.log('\n✅ Admin user already exists, no action needed');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin seeding failed:', error);
      process.exit(1);
    });
}
