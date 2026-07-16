import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { deleteBlogPost, getBlogCategories, getBlogPosts, getBlogTags, upsertBlogPost } from "@/lib/repository";
import type { BlogPost } from "@/lib/types";

const blogPostSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  author: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const blogDeleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  const guard = await requireAdminRoute("blog.manage");
  if (guard.response) return guard.response;

  const [posts, categories, tags] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
    getBlogTags(),
  ]);

  return NextResponse.json({ posts, categories, tags });
}

export async function POST(request: Request) {
  const guard = await requireAdminRoute("blog.manage");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const payload = blogPostSchema.parse(body) as BlogPost;

    const post = await upsertBlogPost(payload);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save blog post." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdminRoute("blog.manage");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    const payload = blogDeleteSchema.parse(body);

    const result = await deleteBlogPost(payload.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete post." },
      { status: 404 },
    );
  }
}
