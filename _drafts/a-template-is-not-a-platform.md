---
layout: post
title: A template is not a platform
tags:
- mlops
summary: What an ML project generator can standardize, what it can't, and how I found the gap in my own design documents.
---

<!--
DRAFT NOTES (delete before publishing)
Source: work repository (Copier-based ML repo generator) + its design docs, reviewed Sept 2026.
- CONFIDENTIALITY: no employer, internal org, repo, registry or platform names in the text.
  Keep it that way. Check with the manager/comms whether describing the internal generator
  at this level of detail is fine.
- The catalog-name mismatch is a real, currently unfixed bug. Fix it before publishing,
  or keep the description generic as it is now.
- Numbers (three archetypes, ~2,700 lines of design docs, dev/tst/acc/prd vs dev/uat/prod)
  are from the repo at commit 9fa644b.
- Maybe add: a diagram of repo → shared workflows → platform (the four layers).
- Length: ~1,700 words. Could cut the maturity-level section if it runs long.
-->

At work I maintain a repository generator for ML projects. You run one command, answer a few questions, and get a repository with a package layout, tests, docs, CI workflows, deployment config and registry metadata. It has three archetypes: a Kedro batch pipeline on Databricks, a plain Python batch job on Databricks, and a FastAPI agent service on Kubernetes through GitOps.

The generated repositories look ready for production. They have the folders and workflows that production repositories have. Recently I wrote two long design documents asking how far that appearance is from the real thing. Then I reviewed those documents against the code, and found that they had drifted from the repository in the same way the generator lets projects drift from production.

This post covers what I learned about the ML lifecycle, where the maturity gap sits, and how I would build an ML project generator now.

## The lifecycle a repository has to support

Most ML templates cover the first half of the lifecycle. The full version looks like this:

```text
design → build → validate → package → release → deploy → verify
  → operate → improve or retrain → retire
```

A template is good at the first four steps. It can create a package, a test layout, lint config and a build. Release and deploy it can reach by generating workflows. The steps after deploy are where it runs out, because they are not files. Monitoring, incident response, retraining and retirement are things people and platforms do over time.

A useful way to see the gap is to ask the questions any production ML system eventually has to answer:

- What was built?
- With which code, data, dependencies and configuration?
- Who owns it?
- What evidence says it is good enough?
- Where is it running?
- How do we know it still works?
- What happens when it fails or degrades?

A generated repository answers the first question well and the third partly. The rest need evidence that only exists after the code runs.

## Batch jobs and services are different animals

The most important thing I got wrong in the first version of the generator was treating archetypes as one axis. `kedro_ml` names a framework. `python_ml` names an implementation style. `genai_agentic` names a workload type, a runtime and a deployment platform at once. The names looked parallel, but they weren't.

That matters because a pipeline and a service fail differently:

| Concern | Online service | Batch pipeline |
| --- | --- | --- |
| Main objective | Availability, latency, error rate | Completion, freshness, correctness |
| Health | Liveness and readiness probes | Input readiness checks |
| Failure handling | Timeouts, fallbacks | Idempotency, retries, reruns |
| Rollback | Previous image | Previous artifact, or corrected data |
| Observability | Request traces | Row counts, data quality, run lineage |

If one template hides these differences behind a generic `main.py`, it is easy to generate and hard to operate. The fix is to split what a workload does (a *service profile*: batch pipeline, online API, agent) from where it runs (a *deployment profile*: Databricks job, Kubernetes via GitOps). Then keep an explicit list of which combinations are allowed and reject the rest before anything renders.

The generator did have a separate `deploy_target` value. When I looked closely, it was hidden from the user and computed from the archetype. So a check on the combination could never fail, because the user could never choose a bad one. It looked like the split existed, but it didn't.

## The maturity gap

I found it helpful to describe maturity in levels, and to score each project by evidence rather than by which tools it has:

- **Level 0, ad hoc.** Notebooks, manual deployment, unclear owner.
- **Level 1, repeatable repository.** Generated structure, pinned dependencies, tests, basic CI, a named owner.
- **Level 2, controlled delivery.** A workload contract, immutable artifacts, environment promotion, standard rollback, conformance tests, basic monitoring.
- **Level 3, observable ML system.** Code, data and model lineage; evaluation gates; data-quality and model monitoring; incident ownership.
- **Level 4, optimized platform.** Reusable workflows, self-service, automated policy checks, controlled automated retraining.

Score a project on several dimensions (reproducibility, contracts and lineage, delivery and recovery, operations, ownership), and take the *lowest* score as its level. A project with excellent CI and nobody on call is not an observable ML system.

By that measure my generator is at Level 1. That is useful: new projects start with the same shape, and nobody spends their first week setting up linting. But the step to Level 2 is mostly not about adding more files to the template. It is about making a few things checkable and moving policy out of the template.

Two things I would not do early, even though they appear on every MLOps diagram:

- **Automated retraining.** It is only useful once data quality, evaluation and monitoring can be trusted. Before that, it just retrains on bad data faster.
- **Copying the whole reference architecture.** Cloud vendors' MLOps reference architectures are good sources of questions. They assume a platform you may not use, and generating a Level 4 layout from a Level 1 organization gives you a large template full of assumptions nobody has checked.

## How I would build an ML project generator now

### Choose a tool that can update

I use Copier rather than Cookiecutter. Both render Jinja templates from answers. Copier also saves the answers in the generated repository, so `copier update` can apply later template changes. ML repositories live for years, and a generator you can only run once creates a hundred slightly different snapshots of last year's best practice.

The catch is that the generator becomes a production dependency. It needs release notes, a note on which changes are safe to update, and a migration path for breaking ones.

### Generate intent, centralize policy

The template should say *what* the workload is. A shared platform should decide *how* it is built and deployed. In practice this means generated workflows are thin wrappers:

```yaml
jobs:
  deploy:
    uses: my-org/shared-workflows/.github/workflows/deploy-databricks.yml@v1
    with:
      service_profile: batch_python
      deployment_profile: databricks_job
      target: dev
    secrets: inherit
```

If fifty repositories each contain a copy of the deployment logic, you have fifty versions of it within a year. One smaller point I learned the hard way: pin the shared workflow to a tag or a commit. Our generated workflows referenced the shared ones at `@main`, which means any merge there changes how every production release behaves.

### Add one small, checked contract

Every generated repository should contain a short file that says what the workload is, and CI should validate it:

```yaml
apiVersion: example.org/v1alpha1
kind: Workload
metadata:
  name: team-eu-demand-forecast
  owners:
    business: forecasting-team
    technical: ml-engineering
    support: ml-support
spec:
  serviceProfile: batch_python
  deploymentProfile: databricks_job
  dataClassification: internal
  criticality: medium
  environments: [dev, tst, acc, prd]
```

Keep it small. It should not become a second deployment language that repeats every Databricks or Kubernetes setting. Its job is to give platform workflows, catalogs and audits one place to read intent from, instead of guessing from folder names.

Two practical details:

- Put the JSON Schema in the generated repository, not only at a URL. If the generator repository is private, CI in other repositories may not be able to fetch it.
- A required field is not the same as a real value. Our owner fields default to `TBD`, which passes a "not empty" check. Warn on placeholders.

### Test the generated repositories, not the template

The template is not what users run. For every supported profile combination, CI should render a project and then check that it:

1. renders with no leftover Jinja;
2. contains only the files its profile should have;
3. has a valid contract file;
4. installs, builds, lints and passes its tests;
5. builds its docs;
6. has the deployment descriptors its profile needs.

A render that succeeds says very little. A generated project that builds, passes its own CI and has a valid contract says a lot more.

### Keep the starter code honest

Starter tests prove that the code runs. They do not prove that the model is good. I now try to make the generated README say this plainly. A generated repository is a *production-shaped* baseline: it has the control points. The business logic, the evaluation thresholds and the on-call rota still belong to the team.

## My design documents had drifted too

I wrote about 2,700 lines of design documentation for this: a productionization standard and a maturity roadmap. They were careful. They separated facts from proposals and said "not yet a standard" at the top. Then I checked them against the repository and found several statements that were no longer true, or never had been:

- The documents said the archetype mixed deployment into one choice. A deployment value did exist; it was just computed from the archetype, which is a different problem.
- They said every project got a registry metadata file. The Kedro archetype didn't; it registers at runtime instead, so there is nothing static to validate.
- They used the environments `dev, tst, acc, prd` everywhere. The Databricks projects use those. The Kubernetes service uses `dev, uat, prod`.
- While tracing the registry file I found a real bug: it refers to a template variable that doesn't exist, so it silently falls back to a default catalog name that doesn't match the one the deployment bundle uses.

None of these would have been caught by reading the documents. They were caught by comparing claims against files. That is the whole argument for a machine-checked contract, just applied to the documents themselves. Prose describing a system drifts from the system in the same way copied workflows drift from the shared ones.

The documents were also too long. When a standard is 2,700 lines, people skip it, and the decisions it asks for don't get made. The most useful artifact to come out of the exercise was a much shorter one: a schema for the contract file and a list of five decisions the team has to make before the schema can be enforced.

## What I would do first

If I were starting again, or had one quarter to improve an existing generator, I would do this, in order:

1. Split service and deployment profiles, and map the existing archetypes onto them so nothing breaks.
2. Add the contract file and validate it in the generator's CI and in each generated repository.
3. Turn the template's render test into a conformance test per profile combination.
4. Decide what the release artifact is, build it once, and promote the same artifact through every environment.
5. Move deployment logic into versioned shared workflows.

Monitoring, evaluation gates and retraining come after that, and most of that work belongs to the platform rather than the template.

A generator is a good way to start every project in the same place. It is not a way to finish them. The gap between the two is not missing files. It is missing evidence, and the only way to close it is to make the important claims something a machine can check.

## References

1. Kedro. *Kedro documentation*. <https://docs.kedro.org/en/stable/>
2. Databricks. *Declarative Automation Bundles (Databricks Asset Bundles)*. Databricks documentation. <https://docs.databricks.com/aws/en/dev-tools/bundles/>
3. Sculley, D. et al. *Hidden Technical Debt in Machine Learning Systems*. Advances in Neural Information Processing Systems 28 (NIPS), 2015. <https://proceedings.neurips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html>
4. Google Cloud. *MLOps: Continuous delivery and automation pipelines in machine learning*. Cloud Architecture Center. <https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning>
5. Microsoft. *MLOps Maturity Model*. Azure Architecture Center. <https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/mlops-maturity-model>
6. Copier. *Updating a project*. Copier documentation. <https://copier.readthedocs.io/en/stable/updating/>
7. JSON Schema. *JSON Schema*. <https://json-schema.org/>
8. GitHub. *Secure use reference*. GitHub Actions documentation. <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions> — why to pin to a commit SHA.
