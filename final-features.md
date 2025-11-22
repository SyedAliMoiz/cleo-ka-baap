# Automated Content Engine v3 - Final Features (Source of Truth)

## 1. System Overview
ACE v3 is a modular content generation platform. It treats every AI operation as a configurable "Module".
Users can execute these modules sequentially (Guided Mode) or individually (Pick Your Own Mode).

## 2. Core Entities

### 2.1 Users & Auth
- **Auth**: Standard JWT-based system (NestJS + Passport).
- **Roles**:
  - `User`: Can manage Clients and run workflows.
  - `Admin`: Can configure Providers, Modules, and Knowledge Base.

### 2.2 Clients
- **Definition**: Represents a brand or persona.
- **Data**:
  - Name, Website, Industry.
  - **Stored Reports**: "Business Intelligence" & "Voice Guide" (Generated in Step 1).
  - **Artifacts**: All generated research, threads, and hooks are linked to a Client.

### 2.3 Modules (The Core Building Block)
- **Definition**: A self-contained AI task configuration.
- **Configurable Properties (Admin)**:
  - **Name**: e.g., "Topic Generator", "Deep Researcher".
  - **Provider/Handler**: e.g., "OpenAI Chat", "Perplexity Search", "Deep Research Agent".
  - **Model**: Specific model ID (e.g., `gpt-4o`, `claude-3-5-sonnet`).
  - **System Instructions**: The prompt defining behavior.
  - **Knowledge Base**: Linked reference files (RAG).
- **Extensibility**: Admins can create unlimited modules (e.g., "LinkedIn Converter").

### 2.4 Providers (API Management)
- **Scope**: Admin manages API Keys per Provider (OpenAI, Anthropic, Perplexity, Google, Grok).
- **Function**: Keys unlock models for use in Modules.

---

## 3. Workflow Modes

### 3.1 Guided Workflow Mode (The "Thread" Flow)
A fixed, sequential pipeline. Output of one step -> User Selection -> Input of next.

1.  **Client & Voice Intake**
    - **Input**: Manual text (Client details, raw notes).
    - **Module**: "Intake Analyst".
    - **Output**: 2 Reports (Business Intelligence + Voice Guide).
2.  **Topic Generator**
    - **Input**: Client Reports.
    - **Output**: 10-15 Hook-style topics.
    - **User Action**: Select 1 Topic.
3.  **Research (Branching)**
    - **Option A: Targeted Research** (Perplexity). Input: Topic. Output: Facts.
    - **Option B: Deep Research** (Google+Perplexity+Grok). Input: Topic. Output: Deep Context.
4.  **Thread Writer**
    - **Input**: Client Reports + Topic + Research + (RAG Knowledge).
    - **Output**: Full Thread Draft.
5.  **Hook Polisher**
    - **Input**: Draft Thread.
    - **Output**: 12 Hook Variants.
    - **User Action**: Select 1 Final Hook.
6.  **Transition & CTA**
    - **Input**: Final Thread + Client Offer.
    - **Output**: 3 CTA options.
    - **User Action**: Select Final CTA -> Complete Thread.

### 3.2 Pick Your Own Module Mode
- **UI**: A catalog of all available Modules.
- **Function**: User selects a Client, selects a Module, provides input, and gets a result.
- **Use Case**: "I just want to research this topic" or "I have a thread, please generate a CTA".

---

## 4. Technical Architecture

### 4.1 Tech Stack
- **Frontend**: Next.js 14+ (App Router).
- **Backend**: NestJS.
- **DB**: MongoDB.
- **Containerization**: Docker Compose (Full stack).

### 4.2 Module Execution Engine
- **Service**: `ModuleRunnerService`.
- **Logic**:
  - Load Module Config (Prompt, Model, RAG files).
  - Prepare Context (Client Reports + User Input + RAG retrieval).
  - Call Provider API (OpenAI/Anthropic/Perplexity).
  - Return formatted result.

### 4.3 RAG System
- **Admin**: Uploads files (PDF, Doc, Txt).
- **Ingestion**: Text extraction + Vector Embedding.
- **Retrieval**: Relevant chunks injected into Module context.

## 5. Implementation Phases
1.  **Foundation**: Project Setup, Docker, Auth, Provider/Key Management.
2.  **Core Engine**: Module entity, RAG system, LLM Service Integration.
3.  **Admin Features**: Module Editor, Knowledge Base UI.
4.  **Client & Dashboard**: Client CRUD, Artifact storage.
5.  **Workflow UI**: Guided Wizard & Module Runner.
