"use client";

import { useMemo, useState, useTransition } from "react";
import type { BlogCategory, BlogPost, BlogTag } from "@/lib/types";

type BlogCmsBuilderProps = {
  initialPosts: BlogPost[];
  categories: BlogCategory[];
  tags: BlogTag[];
};

function makeNewPost(): BlogPost {
  const now = new Date().toISOString();
  return {
    id: `post-${crypto.randomUUID()}`,
    title: "",
    excerpt: "",
    content: "",
    author: "Veyra Editorial",
    categoryId: undefined,
    tagIds: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
    seo: {
      metaTitle: "",
      metaDescription: "",
      slug: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      noIndex: false,
    },
  };
}

export function BlogCmsBuilder({ initialPosts, categories, tags }: BlogCmsBuilderProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [activeId, setActiveId] = useState(initialPosts[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const activePost = useMemo(
    () => posts.find((post) => post.id === activeId) ?? posts[0] ?? null,
    [activeId, posts],
  );

  function patchActive(patch: Partial<BlogPost>) {
    if (!activePost) return;
    const next = { ...activePost, ...patch, updatedAt: new Date().toISOString() };
    setPosts((current) => current.map((post) => (post.id === activePost.id ? next : post)));
  }

  function savePost() {
    if (!activePost) return;
    startTransition(async () => {
      setFeedback("");
      const response = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activePost),
      });
      const json = (await response.json()) as { post?: BlogPost; message?: string };
      if (!response.ok || !json.post) {
        setFeedback(json.message ?? "Could not save blog post.");
        return;
      }
      setPosts((current) => current.map((post) => (post.id === json.post!.id ? json.post! : post)));
      setFeedback("Post saved.");
    });
  }

  function addPost() {
    const next = makeNewPost();
    setPosts((current) => [next, ...current]);
    setActiveId(next.id);
  }

  function deletePost() {
    if (!activePost) return;
    startTransition(async () => {
      setFeedback("");
      const response = await fetch("/api/admin/blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activePost.id }),
      });
      const json = (await response.json()) as { id?: string; message?: string };
      if (!response.ok || !json.id) {
        setFeedback(json.message ?? "Could not delete blog post.");
        return;
      }
      setPosts((current) => current.filter((post) => post.id !== activePost.id));
      setActiveId((current) => (current === activePost.id ? "" : current));
      setFeedback("Post deleted.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Posts</h3>
          <button
            type="button"
            onClick={addPost}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white hover:bg-white/5"
          >
            New Post
          </button>
        </div>
        <div className="grid gap-2">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setActiveId(post.id)}
              className={`rounded-xl border px-3 py-3 text-left ${
                activePost?.id === post.id
                  ? "border-[#f2c16b]/40 bg-[#f2c16b]/10"
                  : "border-white/10 bg-black/20 hover:bg-white/5"
              }`}
            >
              <p className="text-sm font-medium text-white">{post.title || "Untitled post"}</p>
              <p className="mt-1 text-xs text-white/60">{post.status.toUpperCase()}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-[#0c0a09] p-5">
        {activePost ? (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Title
                <input
                  value={activePost.title}
                  onChange={(event) => patchActive({ title: event.target.value })}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Author
                <input
                  value={activePost.author}
                  onChange={(event) => patchActive({ author: event.target.value })}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
            </div>

            <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
              Excerpt
              <textarea
                value={activePost.excerpt}
                onChange={(event) => patchActive({ excerpt: event.target.value })}
                rows={3}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </label>

            <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
              Content
              <textarea
                value={activePost.content}
                onChange={(event) => patchActive({ content: event.target.value })}
                rows={9}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Category
                <select
                  value={activePost.categoryId ?? ""}
                  onChange={(event) => patchActive({ categoryId: event.target.value || undefined })}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Status
                <select
                  value={activePost.status}
                  onChange={(event) =>
                    patchActive({
                      status: event.target.value as BlogPost["status"],
                      publishedAt:
                        event.target.value === "published"
                          ? activePost.publishedAt || new Date().toISOString()
                          : undefined,
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Slug
                <input
                  value={activePost.seo.slug}
                  onChange={(event) =>
                    patchActive({ seo: { ...activePost.seo, slug: event.target.value } })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
            </div>

            <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
              Tags
              <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
                {tags.map((tag) => {
                  const active = activePost.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        patchActive({
                          tagIds: active
                            ? activePost.tagIds.filter((id) => id !== tag.id)
                            : [...activePost.tagIds, tag.id],
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active ? "border-[#f2c16b]/40 bg-[#f2c16b]/10 text-[#f2c16b]" : "border-white/15 text-white/75"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Meta title
                <input
                  value={activePost.seo.metaTitle}
                  onChange={(event) =>
                    patchActive({ seo: { ...activePost.seo, metaTitle: event.target.value } })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Canonical URL
                <input
                  value={activePost.seo.canonicalUrl ?? ""}
                  onChange={(event) =>
                    patchActive({ seo: { ...activePost.seo, canonicalUrl: event.target.value } })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
            </div>

            <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
              Meta description
              <textarea
                value={activePost.seo.metaDescription}
                onChange={(event) =>
                  patchActive({ seo: { ...activePost.seo, metaDescription: event.target.value } })
                }
                rows={3}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </label>

            {feedback ? (
              <p className="rounded-xl border border-[#f2c16b]/30 bg-[#f2c16b]/10 px-3 py-2 text-sm text-[#f2c16b]">
                {feedback}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={deletePost}
                disabled={isPending}
                className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={savePost}
                disabled={isPending}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Post"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60">No post selected.</p>
        )}
      </section>
    </div>
  );
}
