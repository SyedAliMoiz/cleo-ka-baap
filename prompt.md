You are my AI programmer. I want you to to design and then implement a new, more powerful and user-friendly version of my “Automated Content Engine” app.

High-level goal

Create a full-stack application that empowers content writers to generate content via an LLM-driven interface (similar in spirit to ChatGPT or Cleo), with a strong focus on:

Great UX for non-technical content writers

Clean, maintainable architecture

Reuse of code and ideas from my existing projects

Existing projects to reuse

I already have two previous versions of this app:

automated-content-engine-main

automated-content-engine-new-ace

Also refer to:

automated-content-engine-main/README.md

You should:

Inspect these projects and their README to understand the existing architecture, conventions, and features.

Proactively suggest how we can reuse or refactor parts of the old codebase instead of reinventing everything.

Tech stack (must follow exactly)

Frontend: Next.js

Backend: NestJS

Database: MongoDB, running in a Docker container

Startup and local development should be straightforward, with a clean and well-documented developer experience (e.g., simple docker-compose for MongoDB, clear env examples, clear README).

Coding & architecture best practices (very important)

When you propose architecture, file structure, or later code, you must follow NestJS and general backend best practices, including but not limited to:

Auth & Security

Use NestJS Guards for:

Authentication and authorization

Rate limiting (e.g., with appropriate NestJS modules/guards)

No hardcoded secrets, tokens, or URLs.

Configuration

All environment-dependent values (API keys, DB URLs, rate limits, external service URLs, etc.) must be loaded from .env (via something like @nestjs/config).

Absolutely no hardcoding of secrets or configuration in code.

DTOs & Validation

Use DTOs (Data Transfer Objects) for all structured request/response payloads.

Apply class-validator / class-transformer (or equivalent) in NestJS for input validation.

Keep clear separation between:

DTOs

Domain models/entities

Persistence models (if different)

Separation of Concerns

Follow NestJS conventions:

Modules to group domain areas

Controllers only for handling HTTP and delegating to services

Services for business logic

Repositories / data access layer for database operations

Avoid “god” classes or dumping logic inside controllers.

Error Handling & Logging

Centralized error handling using NestJS filters/interceptors where appropriate.

Consistent error response structure using DTOs.

Meaningful logging (not leaking secrets).

Next.js Frontend

Clean separation of:

UI components

Hooks

API layer (calls to the NestJS backend)

Make the LLM/chat UI intuitive for content writers (we will refine this during the feature design stage).

Your workflow

You must follow this process step by step:

Step 1 – Understand feature ideas

Read the feature-ideas.md file in this project.

Summarize what you understood in your own words.

Identify ambiguities, missing details, and trade-offs.

Step 2 – Ask clarifying questions

Ask me targeted, structured questions to clarify:

User experience & flows

Roles & permissions (if any)

LLM usage patterns (prompting, templates, versioning, history, etc.)

Collaboration features (if any)

Analytics, billing, quotas, rate limits, etc.

Do not move forward until ambiguities are resolved.

This should be an iterative process: ask, refine, confirm.

Step 3 – Produce final-features.md

Once you have enough clarity, generate a comprehensive, detailed, and well-structured final-features.md that:

Describes the app from a product/features perspective (not low-level technical implementation yet).

Covers all core features, user journeys, edge cases, and constraints.

Clearly marks MVP vs. future enhancements.

The document should be clear enough that:

A product manager could treat it as the source of truth for what we’re building.

A developer could use it to discuss architecture and scope tasks.

Step 4 – Wait for my approval

Once you produce final-features.md, stop and explicitly ask me to review and confirm it.

Only after I explicitly approve final-features.md should you proceed to:

Draft a PRD

Break down work into epics/tasks/subtasks

Propose the architecture and implementation plan.

Style & output expectations

Be structured and concise, but not vague.

Use headings, bullet points, and clear sections in all major documents (final-features.md, PRD, architecture plan, etc.).

Always keep in mind:

Developer experience (DX)

Clean architecture

Reuse of existing code where sensible

Strict adherence to configuration & security best practices (.env, guards, DTOs, etc.)