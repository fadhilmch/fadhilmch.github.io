---
layout: post
title: What firmware taught me about Go worker pools
date: 2025-12-06
tags:
- mlops
- systems
summary: Keeping P95 under 100 ms when traffic spikes tenfold, and why bounded concurrency felt familiar from writing interrupt handlers.
---

Before I worked on ML platforms, I wrote firmware. A smart-card reader on an STM32, sensor acquisition for a drone that streamed readings to a ground station over MAVLink, and small games on LPC and ATmega boards. Years later, building a high-throughput experiment assignment service in Go, I kept reaching for the same few patterns. The hardware couldn't be more different, but the problem is the same one: work arrives faster than you can always handle it, and you have to decide in advance what happens then.

## The firmware version

A microcontroller has kilobytes of RAM and no operating system to save you. Data arrives through **interrupts**: a byte lands on a UART, the CPU drops what it's doing and runs a handler. The rule every embedded programmer learns early is that the handler does as little as possible, because while it runs, nothing else can:

```c
#define BUF_SIZE 64
static volatile uint8_t buf[BUF_SIZE];
static volatile uint8_t head, tail;

void USART2_IRQHandler(void) {
    uint8_t byte = USART2->DR;           // read the byte, clear the interrupt
    uint8_t next = (head + 1) % BUF_SIZE;
    if (next != tail) {                  // buffer full? then drop, on purpose
        buf[head] = byte;
        head = next;
    }
}

int main(void) {
    for (;;) {                           // the main loop drains at its own pace
        while (tail != head) {
            handle(buf[tail]);
            tail = (tail + 1) % BUF_SIZE;
        }
        feed_watchdog();
    }
}
```

Three decisions are baked into those lines. The buffer has a **fixed size**, because there's no heap to grow into. When it's full, the handler **drops** the byte: a deliberate overload policy, not an accident. And a **watchdog** resets the chip if the main loop ever hangs.

## The Go version

An assignment service answers one question per request: which variant should this user see? Ours ran on Kubernetes with Redis behind it, at around 5,000 requests per second on an average day. Go makes concurrency cheap enough that the tempting design is one goroutine for everything: every request, and every piece of work a request triggers, gets its own. That works right up to a traffic spike. Then goroutines pile up faster than they finish, each one holding memory and waiting on the same Redis connections, and latency climbs for everyone at once.

The fix was the firmware pattern, translated:

<figure class="fig">
<svg viewBox="0 0 680 254" role="img" aria-labelledby="g1t g1d">
  <title id="g1t">Firmware patterns and their Go equivalents</title>
  <desc id="g1d">Four pairs: an interrupt handler corresponds to an HTTP handler, a ring buffer to a buffered channel, main-loop tasks to worker goroutines, and a watchdog timer to a context deadline.</desc>
  <text class="h" x="10" y="16">FIRMWARE ON A MICROCONTROLLER</text>
  <text class="h" x="380" y="16">GO ASSIGNMENT SERVICE</text>
  <rect class="box" x="10" y="28" width="290" height="46" rx="6"/><text class="t" x="22" y="48">Interrupt handler</text><text class="m" x="22" y="65">grab the byte, push it, return</text>
  <rect class="box" x="380" y="28" width="290" height="46" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="392" y="48">HTTP handler</text><text class="m" x="392" y="65">validate, enqueue, return</text>
  <text class="ta" x="340" y="56" text-anchor="middle" style="font-size:16px">≈</text>
  <rect class="box" x="10" y="84" width="290" height="46" rx="6"/><text class="t" x="22" y="104">Ring buffer</text><text class="m" x="22" y="121">fixed size; full means drop</text>
  <rect class="box" x="380" y="84" width="290" height="46" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="392" y="104">Buffered channel</text><text class="m" x="392" y="121">fixed size; full means shed or wait</text>
  <text class="ta" x="340" y="112" text-anchor="middle" style="font-size:16px">≈</text>
  <rect class="box" x="10" y="140" width="290" height="46" rx="6"/><text class="t" x="22" y="160">Main-loop tasks</text><text class="m" x="22" y="177">a fixed number, own pace</text>
  <rect class="box" x="380" y="140" width="290" height="46" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="392" y="160">Worker goroutines</text><text class="m" x="392" y="177">a fixed number, own pace</text>
  <text class="ta" x="340" y="168" text-anchor="middle" style="font-size:16px">≈</text>
  <rect class="box" x="10" y="196" width="290" height="46" rx="6"/><text class="t" x="22" y="216">Watchdog timer</text><text class="m" x="22" y="233">reset if a task hangs</text>
  <rect class="box" x="380" y="196" width="290" height="46" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="392" y="216">context deadline</text><text class="m" x="392" y="233">give up if work takes too long</text>
  <text class="ta" x="340" y="224" text-anchor="middle" style="font-size:16px">≈</text>
</svg>
<figcaption>The same four ideas on very different hardware. In both, the fast path does as little as possible, work waits in a fixed-size buffer, and a fixed number of workers drain it.</figcaption>
</figure>

### Channels, briefly

Go's answer to the ring buffer is the **channel**: a typed pipe between goroutines, managed by the runtime so you never touch the indices or the locking yourself. Three behaviours cover everything in this post:

<figure class="fig">
<svg viewBox="0 0 680 214" role="img" aria-labelledby="g0t g0d">
  <title id="g0t">Three ways to use a Go channel</title>
  <desc id="g0d">An unbuffered channel hands a value directly from sender to receiver, and both wait for each other. A buffered channel with four slots lets the sender continue until all slots are full. A select with a default branch tries to send and takes the default branch immediately if the buffer is full.</desc>
  <defs><marker id="ch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <text class="t" x="10" y="32">unbuffered</text><text class="m" x="10" y="48">make(chan Job)</text>
  <rect class="box" x="180" y="14" width="110" height="40" rx="6"/><text class="t" x="192" y="39">sender</text>
  <rect class="box" x="560" y="14" width="110" height="40" rx="6"/><text class="t" x="572" y="39">receiver</text>
  <path class="sa" d="M290,34 L558,34" marker-end="url(#ch)"/>
  <text class="m" x="424" y="26" text-anchor="middle">hand-off: both sides wait</text>
  <text class="t" x="10" y="98">buffered</text><text class="m" x="10" y="114">make(chan Job, 4)</text>
  <rect class="box" x="180" y="80" width="110" height="40" rx="6"/><text class="t" x="192" y="105">sender</text>
  <rect class="box" x="560" y="80" width="110" height="40" rx="6"/><text class="t" x="572" y="105">receiver</text>
  <rect class="fa" x="350" y="86" width="38" height="28" rx="3" opacity=".45"/>
  <rect class="fa" x="394" y="86" width="38" height="28" rx="3" opacity=".45"/>
  <rect class="fa" x="438" y="86" width="38" height="28" rx="3" opacity=".45"/>
  <rect class="box" x="482" y="86" width="38" height="28" rx="3"/>
  <path class="ln" d="M290,100 L348,100" marker-end="url(#ch)"/><path class="ln" d="M526,100 L558,100" marker-end="url(#ch)"/>
  <text class="m" x="438" y="132" text-anchor="middle">sender waits only when all 4 slots are full</text>
  <text class="t" x="10" y="164">select + default</text><text class="m" x="10" y="180">try, don't wait</text>
  <rect class="box" x="180" y="146" width="110" height="40" rx="6"/><text class="t" x="192" y="171">sender</text>
  <rect class="box" x="560" y="146" width="110" height="40" rx="6"/><text class="t" x="572" y="171">receiver</text>
  <rect class="fa" x="350" y="152" width="38" height="28" rx="3" opacity=".45"/>
  <rect class="fa" x="394" y="152" width="38" height="28" rx="3" opacity=".45"/>
  <rect class="fa" x="438" y="152" width="38" height="28" rx="3" opacity=".45"/>
  <rect class="fa" x="482" y="152" width="38" height="28" rx="3" opacity=".45"/>
  <path class="sb dash" d="M290,166 L346,166"/><text class="tb" x="318" y="200" text-anchor="middle">full → default branch</text>
</svg>
<figcaption>The three channel behaviours this post relies on. A buffered channel is a ring buffer the runtime manages for you; <code>select</code> with <code>default</code> is the "if full, drop" check.</figcaption>
</figure>

- An **unbuffered** channel is a hand-off. The sender blocks until a receiver takes the value, which is good for synchronising, bad for absorbing bursts.
- A **buffered** channel has a fixed number of slots. Sends succeed immediately until it's full, then block. That's the ring buffer from the firmware, with the waiting built in.
- A `select` with a `default` branch turns a blocking send into a *try*: if the channel is full, take the other branch now. That's the `if (next != tail)` check.

Two more details make channels a good fit for worker pools. Many goroutines can receive from the same channel, and each value goes to exactly one of them, so workers share a queue without extra locking. And closing a channel ends every worker's `for job := range jobs` loop once the queue drains, which gives you graceful shutdown for free.

For work that didn't need to finish before the response, the handler did the minimum and handed the job to a **worker pool**: a buffered channel drained by a fixed number of goroutines.

```go
type Pool struct { jobs chan Job }

func NewPool(workers, queue int) *Pool {
    p := &Pool{jobs: make(chan Job, queue)} // fixed-size buffer
    for i := 0; i < workers; i++ {
        go func() {
            for job := range p.jobs { // fixed number of workers
                job.Run()
            }
        }()
    }
    return p
}

// Submit never blocks the request path: a full queue takes the overload path.
func (p *Pool) Submit(job Job) bool {
    select {
    case p.jobs <- job:
        return true
    default:
        return false // count it, log it, fall back
    }
}
```

`Submit` is the interrupt handler's `if (next != tail)`, one level up. The request never waits on a full queue. It takes the overload path immediately, and that path is something you designed, measured and can alert on.

<figure class="fig">
<svg viewBox="0 0 680 204" role="img" aria-labelledby="g2t g2d">
  <title id="g2t">A bounded worker pool</title>
  <desc id="g2d">Requests reach a cheap handler, which puts work into a fixed-capacity queue drained by four workers. When the queue is full, the handler sheds the request quickly or waits with a deadline.</desc>
  <defs><marker id="g2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>
  <rect class="box" x="10" y="60" width="120" height="50" rx="6"/><text class="t" x="22" y="81">Requests</text><text class="m" x="22" y="98">10× in a spike</text>
  <rect class="box" x="170" y="60" width="130" height="50" rx="6"/><text class="t" x="182" y="81">Handler</text><text class="m" x="182" y="98">cheap, bounded</text>
  <text class="h" x="330" y="46">QUEUE · CAPACITY N</text>
  <rect class="fa" x="330" y="68" width="22" height="34" rx="3" opacity=".45"/>
  <rect class="fa" x="356" y="68" width="22" height="34" rx="3" opacity=".45"/>
  <rect class="fa" x="382" y="68" width="22" height="34" rx="3" opacity=".45"/>
  <rect class="fa" x="408" y="68" width="22" height="34" rx="3" opacity=".45"/>
  <rect class="box" x="434" y="68" width="22" height="34" rx="3" />
  <rect class="box" x="460" y="68" width="22" height="34" rx="3" />
  <rect class="box" x="540" y="24" width="130" height="28" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="552" y="42">worker 1</text>
  <path class="sa" d="M488,85 C512,85 512,38 538,38" marker-end="url(#g2)"/>
  <rect class="box" x="540" y="58" width="130" height="28" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="552" y="76">worker 2</text>
  <path class="sa" d="M488,85 C512,85 512,72 538,72" marker-end="url(#g2)"/>
  <rect class="box" x="540" y="92" width="130" height="28" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="552" y="110">worker 3</text>
  <path class="sa" d="M488,85 C512,85 512,106 538,106" marker-end="url(#g2)"/>
  <rect class="box" x="540" y="126" width="130" height="28" rx="6" style="stroke:var(--fig-a)"/><text class="t" x="552" y="144">worker 4</text>
  <path class="sa" d="M488,85 C512,85 512,140 538,140" marker-end="url(#g2)"/>
  <path class="ln" d="M130,85 L168,85" marker-end="url(#g2)"/>
  <path class="ln" d="M300,85 L328,85" marker-end="url(#g2)"/>
  <path class="sb dash" d="M235,110 L235,150" marker-end="url(#g2)"/>
  <rect class="box" x="170" y="152" width="260" height="40" rx="6" style="stroke:var(--fig-b)"/><text class="tb" x="182" y="170">queue full</text><text class="m" x="182" y="185">shed fast or wait with a deadline</text>
  <text class="m" x="540" y="178">N = concurrency</text><text class="m" x="540" y="193">limit, on purpose</text>
</svg>
<figcaption>A worker pool turns "how much can we do at once?" into a number you choose. When a spike exceeds it, the overload policy is explicit, instead of an ever-growing number of goroutines competing for CPU, memory and connections.</figcaption>
</figure>

### Semaphores and deadlines

Not all work can be deferred. For calls that must finish inside the request, such as a Redis read, the tool is a **counting semaphore**. It's exactly the primitive an RTOS gives you, and in Go it's a buffered channel of empty structs. Pair it with a **context deadline** and you have the watchdog too:

```go
var sem = make(chan struct{}, 64) // at most 64 concurrent calls

func withLimit(ctx context.Context, fn func(context.Context) error) error {
    select {
    case sem <- struct{}{}: // acquire a permit
        defer func() { <-sem }() // release it
        return fn(ctx)
    case <-ctx.Done(): // no permit before the deadline
        return ctx.Err() // fail fast instead of piling up
    }
}
```

A request that can't get a permit before its deadline fails fast, and the caller falls back to a default variant. For an experiment, that means the user sees the control experience, which is always a safe answer. A slow answer that eventually arrives is worse, because by then the page has already rendered.

## Did it hold?

Bounded concurrency is easy to claim and easy to test. We ran a 30-minute distributed load test against the service:

<figure class="fig">
<svg viewBox="0 0 680 116" role="img" aria-labelledby="g3t g3d">
  <title id="g3t">Load test numbers</title>
  <desc id="g3d">About 5,000 requests per second on average in production; more than 50,000 requests per second sustained for 30 minutes in a distributed load test; P95 latency under 100 ms in both.</desc>
  <rect class="box" x="10" y="10" width="210" height="96" rx="8"/>
  <text class="t" x="26" y="52" style="font-size:28px;font-family:Geist,sans-serif;font-weight:600">~5K</text>
  <text class="m" x="26" y="76">requests per second,</text><text class="m" x="26" y="92">average in production</text>
  <rect class="box" x="235" y="10" width="210" height="96" rx="8"/>
  <text class="ta" x="251" y="52" style="font-size:28px;font-family:Geist,sans-serif;font-weight:600">50K+</text>
  <text class="m" x="251" y="76">requests per second,</text><text class="m" x="251" y="92">30-minute load test</text>
  <rect class="box" x="460" y="10" width="210" height="96" rx="8"/>
  <text class="ta" x="476" y="52" style="font-size:28px;font-family:Geist,sans-serif;font-weight:600"><100 ms</text>
  <text class="m" x="476" y="76">P95 latency, in both</text><text class="m" x="476" y="92">production and the test</text>
</svg>
<figcaption>The numbers, stated carefully: the 50K figure is a 30-minute distributed load test with a standard payload, about ten times average production traffic, not a claim about everyday load.</figcaption>
</figure>

A test like that is only meaningful if you state its shape: how long, what payload, compared with what baseline. Thirty minutes at ten times average traffic, with P95 still under 100 ms, is evidence that the limits were set well. It doesn't prove the service can take any spike forever. It shows that when load exceeded capacity, the service degraded the way we'd designed it to.

## What carries over

- **Make the limit a number you chose.** Firmware forces this because memory is finite. In Go you have to impose it yourself, because goroutines make unbounded concurrency feel free until it isn't.
- **Keep the fast path fast.** The interrupt handler and the HTTP handler both do the minimum, then hand off.
- **Design the overload behaviour.** Dropping a byte, shedding a request, or serving the control variant are all fine answers if they're deliberate, counted and visible. The failure mode to avoid is the undesigned one.
- **Always have a watchdog.** A deadline on every call is the difference between one slow dependency and a whole service stuck waiting.

Microcontrollers with kilobytes of memory and a Kubernetes deployment have almost nothing in common, except this: whatever you don't bound, the next traffic spike will bound for you.
