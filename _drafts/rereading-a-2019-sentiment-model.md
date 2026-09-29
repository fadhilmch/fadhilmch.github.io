---
layout: post
title: Rereading my 2019 sentiment model
tags:
- data
summary: Three models finished within four points of each other. The dataset moved the result by eleven.
---

<!--
DRAFT NOTES (delete before publishing)
Source: github.com/fadhilmch/big-data-project, project_complete.ipynb + assets/*.png
- Every number below is from the notebook outputs or the report slides in assets/. Nothing was rerun.
- 82.0% / AUC 0.90 for linear SVM come from assets/svm_result.png (the notebook only kept the figures).
  The README says "82% accuracy and AUC 86%", which pairs the linear accuracy with the RBF curve. Fix the README too.
- Co-authors: M. Irfan Handarbeni and Mehrdad Darraji. Confirm they are happy to be named.
- Voice: written as if in late 2020, about 18 months after the project (after the Electrolux thesis
  internship, before Traveloka). No references to anything after 2020.
- Publication date: decide between backdating (e.g. 2020-11) and today's date with a line such as
  'written in late 2020'. Backdating implies it was published then.
-->

In spring 2019 I did a course project at KTH with two classmates, Irfan Handarbeni and Mehrdad Darraji. The question was simple: which classifier is best at telling positive tweets from negative ones? We tried Naive Bayes, a linear SVM and a small convolutional network. I expected the CNN to win, because in 2019 the neural network was supposed to win.

It didn't. A year and a half later I reread the notebook, and I think the more useful lesson is somewhere other than where we put it at the time.

## What we measured

We used Sentiment140, 1.6 million English tweets from 2009 labelled positive or negative. After cleaning, we held out a balanced test set of one million tweets and trained on a sample of about 100,000. Before splitting, we removed any training tweet whose text also appeared in the test set. That was a good call, since Twitter is full of identical tweets.

On that test set:

| Model | Twitter accuracy |
| --- | --- |
| TextBlob, no training (baseline) | 0.59 |
| CNN (Keras, 5,000-word vocabulary) | 0.777 |
| Multinomial Naive Bayes, TF-IDF 1–3 grams | 0.784 |
| Linear SVM, TF-IDF 1–3 grams | 0.820 |

The linear SVM won, and that was the headline of our report. A fair reading is narrower. Anything trained beat the off-the-shelf lexicon by about twenty points, and the three trained models then sat within about four points of each other.

We ran the same three models on Amazon product reviews. All of them scored between 90% and 94%. **Changing the dataset moved accuracy by eleven to fifteen points. Changing the model moved it by about four.**

<figure class="fig">
<svg viewBox="0 0 680 190" role="img" aria-labelledby="s1t s1d">
  <title id="s1t">Accuracy by model on Twitter and Amazon reviews</title>
  <desc id="s1d">CNN 77.7% on Twitter, 92.75% on Amazon. Naive Bayes 78.4% and 89.97%. Linear SVM 82.0% and 93.71%.</desc>
  <circle class="fb" cx="66" cy="14" r="5"/><text class="t" x="76" y="18">Twitter (Sentiment140)</text>
  <circle class="fa" cx="266" cy="14" r="5"/><text class="t" x="276" y="18">Amazon reviews</text>
  <line class="grid" x1="150" x2="150" y1="36" y2="160"/><line class="grid" x1="272.5" x2="272.5" y1="36" y2="160"/>
  <line class="grid" x1="395" x2="395" y1="36" y2="160"/><line class="grid" x1="517.5" x2="517.5" y1="36" y2="160"/>
  <line class="grid" x1="640" x2="640" y1="36" y2="160"/>
  <text class="m" x="150" y="176" text-anchor="middle">75%</text><text class="m" x="272.5" y="176" text-anchor="middle">80%</text>
  <text class="m" x="395" y="176" text-anchor="middle">85%</text><text class="m" x="517.5" y="176" text-anchor="middle">90%</text>
  <text class="m" x="640" y="176" text-anchor="middle">95%</text>
  <text class="t" x="10" y="64">CNN</text>
  <line class="ln" x1="216.2" x2="584.9" y1="60" y2="60"/>
  <g tabindex="0"><title>CNN on Twitter: 77.7%</title><circle class="fb" cx="216.2" cy="60" r="6" style="stroke:var(--bg);stroke-width:2"/></g>
  <g tabindex="0"><title>CNN on Amazon: 92.75%</title><circle class="fa" cx="584.9" cy="60" r="6" style="stroke:var(--bg);stroke-width:2"/></g>
  <text class="m" x="204" y="64" text-anchor="end">77.7</text><text class="m" x="597" y="64">92.8</text>
  <text class="t" x="10" y="104">Naive Bayes</text>
  <line class="ln" x1="233.3" x2="516.8" y1="100" y2="100"/>
  <g tabindex="0"><title>Naive Bayes on Twitter: 78.4%</title><circle class="fb" cx="233.3" cy="100" r="6" style="stroke:var(--bg);stroke-width:2"/></g>
  <g tabindex="0"><title>Naive Bayes on Amazon: 89.97%</title><circle class="fa" cx="516.8" cy="100" r="6" style="stroke:var(--bg);stroke-width:2"/></g>
  <text class="m" x="221" y="104" text-anchor="end">78.4</text><text class="m" x="529" y="104">90.0</text>
  <text class="t" x="10" y="144">Linear SVM</text>
  <line class="ln" x1="321.5" x2="608.9" y1="140" y2="140"/>
  <g tabindex="0"><title>Linear SVM on Twitter: 82.0%</title><circle class="fb" cx="321.5" cy="140" r="6" style="stroke:var(--bg);stroke-width:2"/></g>
  <g tabindex="0"><title>Linear SVM on Amazon: 93.71%</title><circle class="fa" cx="608.9" cy="140" r="6" style="stroke:var(--bg);stroke-width:2"/></g>
  <text class="m" x="309" y="144" text-anchor="end">82.0</text><text class="m" x="621" y="144">93.7</text>
</svg>
<figcaption>Each line is one model on two datasets. The lines are long, while dots of the same colour sit close together: the data moved the result far more than the choice of model did.</figcaption>
</figure>

Reviews are longer, the words are more specific, and a star rating is a cleaner label than whatever a tweet implies. If I had to predict how well a sentiment model would do, knowing what text it would see would help me much more than knowing its architecture.

## The labels were already a model

Sentiment140 was never labelled by people. Its authors collected tweets containing emoticons, treated `:)` as positive and `:(` as negative, and then removed the emoticons from the text. So every one of our models learned to predict whether the author had typed a smiley.

That explains the gap with Amazon better than anything we tried. A tweet like "finally finished my exam :(" carries a negative label that the remaining words hardly support. Beyond a certain point, no classifier can recover information the labelling process never captured. Asking "why can't we get past 82%?" was really asking about the data.

## The stopword that mattered

The experiment I'm happiest with in hindsight is a small one. With Naive Bayes, we compared three ways of handling stopwords:

- keep every word: 0.78
- remove scikit-learn's standard English stopword list: 0.75
- remove our own list of the twenty most frequent words, excluding `not`: 0.77

<figure class="fig">
<svg viewBox="0 0 680 150" role="img" aria-labelledby="s2t s2d">
  <title id="s2t">What each stopword setting leaves of "this is not good"</title>
  <desc id="s2d">Keeping every word leaves "this is not good", accuracy 0.78. The standard English list removes this, is and not, leaving "good", accuracy 0.75. Our list removes is but keeps not, leaving "this not good", accuracy 0.77.</desc>
  <text class="t" x="10" y="31">keep every word</text>
  <rect class="box" x="190" y="14" width="48" height="26" rx="13"/><text class="t" x="214" y="31" text-anchor="middle">this</text>
  <rect class="box" x="246" y="14" width="32" height="26" rx="13"/><text class="t" x="262" y="31" text-anchor="middle">is</text>
  <rect class="box" x="286" y="14" width="40" height="26" rx="13"/><text class="t" x="306" y="31" text-anchor="middle">not</text>
  <rect class="box" x="334" y="14" width="48" height="26" rx="13"/><text class="t" x="358" y="31" text-anchor="middle">good</text>
  <text class="m" x="670" y="31" text-anchor="end">0.78</text>
  <text class="t" x="10" y="76">standard English list</text>
  <rect class="box dash" x="190" y="59" width="48" height="26" rx="13" opacity=".5"/><text class="m" x="214" y="76" text-anchor="middle" text-decoration="line-through">this</text>
  <rect class="box dash" x="246" y="59" width="32" height="26" rx="13" opacity=".5"/><text class="m" x="262" y="76" text-anchor="middle" text-decoration="line-through">is</text>
  <rect class="box dash" x="286" y="59" width="40" height="26" rx="13" style="stroke:var(--fig-b)"/><text class="tb" x="306" y="76" text-anchor="middle" text-decoration="line-through">not</text>
  <rect class="box" x="334" y="59" width="48" height="26" rx="13"/><text class="t" x="358" y="76" text-anchor="middle">good</text>
  <text class="tb" x="396" y="76">reads as positive</text>
  <text class="m" x="670" y="76" text-anchor="end">0.75</text>
  <text class="t" x="10" y="121">our list, kept "not"</text>
  <rect class="box" x="190" y="104" width="48" height="26" rx="13"/><text class="t" x="214" y="121" text-anchor="middle">this</text>
  <rect class="box dash" x="246" y="104" width="32" height="26" rx="13" opacity=".5"/><text class="m" x="262" y="121" text-anchor="middle" text-decoration="line-through">is</text>
  <rect class="box" x="286" y="104" width="40" height="26" rx="13" style="stroke:var(--fig-a)"/><text class="ta" x="306" y="121" text-anchor="middle">not</text>
  <rect class="box" x="334" y="104" width="48" height="26" rx="13"/><text class="t" x="358" y="121" text-anchor="middle">good</text>
  <text class="ta" x="396" y="121">negation survives</text>
  <text class="m" x="670" y="121" text-anchor="end">0.77</text>
</svg>
<figcaption>One example sentence under each setting, with the Naive Bayes validation accuracy on the right.</figcaption>
</figure>

The standard list includes `not`. Dropping it turns "not good" into "good". Our cleaning step had already expanded contractions for this reason ("don't" became "do not"), and then the stopword list removed the part we had been careful to keep. The custom list skipped `not` deliberately, and in the notebook that exclusion is a single line: `del custom_stop_words[2]`.

It's the least impressive-looking line in the project, and it is also the best example of the actual job: find out what a preprocessing step removes before assuming it removes noise.

## What I would question a year on

Rereading your own work from eighteen months ago is humbling. A few things I would change.

**The CNN comparison was unfair.** It had a 5,000-word vocabulary, 25-dimensional embeddings, tweets cut at 50 tokens, and 100,000 training examples. The SVM had 1–3 grams over the full vocabulary. So "the SVM beat the CNN" really means "a well-fed linear model beat an underfed network". That can still be the right practical choice, but it's a different claim.

**One normalisation experiment never ran.** The lemmatisation and stemming cells build a normalised copy of the data and then split the *original* data for training. Their results match the unnormalised run exactly, and we concluded that normalisation made no difference. We never tested it.

**The validation AUC was computed from hard labels.** During the feature search, the ROC curve was built from predicted classes instead of scores, so the "AUC" matched accuracy almost exactly and added nothing. The final test runs used probabilities correctly. Even so, our README pairs the linear SVM's accuracy (82%) with the RBF kernel's AUC (0.86). The linear model's AUC was 0.90.

**The RBF SVM was scored on a 5% sample of the test set**, because the full set was too slow. It appears in our comparison table next to models scored on the full million.

None of these change the main conclusion. They do show that the numbers we were proudest of were the least carefully checked.

## What carried over

Since then I've spent most of a year on sales forecasting, first in an internship and then in my thesis, and the same pattern kept coming back. The model is the easy part to compare, because a leaderboard is easy to build. The decisions that shape the result come earlier: where the labels came from, what cleaning throws away, and whether two numbers in a table were measured the same way.

If I ran this project again, I would spend the first week on the labels and the test set, and only then compare models.

The notebooks, figures and report are on [GitHub](https://github.com/fadhilmch/big-data-project).
