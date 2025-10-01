import { db } from '../config/database.js';
import { blogs } from '../db/schema.js';
import { desc, eq, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { UploadService } from './upload-service.js';

interface BlogData {
  title: string;
  summary: string;
  content: string;
  published_at: string;
  source_name: string;
  source_url: string;
  tags: string[];
  region: string[];
  companies?: string[];
  sector: string;
  financial_impact?: string;
  key_numbers?: { [key: string]: string | number };
  image_prompt?: string;
  image?: {
    url?: string;
    source?: string;
    attribution?: string;
    license?: string;
    alt_text?: string;
  };
}

class BlogService {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30 * 60 * 1000, // 10 minutes timeout for long-running operations
      maxRetries: 3, // Retry failed requests up to 3 times
    });
  }

  async getExistingCategories(): Promise<string[]> {
    try {
      const result = await db
        .selectDistinct({ sector: blogs.sector })
        .from(blogs)
        .where(eq(blogs.isActive, true));
      
      return result.map(r => r.sector).filter(Boolean);
    } catch (error) {
      console.error('❌ Error fetching existing categories:', error);
      return [];
    }
  }

  async generateImageWithDALLE(prompt: string, blogTitle: string): Promise<{ url: string; key: string } | null> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎨 Generating image for: ${blogTitle} (attempt ${attempt}/${maxRetries})`);
        
        // Generate image using DALL-E
        const imageResponse = await this.client.images.generate({
          model: "dall-e-3",
          prompt: `Professional, clean, editorial-style image for a financial news article about: ${prompt}. Style: Modern, business-appropriate, no text or watermarks, suitable for a financial news platform.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

      if (!imageResponse.data || imageResponse.data.length === 0 || !imageResponse.data[0]) {
        console.warn('⚠️ No image generated');
        return null;
      }

      const imageUrl = imageResponse.data[0].url;
      if (!imageUrl) {
        console.warn('⚠️ No image URL generated');
        return null;
      }

      // Download the image
      console.log('📥 Downloading generated image...');
      const imageResponse2 = await fetch(imageUrl);
      const imageArrayBuffer = await imageResponse2.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);

      // Upload to R2
      console.log('☁️ Uploading to R2...');
      const uploadResult = await UploadService.uploadDirect(
        imageBuffer,
        'image/png',
        'blogs/'
      );

        console.log(`✅ Image uploaded successfully: ${uploadResult.publicUrl}`);
        return {
          url: uploadResult.publicUrl,
          key: uploadResult.key,
        };
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed for "${blogTitle}":`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds before retrying
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    console.error(`❌ All ${maxRetries} attempts failed for "${blogTitle}":`, lastError);
    return null;
  }

  async generateDailyBlogs(): Promise<BlogData[]> {
    console.log('🤖 Generating daily blogs...');
    
    try {
      // Fetch existing categories
      const existingCategories = await this.getExistingCategories();
      console.log(`📂 Found ${existingCategories.length} existing categories:`, existingCategories);
      const categoryContext = existingCategories.length > 0
        ? `\n\nEXISTING CATEGORIES:\nWe currently have the following categories in our system: ${existingCategories.join(', ')}.\n\n**CATEGORY RULES:**\n- If the blog fits well into one of these existing categories, use that category name EXACTLY as shown.\n- Only create a NEW category if the blog topic doesn't fit well into any existing category.\n- DO NOT create variations or duplicates of existing categories (e.g., don't create "Banking" if "Banking & Financial Services" already exists).\n- Keep category names professional, clear, and consistent with existing ones.\n- Prefer using existing categories to keep the category list organized and not too fragmented.`
        : '';

      const response = await this.client.responses.create({
        model: "gpt-5",
        tools: [
          { type: "web_search" },
        ],
        input: `You are a professional financial news curator for "FinLook" - a premier Indian fintech and financial education platform. I need you to find and curate 2-5 high-quality finance-focused Indian news stories from the last 24 hours (today: ${new Date().toISOString().split('T')[0]}). Aim for 5 stories if possible, but minimum 2 stories required.${categoryContext}

REQUIREMENTS:
1. **Timeframe**: Only news from the last 24 hours (today and yesterday maximum)
2. **Geography**: Focus on India - Indian financial markets, banking, fintech, or global financial news affecting India
3. **Content Focus**: Target 5 stories, minimum 2 required. Prioritize:
   - **Primary**: Banking & Financial Services (RBI policies, bank earnings, lending trends)
   - **Primary**: Fintech & Digital Payments (UPI, digital lending, neobanks, payment innovations)
   - **Primary**: Stock Markets & Investments (NSE/BSE movements, IPOs, mutual funds, FII/DII flows)
   - **Secondary**: Business & Startups (funding, acquisitions, expansions, new launches)
   - **Secondary**: Economic Policy & Corporate News (regulations, government policies, earnings)
   - **Secondary**: Technology & Innovation (AI, digital transformation, e-commerce)
   - **Acceptable**: Any significant business news with financial implications for India
4. **Quality**: Choose newsworthy stories from reputable sources. PRIORITY ORDER:
   - **Tier 1**: Economic Times, Mint, Bloomberg, Reuters, Business Standard, Moneycontrol
   - **Tier 2**: Financial Express, CNBC-TV18, Hindu BusinessLine, LiveMint, Times of India Business
   - **Tier 3**: FirstPost Business, News18 Business, India Today Business, NDTV Business
   - **Global with India angle**: Wall Street Journal, Financial Times, CNN Business (if India-related)
5. **Flexibility**: If not enough finance stories available, include general business stories with financial implications
6. **Relevance**: Stories that would educate and inform Indian investors, financial professionals, and business enthusiasts

FOR EACH STORY, PROVIDE:
- **title**: Compelling, SEO-friendly headline (60-80 characters)
- **summary**: 2-3 sentence summary highlighting key impact and implications (150-200 words) 

  * NO source mentions
  * NO markdown links like [text](url) 
  * NO URLs or website names anywhere
  * Pure, clean text only
- **content**: Full blog-ready article (800-1200 words) with:
  * Engaging introduction
  * Key details and context
  * Market/business implications
  * Expert analysis or quotes if available


  * NO "source:", "according to", or any reference to the original news source
  * NO markdown links like [reuters.com](https://...) or [text](url) anywhere
  * NO URLs, web addresses, or external references of any kind
  * Remove ALL links and citations - the content should be pure original text

- **published_at**: ISO timestamp of original publication
- **source_name**: Original news source (ONLY place to mention source name)
- **source_url**: Direct link to original article (ONLY place to mention source URL)
- **tags**: 1-4 relevant tags for categorization
- **region**: Affected regions/countries
- **companies**: Mentioned companies/brands
- **sector**: Primary business sector/category (follow the CATEGORY RULES above)
- **financial_impact**: Analysis of how this news affects investors, markets, or personal finance decisions
- **key_numbers**: Important financial figures, percentages, or data points from the story
- **image_prompt**: A detailed prompt for generating an appropriate image for this story using AI (describe the visual elements, style, and mood)

IMAGE PROMPT REQUIREMENTS:
**CRITICAL**: Do NOT provide image URLs. Instead, provide a detailed image generation prompt.
- **image_prompt**: Describe what image should be generated for this story
  * Be specific about visual elements (e.g., "Indian stock market trading floor", "modern fintech mobile app interface")
  * Specify style: "Professional, editorial-style, business photography"
  * Mention mood/tone: "optimistic", "serious", "innovative"
  * Keep it focused on the main theme of the article
  * Example: "Professional photograph of modern Indian banking technology with mobile payment interface, clean and bright, showing financial growth charts in background, editorial style"

QUANTITY REQUIREMENT:
Target 5 stories if available, but provide between 2-5 stories. Quality over quantity - better to have 2-3 excellent stories than forcing 5 mediocre ones.

OUTPUT FORMAT:
Return as clean JSON array with 2-5 stories, ensuring each story is complete, well-researched, and relevant to the FinLook audience interested in finance and business.

CRITICAL CONTENT REQUIREMENTS (MANDATORY - MUST FOLLOW):
1. **Source Removal**: ABSOLUTELY NO mention of "source", "according to [source name]", or ANY reference to the original news source in the title, summary, content, tags, or any other field except source_name and source_url. 
2. **Link Removal**: Remove ALL markdown links [text](url), URLs, web addresses, and external references from title, summary, and content. Read the source and rewrite in your own words without ANY citations or links.
3. **No Image URLs**: Do NOT provide any image URLs. Only provide image_prompt for AI generation.
4. **Clean Text Only**: The summary and content fields must be pure, clean text without ANY URLs, markdown links, or citations. If you find yourself wanting to cite a source, just state the fact directly without attribution.

Focus on stories that would help FinLook users make better financial and business decisions - market analysis, policy impacts, business developments, startup news, economic indicators, corporate earnings, etc.`,
      });

      const content = response.output_text;
      console.log('📝 AI Response received, parsing...');
      
      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const blogData: BlogData[] = JSON.parse(jsonMatch[0]);
      console.log(`✅ Successfully parsed ${blogData.length} blog stories`);
      
      // Generate and upload images for each blog IN PARALLEL for better performance
      console.log('🎨 Starting parallel image generation for all blogs...');
      const imagePromises = blogData.map(async (blog) => {
        if (blog.image_prompt) {
          try {
            const imageResult = await this.generateImageWithDALLE(blog.image_prompt, blog.title);
            if (imageResult) {
              blog.image = {
                url: imageResult.url,
                source: 'dall-e-3',
                attribution: 'Generated by DALL-E 3',
                license: 'AI Generated',
                alt_text: blog.image_prompt.substring(0, 200),
              };
            }
          } catch (error) {
            console.error(`⚠️ Failed to generate image for "${blog.title}", continuing without image:`, error);
            // Continue without image - don't fail the entire blog
          }
        }
      });
      
      // Wait for all images to be generated/uploaded
      await Promise.allSettled(imagePromises);
      console.log('✅ Image generation completed for all blogs');
      
      return blogData;
    } catch (error) {
      console.error('❌ Error generating blogs:', error);
      throw error;
    }
  }

  async saveBlogsToDatabase(blogData: BlogData[]): Promise<void> {
    console.log(`💾 Saving ${blogData.length} blogs to database...`);
    
    let savedCount = 0;
    let failedCount = 0;

    for (const blog of blogData) {
      try {
        await db.insert(blogs).values({
          title: blog.title,
          summary: blog.summary,
          content: blog.content,
          publishedAt: new Date(blog.published_at),
          sourceName: blog.source_name,
          sourceUrl: blog.source_url,
          tags: blog.tags,
          region: blog.region,
          companies: blog.companies || [],
          sector: blog.sector,
          financialImpact: blog.financial_impact,
          keyNumbers: blog.key_numbers || {},
          imageUrl: blog.image?.url,
          imageSource: blog.image?.source,
          imageAttribution: blog.image?.attribution,
          imageLicense: blog.image?.license,
          imageAltText: blog.image?.alt_text,
        });
        savedCount++;
        console.log(`✅ Saved blog: "${blog.title}"`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to save blog "${blog.title}":`, error);
        // Continue saving other blogs instead of failing completely
      }
    }
    
    console.log(`💾 Database save complete: ${savedCount} saved, ${failedCount} failed`);
    
    if (savedCount === 0 && failedCount > 0) {
      throw new Error('Failed to save any blogs to database');
    }
  }

  async generateAndSaveBlogs(): Promise<void> {
    try {
      const blogs = await this.generateDailyBlogs();
      await this.saveBlogsToDatabase(blogs);
      console.log('🎉 Daily blog generation completed successfully!');
    } catch (error) {
      console.error('💥 Daily blog generation failed:', error);
      throw error;
    }
  }

  async getAllBlogs(limit: number = 10, offset: number = 0) {
    return await db
      .select()
      .from(blogs)
      .where(eq(blogs.isActive, true))
      // .orderBy(desc(blogs.publishedAt))
      .orderBy(blogs.publishedAt)
      .limit(limit)
      .offset(offset);
  }

  async getBlogById(id: string) {
    const result = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async incrementViews(id: string) {
    await db
      .update(blogs)
      .set({ views: sql`${blogs.views} + 1` })
      .where(eq(blogs.id, id));
  }
}

export const blogService = new BlogService();
