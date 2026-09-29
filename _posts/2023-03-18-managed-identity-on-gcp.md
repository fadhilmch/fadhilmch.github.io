---
layout: post
title: "Managed identity on GCP: why we're deleting our key files"
date: 2023-03-18
tags:
- systems
summary: Our services talked to Google Cloud with JSON keys copied into secrets and CI variables. What managed identity replaces them with, the three places Google Cloud puts the idea and what each does behind the scenes, how the same pieces look on Azure, and the traps we found while switching.
---

For a long time, every service we ran on Google Cloud authenticated the same way. Someone created a service account, downloaded a JSON key for it, and put that key somewhere the service could read it: a Kubernetes Secret, a CI variable, occasionally a file on someone's laptop "just for testing". The code pointed `GOOGLE_APPLICATION_CREDENTIALS` at the file and everything worked.

This year we started moving away from that, towards what Azure calls managed identity and Google calls, less memorably, attached service accounts and Workload Identity. I had used both without understanding them. The client library found credentials, the call succeeded, and I moved on. Once I had to explain to the team why we were doing the migration, and debug the first few services that broke during it, I had to learn what actually happens when code "just gets" a token.

This post is that explanation: what problem managed identity solves, how each of Google Cloud's three versions of it works underneath, how they line up with Azure's, and what caught us out.

## A note on the name

"Managed identity" is Azure's product name. Google Cloud doesn't have a product called that. It has the same idea split across three features, one for each place your code can run:

1. **Service accounts attached to resources**, for code running on Google Cloud's own compute: a Compute Engine VM, a Cloud Run service, a Cloud Function.
2. **Workload Identity**, for pods on GKE. It gives each Kubernetes service account its own Google identity, instead of every pod sharing the node's.
3. **Workload Identity Federation**, for code running outside Google Cloud: GitHub Actions, an AWS workload, an on-premises job. It lets them act as a service account without a key.

The common thread is that the code never holds a long-lived secret. The platform it runs on vouches for it instead. I'll use "managed identity" for the idea, cover each of the three in turn, and then map them to their Azure equivalents, since Azure is where most people first meet the term.

## What's wrong with a key file

A service account key is a private key. Anyone who has the file can sign a request as that service account, from anywhere on the internet, until someone deletes the key. By default it doesn't expire.

That on its own is fine. The problem is everything that happens to the file after it's created:

- **It gets copied.** Into a Secret, then into a second cluster's Secret, into a CI variable, into a colleague's Downloads folder. Each copy is one more place it can leak from, and nobody has a list of them.
- **It outlives its purpose.** The service that needed it is retired, but the key still works. A service account can hold up to ten keys, and it's common to find several with no idea which are in use.
- **Rotation is manual work.** Rotating means creating a new key, updating every copy, restarting what reads it, and only then deleting the old one. In practice it happens after an incident, not on a schedule.
- **It doesn't say where it's used.** Audit logs tell you the service account made a call. They can't tell you whether the call came from your pod or from someone who found the key in an old commit.

Most of these are not about cryptography. They're about distribution. A key is a secret you have to hand out, and every hand-off is a chance to lose it. Rotating more often shrinks the window but keeps the hand-offs.

<figure class="fig">
<svg viewBox="0 0 680 232" role="img" aria-labelledby="m0t m0d">
  <title id="m0t">Key files compared with an attached identity</title>
  <desc id="m0d">With a key file, you create a key that is valid until deleted, copy it into secrets, CI and laptops, the app reads the file and signs its own request, and Google returns a one-hour token. With an attached identity, you attach a service account to the VM, service or pod, the app asks the local metadata server, the platform mints a one-hour token, and the app calls the API. Only the first flow has a long-lived secret that gets copied around.</desc>
  <defs><marker id="ma0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="h" x="10" y="22">WITH A KEY FILE</text>
  <rect class="box" x="10" y="32" width="150" height="54" rx="6"/><text class="t" x="22" y="54">Create key</text><text class="m" x="22" y="72">valid until deleted</text>
  <g tabindex="0"><title>The copies are what leak</title><rect class="box" x="180" y="32" width="150" height="54" rx="6"/><rect class="sa" x="180" y="32" width="150" height="54" rx="6"/></g><text class="t" x="192" y="54">Copy it</text><text class="m" x="192" y="72">Secret, CI, laptop</text>
  <rect class="box" x="350" y="32" width="150" height="54" rx="6"/><text class="t" x="362" y="54">App reads file</text><text class="m" x="362" y="72">signs its own JWT</text>
  <rect class="box" x="520" y="32" width="150" height="54" rx="6"/><text class="t" x="532" y="54">Google API</text><text class="m" x="532" y="72">token, 1 hour</text>
  <path class="ln" d="M160,59 L178,59" marker-end="url(#ma0)"/><path class="ln" d="M330,59 L348,59" marker-end="url(#ma0)"/><path class="ln" d="M500,59 L518,59" marker-end="url(#ma0)"/>
  <text class="ta" x="255" y="104" text-anchor="middle">the part that leaks</text>
  <text class="h" x="10" y="138">WITH AN ATTACHED IDENTITY</text>
  <rect class="box" x="10" y="148" width="150" height="54" rx="6"/><text class="t" x="22" y="170">Attach SA</text><text class="m" x="22" y="188">to VM, service, pod</text>
  <rect class="box" x="180" y="148" width="150" height="54" rx="6"/><text class="t" x="192" y="170">App asks</text><text class="m" x="192" y="188">local HTTP call</text>
  <rect class="box" x="350" y="148" width="150" height="54" rx="6"/><text class="t" x="362" y="170">Platform mints</text><text class="m" x="362" y="188">no secret in app</text>
  <rect class="box" x="520" y="148" width="150" height="54" rx="6"/><text class="t" x="532" y="170">Google API</text><text class="m" x="532" y="188">token, 1 hour</text>
  <path class="ln" d="M160,175 L178,175" marker-end="url(#ma0)"/><path class="ln" d="M330,175 L348,175" marker-end="url(#ma0)"/><path class="ln" d="M500,175 L518,175" marker-end="url(#ma0)"/>
  <text class="m" x="340" y="226" text-anchor="middle">both end with the same short-lived token; only one starts with a secret you hand out</text>
</svg>
<figcaption>Both flows end with the same kind of token. The difference is whether a long-lived secret exists along the way.</figcaption>
</figure>

Managed identity removes the hand-off. The service account is attached to where the code runs, and the code asks the platform for a token each time it needs one. There is nothing to copy, because there is no file.

## The idea underneath: tokens, not keys

It helps to separate two things that the key file blurs together.

A **credential** proves who you are. The JSON key is one; so is your password when you run `gcloud auth login`.

An **access token** is what Google APIs actually accept. It's a string beginning with `ya29.` that goes in an `Authorization: Bearer` header, and it expires after an hour.

Even with a key file, your code never sends the key to Cloud Storage. The client library uses the key to sign a short JSON Web Token, sends that to Google's OAuth endpoint, and gets an access token back. The access token is what travels with each request.

So the question managed identity answers is narrow: how does code get an access token without holding a credential of its own? The answer is that something trusted, sitting next to the code, asks on its behalf. On Google Cloud that something is the metadata server.

## 1. Attached service accounts: VMs, Cloud Run and Functions

Every Compute Engine VM can reach a metadata server at `169.254.169.254`, also known as `metadata.google.internal`. It isn't a machine on your network. Requests to that address are handled by the host your VM runs on, outside the VM itself. Cloud Run and Cloud Functions provide the same server to your container.

When you create a VM or deploy a Cloud Run service, you choose a service account to attach. The platform remembers that pairing. Later, when code inside asks the metadata server for a token, the host already knows which VM or service is asking, and so which service account it's allowed to have.

You can do the whole thing by hand with `curl`:

```bash
curl -s -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
```

```json
{"access_token": "ya29.c.b0Aa...", "expires_in": 3599, "token_type": "Bearer"}
```

That's all a client library does when there's no key file. The `Metadata-Flavor: Google` header is required, and requests carrying an `X-Forwarded-For` header are refused. Both rules make it harder to trick a web application into fetching a token for an attacker, because a browser or a naive proxy won't add the first header and will add the second.

<figure class="fig">
<svg viewBox="0 0 680 230" role="img" aria-labelledby="m1t m1d">
  <title id="m1t">Getting a token from the metadata server</title>
  <desc id="m1d">Your code, through the client library, sends a GET request with the Metadata-Flavor header to the metadata server at 169.254.169.254, which runs on the host outside the VM. The metadata server knows which service account is attached and returns an access token valid for about an hour. The code then calls a Google API such as Cloud Storage with that token as a bearer token, and the API checks IAM for that service account.</desc>
  <defs><marker id="ma1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="20" width="190" height="80" rx="6"/><text class="t" x="22" y="44">Your code</text><text class="m" x="22" y="64">client library,</text><text class="m" x="22" y="80">no key file</text>
  <rect class="box" x="290" y="20" width="200" height="80" rx="6"/><text class="t" x="302" y="44">Metadata server</text><text class="m" x="302" y="64">169.254.169.254</text><text class="m" x="302" y="80">knows attached SA</text>
  <rect class="box" x="520" y="130" width="150" height="70" rx="6"/><text class="t" x="532" y="154">Google API</text><text class="m" x="532" y="172">checks IAM for</text><text class="m" x="532" y="188">that SA</text>
  <path class="ln" d="M200,46 L288,46" marker-end="url(#ma1)"/><text class="m" x="244" y="38" text-anchor="middle">GET token</text>
  <g tabindex="0"><title>A token valid for about an hour</title><path class="sa" d="M288,78 L202,78" marker-end="url(#ma1)"/></g><text class="ta" x="244" y="94" text-anchor="middle">~1h token</text>
  <path class="ln" d="M105,100 L105,165 L518,165" marker-end="url(#ma1)"/><text class="m" x="300" y="157" text-anchor="middle">Authorization: Bearer ya29...</text>
  <text class="m" x="390" y="120" text-anchor="middle">runs on the host, outside your VM</text>
  <text class="m" x="10" y="222">the library caches the token and asks again shortly before it expires</text>
</svg>
<figcaption>The code never proves who it is. The host already knows, because you told it when you attached the service account.</figcaption>
</figure>

The same server can also hand out an ID token, which is a signed JWT with an audience of your choosing. Access tokens are for calling Google APIs; ID tokens are for calling your own services behind Cloud Run authentication or Identity-Aware Proxy, where the receiver wants to check who is calling:

```bash
curl -s -H "Metadata-Flavor: Google" \
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://orders-abc123-ew.a.run.app"
```

### How the client library decides

The piece of code that makes the switch painless is Application Default Credentials, or ADC. Every Google client library looks for credentials in the same order:

1. The file named by `GOOGLE_APPLICATION_CREDENTIALS`, if the variable is set.
2. Your own user credentials, if you've run `gcloud auth application-default login` on this machine.
3. The metadata server, if there is one.

That order is why the same code runs on my laptop and in production without a branch:

```python
import google.auth
from google.cloud import storage

credentials, project = google.auth.default()   # no path, no key
client = storage.Client(credentials=credentials, project=project)
print([b.name for b in client.list_buckets()])
```

Locally it picks up my login. On Cloud Run it reaches step 3 and asks the metadata server. It also explains the most common surprise during migration: if a leftover `GOOGLE_APPLICATION_CREDENTIALS` is still set in a deployment, step 1 wins, and the service keeps quietly using the old key. Deleting the key is how you find out.

## 2. Workload Identity: pods on GKE

GKE is where most of our services run, and where the story gets more interesting.

A pod runs on a node, and a node is a VM. So without anything else, a pod that asks the metadata server gets the **node's** service account. Every pod on the node shares it. On many clusters, including some of ours, that was the Compute Engine default service account, which by default is granted the Editor role on the whole project. Access scopes on the node narrowed what that token could do, but the principle was wrong: any container on the node, including a compromised one, could act as the node.

Workload Identity fixes this by giving each Kubernetes service account (KSA) its own mapping to a Google service account (GSA). Setting it up is four steps:

```bash
# 1. Turn it on for the cluster; this creates the identity pool PROJECT_ID.svc.id.goog
gcloud container clusters update my-cluster --region europe-west1 \
  --workload-pool=my-project.svc.id.goog

# 2. Make the node pool serve pods through the GKE metadata server
gcloud container node-pools update default-pool --cluster my-cluster \
  --region europe-west1 --workload-metadata=GKE_METADATA

# 3. Allow the KSA orders/orders-api to act as the GSA
gcloud iam service-accounts add-iam-policy-binding \
  orders-api@my-project.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:my-project.svc.id.goog[orders/orders-api]"

# 4. Tell GKE which GSA the KSA maps to
kubectl annotate serviceaccount orders-api --namespace orders \
  iam.gke.io/gcp-service-account=orders-api@my-project.iam.gserviceaccount.com
```

The pod then only needs `serviceAccountName: orders-api` in its spec. No Secret, no volume, no environment variable. Autopilot clusters have Workload Identity on from the start, so only steps 3 and 4 apply there.

What happens when the pod asks for a token took me a while to piece together. With `GKE_METADATA` set, GKE runs its own metadata server as a DaemonSet, `gke-metadata-server`, on every node, and traffic from pods to `169.254.169.254` is redirected to it instead of the real one. The pod can't tell the difference. Behind that same address, a lot more is going on:

<figure class="fig">
<svg viewBox="0 0 680 318" role="img" aria-labelledby="m2t m2d">
  <title id="m2t">How Workload Identity gets a token for a pod</title>
  <desc id="m2d">A sequence across four parties: the pod, the GKE metadata server on the node, Google's Security Token Service, and the IAM Credentials API. The pod asks for a token. The GKE metadata server works out which pod is asking from its IP address and finds its Kubernetes service account. It exchanges a token for that Kubernetes service account at the Security Token Service for a federated token. It uses the federated token to call generateAccessToken for the mapped Google service account, which IAM allows only if the workloadIdentityUser binding exists. It returns the Google service account's access token to the pod.</desc>
  <defs><marker id="ma2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="10" width="150" height="46" rx="6"/><text class="t" x="85" y="30" text-anchor="middle">Pod</text><text class="m" x="85" y="46" text-anchor="middle">KSA orders-api</text>
  <rect class="box" x="180" y="10" width="150" height="46" rx="6"/><text class="t" x="255" y="30" text-anchor="middle">GKE metadata</text><text class="m" x="255" y="46" text-anchor="middle">DaemonSet on node</text>
  <rect class="box" x="350" y="10" width="150" height="46" rx="6"/><text class="t" x="425" y="30" text-anchor="middle">Security Token</text><text class="m" x="425" y="46" text-anchor="middle">Service (STS)</text>
  <rect class="box" x="520" y="10" width="150" height="46" rx="6"/><text class="t" x="595" y="30" text-anchor="middle">IAM Credentials</text><text class="m" x="595" y="46" text-anchor="middle">API</text>
  <path class="ln dash" d="M85,56 L85,300"/><path class="ln dash" d="M255,56 L255,300"/><path class="ln dash" d="M425,56 L425,300"/><path class="ln dash" d="M595,56 L595,300"/>
  <path class="ln" d="M85,90 L253,90" marker-end="url(#ma2)"/><text class="m" x="170" y="82" text-anchor="middle">1  GET token</text>
  <text class="m" x="262" y="122">2  find pod's KSA</text>
  <path class="ln" d="M255,158 L423,158" marker-end="url(#ma2)"/><text class="m" x="340" y="150" text-anchor="middle">3  exchange KSA token</text>
  <path class="ln dash" d="M425,178 L257,178" marker-end="url(#ma2)"/><text class="m" x="340" y="194" text-anchor="middle">federated token</text>
  <path class="ln" d="M255,224 L593,224" marker-end="url(#ma2)"/><text class="m" x="340" y="216" text-anchor="middle">4  generateAccessToken</text>
  <path class="ln dash" d="M595,244 L257,244" marker-end="url(#ma2)"/><text class="m" x="340" y="260" text-anchor="middle">GSA access token</text>
  <g tabindex="0"><title>The pod receives a token for its own Google service account</title><path class="sa" d="M255,284 L87,284" marker-end="url(#ma2)"/></g><text class="ta" x="170" y="276" text-anchor="middle">5  token, ~1h</text>
</svg>
<figcaption>From the pod's side it's one HTTP call. On the node, it's an identity lookup and two token exchanges, cached so they don't happen on every request.</figcaption>
</figure>

1. The pod sends the usual metadata request. The GKE metadata server receives it.
2. It works out which pod is asking from the source IP, and from the pod, which namespace and KSA it runs as.
3. It obtains a token for that KSA from the cluster, signed by the cluster's own issuer, and trades it at Google's Security Token Service for a federated token. STS trusts the cluster because the cluster is registered in the project's identity pool, `my-project.svc.id.goog`. At this point Google knows the caller as `my-project.svc.id.goog[orders/orders-api]`.
4. It uses the federated token to call the IAM Credentials API and ask for an access token for `orders-api@my-project.iam.gserviceaccount.com`. This is where the `workloadIdentityUser` binding from step 3 of the setup is checked. Without it, the call is refused.
5. The GSA's access token goes back to the pod, and is cached until shortly before it expires.

Two things fell out of seeing it this way. First, the KSA-to-GSA link is enforced by IAM, not by the annotation. The annotation only tells the metadata server which GSA to ask for; the binding decides whether it's allowed. That's why one without the other fails. Second, the GKE metadata server only exposes the endpoints a workload needs. A pod can no longer read the node's token or the node's instance attributes, which quietly closes the "act as the node" hole above.

## 3. Workload Identity Federation: outside Google Cloud

The last place we had keys was CI. Our GitHub Actions workflows deployed to Google Cloud with a key stored as a repository secret.

Workload Identity Federation is the same trick as step 3 above, applied to an outside issuer. GitHub can mint an OIDC token for each workflow run, signed by GitHub and saying which repository, branch and workflow it came from. You register GitHub as a provider in a workload identity pool, and STS will exchange that token for a Google one, subject to conditions you write on those claims:

{% raw %}
```yaml
permissions:
  id-token: write      # lets the job request an OIDC token from GitHub
  contents: read

steps:
  - uses: google-github-actions/auth@v1
    with:
      workload_identity_provider: projects/123456/locations/global/workloadIdentityPools/github/providers/github
      service_account: deployer@my-project.iam.gserviceaccount.com
  - run: gcloud run deploy orders --image europe-docker.pkg.dev/my-project/app/orders:${{ github.sha }}
```
{% endraw %}

The attribute condition on the provider matters as much as the setup. Without one, any repository on GitHub that knows your pool's name could try the exchange. We restrict it to our organisation, and bind the deployer service account only to the specific repositories that deploy.

## The same idea on Azure

Azure is where the name comes from, and it has a counterpart for each of the three pieces above. The underlying mechanism is the same: a local endpoint that only your workload can reach hands out short-lived tokens, and in the federated cases a token from one issuer is traded for another.

| Where the code runs | Google Cloud | Azure |
| --- | --- | --- |
| The cloud's own compute | Service account attached to a VM, Cloud Run service or function | Managed identity on a VM, App Service, Functions or Container Apps |
| Kubernetes pods | GKE Workload Identity | Azure AD Workload Identity on AKS |
| Outside the cloud | Workload Identity Federation | Workload identity federation (federated identity credentials) |
| How client libraries find it | Application Default Credentials | `DefaultAzureCredential` |
| The local endpoint | `169.254.169.254`, header `Metadata-Flavor: Google` | `169.254.169.254` (IMDS), header `Metadata: true` |

### Managed identities: system-assigned and user-assigned

Azure's managed identity comes in two kinds, and the difference is worth knowing even if you only use Google Cloud, because it shows a choice Google made for you.

- A **system-assigned** identity is created with a resource and deleted with it. Turn it on for a VM, and Azure AD gets a service principal whose whole life is tied to that VM. One resource, one identity.
- A **user-assigned** identity is a standalone resource. You create it first, grant it roles, and attach it to one or many VMs, apps or functions. It survives when they're deleted.

A Google service account always behaves like the user-assigned kind: it exists on its own, you grant it roles, and you attach it to whatever should run as it. There's no identity that appears and disappears with a VM. In practice we use it the way Azure people use user-assigned identities, one per service, shared by all instances of that service.

Behind the scenes, an Azure VM asks its Instance Metadata Service for a token, and the request looks very much like the Google one:

```bash
curl -s -H "Metadata: true" \
  "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://storage.azure.com/"
```

The one visible difference is `resource`. Google hands out one access token that works for any Google API the service account has roles on, narrowed by IAM. Azure asks you to name the API you want a token for, and the token's audience is that API. App Service and Functions use the same model, but reach it through a local endpoint whose address and secret header are given to your app as the `IDENTITY_ENDPOINT` and `IDENTITY_HEADER` environment variables.

### Pods on AKS

AKS went through the same problem GKE did. The first answer, pod-managed identity (the `aad-pod-identity` project), intercepted metadata calls from pods on each node, much like the GKE metadata server does. It was deprecated last year, in favour of **Azure AD Workload Identity**, which is in preview on AKS as I write this.

The new approach doesn't intercept anything. The cluster publishes an OIDC issuer, Kubernetes projects a signed service account token into the pod, and the pod exchanges that token with Azure AD directly for a token as a user-assigned identity. You link the two by adding a federated identity credential to the identity, naming the cluster's issuer and `system:serviceaccount:orders:orders-api` as the subject, and annotating the service account with the identity's client ID. It's step 3 of the GKE flow, done by the pod's own client library instead of by a node daemon.

### Outside Azure

For GitHub Actions and similar, Azure uses the same federated identity credentials. You add one to a user-assigned identity or an app registration, saying "trust tokens from `https://token.actions.githubusercontent.com` whose subject is `repo:my-org/orders:ref:refs/heads/main`", and the `azure/login` action with OIDC exchanges the workflow's token for an Azure one. It's the same exchange as Google's Workload Identity Federation, with the trust rule written as an exact subject rather than a condition expression.

### Finding credentials

`DefaultAzureCredential` plays the role of ADC. It tries a chain in order: credentials from environment variables, then managed identity, then the tools a developer is signed into, such as the Azure CLI. The same trap applies. A leftover client secret in the environment wins over the managed identity, and the service keeps using a secret you thought you'd retired.

Seeing the two clouds side by side made the idea clearer to me than either did alone. The names differ and the details differ, but both have settled on the same design: no secrets inside the workload, a trusted local endpoint for code on the cloud's own compute, and token exchange for everything else.

## Why it matters

Put together, this changes a few things that are easy to undersell:

- **Nothing to steal at rest.** No file in a Secret, a repository, a backup or a laptop. The token a pod holds dies within the hour.
- **Identity follows the workload.** The permission is tied to "this namespace and service account in this cluster" or "this Cloud Run service", not to whoever has the file.
- **One identity per workload becomes cheap.** When each identity costs a key to manage, teams share one broad service account. When it costs two commands, giving each service its own narrow one is the easy path.
- **Rotation stops being a project.** Google rotates the keys that sign these tokens. There's nothing for us to schedule.
- **Audit logs mean something.** A call made as `orders-api@` came from the orders workload, because nothing else can get that token. With federation, the logs also carry the external identity that was exchanged.

It doesn't make IAM design go away. A workload identity with Editor on the project is still a workload with Editor on the project. What changes is that least privilege becomes practical, because the unit of identity finally matches the unit of deployment.

## What caught us out

A few things we hit during the first services, in the order we hit them:

- **The leftover environment variable.** Covered above: `GOOGLE_APPLICATION_CREDENTIALS` still set in a Helm values file, so ADC kept using the key. Grep for it before deleting keys.
- **The first request at startup.** On GKE the metadata server can take a moment to be ready for a freshly scheduled pod. A service that fetched a token as the very first thing in `main` occasionally failed on startup. A retry with backoff on the first call fixed it.
- **IAM is eventually consistent.** A new `workloadIdentityUser` binding or role grant can take a few minutes to take effect. Deploying immediately after `terraform apply` gave us confusing 403s that fixed themselves.
- **Identity sameness.** The identity pool is per project, not per cluster. `orders/orders-api` in our staging cluster and `orders/orders-api` in another cluster in the same project are the same principal to IAM. Keep environments in separate projects, or at least separate namespaces.
- **`hostNetwork` pods can't use it.** Their traffic doesn't go through the redirect, so they fall back to the node's identity. We had one such workload and gave it a dedicated node pool.
- **Old access scopes on VMs.** On Compute Engine, a VM's access scopes cap what its token can do even when IAM allows more. We set the scope to `cloud-platform` and let IAM do the restricting, as Google recommends.

## How we're rolling it out

We're doing this service by service, not as one big switch:

1. **Inventory.** List every user-managed key with `gcloud iam service-accounts keys list`, and use Activity Analyzer to see when each one last authenticated. Keys unused for months are the easy first deletions.
2. **One GSA per workload.** Create a dedicated service account for each service, with only the roles it needs, and map its KSA or attach it to its Cloud Run service.
3. **Remove the key path.** Drop `GOOGLE_APPLICATION_CREDENTIALS` and the Secret, deploy, and watch for errors.
4. **Disable, then delete.** Disable the old key first. If nothing breaks for a week, delete it.
5. **Close the door.** Once a project has no keys left, enforce the `iam.disableServiceAccountKeyCreation` organisation policy on it, so new ones can't appear.

The last step is the one that makes the change stick. Without it, the next person under deadline pressure downloads a key "just for now", and the file starts its journey again.

## What made it click

- An access token and a credential are different things. Managed identity keeps the token and removes the credential.
- The metadata server is the platform vouching for you, because it already knows where your code runs.
- ADC checks the environment variable, then your login, then the metadata server, which is why one code path works everywhere.
- On GKE, the pod still talks to `169.254.169.254`; the GKE metadata server exchanges a Kubernetes identity for a Google one behind it.
- The annotation says which service account; the IAM binding says whether you may.
- Federation is the same exchange, with GitHub or another cloud as the issuer.
- Azure has the same three pieces under different names: managed identities, AKS workload identity and federated identity credentials.

What we're really getting rid of isn't key files. It's the step where someone hands out a secret, and everything that goes wrong after it.
