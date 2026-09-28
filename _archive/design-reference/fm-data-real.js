window.FM_DATA = {
  profile: {
    name: "Fadhil Mochammad",
    role: "Machine Learning Engineer",
    location: "Stockholm, Sweden",
    headline: "Engineer at heart. I build ML platforms and agents that hold up in production.",
    bio: "I'm a machine learning engineer in Stockholm. I work on ML platforms, experimentation and, lately, AI agents. I studied electrical engineering in Bandung and machine learning at KTH. Outside work I take photos, design things and make music.",
    now: "Multi-agent AI: how agents coordinate, how to evaluate them honestly, and how to run them reliably once the demo is over.",
    offHours: "Photography · digital design · music"
  },
  stats: [
    { v: "6,000", k: "monthly employees on the agentic assistant I help run" },
    { v: "800+", k: "experiments a year on the platform I led at Traveloka" },
    { v: "−95%", k: "cloud cost, year over year, after the modernization" },
    { v: "50k+", k: "requests per second, load-tested at P95 under 100 ms" }
  ],
  education: [
    { years: "2018 — 2020", role: "M.Sc. Machine Learning", org: "KTH Royal Institute of Technology", note: "Thesis: sales forecasting with GAM and LASSO on leading macroeconomic indicators." },
    { years: "2012 — 2016", role: "B.Sc. Electrical Engineering", org: "Institut Teknologi Bandung", note: "Thesis: hazardous chemical gas monitoring on a UAV." }
  ],
  experience: [
    { years: "Sep 2025 — Now", role: "Machine Learning Engineer", org: "Electrolux Group", place: "Stockholm", note: "Agentic internal knowledge assistant: evaluation architecture, retrieval flow, feedback-triage agent. MLOps for a supply-chain optimization system." },
    { years: "Dec 2020 — Sep 2025", role: "Sr. ML & Experimentation Platform Engineer", org: "Traveloka", place: "Jakarta", note: "Tech lead for the experimentation platform. ML serving engine and SDK, Kubeflow training platform, ranking and bandits." },
    { years: "Jun — Oct 2020", role: "ML Engineer Intern", org: "Spotify", place: "Stockholm", note: "Multi-armed bandit for notification optimization: policy, reward definition, offline analysis." },
    { years: "Dec 2019 — Jun 2020", role: "Data Scientist Intern", org: "Electrolux", place: "Stockholm", note: "Bayesian vs frequentist demand forecasting on Databricks with PySpark." },
    { years: "Apr — Aug 2019", role: "Data Scientist Intern", org: "Scania", place: "Stockholm", note: "Maintenance-action recommendation for truck diagnostic trouble codes." },
    { years: "Oct 2018 — Aug 2019", role: "Full-Stack Web Developer", org: "OnTel AB", place: "Stockholm", note: "Real-time interactive presentation app for an Ericsson collaboration." },
    { years: "Apr 2018 — Apr 2019", role: "AI Engineer", org: "Riset.ai", place: "Bandung", note: "Led engineers building a FaceNet-based face-recognition system to production." },
    { years: "Aug 2016 — Dec 2017", role: "Research Assistant", org: "ITB Advanced Robotics Lab", place: "Bandung", note: "Data acquisition for coordinated UAV and ground-robot reconnaissance on ROS." }
  ],
  skills: [
    { group: "LLMs & agents", items: [["Microsoft Agent Framework", "Electrolux Group"], ["RAG · Azure AI Search · Azure OpenAI", "Electrolux Group"], ["Evaluation-driven development", "Electrolux Group"], ["Arize · OpenTelemetry tracing", "Electrolux Group"], ["LLM experimentation pipeline", "Traveloka"]] },
    { group: "Experimentation", items: [["A/B testing platform", "Traveloka"], ["Multi-armed bandits · Thompson sampling", "Traveloka · Spotify"], ["Metric semantic layer · BigQuery", "Traveloka"], ["Ranking · CatBoost", "Traveloka"], ["Forecasting · GAM · LASSO", "KTH · Electrolux"]] },
    { group: "ML platform", items: [["Python · Go", "strongest languages"], ["Kubernetes · Kubeflow Pipelines", "Traveloka · Electrolux Group"], ["Terraform", "Traveloka"], ["Argo CD · GitHub Actions", "Electrolux Group"], ["Prometheus · Grafana · Datadog", "Traveloka · Electrolux Group"], ["GCP · Azure", "both clouds in production"]] },
    { group: "Creative", items: [["Photography", "off-hours"], ["Digital design · Figma", "off-hours"], ["Music", "off-hours"], ["Design thinking", "Labtek Indie"], ["Interactive installations · Unity", "Labtek Indie"]] }
  ],
  projects: [
    { name: "Agentic knowledge assistant", year: "2025 —", desc: "Agent Framework + RAG on Azure for 6,000 monthly employees, about 200 conversations a day, in any language. I own the evaluation architecture.", tags: "agents · evals" },
    { name: "Feedback-triage agent", year: "2026", desc: "Replays flagged questions, checks the evidence, finds the likely root cause and routes it to an owner. An estimated 15 → 1 minute per item.", tags: "agents · ops" },
    { name: "Experimentation platform", year: "2022 — 2025", desc: "800+ experiments a year across 30+ product teams. Modernized for −95% cloud cost and −90% API latency; opened up to PMs and designers.", tags: "experimentation" },
    { name: "Experiment assignment service", year: "2024", desc: "Go, Kubernetes and Redis. Sustained 50k+ RPS in a 30-minute load test, P95 under 100 ms.", tags: "go · platform" },
    { name: "ML serving engine & SDK", year: "2024", desc: "One standardized path to production for about 40 model deployments, with auth, tracing and orchestration handled.", tags: "platform" },
    { name: "Metric semantic layer", year: "2025", desc: "A catalog of 100+ reusable metrics, so teams stopped defining conversion four different ways.", tags: "experimentation · data" }
  ],
  pubs: [
    { title: "FPGA Implementation of Template Matching Using Binary Sum of Absolute Difference", venue: "IEEE", year: "2016", href: "https://ieeexplore.ieee.org/document/7849615/" },
    { title: "Implementation of Hazardous Chemical Gas Monitoring System Using Unmanned Aerial Vehicle (UAV)", venue: "IEEE", year: "2016", href: "https://ieeexplore.ieee.org/document/7849643/" }
  ],
  contact: [
    { label: "email", value: "fadhil.mochammad1095@gmail.com", href: "mailto:fadhil.mochammad1095@gmail.com" },
    { label: "github", value: "github.com/fadhilmch", href: "https://github.com/fadhilmch" },
    { label: "linkedin", value: "in/fadhilmch", href: "https://www.linkedin.com/in/fadhilmch/" }
  ],
  tags: { agents: "Agents & LLMs", exp: "Experimentation", mlops: "ML platform", data: "Data & forecasting", design: "Design", photo: "Photography", music: "Music", meta: "Meta" },
  lanes: [
    { key: "agents", label: "agents", tags: ["agents"] },
    { key: "exp", label: "experimentation", tags: ["exp", "data"] },
    { key: "mlops", label: "ml-platform", tags: ["mlops"] },
    { key: "creative", label: "creative", tags: ["design", "photo", "music"] }
  ],
  posts: [
    { date: "2026-09-10", title: "Evaluating an agent honestly", tags: ["agents"], min: 9, excerpt: "Relevance, recall, groundedness and latency, and why none of them is enough on its own." },
    { date: "2026-08-02", title: "An agent that triages its own feedback", tags: ["agents", "mlops"], min: 8, excerpt: "Replay the question, check the evidence, route to an owner, and send the rest to a human." },
    { date: "2026-06-20", title: "Golden datasets without the gold rush", tags: ["agents"], min: 7, excerpt: "Simulated personas propose queries. People approve them." },
    { date: "2026-04-11", title: "Thompson sampling, explained with coupons", tags: ["exp"], min: 6, excerpt: "Adaptive traffic allocation without the maths anxiety." },
    { date: "2026-02-28", title: "One definition of conversion", tags: ["exp", "data"], min: 7, excerpt: "What building a metric semantic layer taught me about teams." },
    { date: "2025-12-06", title: "Go worker pools for experiment assignment", tags: ["mlops"], min: 10, excerpt: "Keeping P95 under 100 ms when traffic spikes tenfold." },
    { date: "2025-10-18", title: "The exposure triangle, but for learning rates", tags: ["photo"], min: 5, excerpt: "Aperture, shutter and ISO behave a lot like learning rate, batch size and warmup." },
    { date: "2025-06-14", title: "A serving SDK data scientists actually use", tags: ["mlops", "design"], min: 8, excerpt: "An SDK is an interface. Design it like one." },
    { date: "2025-03-01", title: "FM synthesis and explore–exploit", tags: ["music", "exp"], min: 6, excerpt: "Where my initials come from, and why modulation feels like bandits." }
  ],
  notes: [
    { id: "index", title: "Start here", tag: "meta", links: ["agents", "ab-testing", "serving", "design-thinking", "robotics", "exposure"], body: "An index into the vault. Notes are small, linked, and rewritten often. Follow any edge." },
    { id: "robotics", title: "Robotics roots", tag: "meta", links: ["forecasting", "design-thinking"], body: "Electrical engineering, UAVs, ROS and FPGAs came before ML. The hardware years taught me to debug from the signal up." },
    { id: "agents", title: "Agents", tag: "agents", links: ["rag", "evals", "triage", "multi-agent", "mcp"], body: "An LLM that decides which tool to call next. Mostly useful when the loop is short and the evaluation is honest." },
    { id: "multi-agent", title: "Multi-agent systems", tag: "agents", links: ["evals", "observability"], body: "My current rabbit hole: how agents coordinate, fail and recover, and how to tell whether they're actually better than one agent." },
    { id: "rag", title: "RAG", tag: "agents", links: ["retrieval-recall", "groundedness"], body: "Retrieve, then generate. Most bad answers are retrieval failures in disguise." },
    { id: "evals", title: "Evaluation-driven development", tag: "agents", links: ["golden-dataset", "online-eval", "groundedness", "retrieval-recall"], body: "Write the eval before the change. Compare against a baseline, not against vibes." },
    { id: "golden-dataset", title: "Golden datasets", tag: "agents", links: ["human-review"], body: "Anchored queries, expected answers and source URLs. Generated from personas, approved by people." },
    { id: "online-eval", title: "Online evaluation", tag: "agents", links: ["observability", "traces"], body: "Offline evals catch regressions before release. Online evals catch the ones you didn't imagine." },
    { id: "groundedness", title: "Groundedness", tag: "agents", links: [], body: "Is every claim in the answer supported by a retrieved source?" },
    { id: "retrieval-recall", title: "Retrieval recall", tag: "agents", links: [], body: "Did the right documents make it into context at all?" },
    { id: "triage", title: "Feedback triage", tag: "agents", links: ["traces", "human-review"], body: "Replay, gather evidence, classify content gap versus config issue, route to an owner deterministically." },
    { id: "human-review", title: "Human in the loop", tag: "agents", links: ["design-thinking"], body: "When the evidence is missing or conflicting, stop and ask a person." },
    { id: "mcp", title: "MCP", tag: "agents", links: [], body: "Model Context Protocol: a common plug shape for tools." },
    { id: "ab-testing", title: "A/B testing", tag: "exp", links: ["metrics-layer", "bandits", "self-service"], body: "Randomize, measure, decide. The hard parts are metric definitions and patience." },
    { id: "bandits", title: "Multi-armed bandits", tag: "exp", links: ["thompson", "uplift"], body: "Explore while you exploit. Great for coupons and notifications, less so for long-term effects." },
    { id: "thompson", title: "Thompson sampling", tag: "exp", links: [], body: "Sample from each arm's posterior and play the winner. Simple, and hard to beat." },
    { id: "uplift", title: "Uplift modeling", tag: "exp", links: [], body: "Model the treatment effect, not the outcome. Who changes because of the message?" },
    { id: "metrics-layer", title: "Metric semantic layer", tag: "exp", links: ["bigquery"], body: "One governed definition per metric, reused everywhere." },
    { id: "self-service", title: "Self-service tooling", tag: "exp", links: ["design-thinking"], body: "If only analysts can run experiments, the platform isn't done." },
    { id: "bigquery", title: "BigQuery", tag: "data", links: [], body: "Where most experiment analysis actually ran." },
    { id: "forecasting", title: "Forecasting", tag: "data", links: ["gam"], body: "ARIMA, Prophet, SARIMA and exponential smoothing, compared honestly." },
    { id: "gam", title: "GAMs & LASSO", tag: "data", links: [], body: "Additive models with leading indicators. My KTH thesis, in one line." },
    { id: "optimization", title: "Mixed-integer optimization", tag: "data", links: ["kubeflow"], body: "CVXPY and Kedro, running in production to plan deliveries and trucks. I run the ops side." },
    { id: "serving", title: "Model serving", tag: "mlops", links: ["kubernetes", "sdk-design", "observability", "latency"], body: "A standardized path to production, so model teams never touch the cluster." },
    { id: "kubeflow", title: "Kubeflow Pipelines", tag: "mlops", links: ["reproducibility", "kubernetes"], body: "Reusable train, test and deploy components for heavy workloads." },
    { id: "reproducibility", title: "Reproducibility", tag: "mlops", links: [], body: "Same data, same code, same result, or at least a record of why not." },
    { id: "kubernetes", title: "Kubernetes", tag: "mlops", links: ["iac"], body: "GKE at Traveloka, AKS at Electrolux. Boring when it's done right." },
    { id: "iac", title: "Infra as code", tag: "mlops", links: [], body: "Terraform modules, so new services arrive through a reviewed change." },
    { id: "latency", title: "P95 latency", tag: "mlops", links: ["go-workers"], body: "Averages lie. Watch the tail." },
    { id: "go-workers", title: "Go worker pools", tag: "mlops", links: [], body: "Goroutines with backpressure, for asynchronous, near-real-time updates." },
    { id: "observability", title: "Observability", tag: "mlops", links: ["traces"], body: "Instrument, collect, dashboard, alert. The tools are interchangeable; the habit isn't." },
    { id: "traces", title: "Distributed traces", tag: "mlops", links: [], body: "Follow one request across every service it touched." },
    { id: "sdk-design", title: "SDK design", tag: "mlops", links: ["design-thinking"], body: "An SDK is a user interface for engineers." },
    { id: "design-thinking", title: "Design thinking", tag: "design", links: ["composition"], body: "Start with people and their problem. Choose the technology last." },
    { id: "composition", title: "Composition", tag: "design", links: ["exposure"], body: "Where the eye goes first. Applies to frames, pages and dashboards." },
    { id: "exposure", title: "Exposure triangle", tag: "photo", links: ["film-grain"], body: "Aperture, shutter, ISO: three knobs sharing one budget. Sounds familiar." },
    { id: "film-grain", title: "Film grain", tag: "photo", links: ["sampling"], body: "Grain is structured noise. So is dropout, if you squint." },
    { id: "synthesis", title: "FM synthesis", tag: "music", links: ["sampling"], body: "One oscillator modulating another. Also where my logo comes from." },
    { id: "sampling", title: "Sampling", tag: "music", links: ["bandits"], body: "Sample rates in audio, temperature in decoding, arms in a bandit: they all decide what you hear." }
  ]
};
