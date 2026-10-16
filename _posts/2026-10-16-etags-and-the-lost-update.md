---
layout: post
title: "ETags: how an API tells you the data changed under you"
date: 2026-10-16
tags:
- systems
- mlops
summary: "What an ETag is, how it skips a download when nothing changed, how it stops two people from overwriting each other's edits, and where the same trick shows up in ML systems."
---

A café has a small admin page for its online menu. Rina opens the iced latte and changes the price from 30 to 32. Budi opened the same item a minute earlier. He marks it as sold out and saves. His form sends the whole item back, including the price it showed him: 30.

Both saves succeed. The latte is now sold out at 30, and Rina's price change is gone. Nobody saw an error.

This is called a *lost update*. HTTP has a fix for it built in, using a header most people only know from caching: the ETag. Rina and Budi are made up.

<figure class="fig">
<svg viewBox="0 0 680 240" role="img" aria-labelledby="et-lost-t et-lost-d">
  <title id="et-lost-t">A lost update</title>
  <desc id="et-lost-d">Rina and Budi both load version 1 of the iced latte: price 30, available. Rina saves price 32, creating version 2. Budi then saves sold out, but his form still holds price 30 from version 1. The server stores version 3, price 30 and sold out, and Rina's price change is lost without any error.</desc>
  <text class="t" x="10" y="60">Rina</text>
  <text class="t" x="10" y="128">server</text>
  <text class="t" x="10" y="196">Budi</text>
  <line class="grid" x1="100" x2="660" y1="56" y2="56"/>
  <line class="grid" x1="100" x2="660" y1="124" y2="124"/>
  <line class="grid" x1="100" x2="660" y1="192" y2="192"/>
  <line class="ln" x1="150" x2="150" y1="118" y2="64"/><polygon class="arrow" points="146,69 154,69 150,62"/>
  <line class="ln" x1="150" x2="150" y1="130" y2="184"/><polygon class="arrow" points="146,179 154,179 150,186"/>
  <circle cx="150" cy="124" r="4" fill="var(--muted)"/>
  <text class="m" x="158" y="44">GET → v1</text>
  <text class="m" x="158" y="214">GET → v1</text>
  <text class="t" x="158" y="146">v1  30, available</text>
  <line class="sa" x1="330" x2="330" y1="58" y2="112"/><polygon class="fa" points="326,111 334,111 330,118"/>
  <circle class="fa" cx="330" cy="124" r="4"/>
  <text class="ta" x="338" y="44">PUT 32, available</text>
  <text class="t" x="338" y="146">v2  32, available</text>
  <line class="sb" x1="510" x2="510" y1="190" y2="136"/><polygon class="fb" points="506,137 514,137 510,130"/>
  <circle class="fb" cx="510" cy="124" r="4"/>
  <text class="tb" x="518" y="214">PUT 30, sold out</text>
  <text class="m" x="518" y="230">built on v1</text>
  <text class="t" x="518" y="146">v3  30, sold out</text>
  <text class="tb" x="518" y="162">Rina's 32 is gone</text>
</svg>
<figcaption>Both writes succeed. Budi's was built on a version that no longer existed, and nothing told him.</figcaption>
</figure>

## What an ETag is

An ETag is a short string the server attaches to a response to name that version of the resource:

```http
HTTP/1.1 200 OK
ETag: "v2"

{"name": "Iced latte", "price": 32, "available": true}
```

What goes inside the quotes is up to the server: a version number, a hash of the content, a revision ID. The only rule is that when the data changes, the ETag changes. The client doesn't need to understand it. It keeps the value and sends it back later, in one of two headers:

- `If-None-Match: "v2"` on a read: "only send it if it's no longer v2."
- `If-Match: "v2"` on a write: "only save this if it's still v2."

## Reads: don't send me what I already have

The customer-facing menu app asks for the menu every time someone opens it. Most of the time the menu hasn't changed. With an ETag, the app sends back the one it got last time:

```http
GET /menu
If-None-Match: "v2"
```

If the menu is still at `v2`, the server answers `304 Not Modified` with no body, and the app uses its cached copy. If it changed, the app gets a normal `200` with the new menu and a new ETag. You still make the request, but most of the time almost nothing comes back.

## Writes: don't overwrite what I haven't seen

Back to Budi. His page loaded the latte at `v1`, so his save says so:

```http
PUT /menu/iced-latte
If-Match: "v1"

{"name": "Iced latte", "price": 30, "available": false}
```

The server is at `v2` now, because Rina saved first. The ETags don't match, so it refuses:

```http
HTTP/1.1 412 Precondition Failed
```

Nothing is written. Budi's page can tell him someone else changed the item, reload it, show him the new price and let him mark it sold out again. This time his save is built on `v2`.

This pattern is called *optimistic concurrency control*. Nobody locks the item while editing. You assume conflicts are rare and check at the moment you write. Locking an edit page doesn't work well on the web anyway: people open a tab and go for lunch.

## The check and the write must be one step

The obvious server code still has a race:

```python
item = db.get(item_id)
if request.headers["If-Match"] != item.etag:
    return 412
db.save(item_id, new_data)  # another save can sneak in between get and save
```

Two requests with the same ETag can both pass the check before either one saves. The fix is to let the database compare and write in one statement:

```sql
UPDATE menu_items
SET price = 30, available = false, version = version + 1
WHERE id = 'iced-latte' AND version = 1;
```

If it updates zero rows, the version moved, so you return 412. If it updates one row, return 200 and the new ETag, `"v3"`, so the client's next save doesn't fail against its own change.

## Where this shows up in ML systems

ML systems move around large files and small pointers to them. ETags help with both.

**Caching model weights.** Model files can be gigabytes, and you don't want to download them again every time a job starts. The Hugging Face Hub client checks the file's ETag before downloading. If it matches the copy already in the local cache, it skips the download. It's the same `304` idea applied to model weights. Object stores like S3 and Google Cloud Storage return ETags on objects too, so a model server that polls for a new model can compare ETags and only reload when the file has changed.

**Promoting a model.** Many setups have a small pointer that serving reads to find the current model, for example a `production.json` file in a bucket that says `{"model": "v41"}`. Now two training pipelines finish around the same time. Pipeline A trained on newer data and writes `v42`. Pipeline B started earlier, is slower and writes `v41` a few seconds later. B wins, and production quietly goes back to the older model. That's the menu problem again.

Conditional writes fix it the same way. Each pipeline reads the pointer, decides whether its model is better, and writes back only if the pointer hasn't moved since it read it. S3 supports `If-Match` on writes, and Google Cloud Storage has the same check through generation numbers (`ifGenerationMatch`). If the write fails, the pipeline reads the pointer again and compares itself with the model that's there now, instead of blindly replacing it.

The same applies to anything several jobs update: a shared eval leaderboard, a "best checkpoint so far" file, or a feature definition two teams edit.

## A few things to watch

- **Make `If-Match` required.** A client that leaves it out still gets last-write-wins. A server can reject unconditional writes with `428 Precondition Required`.
- **Don't retry a 412 automatically.** Sending the same data again with the new ETag just overwrites the other change with extra steps. A 412 means someone, a person or some code, has to look at the new version first.
- **Watch for weak ETags.** An ETag like `W/"v2"` is *weak*, and `If-Match` never matches a weak one. Some servers turn strong ETags into weak ones, for example nginx when it compresses a response. If every save fails with 412, check for the `W/` first.
- **Some data doesn't need it.** A view counter should be `SET views = views + 1` in the database. Two increments can't conflict. Data with a single writer doesn't need it either.

For anything that two people or two jobs can edit, a version column, one header and a 412 handler are enough to stop lost updates.

## References

- RFC 9110, *HTTP Semantics*: [ETag](https://www.rfc-editor.org/rfc/rfc9110#section-8.8.3), [conditional requests](https://www.rfc-editor.org/rfc/rfc9110#section-13), [412 Precondition Failed](https://www.rfc-editor.org/rfc/rfc9110#section-15.5.13).
- MDN, [conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests).
- Amazon S3, [conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html). Google Cloud Storage, [request preconditions](https://cloud.google.com/storage/docs/request-preconditions).
- Hugging Face, [cache management](https://huggingface.co/docs/huggingface_hub/guides/manage-cache).
