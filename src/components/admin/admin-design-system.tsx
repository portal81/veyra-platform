"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { ReactNode } from "react";

/**
 * Admin Design System — Veyra 2.0
 *
 * A set of composable primitives that give the admin a consistent,
 * product-grade personality: quieter than the public site, denser,
 * clearer, faster to edit.
 *
 * Naming convention follows the rest of the codebase (builder-kit.tsx).
 */

// ── AdminSectionCard ────────────────────────────────────────────────────────

type AdminSectionCardProps = {
  children: ReactNode;
  className?: string;
  /** If true, renders with a subtle gold accent top border */
  accent?: boolean;
};

export function AdminSectionCard({ children, className = "", accent = false }: AdminSectionCardProps) {
  return (
    <div
      className={`admin-section-card ${accent ? "admin-section-card--accent" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ── AdminSectionHeader ───────────────────────────────────────────────────────

type AdminSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional right-side content (e.g. status badge or action button) */
  trailing?: ReactNode;
};

export function AdminSectionHeader({ eyebrow, title, description, trailing }: AdminSectionHeaderProps) {
  return (
    <div className="admin-section-header">
      <div className="admin-section-header-text">
        {eyebrow && <p className="admin-section-eyebrow">{eyebrow}</p>}
        <h3 className="admin-section-title">{title}</h3>
        {description && <p className="admin-section-description">{description}</p>}
      </div>
      {trailing && <div className="admin-section-header-trailing">{trailing}</div>}
    </div>
  );
}

// ── AdminFieldRow ────────────────────────────────────────────────────────────

type AdminFieldRowProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function AdminFieldRow({ label, hint, required = false, children }: AdminFieldRowProps) {
  return (
    <div className="admin-field-row">
      <div className="admin-field-label-group">
        <label className="admin-field-label">
          {label}
          {required && <span className="admin-field-required">*</span>}
        </label>
        {hint && <p className="admin-field-hint">{hint}</p>}
      </div>
      <div className="admin-field-input">{children}</div>
    </div>
  );
}

// ── AdminStickyActions ───────────────────────────────────────────────────────

type AdminStickyActionsProps = {
  onSave: () => void | Promise<void>;
  isSaving?: boolean;
  isDirty?: boolean;
  saveLabel?: string;
  savedLabel?: string;
};

export function AdminStickyActions({
  onSave,
  isSaving = false,
  isDirty = false,
  saveLabel = "Save changes",
  savedLabel = "Saved",
}: AdminStickyActionsProps) {
  const statusLabel = isSaving
    ? "Saving..."
    : isDirty
      ? "Unsaved changes"
      : "All changes saved";

  return (
    <div className={`admin-sticky-actions ${isDirty ? "admin-sticky-actions--visible" : ""}`}>
      <div className="admin-sticky-actions-inner">
        <p className="admin-sticky-unsaved-label">{statusLabel}</p>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="admin-sticky-save-btn"
        >
          {isSaving ? (
            <span className="admin-sticky-spinner" />
          ) : isDirty ? (
            saveLabel
          ) : (
            savedLabel
          )}
        </button>
      </div>
    </div>
  );
}

// ── AdminEmptyState ──────────────────────────────────────────────────────────

type AdminEmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminEmptyState({ icon = "◻", title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state">
      <span className="admin-empty-icon">{icon}</span>
      <p className="admin-empty-title">{title}</p>
      {description && <p className="admin-empty-description">{description}</p>}
      {action && <div className="admin-empty-action">{action}</div>}
    </div>
  );
}

// ── AdminMissingMediaState ───────────────────────────────────────────────────

type AdminMissingMediaStateProps = {
  /** Where is this media used? e.g. "Hero Background", "Gallery Image 1" */
  slotName: string;
  /** What type is expected */
  mediaType: "image" | "video" | "gallery";
  /** Aspect ratio hint e.g. "16:9", "1:1", "3:4" */
  aspectHint?: string;
  /** Where it renders on the public site */
  usageHint?: string;
  /** Upload handler */
  onUpload?: () => void;
};

export function AdminMissingMediaState({
  slotName,
  mediaType,
  aspectHint,
  usageHint,
  onUpload,
}: AdminMissingMediaStateProps) {
  const ICONS = { image: "◻", video: "▷", gallery: "⊞" };

  return (
    <div className="admin-missing-media">
      <div className="admin-missing-media-icon">{ICONS[mediaType]}</div>
      <div className="admin-missing-media-body">
        <p className="admin-missing-media-slot">{slotName}</p>
        {usageHint && <p className="admin-missing-media-usage">{usageHint}</p>}
        <div className="admin-missing-media-meta">
          <span className="admin-missing-media-chip">{mediaType}</span>
          {aspectHint && <span className="admin-missing-media-chip">{aspectHint}</span>}
          <span className="admin-missing-media-chip admin-missing-media-chip--warn">Missing</span>
        </div>
      </div>
      {onUpload && (
        <button type="button" onClick={onUpload} className="admin-missing-media-upload-btn">
          Upload
        </button>
      )}
    </div>
  );
}

// ── AdminSubnavTabs ──────────────────────────────────────────────────────────

type AdminSubnavTab = {
  id: string;
  label: string;
  /** Optional count badge */
  count?: number;
};

type AdminSubnavTabsProps = {
  tabs: AdminSubnavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function AdminSubnavTabs({ tabs, activeTab, onTabChange }: AdminSubnavTabsProps) {
  return (
    <nav className="admin-subnav-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`admin-subnav-tab ${activeTab === tab.id ? "admin-subnav-tab--active" : ""}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="admin-subnav-tab-count">{tab.count}</span>
          )}
        </button>
      ))}
    </nav>
  );
}

// ── AdminMediaSlot ───────────────────────────────────────────────────────────

type AdminMediaSlotProps = {
  /** Clear descriptive name: "Hero Background", "Gallery Image 1" */
  name: string;
  /** Where it appears on the public site */
  usageHint?: string;
  /** e.g. "16:9", "1:1" */
  aspectHint?: string;
  mediaType?: "image" | "video";
  currentUrl?: string;
  onUpload?: () => void;
  onDelete?: () => void;
  onReplace?: () => void;
};

export function AdminMediaSlot({
  name,
  usageHint,
  aspectHint,
  mediaType = "image",
  currentUrl,
  onUpload,
  onDelete,
  onReplace,
}: AdminMediaSlotProps) {
  if (!currentUrl) {
    return (
      <AdminMissingMediaState
        slotName={name}
        mediaType={mediaType}
        aspectHint={aspectHint}
        usageHint={usageHint}
        onUpload={onUpload}
      />
    );
  }

  return (
    <div className="admin-media-slot">
      <div className="admin-media-slot-preview">
        {mediaType === "video" ? (
          <video src={currentUrl} className="admin-media-slot-img" muted playsInline />
        ) : (
          <img src={currentUrl} alt={name} className="admin-media-slot-img" />
        )}
      </div>
      <div className="admin-media-slot-meta">
        <div>
          <p className="admin-media-slot-name">{name}</p>
          {usageHint && <p className="admin-media-slot-usage">{usageHint}</p>}
          <div className="admin-missing-media-meta" style={{ marginTop: "0.4rem" }}>
            <span className="admin-missing-media-chip">{mediaType}</span>
            {aspectHint && <span className="admin-missing-media-chip">{aspectHint}</span>}
            <span className="admin-missing-media-chip admin-missing-media-chip--ok">Uploaded</span>
          </div>
        </div>
        <div className="admin-media-slot-actions">
          {onReplace && (
            <button type="button" onClick={onReplace} className="admin-media-btn">
              Replace
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className="admin-media-btn admin-media-btn--danger">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AdminContentScore ────────────────────────────────────────────────────────

type AdminContentScoreItem = {
  label: string;
  done: boolean;
  required: boolean;
};

type AdminContentScoreProps = {
  score: number; // 0-100
  items: AdminContentScoreItem[];
  compact?: boolean;
};

export function AdminContentScore({ score, items, compact = false }: AdminContentScoreProps) {
  const [expanded, setExpanded] = useState(false);
  const color = score >= 80 ? "#059669" : score >= 50 ? "#D4AF37" : "#DC2626";

  return (
    <div className="admin-content-score">
      <div className="admin-content-score-header" onClick={() => setExpanded((v) => !v)}>
        <div className="admin-content-score-bar-wrap">
          <div
            className="admin-content-score-bar-fill"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
        <span className="admin-content-score-pct" style={{ color }}>
          {score}%
        </span>
        <span className="admin-content-score-label">Content readiness</span>
      </div>
      {(expanded || !compact) && (
        <ul className="admin-content-score-checklist">
          {items.map((item, i) => (
            <li
              key={i}
              className={`admin-content-score-item ${item.done ? "admin-content-score-item--done" : item.required ? "admin-content-score-item--missing" : "admin-content-score-item--optional"}`}
            >
              <span className="admin-content-score-item-icon">
                {item.done ? "✓" : item.required ? "✗" : "◌"}
              </span>
              {item.label}
              {item.required && !item.done && (
                <span className="admin-content-score-required-badge">Required</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
