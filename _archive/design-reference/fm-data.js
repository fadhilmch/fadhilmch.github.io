window.FM_DATA = {
  profile: {
    name: "Fadhil Mochammad",
    role: "ML Engineer & Data Scientist",
    bio: "I build and ship machine learning systems — training deep nets, fine-tuning language models, and the pipelines that keep them healthy in production. Off the clock I shoot photographs, design things and make music; the same instinct for composition shows up in how I structure models and data.",
    status: "Open to collaborations"
  },
  experience: [
    { years: "2024 — Now", role: "Senior ML Engineer", org: "Lumen AI", note: "LLM fine-tuning, retrieval systems and evaluation infrastructure." },
    { years: "2022 — 2024", role: "ML Engineer", org: "Kanal Data", note: "Built the internal MLOps platform: feature store, model CI, serving." },
    { years: "2020 — 2022", role: "Data Scientist", org: "Rupa Analytics", note: "Forecasting and NLP on customer text at scale." },
    { years: "2016 — 2020", role: "B.Sc. Computer Science", org: "University", note: "Thesis on sequence models for low-resource text." }
  ],
  skills: [
    { group: "Modeling", items: ["PyTorch", "JAX", "Transformers", "LoRA / PEFT", "Diffusion"] },
    { group: "NLP / LLMs", items: ["RAG", "Evals", "Tokenization", "vLLM", "Distillation"] },
    { group: "MLOps", items: ["MLflow", "Kubeflow", "Ray", "Docker", "Kubernetes", "Airflow"] },
    { group: "Data", items: ["Python", "SQL", "Spark", "dbt", "Polars"] },
    { group: "Creative", items: ["Figma", "Lightroom", "Ableton", "TouchDesigner"] }
  ],
  projects: [
    { name: "lingua-lite", year: "2026", desc: "Instruction-tuning small language models for low-resource languages.", tags: "nlp · lora" },
    { name: "driftwatch", year: "2025", desc: "Open-source monitoring for embedding drift in production.", tags: "mlops · oss" },
    { name: "grain", year: "2025", desc: "A diffusion model fine-tuned on my own film scans.", tags: "dl · photo" },
    { name: "spectra", year: "2024", desc: "Audio-to-mood classifier trained on my music library.", tags: "dl · music" }
  ],
  pubs: [
    { title: "Parameter-efficient adaptation for low-resource instruction following", authors: "F. Mochammad, et al.", venue: "Workshop on Efficient NLP", year: "2025" },
    { title: "Detecting silent failures in deployed embedding models", authors: "F. Mochammad, A. Author", venue: "arXiv preprint", year: "2024" }
  ],
  contact: [
    { label: "email", value: "hello@fadhil.dev", href: "mailto:hello@fadhil.dev" },
    { label: "github", value: "github.com/fadhil", href: "#" },
    { label: "linkedin", value: "in/fadhilmochammad", href: "#" },
    { label: "scholar", value: "Google Scholar", href: "#" }
  ],
  tags: { dl: "Deep learning", nlp: "NLP / LLMs", mlops: "MLOps", data: "Data", photo: "Photography", music: "Music", design: "Design", meta: "Meta" },
  posts: [
    { date: "2026-09-02", title: "What I learned fine-tuning forty LoRAs in a month", tags: ["nlp"], min: 9, excerpt: "Rank matters less than you think; data order matters more." },
    { date: "2026-08-10", title: "Your eval set is lying to you", tags: ["nlp", "data"], min: 7, excerpt: "Contamination, leakage, and the quiet ways benchmarks flatter models." },
    { date: "2026-07-18", title: "Feature stores, honestly", tags: ["mlops"], min: 11, excerpt: "When they pay for themselves, and when a Parquet file will do." },
    { date: "2026-06-01", title: "The exposure triangle, but for learning rates", tags: ["dl", "photo"], min: 6, excerpt: "Learning rate, batch size and warmup behave a lot like aperture, shutter and ISO." },
    { date: "2026-05-12", title: "Shipping a model is a deploy, not a launch", tags: ["mlops"], min: 5, excerpt: "Treat every model like a service with an on-call rotation." },
    { date: "2026-04-03", title: "Attention, explained as a mixing desk", tags: ["dl", "music"], min: 8, excerpt: "Queries are faders, keys are channels, softmax is the master bus." },
    { date: "2026-02-20", title: "Tokenizers are a design problem", tags: ["nlp", "design"], min: 6, excerpt: "Vocabulary is interface design for a model." },
    { date: "2026-01-08", title: "Notes from a year of on-call for ML", tags: ["mlops"], min: 10, excerpt: "Most incidents were data incidents wearing a model costume." }
  ],
  notes: [
    { id: "index", title: "Start here", tag: "meta", links: ["transformers", "mlops", "evals", "exposure", "composition"], body: "An index into the vault. Notes are atomic, linked, and rewritten often. Follow any edge." },
    { id: "transformers", title: "Transformers", tag: "dl", links: ["attention", "positional-encoding", "normalization", "tokenization"], body: "Stacks of attention and MLP blocks with residual connections. The residual stream is the real backbone." },
    { id: "attention", title: "Attention", tag: "dl", links: ["mixing-desk", "kv-cache"], body: "Softmax-weighted averaging over values, keyed by query–key similarity. Cheap to explain, expensive to scale." },
    { id: "positional-encoding", title: "Positional encoding", tag: "dl", links: ["attention"], body: "RoPE rotates query/key pairs by position so relative distance falls out of the dot product." },
    { id: "normalization", title: "Normalization", tag: "dl", links: ["optimizers"], body: "LayerNorm vs RMSNorm; pre-norm trains more stably at depth." },
    { id: "backprop", title: "Backpropagation", tag: "dl", links: ["optimizers"], body: "Reverse-mode autodiff. Everything else is bookkeeping." },
    { id: "optimizers", title: "Optimizers", tag: "dl", links: ["lr-schedules"], body: "AdamW is the default until it isn't. Watch the epsilon." },
    { id: "lr-schedules", title: "LR schedules", tag: "dl", links: ["exposure"], body: "Warmup, cosine decay, and why the first 1% of steps decides a lot." },
    { id: "lora", title: "LoRA", tag: "nlp", links: ["peft", "quantization", "transformers"], body: "Low-rank updates to frozen weights. Rank 8 is usually enough; alpha is the real knob." },
    { id: "peft", title: "PEFT", tag: "nlp", links: ["distillation"], body: "The family of methods that adapt big models by training few parameters." },
    { id: "quantization", title: "Quantization", tag: "nlp", links: ["serving", "vllm"], body: "Int8 / int4 weights. Measure perplexity and task evals, not just speed." },
    { id: "distillation", title: "Distillation", tag: "nlp", links: ["evals"], body: "Train a small student on a big teacher's outputs. Data curation is the whole game." },
    { id: "tokenization", title: "Tokenization", tag: "nlp", links: ["grid-systems"], body: "BPE merges shape what the model can see. Vocabulary is interface design." },
    { id: "rag", title: "RAG", tag: "nlp", links: ["embeddings", "vector-db", "evals"], body: "Retrieve, then generate. Most failures are retrieval failures." },
    { id: "embeddings", title: "Embeddings", tag: "nlp", links: ["drift", "vector-db"], body: "Dense vectors that encode similarity. They drift when the world does." },
    { id: "vector-db", title: "Vector databases", tag: "mlops", links: ["serving"], body: "ANN indexes (HNSW, IVF) behind an API. Recall@k is the SLA." },
    { id: "evals", title: "Evals", tag: "nlp", links: ["data-quality"], body: "An eval is a product spec written as data. Version it like code." },
    { id: "kv-cache", title: "KV cache", tag: "nlp", links: ["vllm"], body: "Cache keys and values per token so decoding stays linear." },
    { id: "vllm", title: "vLLM", tag: "mlops", links: ["serving"], body: "Paged attention for high-throughput LLM serving." },
    { id: "mlops", title: "MLOps", tag: "mlops", links: ["feature-store", "model-registry", "ci-for-ml", "monitoring"], body: "The discipline of making models boring to operate." },
    { id: "feature-store", title: "Feature store", tag: "mlops", links: ["data-quality"], body: "Consistent features for training and serving. Often overkill; sometimes essential." },
    { id: "model-registry", title: "Model registry", tag: "mlops", links: ["ci-for-ml"], body: "Versioned artifacts with lineage, metrics and a stage." },
    { id: "ci-for-ml", title: "CI for ML", tag: "mlops", links: ["evals"], body: "Tests for data, training reproducibility and eval regressions on every PR." },
    { id: "serving", title: "Serving", tag: "mlops", links: ["monitoring"], body: "Batching, autoscaling and tail latency." },
    { id: "monitoring", title: "Monitoring", tag: "mlops", links: ["drift"], body: "Watch inputs, outputs and business metrics — in that order." },
    { id: "drift", title: "Drift", tag: "data", links: ["data-quality"], body: "Covariate, label and concept drift. Alert on distributions, not single values." },
    { id: "data-quality", title: "Data quality", tag: "data", links: [], body: "Schema checks, freshness, dedup. Most model bugs start here." },
    { id: "exposure", title: "Exposure triangle", tag: "photo", links: ["film-grain", "composition"], body: "Aperture, shutter, ISO — three knobs trading off against one budget. Sounds familiar." },
    { id: "film-grain", title: "Film grain", tag: "photo", links: ["sampling"], body: "Grain is structured noise. So is dropout, if you squint." },
    { id: "composition", title: "Composition", tag: "design", links: ["grid-systems"], body: "Where the eye goes first. Applies to frames, pages and dashboards." },
    { id: "grid-systems", title: "Grid systems", tag: "design", links: [], body: "Constraints that make freedom legible." },
    { id: "mixing-desk", title: "Mixing desk", tag: "music", links: ["synthesis"], body: "Faders, sends, a master bus. A surprisingly good model of attention." },
    { id: "synthesis", title: "Synthesis", tag: "music", links: ["sampling"], body: "Oscillators, filters, envelopes. FM synthesis is where my initials come from." },
    { id: "sampling", title: "Sampling", tag: "music", links: ["lr-schedules"], body: "Sample rates in audio, temperature in decoding — both decide what you hear." }
  ]
};
