import { CourseService } from '../services/course-service.js';

// Mock courses data (converted from the frontend mock data)
const mockCourses = [
  {
    title: "Complete Stock Market Investing Course",
    description: "Learn everything from basics to advanced trading strategies. Master fundamental and technical analysis.",
    price: 149.99,
    originalPrice: 299.99,
    level: "Beginner" as const,
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop",
    category: "Stock Market",
  },
  {
    title: "Cryptocurrency Trading Masterclass",
    description: "Comprehensive guide to crypto trading, blockchain technology, and DeFi protocols.",
    price: 199.99,
    originalPrice: 399.99,
    level: "Intermediate" as const,
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop",
    category: "Cryptocurrency",
  },
  {
    title: "Real Estate Investment Fundamentals",
    description: "Build wealth through real estate. Learn about REITs, rental properties, and market analysis.",
    price: 129.99,
    originalPrice: 249.99,
    level: "Beginner" as const,
    thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop",
    category: "Real Estate",
  },
  {
    title: "Options Trading Strategies",
    description: "Advanced options trading techniques, Greeks, and risk management strategies.",
    price: 249.99,
    originalPrice: 499.99,
    level: "Advanced" as const,
    thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=250&fit=crop",
    category: "Options Trading",
  },
];

// Mock video data for each course
const mockVideos = {
  "Stock Market": [
    {
      title: "Introduction to Stock Market",
      description: "Understanding the basics of stock market investing and how markets work.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 1200, // 20 minutes
      order: 0,
    },
    {
      title: "Fundamental Analysis Basics",
      description: "Learn how to analyze company financials and determine stock value.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: 1800, // 30 minutes
      order: 1,
    },
    {
      title: "Technical Analysis Introduction",
      description: "Understanding charts, patterns, and technical indicators.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: 1500, // 25 minutes
      order: 2,
    },
    {
      title: "Risk Management Strategies",
      description: "How to manage risk and protect your investment portfolio.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      duration: 900, // 15 minutes
      order: 3,
    },
  ],
  "Cryptocurrency": [
    {
      title: "Blockchain Technology Explained",
      description: "Understanding the technology behind cryptocurrencies.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      duration: 1400, // 23 minutes
      order: 0,
    },
    {
      title: "Cryptocurrency Trading Basics",
      description: "Getting started with crypto trading and exchanges.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      duration: 1600, // 27 minutes
      order: 1,
    },
    {
      title: "DeFi Protocols and Yield Farming",
      description: "Exploring decentralized finance opportunities.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      duration: 2000, // 33 minutes
      order: 2,
    },
  ],
  "Real Estate": [
    {
      title: "Real Estate Investment Overview",
      description: "Introduction to different types of real estate investments.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      duration: 1100, // 18 minutes
      order: 0,
    },
    {
      title: "REIT Investment Strategies",
      description: "How to invest in Real Estate Investment Trusts.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      duration: 1300, // 22 minutes
      order: 1,
    },
    {
      title: "Rental Property Analysis",
      description: "Evaluating rental properties for investment potential.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: 1700, // 28 minutes
      order: 2,
    },
  ],
  "Options Trading": [
    {
      title: "Options Basics and Terminology",
      description: "Understanding calls, puts, strikes, and expiration dates.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
      duration: 1800, // 30 minutes
      order: 0,
    },
    {
      title: "The Greeks Explained",
      description: "Delta, Gamma, Theta, Vega - understanding option sensitivities.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
      duration: 2200, // 37 minutes
      order: 1,
    },
    {
      title: "Advanced Options Strategies",
      description: "Spreads, straddles, and complex option strategies.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: 2400, // 40 minutes
      order: 2,
    },
  ],
};

/**
 * Seed courses function
 * This function can be called to populate the database with initial course data
 */
export async function seedCourses() {
  try {
    console.log('Starting to seed courses...');
    
    const seededCourses = await CourseService.seedCourses(mockCourses);
    
    console.log(`Successfully seeded ${seededCourses.length} courses:`);
    seededCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} - $${course.price / 100}`);
    });
    
    return seededCourses;
  } catch (error) {
    console.error('Error seeding courses:', error);
    throw error;
  }
}

/**
 * Seed courses with videos using the new create course API
 * This function creates courses and videos in a single transaction
 */
export async function seedCoursesWithVideos() {
  try {
    console.log('Starting to seed courses with videos...');
    
    const results = [];
    let totalVideos = 0;
    
    // Create each course with its videos
    for (const courseData of mockCourses) {
      const categoryVideos = mockVideos[courseData.category as keyof typeof mockVideos] || [];
      
      // Create course with videos in single API call
      const result = await CourseService.createCourse({
        ...courseData,
        price: Math.round(courseData.price * 100), // Convert to cents
        originalPrice: courseData.originalPrice ? Math.round(courseData.originalPrice * 100) : undefined,
        videos: categoryVideos,
      });
      
      results.push(result);
      totalVideos += result.videos.length;
      
      console.log(`✅ Created "${result.course.title}" with ${result.videos.length} videos`);
    }
    
    console.log(`\n🎉 Successfully seeded ${results.length} courses with ${totalVideos} total videos!`);
    
    return { courses: results.map(r => r.course), totalVideos };
  } catch (error) {
    console.error('Error seeding courses with videos:', error);
    throw error;
  }
}

/**
 * Alternative: Seed videos for courses (legacy method)
 * This function should be called after courses are seeded
 */
export async function seedCoursesWithVideosLegacy() {
  try {
    console.log('Starting to seed courses with videos (legacy method)...');
    
    // First seed courses
    const seededCourses = await CourseService.seedCourses(mockCourses);
    
    console.log(`Successfully seeded ${seededCourses.length} courses`);
    
    // Then seed videos for each course
    let totalVideos = 0;
    for (const course of seededCourses) {
      const categoryVideos = mockVideos[course.category as keyof typeof mockVideos];
      if (categoryVideos) {
        const seededVideos = await CourseService.seedVideos(course.id, categoryVideos);
        totalVideos += seededVideos.length;
        console.log(`  - Added ${seededVideos.length} videos to "${course.title}"`);
      }
    }
    
    console.log(`\nTotal: ${seededCourses.length} courses with ${totalVideos} videos seeded successfully!`);
    
    return { courses: seededCourses, totalVideos };
  } catch (error) {
    console.error('Error seeding courses with videos:', error);
    throw error;
  }
}

// If this script is run directly, execute the seed function with videos
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCoursesWithVideos()
    .then(() => {
      console.log('Course and video seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Course and video seeding failed:', error);
      process.exit(1);
    });
}
