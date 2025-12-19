# Theme System Implementation Plan

This document outlines the effort and technical strategy required to implement a robust multi-theme system (Light and Dark) for the Cultivator PWA.

## Summary of Effort
The application is currently "Dark First," utilizing many hardcoded dark-mode utility classes and custom hex colors. Supporting a light theme requires a systematic refactor of the styling layer.

- **Estimated Time**: 5-7 business days.
- **Complexity**: Moderate-High (due to heavy use of glassmorphism and custom gradients).
- **Scope**: ~60+ components and pages across the entire codebase.

## Proposed Strategy

### 1. Architecture Refactor
Move from hardcoded hex colors to a CSS Variable system. This allows toggling colors globally via a class on the `<html>` or `<body>` tag.

- **Tools**: Use `next-themes` for state management and local storage persistence.
- **Tailwind Config**: Map theme colors (e.g., `accent-green`) to CSS variables (e.g., `var(--accent-green)`).
- **Global Styles**: Define `:root` (light) and `.dark` variable sets in `globals.css`.

### 2. Semantic Color Mapping
Replace hardcoded utility classes with semantic variants that adapt automatically.

| Variable Name | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- |
| `--bg-main` | `#F8FAFC` (Slate 50) | `#050505` (Black) |
| `--bg-surface` | `#FFFFFF` (White) | `#0A0A0A` (Dark Surface) |
| `--text-primary` | `#0F172A` (Slate 900) | `#F3F4F6` (Gray 100) |
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | `rgba(255, 255, 255, 0.07)` |

### 3. Progressive Migration
Refactor components in logical waves to ensure the app remains functional throughout the process:
- **Wave 1**: Core Layout (Sidebar, Topbar, Navigation).
- **Wave 2**: Shared UI Library (Buttons, Inputs, Tables, Badges).
- **Wave 3**: Feature Components (BatchCard, Dashboard, Baglet Grids).

## Key Considerations

> [!IMPORTANT]
> **Aesthetic Quality**: The light theme must feel as "premium" as the dark theme. This requires careful use of box-shadows and subtle borders to replace the depth currently provided by dark gradients.

> [!WARNING]
> **Component Audit**: We must manually audit ~20 feature-specific files (like `BatchCard.tsx`) to remove hardcoded hex values such as `bg-[#0A0A0A]`.

## Verification Plan
- **Theme Toggle**: Test that theme preference persists across browser refreshes and PWA sessions.
- **Contrast Check**: Audit all screens for WCAG AA accessibility compliance in both modes.
- **Visual Regression**: Ensure no layouts "break" or lose visibility when switching modes.
