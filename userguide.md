# README-Driven Tutorial Dashboard + Topic Viewer (One-File Guide)

This guide explains how your app reads a single GitHub `README.md` to build:

- **Dashboard** → list of **Subjects**
- **Subject page** → list of **Topics**
- **Topic page** → renders the topic `.md` content

---

## 1) Update the README URL in Code (Required)

You must update the README link in **both** places:

- **Dashboard page file** (subject listing)
- **TopicPage file** (topic rendering)

Search keywords in your project:

- `README_BLOB_URL`
- `blob/main/README.md`

✅ Keep it as a **blob URL**.  
Your code converts blob → raw automatically using `toRawGithub()`.

Example:

```ts
const README_BLOB_URL =
  "https://github.com/<owner>/<repo>/blob/main/README.md";
  ```

README Format (MOST IMPORTANT)

Your parser expects this structure:

## Subject Name

### Topic Name

Next line (or same line) must contain a URL pointing to a .md file

✅ Copy-paste README example
# Tutorials Catalog

## Vue JS

### Introduction
https://github.com/<owner>/<repo>/blob/main/catalog/vue/introduction.md

### Components
https://github.com/<owner>/<repo>/blob/main/catalog/vue/components.md


## React

### Introduction
https://github.com/<owner>/<repo>/blob/main/catalog/react/introduction.md

### Hooks
https://github.com/<owner>/<repo>/blob/main/catalog/react/hooks.md
Rules

## creates a Subject (appears on Dashboard)

### creates a Topic under that subject

The link must end with .md

Link can be raw or blob (blob is converted to raw automatically)

3) Where to Place Topic Markdown Files

- You can store topic markdown files anywhere in the repo, but recommended:

/catalog/<subject-folder>/<topic>.md

Examples:
```
/catalog/vue/introduction.md
/catalog/vue/components.md
/catalog/react/hooks.md
4) How Navigation Works (Which Pages Open)
A) Dashboard page

Open:

/

This reads README and shows Subject cards.

B) Subject page

When you click a subject (example: Vue JS), it opens:

/subject/Vue%20JS
C) Topic page

When you click a topic (example: Introduction), it opens:

/topic/Introduction?subject=Vue%20JS

✅ The subject=... query param is required because your TopicPage reads:

router.query.subject

router.query.topic

5) How to Add a New Subject + Topic (Step-by-step)
Step 1: Add to README

Add a new subject:

## SQL Server

Add a topic:

### Joins
https://github.com/<owner>/<repo>/blob/main/catalog/sqlserver/joins.md
Step 2: Create the markdown file in the repo

Create:

/catalog/sqlserver/joins.md

``` 

Step 3: Commit + push

After push, refresh your app.

✅ Result:

Dashboard will show SQL Server

Subject page will list Joins

Topic page will render /catalog/sqlserver/joins.md

6) Common Issues and Fixes
“Subject not found”

README does not have ## Subject

Subject name mismatch

“Topic not found”

README missing ### Topic

URL missing

URL is not .md

“Failed to load content”

URL is wrong (404)

Repo is private (raw fetch may fail)

CORS blocked → you may need /api/proxy (your code already tries it as fallback)

7) Minimal Working Example (Real Quick)

Repo files:

README.md
catalog/vue/introduction.md

README content:

## Vue JS
### Introduction
https://github.com/<owner>/<repo>/blob/main/catalog/vue/introduction.md

