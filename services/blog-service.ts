import { db } from '../config/database.js';
import { blogs } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import OpenAI from 'openai';

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
    });
  }

  async generateDailyBlogs(): Promise<BlogData[]> {
    console.log('🤖 Generating daily blogs...');
    
    try {
      const response = await this.client.responses.create({
        model: "gpt-5",
        tools: [
          { type: "web_search" },
        ],
        input: `You are a professional financial news curator for "FinLook" - a premier Indian fintech and financial education platform. I need you to find and curate 2-5 high-quality finance-focused Indian news stories from the last 24 hours (today: ${new Date().toISOString().split('T')[0]}). Aim for 5 stories if possible, but minimum 2 stories required.

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
- **summary**: 2-3 sentence summary highlighting key impact and implications (150-200 words) - DO NOT mention source name or "according to" references
- **content**: Full blog-ready article (800-1200 words) with:
  * Engaging introduction
  * Key details and context
  * Market/business implications
  * Expert analysis or quotes if available
  * Conclusion with future outlook
  * DO NOT include "source:", "according to", or reference the original news source in the content
  * Remove ALL links, URLs, and references to external sources from within the content

- **published_at**: ISO timestamp of original publication
- **source_name**: Original news source (ONLY place to mention source name)
- **source_url**: Direct link to original article (ONLY place to mention source URL)
- **tags**: 5-7 relevant tags for categorization
- **region**: Affected regions/countries
- **companies**: Mentioned companies/brands
- **sector**: Primary business sector
- **financial_impact**: Analysis of how this news affects investors, markets, or personal finance decisions
- **key_numbers**: Important financial figures, percentages, or data points from the story
- **image_info**: Find and provide real image URLs when possible

IMAGE REQUIREMENTS:
For each story, try to find:
1. **Direct image URLs**: Look for images from the original news source or related official sources
2. **Free stock images**: Provide direct download URLs from Unsplash, Pexels, or similar free platforms
3. **Image accessibility**: CRITICAL - Ensure all image URLs are accessible and return valid images (not 404 errors)
4. **Image attribution**: Include proper attribution and license information
5. **NO WATERMARKS**: CRITICAL - Only use images that are completely watermark-free and clean


IMPORTANT IMAGE ACCESSIBILITY RULES:
- Test image URLs before including them
- For Unsplash: Use direct image URLs that work (avoid expired or moved links)
- For Pexels: Ensure URLs are current and accessible
- If an image URL returns 404 or is inaccessible, do NOT include it
- Better to have no image than a broken image URL
- **WATERMARK CHECK**: Verify that images do NOT have any watermarks, logos, or text overlays before including them
- **CLEAN IMAGES ONLY**: Only use professional, clean images without any branding, watermarks, or text overlays

PREFERRED IMAGE SOURCES:
- Original news article images (if available and watermark-free)
- Unsplash financial/business images with direct download URLs (watermark-free versions only)
- Pexels professional images with direct links (clean, no watermarks)
- Company logos or official images (if publicly available and clean)
- **AVOID**: Any stock photo sites that add watermarks or require attribution overlays

IMAGE OUTPUT FORMAT:
\`\`\`json
"image": {
  "url": "direct_download_url_here", // MUST be accessible and working (no 404 errors)
  "source": "unsplash/pexels/news_source",
  "attribution": "Photo by [Author] on [Platform]",
  "license": "license_type",
  "alt_text": "descriptive_text_for_accessibility"
}
\`\`\`

QUANTITY REQUIREMENT:
Target 5 stories if available, but provide between 2-5 stories. Quality over quantity - better to have 2-3 excellent stories than forcing 5 mediocre ones.

OUTPUT FORMAT:
Return as clean JSON array with 2-5 stories, ensuring each story is complete, well-researched, and relevant to the FinLook audience interested in finance and business.

CRITICAL CONTENT REQUIREMENTS:
1. **Source Removal**: Do NOT mention "source", "according to [source name]", or any reference to the original news source in the title, summary, content, tags, or any other field except source_name and source_url.
2. **Link Removal**: Remove ALL links, URLs, and external references from within the content. Read the full source article and strip out any embedded links, source references, or external URLs.


IMAGE URL VERIFICATION: Before including any image URL, ensure it is accessible and returns a valid image. Test Unsplash, Pexels, and other free platform URLs to confirm they work. If an image URL is broken or returns 404, do not include the image field at all. **CRITICAL**: Only use images that are completely free of watermarks, logos, or text overlays. Verify image quality and cleanliness before including.

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
      
      return blogData;
    } catch (error) {
      console.error('❌ Error generating blogs:', error);
      throw error;
    }
  }

  async saveBlogsToDatabase(blogData: BlogData[]): Promise<void> {
    console.log(`💾 Saving ${blogData.length} blogs to database...`);
    
    try {
      for (const blog of blogData) {
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
      }
      
      console.log('✅ All blogs saved successfully');
    } catch (error) {
      console.error('❌ Error saving blogs to database:', error);
      throw error;
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
