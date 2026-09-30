---
layout: post
title: "Deconstructing PlanOut: a coin toss you can repeat"
date: 2026-09-30
tags:
- exp
- systems
summary: "Follow one shopper from a button experiment to the actual SHA-1 bytes, then look at salts, namespaces and the gap between assignment and exposure."
---

Andi opens a checkout page. We want to test two buttons: A is blue, B is pink. He gets blue today. Tomorrow, he opens the page on another server. He should still get blue.

That sounds like a small requirement. It rules out the most obvious implementation: toss a fresh coin on every request. You could save every user's choice in a database, but then every server needs access to that record. PlanOut offers another way: make the coin toss repeatable from the inputs.

This is the part of experimentation systems I want to take apart here. One shopper, one button, and the actual numbers from the archived Python implementation. No production traffic or company internals: the example below uses invented IDs.

<style>
.prose .fig.planout-fig { max-width: 540px; }
.fig.planout-fig svg { min-width: 340px; max-width: 540px; }
.planout-fig .t { font-size: 14px; }
.planout-fig .m, .planout-fig .ta, .planout-fig .tb { font-size: 12px; }
.planout-fig .h { font-size: 12px; }
</style>

## What PlanOut was trying to separate

The product owns the checkout page. The experiment owns the rule for choosing the button. Those should not become one tangled piece of code.

PlanOut was developed at Facebook as a language and framework for defining online experiments. Its 2014 paper describes how an experiment maps a unit, such as a user ID, to parameter values. A parameter might be a button colour, a piece of text, or a discount. Product code asks for that value and uses it.

In other words, the experiment says "blue". It does not draw the button, count purchases, or tell us whether blue is better.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 324" role="img" aria-labelledby="po-flow-t po-flow-d">
<title id="po-flow-t">Flow</title>
<desc id="po-flow-d">Andi enters the checkout. The experiment chooses blue. The product renders the button. The outcome pipeline counts purchases separately.</desc>
<rect class="box" x="12" y="12" width="396" height="60" rx="6"/><text class="t" x="24" y="36">Andi opens checkout</text><text class="m" x="24" y="55">unit: user-42</text><path class="ln" d="M210,72 v20"/><rect class="box" x="12" y="92" width="396" height="60" rx="6"/><text class="t" x="24" y="116">Experiment definition</text><text class="m" x="24" y="135">choose button = blue</text><path class="ln" d="M210,152 v20"/><rect class="box" x="12" y="172" width="396" height="60" rx="6"/><text class="t" x="24" y="196">Product code</text><text class="m" x="24" y="215">use blue when rendering checkout</text><path class="ln dash" d="M210,232 v20"/><rect class="box" x="12" y="252" width="396" height="60" rx="6"/><text class="t" x="24" y="276">Outcome pipeline</text><text class="m" x="24" y="295">record purchases; analyse later</text>
</svg>
<figcaption>PlanOut returns parameter values. Rendering and measuring the result live outside that decision.</figcaption>
</figure>

Here is a small definition using PlanOut's Python API:

```python
from planout.experiment import SimpleExperiment
from planout.ops.random import UniformChoice

class CheckoutButton(SimpleExperiment):
    def setup(self):
        self.salt = "checkout-v1"

    def assign(self, params, userid):
        params.button = UniformChoice(
            choices=["blue", "pink"], unit=userid
        )

experiment = CheckoutButton(userid="user-42")
colour = experiment.get("button")  # "blue"
```

Andi's invented ID is `user-42`. It is the *unit*: the thing we randomise. If we used a session ID instead, we'd be randomising sessions, and Andi could get a different button on his next visit. Choosing the unit is a design decision, not a detail to leave to the SDK.

## A coin toss without a coin

A hash function turns an input string into a fixed-length output. The same input always gives the same output. Small changes to the input usually produce very different outputs.

PlanOut uses SHA-1 as a mixing function for assignment. This is not a password scheme or a way to hide someone's group. We want repeatable, well-spread values, not secrecy.

For this example, PlanOut joins three pieces with dots:

1. The experiment salt: `checkout-v1`.
2. The parameter salt: `button`, supplied from the assigned variable name.
3. The unit: `user-42`.

The complete key is `checkout-v1.button.user-42`. The default separator is a dot; explicit salt overrides and multi-part units have their own paths in the source.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 324" role="img" aria-labelledby="po-hash-t po-hash-d">
<title id="po-hash-t">Hash</title>
<desc id="po-hash-d">The exact key checkout-v1.button.user-42 is hashed. Its first 15 hex digits become integer 235347851596851754. Remainder modulo two is zero, selecting blue.</desc>
<g><rect class="box" x="12" y="12" width="396" height="60" rx="6"/><text class="t" x="24" y="36">checkout-v1.button.user-42</text><text class="m" x="24" y="55">salt + parameter + unit</text></g><g><path class="ln" d="M210,72 v20"/></g><g><rect class="box" x="12" y="92" width="396" height="60" rx="6"/><text class="t" x="24" y="116">SHA-1 → keep first 15 hex digits</text><text class="m" x="24" y="135">3441f9fc514ea2a</text></g><g><path class="ln" d="M210,152 v20"/></g><g><rect class="box" x="12" y="172" width="396" height="60" rx="6"/><text class="t" x="24" y="196">Convert hex to integer</text><text class="m" x="24" y="215">235347851596851754</text></g><g><path class="ln" d="M210,232 v20"/></g><g><rect class="box" x="12" y="252" width="396" height="60" rx="6"/><text class="t" x="24" y="276">h % 2 = 0 → choices[0] → blue</text><text class="m" x="24" y="295">same key, same answer</text></g>
</svg>
<figcaption>The computed path for Andi. Nothing is freshly drawn on the second request.</figcaption>
</figure>

<style>
.po-playground { margin: 32px 0; padding: 20px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
.po-playground[hidden], .po-playground [hidden] { display: none; }
.prose .po-playground h3 { margin: 0 0 8px; }
.prose .po-playground p { margin: 0 0 16px; font-size: 14px; color: var(--muted); }
.po-playground label { display: block; margin-bottom: 6px; font-size: 14px; }
.po-playground input { box-sizing: border-box; width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); color: var(--fg); font: 14px 'Geist Mono', monospace; }
.po-playground input:focus-visible { outline: 2px solid var(--l0); outline-offset: 3px; }
.prose .po-playground .po-status { margin: 12px 0 0; }
.po-playground dl { margin: 20px 0 0; }
.po-playground .po-row { border-top: 1px solid var(--line); padding: 10px 0; }
.po-playground dt { color: var(--muted); font-size: 12px; }
.po-playground dd { margin: 4px 0 0; overflow-wrap: anywhere; font: 13px/1.6 'Geist Mono', monospace; }
.po-playground dd code { padding: 0; border: 0; background: none; font: inherit; }
.po-playground .po-choice { display: inline-block; margin-top: 8px; padding: 4px 10px; border: 1px solid currentColor; border-radius: 4px; font-weight: 600; }
.po-playground .po-choice[data-choice="blue"] { color: var(--l0); }
.po-playground .po-choice[data-choice="pink"] { color: var(--l3); }
</style>
<section class="po-playground" id="po-playground" aria-labelledby="po-playground-title" hidden>
<h3 id="po-playground-title">Try the coin toss</h3>
<p>Change the user ID and follow the actual calculation. The salt stays <code>checkout-v1</code>, the parameter stays <code>button</code>. Nothing is sent to a server.</p>
<label for="po-user-id">User ID</label>
<input id="po-user-id" type="text" value="user-42" placeholder="e.g. user-42" autocomplete="off" spellcheck="false" aria-describedby="po-status">
<p class="po-status" id="po-status" role="status" aria-live="polite" aria-atomic="true">Computing the assignment...</p>
<dl id="po-results" hidden>
<div class="po-row"><dt>1. Full key: salt.parameter.unit</dt><dd><code id="po-key"></code></dd></div>
<div class="po-row"><dt>2. SHA-1 of the UTF-8 key</dt><dd><code id="po-hash"></code></dd></div>
<div class="po-row"><dt>3. Keep the first 15 hex digits (60 bits)</dt><dd><code id="po-prefix"></code></dd></div>
<div class="po-row"><dt>4. Convert hex to an integer</dt><dd><code id="po-integer"></code></dd></div>
<div class="po-row"><dt>5. Remainder selects a choice</dt><dd><code id="po-modulo"></code><br><span class="po-choice" id="po-choice"></span></dd></div>
</dl>
</section>
<noscript><p>The example above works without JavaScript. Enable JavaScript to try other user IDs.</p></noscript>
<script>
(() => {
  'use strict';
  const widget = document.getElementById('po-playground');
  const input = document.getElementById('po-user-id');
  const status = document.getElementById('po-status');
  const results = document.getElementById('po-results');
  // SHA-1 is PlanOut's assignment mixer here, not a security primitive.
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined' || typeof BigInt === 'undefined') {
    const note = document.createElement('p');
    note.textContent = 'The interactive example needs a browser with Web Crypto and BigInt on HTTPS. The static calculation above still applies.';
    widget.replaceWith(note);
    return;
  }
  widget.hidden = false;
  let revision = 0;
  async function update() {
    const current = ++revision;
    const unit = input.value; // Preserve the exact ID, including spaces and Unicode.
    results.hidden = true;
    if (unit === '') {
      status.textContent = 'Enter a user ID to compute its assignment.';
      return;
    }
    status.textContent = 'Computing the assignment...';
    try {
      const key = 'checkout-v1.button.' + unit;
      const bytes = new TextEncoder().encode(key);
      const digest = await window.crypto.subtle.digest('SHA-1', bytes);
      if (current !== revision) return; // An older digest must not overwrite a newer ID.
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const prefix = hash.slice(0, 15);
      // Number would lose precision for a 60-bit hash. Keep this exact with BigInt.
      const integer = BigInt('0x' + prefix);
      const remainder = integer % BigInt(2);
      const choice = ['blue', 'pink'][Number(remainder)];
      document.getElementById('po-key').textContent = key;
      document.getElementById('po-hash').textContent = hash;
      document.getElementById('po-prefix').textContent = prefix;
      document.getElementById('po-integer').textContent = integer.toString();
      document.getElementById('po-modulo').textContent = 'h % 2 = ' + remainder + ' → choices[' + remainder + ']';
      const badge = document.getElementById('po-choice');
      badge.textContent = choice;
      badge.dataset.choice = choice;
      results.hidden = false;
      status.textContent = 'Assigned to ' + choice + '. Same ID, same answer.';
    } catch (error) {
      if (current !== revision) return;
      status.textContent = 'This browser could not compute SHA-1. The static example above is still available.';
    }
  }
  input.addEventListener('input', update);
  update();
})();
</script>


SHA-1 produces 40 hexadecimal digits. The Python implementation keeps the first 15. Each hex digit holds four bits, so that prefix gives a 60-bit integer. For Andi:

```text
key:          checkout-v1.button.user-42
SHA-1:        3441f9fc514ea2ac8f04b1c44a64d90aa350f4fb
first 15:     3441f9fc514ea2a
integer h:    235347851596851754
h % 2:        0
choices[0]:   blue
```

`%` means remainder. Dividing an even number by 2 leaves remainder 0; an odd number leaves 1. With two choices, that is the whole `UniformChoice` decision: `choices[h % 2]`.

A thousand servers can repeat it. None needs a stored row saying "Andi got blue", as long as they agree on the input and implementation.

## The bucket picture, with one important distinction

It is tempting to explain every assignment as "put the hash on a line from zero to one, then split the line in half". That is a useful picture for weighted choices. It is not the exact code path for `UniformChoice`.

The archived Python implementation has two different operations:

- `UniformChoice`: use the integer's remainder to select a list position.
- `WeightedChoice`: divide the integer by a scale, then compare it with cumulative weights.

For the second operation, the scale is `2**60 - 1`, or `1,152,921,504,606,846,975`. Andi's normalized value is about `0.2041317216`. With weights `[0.5, 0.5]`, it lands in blue's half of the line.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 296" role="img" aria-labelledby="po-bucket-t po-bucket-d">
<title id="po-bucket-t">Bucket</title>
<desc id="po-bucket-d">UniformChoice selects blue using remainder zero. WeightedChoice instead places normalized value 0.2041 in the first half of a line from zero to one.</desc>
<text class="h" x="12" y="22">UNIFORMCHOICE: LIST INDEX</text><rect class="box" x="12" y="38" width="190" height="60" rx="6"/><text class="t" x="24" y="62">0 → blue</text><text class="m" x="24" y="81">even hash</text><rect class="box" x="218" y="38" width="190" height="60" rx="6"/><text class="t" x="230" y="62">1 → pink</text><text class="m" x="230" y="81">odd hash</text><circle class="fa" cx="107" cy="118" r="6"/><text class="ta" x="107" y="145" text-anchor="middle">Andi: remainder 0</text><text class="h" x="12" y="188">WEIGHTEDCHOICE: CUMULATIVE WEIGHTS</text><rect class="fa" x="12" y="205" width="198" height="32" opacity=".5"/><rect class="fb" x="210" y="205" width="198" height="32" opacity=".5"/><text class="t" x="111" y="226" text-anchor="middle">blue</text><text class="t" x="309" y="226" text-anchor="middle">pink</text><text class="m" x="12" y="258">0</text><text class="m" x="210" y="258" text-anchor="middle">0.5</text><text class="m" x="408" y="258" text-anchor="end">1</text><path class="sa" d="M93,200 v44"/><text class="ta" x="93" y="280" text-anchor="middle">Andi: 0.2041</text>
</svg>
<figcaption>Two different operators. The example uses the same blue/pink order and equal weights, but matching probabilities do not guarantee matching users.</figcaption>
</figure>

Both operations happen to give Andi blue here. That does not mean they assign every user identically. Replacing one with the other can move users even if both advertise a 50/50 split.

A small source-level detail matters if you want compatibility: PlanOut converts that scale to a floating-point value, and uses `<=` at the weighted boundaries. The mathematical normalization includes 1 at the maximum hash. Replacing the denominator with `2**60`, changing the comparison, or switching to another port without checking its hash behaviour is not a harmless cleanup.

## A salt is the name of the shuffle

Think of the salt as the label on a shuffled deck. With the same deck label and the same user ID, draw the same card again. Change the label and you get a new shuffle.

Here are computed results for 10,000 invented users, `user-0` through `user-9999`, using the same key construction and `UniformChoice` modulo rule:

| Change | Users whose button changed |
| --- | ---: |
| Repeat `checkout-v1`, same choices | 0 / 10,000 |
| Change salt to `checkout-v2` | 4,984 / 10,000 |
| Keep salt, reverse `[blue, pink]` | 10,000 / 10,000 |

The original split was 5,004 blue and 4,996 pink. These are reproducible results for this toy population, not a promise that every experiment produces those exact counts.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 306" role="img" aria-labelledby="po-salt-t po-salt-d">
<title id="po-salt-t">Salt</title>
<desc id="po-salt-d">Among ten thousand users, repeating the definition changes zero assignments, changing the experiment salt changes 4984, and reversing the choices changes all ten thousand.</desc>
<text class="h" x="12" y="20">USERS CHANGED / 10,000</text><text class="t" x="12" y="52">Same salt, same choices</text><rect class="box" x="12" y="64" width="396" height="20" rx="4"/><text class="m" x="408" y="104" text-anchor="end">0 / 10,000</text><text class="t" x="12" y="142">New salt</text><rect class="box" x="12" y="154" width="396" height="20" rx="4"/><rect class="fa" x="12" y="154" width="197.3664" height="20" rx="4"/><text class="m" x="408" y="194" text-anchor="end">4,984 / 10,000</text><text class="t" x="12" y="232">Reversed choices</text><rect class="box" x="12" y="244" width="396" height="20" rx="4"/><rect class="fb" x="12" y="244" width="396.0" height="20" rx="4"/><text class="m" x="408" y="284" text-anchor="end">10,000 / 10,000</text>
</svg>
<figcaption>Computed on invented user-0 through user-9999. Bars share the same scale; the input change, not new coin tosses, moves users.</figcaption>
</figure>

<style>
.po-lab { margin:32px 0; padding:20px; border:1px solid var(--line); border-radius:8px; background:var(--panel); }
.po-lab[hidden] { display:none; }
.prose .po-lab h3 { margin:0 0 8px; }
.prose .po-lab p { margin:0 0 12px; font-size:14px; color:var(--muted); }
.po-lab button { padding:10px 14px; border:1px solid var(--line); border-radius:4px; background:var(--bg); color:var(--fg); font:inherit; cursor:pointer; min-height:44px; }
.po-lab button:focus-visible { outline:2px solid var(--l0); outline-offset:3px; }
.po-lab button:disabled { opacity:.6; cursor:wait; }
.po-lab code { overflow-wrap:anywhere; }
.po-lab .po-tally { display:flex; justify-content:space-between; gap:12px; margin:16px 0 8px; font:13px/1.5 'Geist Mono',monospace; }
.po-blue { color:var(--l0); }
.po-pink { color:var(--l3); }
.po-dot-field { position:relative; height:204px; border:1px solid var(--line); border-radius:4px; background:linear-gradient(to right,transparent calc(50% - 1px),var(--line) 50%,transparent calc(50% + 1px)); overflow:hidden; }
.po-dot { position:absolute; left:0; top:0; width:6px; height:6px; border-radius:50%; transition:transform .55s ease,background-color .55s ease; }
.po-dot[data-choice="0"] { background:var(--l0); }
.po-dot[data-choice="1"] { background:var(--l3); }
.po-split-track { height:24px; display:flex; border:1px solid var(--line); border-radius:4px; overflow:hidden; background:var(--bg); }
.po-split-track span { display:block; }
.po-split-track .po-blue-fill { background:var(--l0); }
.po-split-track .po-pink-fill { background:var(--l3); }
.po-lab progress { width:100%; height:8px; accent-color:var(--l0); }
.prose .po-lab .po-lab-status { margin-top:12px; margin-bottom:0; }
@media(prefers-reduced-motion:reduce) { .po-dot { transition:none; } }
@media(max-width:420px) { .po-lab { padding:14px; } }
</style>
<section class="po-lab" id="po-salt-shifter" aria-labelledby="po-salt-title" hidden>
<h3 id="po-salt-title">Change the shuffle, not the users</h3>
<p>These are the same 200 IDs, <code>user-0</code> through <code>user-199</code>. Each dot uses SHA-1 and the first 15 hex digits, then <code>h % 2</code>. Change only the salt and see which users cross over.</p>
<p>Salt: <code id="po-current-salt">checkout-v1</code> · parameter: <code>button</code></p>
<button type="button" id="po-change-salt">Change salt</button>
<div class="po-tally"><span class="po-blue" id="po-salt-blue">Blue: 0</span><span class="po-pink" id="po-salt-pink">Pink: 0</span></div>
<div class="po-dot-field" id="po-dot-field" aria-hidden="true"></div>
<p class="po-lab-status" id="po-salt-status" role="status" aria-live="polite">Computing 200 assignments...</p>
</section>
<noscript><p>The static salt comparison above shows the same principle. Enable JavaScript to reshuffle 200 users yourself.</p></noscript>


For Andi, the new salt produces prefix `5c87192d9dc8829`, integer `416707841066043433`, and remainder 1. He moves to pink. Reversing the original choices also gives him pink, but for a different reason: his original index is still 0; index 0 now means pink.

That last row is the trap. Keeping the hash stable is not enough. Keep the meaning of its output stable too.

A new experiment can use a new salt deliberately. A live experiment should not casually rename its salt, change ID formatting, reorder choices, edit weights, or switch hashing algorithms. Any of those can change the experience for people already enrolled. Stateless repeatability is not the same thing as a saved sticky assignment that survives definition changes.

The parameter name acts as a salt too. `button` and `hint` get different hash keys for the same user, unless you intentionally share an explicit salt. This keeps two parameters from being perfectly tied to each other by accident.

## Namespaces: pick the experiment before the button

Now suppose two teams both want to test the checkout page. One tests the button; the other tests the layout. We do not want Andi in both at the same time.

A namespace is a shared allocation space. In the Python implementation, a user hashes into an integer segment. Experiments reserve disjoint sets of segment IDs. The user's segment decides which experiment, if any, runs. Only then does that experiment choose its parameter values.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 326" role="img" aria-labelledby="po-namespace-t po-namespace-d">
<title id="po-namespace-t">Namespace</title>
<desc id="po-namespace-d">Illustrative noncontiguous slots: button experiment owns 0, 3, 7; layout owns 1, 5. Other slots give defaults. A user first routes to one experiment, then gets its parameters.</desc>
<text class="h" x="12" y="20">ONE NAMESPACE · 10 ILLUSTRATIVE SLOTS</text><rect class="fa" x="12" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="48" y="64" text-anchor="middle">0</text><rect class="fb" x="92" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="128" y="64" text-anchor="middle">1</text><rect class="box" x="172" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="208" y="64" text-anchor="middle">2</text><rect class="fa" x="252" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="288" y="64" text-anchor="middle">3</text><rect class="box" x="332" y="36" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="368" y="64" text-anchor="middle">4</text><rect class="fb" x="12" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="48" y="128" text-anchor="middle">5</text><rect class="box" x="92" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="128" y="128" text-anchor="middle">6</text><rect class="fa" x="172" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="208" y="128" text-anchor="middle">7</text><rect class="box" x="252" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="288" y="128" text-anchor="middle">8</text><rect class="box" x="332" y="100" width="72" height="48" rx="5" opacity=".65"/><text class="t" x="368" y="128" text-anchor="middle">9</text><text class="ta" x="12" y="186">Button: slots 0, 3, 7</text><text class="tb" x="12" y="208">Layout: slots 1, 5</text><text class="m" x="12" y="230">Other slots: default experience</text><rect class="box" x="12" y="250" width="396" height="64" rx="6"/><text class="t" x="24" y="274">User → segment → one experiment</text><text class="m" x="24" y="293">then: experiment → button value</text>
</svg>
<figcaption>Two decisions: namespace routing, then treatment assignment. Separate namespaces can still overlap in people.</figcaption>
</figure>

The numbered tiles above are an illustration, not Andi's computed upstream namespace segment. The real `add_experiment()` samples from the available segments, so an experiment's allocation need not be a neat contiguous range.

Mutual exclusion applies inside that namespace: a segment cannot belong to both checkout experiments at once. A separate namespace for the homepage can also enrol Andi. Namespaces do not automatically prevent interactions between experiments on different surfaces.

The namespace name, unit, segment count and allocation history are part of the routing contract. Preserving only the button's salt will not preserve routing if those change.

## Assignment is not exposure

We have computed a button colour. Has Andi seen the button? Not necessarily. The page might fail before rendering it. The application might ask for the colour on a route where checkout is never shown.

PlanOut gives you a logging hook. In the default Python experiment behaviour, the first eligible `get()` on an instance triggers exposure logging before returning the parameter. The instance remembers that it logged, so repeated `get()` calls on that same instance do not each emit a new automatic exposure. A new instance is a new situation; there is no global per-user deduplication promise.

<figure class="fig planout-fig">
<svg viewBox="0 0 420 324" role="img" aria-labelledby="po-logging-t po-logging-d">
<title id="po-logging-t">Logging</title>
<desc id="po-logging-d">Computing assignment is followed by first eligible get, which triggers a log hook. Rendering comes later and can fail. A purchase is another event.</desc>
<rect class="box" x="12" y="12" width="396" height="60" rx="6"/><text class="t" x="24" y="36">Compute assignment</text><text class="m" x="24" y="55">blue is the intended value</text><path class="ln" d="M210,72 v20"/><rect class="box" x="12" y="92" width="396" height="60" rx="6"/><text class="t" x="24" y="116">First eligible get("button")</text><text class="m" x="24" y="135">automatic log hook on this instance</text><path class="ln dash" d="M210,152 v20"/><rect class="box" x="12" y="172" width="396" height="60" rx="6"/><text class="t" x="24" y="196">Render button</text><text class="m" x="24" y="215">may fail; get() is not viewability</text><path class="ln dash" d="M210,232 v20"/><rect class="box" x="12" y="252" width="396" height="60" rx="6"/><text class="t" x="24" y="276">Purchase event</text><text class="m" x="24" y="295">outcome, not assignment</text>
</svg>
<figcaption>A parameter-access log is useful evidence, but it is not proof that a person saw the pixels.</figcaption>
</figure>

That hook records parameter access, not human viewability. Automatic logging can be disabled, and an experiment marked out of experiment does not log an exposure. The base experiment delegates the log to your implementation; `SimpleExperiment` writes JSON to a file. Getting a production event pipeline right is still your job.

A useful record connects the unit, experiment, parameter values and time to the definition that produced them. Upstream also records a checksum when available. In a production system I would make the definition version, override, surface and event ID explicit, then decide where the application should emit the event that analysis treats as exposure.

A hash can reconstruct an intended choice if the original inputs and definition survive. It cannot reconstruct a missing render event or a fallback that nobody recorded.

## What the hash cannot tell you


<section class="po-lab" id="po-split-simulator" aria-labelledby="po-split-title" hidden>
<h3 id="po-split-title">Run 10,000 repeatable coin tosses</h3>
<p>Assign <code>user-0</code> through <code>user-9999</code> with <code>checkout-v1.button</code> and <code>h % 2</code>. A 50/50 rule does not promise exactly 5,000 in each group. Run it again: the same inputs give the same counts.</p>
<button type="button" id="po-run-split">Run 10,000 users</button>
<div class="po-tally"><span class="po-blue" id="po-split-blue">Blue: 0</span><span class="po-pink" id="po-split-pink">Pink: 0</span></div>
<div class="po-split-track" aria-hidden="true"><span class="po-blue-fill" id="po-blue-fill" style="width:0%"></span><span class="po-pink-fill" id="po-pink-fill" style="width:0%"></span></div>
<label for="po-split-progress">Users assigned</label>
<progress id="po-split-progress" max="10000" value="0">0 / 10000</progress>
<p class="po-lab-status" id="po-split-status" role="status" aria-live="polite">Ready. All computation stays in your browser.</p>
</section>
<noscript><p>Enable JavaScript to run the 10,000-user assignment example. The SRM explanation below works without it.</p></noscript>
<script>
(() => {
  'use strict';
  const saltWidget = document.getElementById('po-salt-shifter');
  const splitWidget = document.getElementById('po-split-simulator');
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined' || typeof BigInt === 'undefined') {
    [saltWidget, splitWidget].forEach(widget => {
      const note = document.createElement('p');
      note.textContent = 'This interactive example needs Web Crypto and BigInt on HTTPS. The static examples still apply.';
      widget.replaceWith(note);
    });
    return;
  }
  saltWidget.hidden = splitWidget.hidden = false;
  const encoder = new TextEncoder();
  // PlanOut's SHA-1 mixer, not a cryptographic security feature. Never round the 60-bit integer.
  async function bucket(salt, unit) {
    const digest = await crypto.subtle.digest('SHA-1', encoder.encode(salt + '.button.' + unit));
    const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return Number(BigInt('0x' + hex.slice(0, 15)) % BigInt(2));
  }
  const field = document.getElementById('po-dot-field');
  const saltButton = document.getElementById('po-change-salt');
  const saltStatus = document.getElementById('po-salt-status');
  const dots = Array.from({length:200}, (_, i) => {
    const dot = document.createElement('span');
    dot.className = 'po-dot';
    dot.title = 'user-' + i;
    field.appendChild(dot);
    return dot;
  });
  let saltVersion = 1;
  let assignments = [];
  function drawDots() {
    if (!assignments.length) return;
    const half = field.clientWidth / 2;
    const counts = [0, 0];
    assignments.forEach((choice, i) => {
      const index = counts[choice]++;
      const x = choice * half + 10 + (index % 8) * ((half - 22) / 8);
      const y = 12 + Math.floor(index / 8) * 12;
      dots[i].dataset.choice = String(choice);
      dots[i].style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    field.style.height = (Math.ceil(Math.max(...counts) / 8) * 12 + 24) + 'px';
    document.getElementById('po-salt-blue').textContent = 'Blue: ' + counts[0];
    document.getElementById('po-salt-pink').textContent = 'Pink: ' + counts[1];
  }
  async function reshuffle() {
    saltButton.disabled = true;
    saltStatus.textContent = 'Computing 200 assignments...';
    const salt = 'checkout-v' + saltVersion;
    try {
      const next = await Promise.all(dots.map((_, i) => bucket(salt, 'user-' + i)));
      const changed = next.filter((choice, i) => assignments.length && choice !== assignments[i]).length;
      const initial = assignments.length === 0;
      assignments = next;
      document.getElementById('po-current-salt').textContent = salt;
      drawDots();
      saltStatus.textContent = initial ? '200 users assigned. Change salt to reshuffle them.' : changed + ' of 200 users changed sides. Same users; new salt.';
    } catch (error) {
      saltStatus.textContent = 'SHA-1 could not be computed. The static salt comparison is still available.';
    } finally { saltButton.disabled = false; }
  }
  saltButton.addEventListener('click', () => { saltVersion++; reshuffle(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(drawDots).observe(field);
  else window.addEventListener('resize', drawDots);
  reshuffle();
  const runButton = document.getElementById('po-run-split');
  const splitStatus = document.getElementById('po-split-status');
  runButton.addEventListener('click', async () => {
    runButton.disabled = true;
    const counts = [0, 0];
    document.getElementById('po-split-progress').value = 0;
    document.getElementById('po-blue-fill').style.width = '0%';
    document.getElementById('po-pink-fill').style.width = '0%';
    document.getElementById('po-split-blue').textContent = 'Blue: 0';
    document.getElementById('po-split-pink').textContent = 'Pink: 0';
    splitStatus.textContent = 'Computing 10,000 real SHA-1 assignments...';
    try {
      // Bounded batches keep the page responsive and let actual progress paint.
      for (let start = 0; start < 10000; start += 250) {
        const batch = await Promise.all(Array.from({length:250}, (_, offset) => bucket('checkout-v1', 'user-' + (start + offset))));
        batch.forEach(choice => counts[choice]++);
        const completed = start + 250;
        document.getElementById('po-split-blue').textContent = 'Blue: ' + counts[0].toLocaleString();
        document.getElementById('po-split-pink').textContent = 'Pink: ' + counts[1].toLocaleString();
        document.getElementById('po-blue-fill').style.width = (counts[0] / 10000 * 100) + '%';
        document.getElementById('po-pink-fill').style.width = (counts[1] / 10000 * 100) + '%';
        document.getElementById('po-split-progress').value = completed;
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      splitStatus.textContent = '10,000 assigned: ' + (counts[0] / 100).toFixed(2) + '% blue, ' + (counts[1] / 100).toFixed(2) + '% pink. Repeat to get exactly the same counts. This is assignment, not exposure data or an SRM test.';
    } catch (error) {
      splitStatus.textContent = 'The computation stopped before finishing. Try again; the static explanation remains available.';
    } finally { runButton.disabled = false; }
  });
})();
</script>


Suppose the button experiment expects an even split, but the logged population contains 700 blue and 300 pink users. That is a sample ratio mismatch, or SRM: the observed group counts are unexpectedly far from the planned allocation.

It is a warning to investigate the experiment, not evidence that pink loses. Maybe assignment changed. Maybe one group has missing events. Maybe the eligibility filter is different on the two paths. Check the population you count, the planned allocation, and the logging before reading an effect estimate. A fixed 50/50 check also does not fit a bandit that intentionally moves traffic.

PlanOut does not perform that investigation or estimate lift for you. Repeatable assignment is one part of trustworthy experimentation. Exposure data, outcome definitions and statistical analysis are separate parts.

## Archived does not mean the idea failed

The public repository was archived on June 1, 2021 and is read-only. That is verifiable. An exact public explanation from the maintainers for *why* it was archived is not established in the sources linked below.

So I would not turn the archive badge into a story about Facebook abandoning experimentation, maintenance costs, or a single successor replacing PlanOut. Its own documentation described the interpreter as one way to define experiments at Facebook, running on top of QuickExperiment. The public library was never the whole internal platform.

What has changed for someone choosing a tool today is the available scope. A language gives you definitions and operators. Modern experimentation products can also provide configuration delivery, allocation controls, exposure handling, metric definitions and analysis. Those are reasons to evaluate a broader platform, not proof of the archive's motive.

## What I would use instead today

There is no official replacement established by the PlanOut sources. The replacement depends on which job you need done.

- For owning the assignment implementation, a small SDK can work, but stable identity, versioned definitions and compatibility tests become your responsibility. GrowthBook's [build-your-own guide](https://docs.growthbook.io/lib/build-your-own) is a useful current example of an SDK contract.
- For an experimentation platform, [GrowthBook](https://docs.growthbook.io/app/sticky-bucketing) and [Statsig](https://docs.statsig.com/experiments-plus) are examples worth evaluating. Compare their allocation, logging, warehouse and analysis paths against your requirements. They are alternatives, not drop-in replicas of PlanOut's byte-level behaviour.
- For adaptive allocation, the policy is another layer. A bandit updates traffic based on rewards; a deterministic hash does not learn which button sells more. I covered that distinction in [Thompson sampling, explained with coupons]({{ '/posts/thompson-sampling-explained-with-coupons/' | relative_url }}).

If I were moving an existing experiment, I would first make a test set of IDs, salts, definitions, overrides and expected outputs. Run old and new systems against it. Explain every disagreement before moving live traffic. A new SDK producing "roughly half in each group" is not enough if it puts different people in those groups.

The lesson I keep from PlanOut is smaller than a whole platform: separate the experiment definition from product code, make assignment repeatable, and make the boundary between a decision and an observation explicit. Andi getting blue twice is easy to demonstrate. Knowing whether blue helped him is a different system.

## References

- Bakshy, Eckles and Bernstein, [Designing and Deploying Online Field Experiments](https://hci.stanford.edu/publications/2014/planout/planout-www2014.pdf), WWW 2014. The design motivation and system boundaries.
- [PlanOut repository](https://github.com/facebookarchive/planout) and [release page](https://github.com/facebookarchive/planout/releases). Public archival status and date.
- Python source: [random operators](https://github.com/facebookarchive/planout/blob/master/python/planout/ops/random.py), [assignment](https://github.com/facebookarchive/planout/blob/master/python/planout/assignment.py), [namespaces](https://github.com/facebookarchive/planout/blob/master/python/planout/namespace.py), and [experiment logging](https://github.com/facebookarchive/planout/blob/master/python/planout/experiment.py). The mechanics here refer to this implementation, not every language port.
- Fabijan et al., [Diagnosing Sample Ratio Mismatch](https://www.microsoft.com/en-us/research/publication/diagnosing-sample-ratio-mismatch-in-online-controlled-experiments-a-taxonomy-and-rules-of-thumb-for-practitioners/), KDD 2019. Why the count mismatch is a diagnostic warning, not a treatment-effect result.
- [About PlanOut](https://github.com/facebook/planout/blob/master/python/docs/08-about-planout.md). Its relationship to QuickExperiment.
- [GrowthBook SDK guide](https://docs.growthbook.io/lib/build-your-own), [sticky bucketing](https://docs.growthbook.io/app/sticky-bucketing), and [Statsig Experiments](https://docs.statsig.com/experiments-plus). Examples of current alternatives, not evidence of an official succession.
