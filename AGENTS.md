# AGENTS.md — OpenAccounts

Personal accounting SPA with Google Drive sync. No backend servers.
User authenticates with their Google Account. For their sign up, they give access to their Google Drive's `drive.file` scope.

## Before working

- Use tokens effectively. First plan, reiterate the plan and then code.
- Work on one feature at a time while not breaking existing features (unless allowed by the user).

## Stack

| Concern | Choice |
|---|---|
| Hosting | GitHub Pages |
| Auth | Google Identity Services (OAuth2, `drive.file` scope) |
| Storage | IndexedDB (primary) + Google Drive visible folder (sync) |
| Frontend | Vanilla TS SPA (Oat UI library) |
| Bundler | Vite |
| Ledger | Double-entry (credits = debits) |
