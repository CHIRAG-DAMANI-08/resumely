# Resumely Architecture Diagrams

## Diagram 1 — System Context

```mermaid
C4Context
    title System Context Diagram

    Person(user, "User", "A job seeker looking to optimize their resume.")
    System(resumely, "Resumely", "Resume optimization and ATS scoring platform.")
    
    System_Ext(puter, "Puter.js", "Auth + Storage + KV")
    System_Ext(claude, "Claude AI", "AI Provider (via Puter)")

    Rel(user, resumely, "Uses")
    Rel(resumely, puter, "Uses for Auth, Storage, KV")
    Rel(resumely, claude, "Sends prompts to")
    ```c4x
    %%{ c4: container }%%
    graph TB
    
    user[Person: User<br/>A job seeker looking to optimize their resume.]
    
    subgraph ResumelySystem {
        resumely[System: Resumely<br/>Resume optimization and ATS scoring platform.]
    }
    
    subgraph ExternalSystems {
        puter[System_Ext: Puter.js<br/>Auth / Storage / KV]
        claude[System_Ext: Claude AI<br/>AI Provider via Puter]
    }
    
    user -->|Uses| resumely
    resumely -->|Uses for Auth, Storage, and KV| puter
    resumely -->|Sends prompts to| claude

```

```c4x
%%{ c4: container }%%
graph TB
    user[User<br/>Person<br/>A job seeker looking to optimize their resume.]

    subgraph ResumelySystem {
        resumely[Resumely<br/>System<br/>Resume optimization and ATS scoring platform.]
    }

    subgraph ExternalServices {
        puter[Puter.js<br/>System_Ext<br/>Auth + Storage + KV]
        claude[Claude AI<br/>System_Ext<br/>AI Provider via Puter]
    }

    user -->|Uses| resumely
    resumely -->|Uses for Auth, Storage, KV| puter
    resumely -->|Sends prompts to| claude
```

## Diagram 2 — Container Diagram

```mermaid
C4Container
    title Container Diagram

    Person(user, "User", "Job seeker")
    
    Container(spa, "React SPA", "React 19, Route v7, Zustand", "Provides the user interface and handles purely client-side logic.")
    Container(puter, "Puter.js Cloud BaaS", "Cloud Platform", "Handles user authentication, file storage, and NoSQL KV database.")
    Container(claude, "Claude 3.7 Sonnet", "AI Service", "Processes resumes against job descriptions to provide ATS scoring and tips.")

    Rel(user, spa, "Visits app, uploads PDF, views scores")
    Rel(spa, puter, "PDF upload, KV read/write")
    Rel(spa, claude, "AI prompt/response")
```

## Diagram 3 — Component Diagram (Upload Flow)

```mermaid
C4Component
    title Component Diagram (Upload Flow)
    
    Container_Boundary(spa, "React SPA") {
        Component(upload_tsx, "upload.tsx", "React Route", "Upload workflow orchestration.")
        Component(jobUrlInput, "JobUrlInput", "React Component", "Captures target job URL.")
        Component(jobParser, "jobParser.ts", "Module", "Extracts job description from URL.")
        Component(pdf2img, "pdf2img.ts", "Module", "Converts PDF resumes to PNGs.")
    }
    
    Container_Boundary(puter_services, "Puter Cloud BaaS") {
        Component(puterAI, "Puter AI", "Service", "Used for text extraction and content parsing.")
        Component(puterFS, "Puter FS", "Service", "Stores uploaded PDFs and generated PNGs.")
        Component(puterKV, "KV Store", "Service", "Saves resume metadata and AI scores.")
    }

    Rel(upload_tsx, jobUrlInput, "Uses")
    Rel(jobUrlInput, jobParser, "Calls")
    Rel(jobParser, puterAI, "Uses to parse job details")
    Rel(upload_tsx, pdf2img, "Calls to convert PDF")
    Rel(pdf2img, puterFS, "Uploads image to")
    Rel(upload_tsx, puterFS, "Uploads PDF to")
    Rel(upload_tsx, puterKV, "Saves analysis results to")
    Rel(upload_tsx, puterAI, "Requests analysis from")
```

## Diagram 4 — Component Diagram (Resume Detail Flow)

```mermaid
C4Component
    title Component Diagram (Resume Detail Flow)

    Container_Boundary(spa, "React SPA") {
        Component(resume_tsx, "resume.tsx", "React Route", "Main resume feedback view.")
        Component(scoreHistory, "ScoreHistory", "React Component", "Displays score trends.")
        Component(bulletRewriter, "BulletRewriter", "React Component", "UI for rewriting resume bullets.")
        Component(bulletRewriter_ts, "bulletRewriter.ts", "Module", "Logic for formatting bullet rewrite prompts.")
        Component(summary, "Summary", "React Component", "Displays overall ATS and category scores.")
        Component(details, "Details", "React Component", "Displays detailed feedback tips.")
        Component(accordion, "Accordion", "React Component", "Collapsible UI element.")
    }

    Container_Boundary(puter_services, "Puter Cloud BaaS") {
        Component(puterAI, "Puter AI", "Service", "Generates rewrite suggestions.")
    }

    Rel(resume_tsx, scoreHistory, "Renders")
    Rel(resume_tsx, bulletRewriter, "Renders")
    Rel(bulletRewriter, bulletRewriter_ts, "Calls logic from")
    Rel(bulletRewriter_ts, puterAI, "Requests rewritten bullets from")
    
    Rel(resume_tsx, summary, "Renders")
    Rel(summary, details, "Passes data to / Renders")
    Rel(details, accordion, "Uses for UI structure")
```
