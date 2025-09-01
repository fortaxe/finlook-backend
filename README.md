# Finlook Backend API

A social media backend API built with Express, TypeScript, Drizzle ORM, PostgreSQL (Neon), Redis, and Cloudflare R2.

## 🚀 Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Posts & Social Features**: Create posts, retweets, comments, likes, bookmarks
- **Image Upload**: Cloudflare R2 integration with presigned URLs
- **Database**: PostgreSQL with Drizzle ORM and migrations
- **Caching**: Redis for session management and caching
- **Validation**: Zod for request validation
- **Security**: Rate limiting, CORS, helmet, compression
- **TypeScript**: Full type safety with strict mode

## 📁 Project Structure

```
├── config/          # Configuration files (env, database, redis)
├── controller/      # Route controllers with business logic
├── db/             # Database schema and migrations
├── middleware/     # Custom middleware (auth, cors, security)
├── routes/         # API route definitions
├── services/       # Business logic services
├── validations/    # Zod validation schemas
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## 🛠️ Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Generate and run database migrations
bun run db:generate
bun run db:migrate

# Start development server
bun run dev
```

## 📝 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# JWT Secret (generate a random 32+ character string)
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_chars

# Cloudflare R2 Configuration
R2_REGION=auto
R2_S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_BUCKET=your-bucket-name
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_PUBLIC_BASE_URL=https://your-custom-domain.com
```

## 🗄️ Database Schema

The API includes the following main entities:

- **Users**: User accounts with roles (user/admin)
- **Posts**: Social media posts with images and retweets
- **Comments**: Single-level comments on posts
- **Likes**: Likes for posts and comments
- **Bookmarks**: User bookmarks for posts

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user
- `GET /api/auth/profile` - Get current user profile

### Posts
- `GET /api/posts` - Get posts with pagination
- `POST /api/posts` - Create new post
- `POST /api/posts/retweet` - Create retweet
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Toggle like on post
- `POST /api/posts/:id/bookmark` - Toggle bookmark on post

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Create comment
- `PUT /api/posts/comments/:id` - Update comment
- `DELETE /api/posts/comments/:id` - Delete comment
- `POST /api/posts/comments/:id/like` - Toggle like on comment

### Uploads
- `POST /api/uploads/presigned-url` - Generate presigned URL for image upload

## 🔒 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🖼️ Image Upload Flow

1. Client requests presigned URL: `POST /api/uploads/presigned-url`
2. Client uploads image directly to Cloudflare R2 using presigned URL
3. Client uses the returned public URL in post/comment creation

## 🏃‍♂️ Development

```bash
# Start development server with hot reload
bun run dev

# Generate database migrations
bun run db:generate

# Run database migrations
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio
```

## 🔧 Scripts

- `bun run dev` - Start development server
- `bun run start` - Start production server
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Drizzle Studio

## 🛡️ Security Features

- Rate limiting on all endpoints (stricter for auth)
- CORS protection with configurable origins
- Helmet for security headers
- Password hashing with bcrypt
- JWT token expiration
- Input validation with Zod
- SQL injection prevention with Drizzle ORM

## 📱 Frontend Integration

This backend is designed to work with React Native/Expo frontend. CORS is configured to allow:
- `localhost:3000` (web development)
- `localhost:8081` (Expo dev server)
- `localhost:19006` (Expo web)
- Production domains (configurable)

## 🚀 Deployment

The API is ready for deployment on platforms like:
- Vercel
- Railway
- Fly.io
- Any Node.js/Bun hosting platform

Make sure to:
1. Set all environment variables
2. Run database migrations
3. Configure Redis instance
4. Set up Cloudflare R2 bucket

---

Built with ❤️ using Bun, Express, TypeScript, and Drizzle ORM.