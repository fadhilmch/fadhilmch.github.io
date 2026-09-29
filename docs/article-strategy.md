# Article strategy: from data to dependable products

Status: review draft. This document is an editorial plan, not a published post.

## The positioning

The portfolio should show one consistent capability:

> I turn ambiguous signals into useful decisions, then build the product and
> operating system around those decisions.

That is a stronger story than “I have worked with machine learning.” It connects
data science, product thinking, UI/UX, backend systems, infrastructure, and
operations without pretending they are separate careers.

The articles should therefore follow the life of a system:

```text
messy signal → useful model or rule → user-facing workflow → reliable service → evidence in production
```

The repo is only the evidence. The article is about the decisions made around it.

## The article series I would build

### 1. The model was not the product

Source: [big-data-project](https://github.com/fadhilmch/big-data-project)

Working title:

> Why the Simple Model Won: What Twitter Sentiment Taught Me About Features and Evaluation

Core argument:

> A more complicated model does not compensate for a representation that does not
> fit the data.

What it showcases:

- problem framing and dataset selection;
- preprocessing and feature engineering;
- baseline comparison between Naive Bayes, SVM, and CNN;
- choosing metrics instead of chasing one accuracy number;
- recognizing domain shift between tweets and product reviews;
- communicating an experiment honestly.

Story arc:

1. I expected the CNN to be the interesting winner.
2. The linear SVM won on the Twitter task.
3. The investigation moved from architecture to representation and preprocessing.
4. Amazon reviews produced a different result because the language and signal were different.
5. The real lesson was not “SVM beats CNN”; it was “model choice is downstream of data and task design.”

Evidence already available:

- project report;
- notebook experiments;
- comparison charts;
- reported Twitter and Amazon results.

Before publishing:

- verify the exact train/test split and metric definitions;
- label this as a historical experiment if it is not rerun;
- avoid implying that the result generalizes beyond these datasets;
- check that redistributed datasets and Kaggle links are still appropriate.

Recommendation: publish first. This is the clearest pure data-science story.

### 2. A real-time dashboard is a measurement system

Source: [streaming-twitter-spotify-trending-artists](https://github.com/fadhilmch/streaming-twitter-spotify-trending-artists)

Working title:

> Trending Is Not a Fact: Building a Real-Time Artist Ranking Pipeline

Core argument:

> A live chart is only as meaningful as its sampling, enrichment, windowing, and failure assumptions.

What it showcases:

- Kafka ingestion;
- Spark Streaming processing;
- Spotify API enrichment;
- Cassandra data modelling;
- rolling-window aggregation;
- Dash-based user experience;
- the relationship between data infrastructure and product interpretation.

Story arc:

1. The product question sounds simple: which artists are trending right now?
2. The system has to decide what counts as a signal and what gets discarded.
3. External APIs introduce missing data, latency, and rate-limit risk.
4. The database schema and aggregation window change the meaning of the chart.
5. The final UI is not “the truth”; it is a view over a particular measurement process.

What to add to the article:

- a one-screen architecture diagram;
- an example event from tweet to chart;
- the definition of the time window;
- failure cases: malformed links, unknown tracks, duplicate events, API failures;
- a paragraph on popularity bias and why Twitter users are not the whole audience.

Recommendation: publish second. It shows data engineering, infrastructure, and product interpretation in one piece.

### 3. The hard part of image retrieval was choosing the negatives

Sources: [triplets-dataset-generator](https://github.com/fadhilmch/triplets-dataset-generator) and [image-similarities-deep-learning](https://github.com/fadhilmch/image-similarities-deep-learning)

Working title:

> The Model Wasn’t the Hard Part: How Negative Sampling Shapes Image Retrieval

Core argument:

> In metric learning, the training examples encode the product definition of “similar.”

What it showcases:

- triplet construction;
- same-class and cross-class negatives;
- embedding learning;
- contrastive and hinge-style losses;
- transfer learning with VGG;
- retrieval-oriented evaluation rather than only classification accuracy.

Story arc:

1. “Find similar clothing” sounds like a model problem.
2. The first design decision is actually what counts as a positive and a negative.
3. Random negatives can make training easy while leaving the product weak.
4. Harder negatives expose whether the embedding captures useful visual distinctions.
5. The model is only learning the similarity definition encoded by the dataset generator.

Before publishing:

- rerun the pipeline with a current environment;
- report a retrieval metric such as Recall@K or mAP;
- compare at least two negative-sampling strategies;
- include a few qualitative nearest-neighbour examples;
- explain the limits of the Street2Shop labels.

Recommendation: high-value follow-up, but it needs an evidence pass before it is article-ready.

### 4. Product design is an architecture decision

Source: [mentimeter](https://github.com/fadhilmch/mentimeter)

Working title:

> When Every Phone Is Part of the Interface: Designing a Real-Time Presentation Product

Core argument:

> Real-time product design is not only about websockets or APIs; it is about deciding what every participant should see, when they should see it, and what happens when the states disagree.

What it showcases:

- product framing around audience participation;
- presentation, question, answer, and voting workflows;
- a Vue client and Node server;
- state changes visible to multiple users;
- interaction design and feedback loops;
- an early full-stack product rather than an isolated coding exercise.

Story arc:

1. A presenter wants participation without losing control of the room.
2. The product has two audiences: presenter and participants.
3. Each action changes the shared state of the presentation.
4. The interesting design problem is feedback: did the vote arrive, did the slide change, and who is allowed to control the room?
5. The implementation choices follow from that interaction model.

Before publishing:

- capture the user journey from creating a presentation to seeing a vote;
- describe the state model instead of only listing Vue and Node;
- be clear about what was implemented versus what was a prototype;
- add screenshots or a short screen recording with annotations.

Recommendation: strong product/UI article. It complements the DS pieces well.

### 5. From order entry to kitchen to cashier

Source: [Makan-Yuk-POS](https://github.com/fadhilmch/Makan-Yuk-POS)

Working title:

> A Point-of-Sale System Is a Workflow, Not a CRUD App

Core argument:

> The useful unit of a business product is the workflow between people, not the database table behind it.

What it showcases:

- menu configuration;
- order lifecycle;
- kitchen and cashier views;
- receipt generation;
- relational modelling and migrations;
- designing around different operational roles.

Story arc:

1. A restaurant does not need “records”; it needs an order to move correctly through several hands.
2. The same order has different useful representations for kitchen staff and cashiers.
3. Status transitions become the product’s real domain model.
4. A receipt is an operational output, not merely a formatted database row.
5. The quality of the product is measured by whether the workflow remains understandable under pressure.

Important cleanup before using it as a showcase:

- audit the public repository for credentials and sensitive configuration;
- rotate any exposed keys before linking the repository;
- remove generated `node_modules` content from the repository;
- clarify what was personally designed and what was part of the original project context.

Recommendation: good product and UX story after security hygiene work. Do not make it the first article.

### 6. The messy middle of a live event product

Source: private [icarus](https://github.com/fadhilmch/icarus)

Working title:

> A Live Event Product Is More Than Its Landing Page

Core argument:

> The difficult product work begins after the first screen: identity, registration,
> participant data, external integrations, leaderboards, payments or merchandise,
> and the rules that keep the experience coherent.

What it showcases:

- event discovery and registration;
- account creation, login, and profile completion;
- Strava integration and activity data;
- individual and team profiles;
- leaderboards and event-specific views;
- merchandise, sponsor, FAQ, and policy surfaces;
- responsive UI composition across a large component system;
- API routes, external service boundaries, and deployment-oriented configuration.

Story arc:

1. The visible product is an event page, but the user journey continues through registration and participation.
2. Each event has its own rules, content, assets, and leaderboard behavior.
3. External activity data creates identity, synchronization, and failure questions.
4. Reusable components help, but only when the product model is clear enough to reuse safely.
5. The quality of the experience is measured across the whole participant journey, not just the landing page.

Publication boundary:

- confirm that the project and event brands can be named;
- remove private participant information and tokens;
- use screenshots with personal data and real event identifiers redacted;
- distinguish product ownership from implementation contribution;
- describe production claims only when they can be evidenced.

Recommendation: strong product/UI/UX article and a useful bridge into operations, but publish only as an anonymised case study unless the project is intentionally made public.

### 7. Build the boundary before the intelligence

Source: private [personal-agent](https://github.com/fadhilmch/personal-agent)

Working title:

> I Built a Personal Agent with a Database Before I Trusted It with a Prompt

Core argument:

> An agent becomes useful when its authority, data, failure modes, and operational boundaries are explicit.

What it showcases:

- product scoping into bounded domains;
- WhatsApp as an interaction surface;
- SQLite as the source of truth for numbers and dates;
- tool-level authorization;
- deterministic reminders and projections;
- structured logging, health checks, backups, Docker, and runbooks;
- offline tests before live provider integration.

Story arc:

1. The tempting product is “a chatbot that can do things.”
2. The real product is a set of actions with different risk levels and authorities.
3. Model output is kept away from money arithmetic, permissions, and scheduled execution.
4. The database and operational boundaries make the system trustworthy enough to use.
5. The most important design decision is what the agent is not allowed to do.

Publication boundary:

- publish only an anonymised version;
- remove family, phone, WhatsApp, vault, provider, and infrastructure details that identify private systems;
- use synthetic examples and diagrams;
- do not publish operational secrets, real messages, or private data;
- link the repository only if it is intentionally made public.

Recommendation: potentially the strongest article for product, safety, backend, and operations, but it must remain a public-safe case study rather than a repository walkthrough.

### 8. A portfolio is also a product

Source: this repository, [fadhilmch.github.io](https://github.com/fadhilmch/fadhilmch.github.io)

Working title:

> I Built My Portfolio as a Map of Systems, Not a List of Cards

Core argument:

> A portfolio can demonstrate product thinking through its information architecture, not only through the projects it links to.

What it showcases:

- designing an audience journey;
- a workflow-based home page;
- a linked notes graph;
- content stored as structured YAML and Markdown;
- hand-written CSS and JavaScript without a frontend framework;
- Jekyll build and deployment through GitHub Actions;
- HTML validation as part of the publishing path.

Story arc:

1. A conventional portfolio asks visitors to browse a list.
2. The real problem is helping different visitors find the evidence relevant to them.
3. Projects, skills, experience, notes, and posts become connected content rather than isolated sections.
4. The UI exposes the structure of the work while the content remains easy to edit.
5. CI is part of the publishing experience because a broken link is a product defect.

Recommendation: use this as a meta-article or introduction to the series. It demonstrates UI/UX, content modelling, frontend implementation, and delivery discipline.

## How the series should work together

The articles should not all use the same format. They should form a progression:

| Article | Main signal | Supporting signals |
| --- | --- | --- |
| Simple model wins | DS judgment | evaluation, communication |
| Trending is a measurement system | streaming data | infra, storage, UI |
| Negative sampling defines similarity | deep learning | data design, retrieval |
| Every phone is part of the interface | product/UI/UX | realtime backend |
| POS is a workflow | product modelling | role-based UX, persistence |
| Live event product | product/UI/UX | integrations, identity, operations |
| Boundary before intelligence | agent product | safety, ops, infra |
| Portfolio as a map | frontend/product | content architecture, CI/CD |

The resulting reader impression should be:

> This person can investigate a data problem, design a useful product around it,
> build the supporting system, and explain what happens when reality disagrees
> with the happy path.

## The writing pattern for every article

Each article should answer these questions in order:

1. What user or operational problem existed?
2. What did the first implementation assume?
3. Which decision mattered more than expected?
4. What evidence supported the decision?
5. What failed, remained uncertain, or was deliberately not automated?
6. How did the user experience change because of the technical decision?
7. What would I do differently now?

Avoid writing repository tours. Readers do not need every file explained. They need
the chain from problem to decision to evidence to consequence.

## Publication order

1. `big-data-project` — establish DS judgment.
2. `streaming-twitter-spotify-trending-artists` — connect data to infrastructure and UI.
3. `mentimeter` — introduce product and realtime UX.
4. `triplets-dataset-generator` + `image-similarities-deep-learning` — deepen the modelling story.
5. `icarus` — show the complexity of a real user-facing product.
6. `personal-agent` — show safety, operations, and production boundaries through a public-safe case study.
7. This portfolio — explain the system that ties the evidence together.

`Makan-Yuk-POS`, `tanya-platform`, `jepretgram`, and `Chempro-Sensor-Serial-Python`
are useful supporting references, but they do not currently have as much evidence
or narrative depth as the sequence above.

## Review questions

Before drafting the first published post, I would want your answer to these:

- Should private projects be discussed as anonymised case studies, or omitted until they are public?
- Are you comfortable presenting old university and side projects as historical work, with explicit “what I would change today” sections?
- Do you want the site to feel more like a technical journal, a product case-study portfolio, or a deliberate mix of both?
- Can we use screenshots, diagrams, and short GIFs from the public repositories?
- Which claims can be supported with measurements, and which should be framed as design decisions rather than results?
