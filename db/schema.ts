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

