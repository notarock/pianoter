# Pianoter UI/UX Tasks

## Bug Fixes (Broken/Missing UI)

- [ ] `/composers/new` page is blank — the Add Composer form renders nothing
- [ ] Page titles are invisible — "Sign in to Pianoter", "Create an account", "Repertoire", "Add Piece", "Practice History", "To Revisit" all render as near-transparent ghost text
- [ ] "Edit" button on piece detail is invisible — renders as an unstyled empty box next to the title with no label
- [ ] "+ Log Practice Session" renders as an unstyled blank box — no visible button text or boundary styling
- [ ] Mystery unlabeled empty boxes appear on `/register`, `/pieces/new`, and `/pieces/:id`; likely buttons or form sections that lost their styles/labels
- [ ] Browser tab title shows "web" — should display the app name ("Pianoter") or the current page name

## Inconsistent Styling

- [ ] Filter dropdowns have mismatched themes — "All statuses" is dark-styled, "All composers" uses default browser styling
- [ ] Form input fields are dark on auth pages and add-piece forms, but white/light on piece detail — no consistent input style
- [ ] "Logout" sits inline with nav links in the top-right but looks like a nav item — should be visually distinct
- [ ] Status text in tables is plain unstyled text — "Active", "Wishlist", "Learning", "Shelved" should be color-coded badges

## Navigation & Wayfinding

- [ ] No back/breadcrumb navigation — from `/pieces/1` there's no way back to Repertoire except the nav bar
- [ ] Composer names on repertoire/dashboard are not clickable — should navigate to composer detail
- [ ] Composer rows on `/composers` are not clickable — no way to view or edit a composer's details
- [ ] No active page highlighting on Dashboard nav link — all other links get an underline indicator but behavior should be consistent

## Layout & Visual Design

- [ ] Content area is very narrow and centered with large unused grey sidebars
- [ ] Dashboard stat cards are not clickable — should filter the repertoire by status when clicked
- [ ] Difficulty displayed as raw "7/10" text — should use a visual indicator (progress bar, star rating, or colored pill)
- [ ] "Started" date displays with a timezone off-by-one issue and is not human-friendly (e.g. should show "Jan 1, 2026")
- [ ] "Last Played: Never" and "Current Level: —" use inconsistent null representations
- [ ] No favicon

## Forms & Data Entry UX

- [ ] No inline "Add composer" from the Add Piece form — requires navigating away to Composers first
- [ ] Difficulty field is a raw number input (1–10) — should be a slider or segmented control
- [ ] Date pickers use raw `yyyy-mm-dd` browser input — no user-friendly date picker
- [ ] "Started At" field on Add Piece has no default value — should default to today
- [ ] "Log Practice Session" has no visible form fields — unclear what data to enter (duration? notes? rating?)
- [ ] No validation feedback on forms — only browser-native tooltips, not inline styled errors
- [ ] No success/confirmation feedback after adding a piece, logging a session, or registering

## Safety & Destructive Actions

- [ ] No confirmation dialog before deleting a piece — the red Delete button fires immediately with no prompt

## Empty States

- [ ] Dashboard "To Revisit" section shows brand-new pieces immediately — the "not played in 30+ days" logic triggers for pieces that have never been played regardless of age
- [ ] Repertoire has two CTAs when empty ("+ Add Piece" top-right AND "+ Add your first piece" centered) — redundant

## Page-Level Structure

- [ ] No page for viewing/editing a composer's details — `/composers/:id` may not exist or be unreachable
- [ ] No notes/description field on pieces — nowhere to store info like "currently working on bars 24–48"
- [ ] Practice session history has no detail — "Practice History" section has no table/timeline structure
- [ ] No search on the Repertoire page — only filter by status and composer; no text search
- [ ] The "system" badge on composer names has no tooltip or explanation
