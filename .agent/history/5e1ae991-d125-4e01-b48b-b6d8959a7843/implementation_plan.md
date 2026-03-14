# Phase 3.2: Offline-First Data Quality Enhancements

The next set of Phase 3 features focuses on simple, offline, and standalone solutions for maintaining data quality in the CRM.

## Proposed Changes

### 1. Simple Typo Checking (Fields)
- **Problem**: Users might make typos when entering names or companies. Complex external spell-checking is out of scope per our offline rules.
- **Solution**: Use the browser's native `spellcheck="true"` attribute on all `<textarea>` and text `<input>` fields. It's built into every major browser, completely offline, zero-cost, and requires no agent services.
- **Files**: `frontend/src/pages/Contacts.tsx`, `frontend/src/pages/Timeline.tsx`

### 2. Simple Skill Deduplication
- **Problem**: Inconsistent casing and naming for skills (e.g., "ReactJS", "react.js", "React").
- **Solution**: Implement a simple, deterministic normalization function on the backend that standardizes incoming skills before saving them to the database.
  - Convert everything to title case (or specific known cases).
  - Use a basic dictionary mapping for common tech aliases (e.g., `{'reactjs': 'React', 'react.js': 'React', 'node js': 'Node.js', 'nodejs': 'Node.js'}`).
- **Files**: `backend/src/index.ts` (in the `POST` and `PUT` routes for `/api/contacts`)

### 3. Relationship Decay Visualizer
- **Problem**: Hard to see at a glance who hasn't been contacted in a while.
- **Solution**: Compare the `lastContacted` date against the current date. If `lastContacted` is more than 3 months ago (or empty), add a subtle "decay" indicator (e.g., a "Needs Outreach" badge or an opacity change) to the contact card in `Contacts.tsx`.
- **Files**: `frontend/src/pages/Contacts.tsx`, `frontend/src/index.css`

## Verification Plan
1. Ensure red underlines appear natively on misspelled words in the notes textarea.
2. Submit a contact with skills like "reactjs, Node JS, typescript". Verify it saves and displays as "React, Node.js, Typescript".
3. Add a contact with an old `lastContacted` date and verify the "decay" UI element appears on their card.
