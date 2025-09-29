import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  mobileNumber: varchar('mobile_number', { length: 10 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' | 'admin'
  isInfluencer: boolean('is_influencer').notNull().default(false),
  influencerUrl: varchar('influencer_url', { length: 255 }),
  avatar: varchar('avatar', { length: 500 }),
  verified: boolean('verified').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Posts table
export const posts: any = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content'),
  images: jsonb('images').$type<string[]>(), // Array of image URLs
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  bookmarks: integer('bookmarks').notNull().default(0),
  isRetweet: boolean('is_retweet').notNull().default(false),
  originalPostId: uuid('original_post_id').references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Comments table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content'),
  images: jsonb('images').$type<string[]>(), // Array of image URLs
  likes: integer('likes').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Likes table (for posts and comments)
export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Bookmarks table
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  reels: many(reels),
  reelComments: many(reelComments),
  reelLikes: many(reelLikes),
  coursePurchases: many(coursePurchases),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  originalPost: one(posts, {
    fields: [posts.originalPostId],
    references: [posts.id],
  }),
  retweets: many(posts),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
}));

// Reels table
export const reels = pgTable('reels', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoUrl: varchar('video_url', { length: 500 }).notNull(),
  content: text('content'),
  likes: integer('likes').notNull().default(0),
  shares: integer('shares').notNull().default(0),
  duration: integer('duration').notNull(), // in seconds
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Reel comments table
export const reelComments = pgTable('reel_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  reelId: uuid('reel_id').notNull().references(() => reels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content'),
  images: jsonb('images').$type<string[]>(), // Array of image URLs
  likes: integer('likes').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Update likes table to support reels and reel comments
export const reelLikes = pgTable('reel_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reelId: uuid('reel_id').references(() => reels.id, { onDelete: 'cascade' }),
  reelCommentId: uuid('reel_comment_id').references(() => reelComments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Reel relations
export const reelsRelations = relations(reels, ({ one, many }) => ({
  user: one(users, {
    fields: [reels.userId],
    references: [users.id],
  }),
  comments: many(reelComments),
  likes: many(reelLikes),
}));

export const reelCommentsRelations = relations(reelComments, ({ one, many }) => ({
  reel: one(reels, {
    fields: [reelComments.reelId],
    references: [reels.id],
  }),
  user: one(users, {
    fields: [reelComments.userId],
    references: [users.id],
  }),
  likes: many(reelLikes),
}));

export const reelLikesRelations = relations(reelLikes, ({ one }) => ({
  user: one(users, {
    fields: [reelLikes.userId],
    references: [users.id],
  }),
  reel: one(reels, {
    fields: [reelLikes.reelId],
    references: [reels.id],
  }),
  reelComment: one(reelComments, {
    fields: [reelLikes.reelCommentId],
    references: [reelComments.id],
  }),
}));

// Courses table
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // Price in cents (e.g., 14999 for $149.99)
  originalPrice: integer('original_price'), // Original price in cents
  level: varchar('level', { length: 50 }).notNull(), // 'Beginner', 'Intermediate', 'Advanced'
  category: varchar('category', { length: 100 }).notNull(),
  thumbnail: varchar('thumbnail', { length: 500 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Course purchases table
export const coursePurchases = pgTable('course_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  purchasePrice: integer('purchase_price').notNull(), // Price paid in cents
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Course videos table
export const courseVideos = pgTable('course_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  videoUrl: varchar('video_url', { length: 500 }).notNull(),
  duration: integer('duration'), // Duration in seconds
  order: integer('order').notNull().default(0), // Order of video in course
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Course relations
export const coursesRelations = relations(courses, ({ many }) => ({
  purchases: many(coursePurchases),
  videos: many(courseVideos),
}));

export const coursePurchasesRelations = relations(coursePurchases, ({ one }) => ({
  user: one(users, {
    fields: [coursePurchases.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [coursePurchases.courseId],
    references: [courses.id],
  }),
}));

export const courseVideosRelations = relations(courseVideos, ({ one }) => ({
  course: one(courses, {
    fields: [courseVideos.courseId],
    references: [courses.id],
  }),
}));

// Blogs table for FinLook daily financial news
export const blogs = pgTable('blogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  publishedAt: timestamp('published_at').notNull(),
  sourceName: varchar('source_name', { length: 100 }).notNull(),
  sourceUrl: varchar('source_url', { length: 500 }).notNull(),
  tags: jsonb('tags').$type<string[]>().notNull(),
  region: jsonb('region').$type<string[]>().notNull(),
  companies: jsonb('companies').$type<string[]>(),
  sector: varchar('sector', { length: 100 }).notNull(),
  financialImpact: text('financial_impact'),
  keyNumbers: jsonb('key_numbers').$type<{[key: string]: string | number}>(),
  imageUrl: varchar('image_url', { length: 500 }),
  imageSource: varchar('image_source', { length: 100 }),
  imageAttribution: varchar('image_attribution', { length: 255 }),
  imageLicense: varchar('image_license', { length: 100 }),
  imageAltText: varchar('image_alt_text', { length: 255 }),
  aiGeneratedAt: timestamp('ai_generated_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


