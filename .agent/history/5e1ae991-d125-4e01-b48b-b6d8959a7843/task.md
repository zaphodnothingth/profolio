# CRM Application Development Checklist

## Phase 1: Initial Setup (Completed)
- [x] Set up Git repository and perform initial commit
- [x] Fix the non-functional save button for contacts

## Phase 2: Current Focus (Now)
- [x] Add a Satisfaction/Rating score (1-10) to Projects
- [x] Add the ability to Edit existing Contacts and Projects (pencil icon)
- [x] Ensure the native `<input type="month">` is styled intuitively and preserves "— Present" behavior when blank.
- [x] Make Career Timeline projects collapsible (and collapsed by default)
- [x] Add a "Delete" button when editing Contacts and Projects
- [x] Implement Bulk Delete for Contacts (checkboxes + shift-click support)

## Phase 3: Offline-First Enhancements (Now)
- [x] Fix the vCard export download behavior and verify filetype
- [ ] Implement sorting by Name/Date and Grid vs List views for the contact book
- [ ] Simple Automated Typo Checking/Correction (e.g., client-side dictionary or simple heuristic)
- [ ] Simple Skill Deduplication (e.g., lowercase matching, basic aliases for "ReactJS" -> "React")
- [ ] "Relationship Decay" visualizer: Flag contacts that haven't been contacted recently based on `lastContacted`

## Phase 4: Complex Integrations (Later)
- [ ] Import button (requires complex script for major contact management tools)
- [ ] Data Enrichment: Auto-fetch company logos or social profile thumbnails (Requires external APIs - deferred)
- [ ] Link Contacts to Projects (define relationships natively)
- [ ] Intelligent deduplication tool to merge identical Contacts (and potentially Projects)
- [ ] Skill Summary Tool: Rank top skills by time spent (consider simple vs multi-dimensional tracking)
