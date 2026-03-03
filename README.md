# Tinitiate PWA Documentation

Scroll+ Tinitiate PWA is a Progressive Web App (PWA) that provides subject-wise learning content using Markdown files. This documentation is divided into two main parts:

- **Developer Guide** - for contributors who maintain subjects, README files, and topic Markdown files.
- **User Guide** - for learners who use the application to sign up, log in, browse subjects, save content offline, and read topics.

---
## Table of Contents

- [Overview](#overview)
- [Main GitHub Repository](https://github.com/tinitiateprime/tinitiate_it_traning_app)
    In this Github link we can add new subject ReadMe
    
  - [How Markdown Topic Linking Works](#how-markdown-topic-linking-works)
  - [How to Add a New Topic](#how-to-add-a-new-topic)
  - [User Guide](#user-guide)
  - [Signup Flow](#signup-flow)
  - [Login Flow](#login-flow)
  - [Dashboard Flow](#dashboard-flow)
  - [Subject Navigation Flow](#subject-navigation-flow)
  - [Topic Navigation Flow](#topic-navigation-flow)
  - [Complete Application Flow](#complete-application-flow)
  - [Mobile View](#mobile-view)
- [Summary](#summary)

## Overview

- Scroll+ Tinitiate PWA is a Progressive Web App (PWA) built to deliver subject-wise learning content.
- Learning content is organized using Markdown (`.md`) files.
- Each subject has its own main `README.md` file that acts as a topic index.
- Users can navigate from the Dashboard to a Subject, then to a Topic, and read the topic content directly in the application.
- The application also supports **Save Offline** so users can access selected subject content later.

---

## Subject Catalog Links

If you want to add another subject, its main subject `README.md` link should be added here in github

### Catalog 1
- **Vue.js**  
  `https://github.com/tinitiateprime/vue-Js/blob/main/README.md`

### Catalog 2
- **Next.js**  
  `https://github.com/tinitiateprime/Next-Js/blob/main/README.md`

### Catalog 3
- **SQL Server**  
  `https://github.com/tinitiateprime/sqlserver/blob/main/README.md`

---

# Developer Guide

## How the README Structure Works

- Each subject contains a main `README.md` file.
- This README works as the main index for that subject.
- It contains clickable topic links written in Markdown format.
- If you want to add another subject, the subject's main README link should be added in the main catalog section.

![Main README Structure](./public/main_Readme_files.png)

### Example

Below is an example of one topic link written inside a subject `README.md`:

## [Reactivity System](./05-reactivity-basics.md)

### Meaning of Each Part

- `##` -> Defines a level-2 heading in Markdown.
- `[Reactivity System]` -> The visible clickable topic name.
- `(./05-reactivity-basics.md)` -> The relative file path to the topic file.

### Purpose

This structure ensures that:

- the README remains organized
- topic names are clearly visible
- each topic is clickable
- each topic connects to its own Markdown file

---

## Why `##` Is Required for Every Topic

- For every topic inside a README, it is compulsory to use `##` before the topic name.

### Correct Format

## [Topic Name](./file-name.md)

### Why This Is Important

- It creates a proper heading in Markdown.
- It keeps the README structured.
- It improves readability.
- It maintains consistency across all subjects.
- It makes the document easier to scan.
- If `##` is not used, the topic may not appear as a proper section heading.

---

## How Markdown Topic Linking Works

The linking pattern used in the README is:

`[Topic Name](./file-name.md)`

### Rules

- The topic name must be inside square brackets `[ ]`.
- The file path must be inside parentheses `( )`.
- The file path should usually be a relative path like `./file-name.md`.
- The file name must match the actual Markdown file exactly.

### Purpose

- This allows the application and GitHub to correctly connect the topic name to its content file.

---

## How to Add a New Topic

If a contributor wants to add a new topic, they must follow the same structure.

### Steps

1. Create a new `.md` file in the correct subject folder.
2. Add the topic content inside that file.
3. Open the subject's main `README.md`.
4. Add a new line using the correct Markdown format.

### Format

## [New Topic Name](./new-topic-file.md)

### Checklist

- `##` must be present.
- The topic name must be inside `[ ]`.
- The file path must be inside `( )`.
- The file name must match exactly.
- The file must exist in the correct folder.

### Purpose

- This ensures that the new topic becomes visible and accessible in the subject topic list.
- Everything explained above is shown in the screenshot below.

![Vue.js Markdown Example](./public/Vuejsmarkdown.png)

---

# User Guide

## Signup Flow

When a new user opens the application for the first time, they must create an account using the Signup page.

### Steps

1. The user opens the application.
2. The user navigates to the Signup page.
3. The user enters the required registration details.
4. The application stores the user details in the configured database.
5. After successful signup, the user is automatically redirected to the Dashboard.

### Purpose

- The signup flow allows a new user to create an account and access the learning platform.

---

## Login Flow

If the user already has an account, they can use the Login page.

### Steps

1. The user opens the application.
2. The user navigates to the Login page.
3. The user enters valid credentials.
4. The application verifies the credentials.
5. If authentication is successful, the user is redirected to the Dashboard.
6. If authentication fails, the user remains on the login page and sees an error message.

### Purpose

- The login flow allows existing users to securely access the application.

---

## Dashboard Flow

After successful signup or login, the user is redirected to the Dashboard.

### Steps

1. The user reaches the dashboard after authentication.
2. The dashboard displays the available subjects.
3. The user can select any subject from the list.
4. If any subject has been saved offline, those saved cards are also visible on the dashboard.

### Purpose

- The dashboard acts as the main entry point after authentication and allows users to navigate to subject content.

![Dashboard](./public/dashboard.png)

---

## Subject Navigation Flow

When the user selects a subject from the dashboard, the application opens the corresponding Subject Page.

### Steps

1. The user clicks a subject on the dashboard.
2. The application opens the subject page.
3. The subject page loads the subject's main `README.md`.
4. The README displays the list of available topics for that subject.

### Save Offline

- Each subject page includes a **Save Offline** option.
- To save the subject for offline access, click the **Save Offline** button on the subject page.
- Once saved, the saved subject cards become visible on the Dashboard.
- This allows the user to reopen saved content later, even when internet access is limited.

### Purpose

- The subject page acts as the bridge between the dashboard and the individual topic content.

**Before Save Offline**

![Subject Before Offline Save](./public/Vuejs_subject_before_offline.png)

**After Save Offline**

![Subject After Offline Save](./public/Vuejs_after_offline.png)

---

## Topic Navigation Flow

Inside the subject page, the user can choose a topic.

### Steps

1. The user sees the list of topics from the subject README.
2. The user clicks a topic.
3. The application loads the linked Markdown (`.md`) file for that topic.
4. The topic content is rendered and displayed on the screen.

### Purpose

- This flow allows users to read the selected learning material topic by topic.

![Topic View](./public/topic.png)

---

## Complete Application Flow

The full user journey in the application is:

1. Open the application.
2. Signup (for new users) or Login (for existing users).
3. Redirect to Dashboard.
4. Select a Subject.
5. Load Subject README.
6. Select a Topic.
7. Load Topic Markdown File.
8. Display Topic Content.

### Flow Summary

- Signup / Login -> Dashboard -> Subject -> Topic -> Markdown Content

---

## Mobile View

The following screenshots show the mobile view of the application, including the Topic page, Dashboard, Sidebar, and Subject page.

### Mobile View - Topic Page

![Mobile Topic Page](./public/mobile_topic.png)

### Mobile View - Dashboard

![Mobile Dashboard](./public/mobile-viewdashboard.png)

### Mobile View - Sidebar

![Mobile Sidebar](./public/mobile-viewsidebar.png)

### Mobile View - Subject Page

![Mobile Subject Page](./public/mobile-viewsubject.png)

---

## Summary

This documentation now covers both:

- **Developer Guide** for maintaining subject README structure and topic links.
- **User Guide** for understanding how learners use the application from signup to topic reading.

This makes the main `README.md` more complete, easier to understand, and useful for both contributors and end users.