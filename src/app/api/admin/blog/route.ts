import { NextResponse } from "next/server";
import { deleteBlogPost, getBlogCategories, getBlogPosts, getBlogTags, upsertBlogPost } from "@/lib/repository";
import type { BlogPost } from "@/lib/types";

export async function GET() {
  const [posts, categories, tags] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
    getBlogTags(),
  ]);

  return NextResponse.json({ posts, categories, tags });
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as BlogPost | null;
  if (!payload?.id || !payload?.title) {
    return NextResponse.json({ message: "Invalid blog payload." }, { status: 400 });
  }

  const post = await upsertBlogPost(payload);
  return NextResponse.json({ post });
}

export async function DELETE(request: Request) {
  const payload = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!payload?.id) {
    return NextResponse.json({ message: "Post id is required." }, { status: 400 });
  }

  try {
    const result = await deleteBlogPost(payload.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete post." },
      { status: 404 },
    );
  }
}
