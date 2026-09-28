require 'json'
require 'yaml'
require 'date'
require 'open3'
require 'fileutils'

root = File.expand_path('..', __dir__)
source = '/Users/fadhil.1.mochammad/Downloads/Portfolio Website Design Request/fm-data-real.js'
node_reader = <<~'JS'
  const fs = require('fs');
  const vm = require('vm');
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
  process.stdout.write(JSON.stringify(context.window.FM_DATA));
JS
json, error, status = Open3.capture3('node', '-e', node_reader, source)
abort error unless status.success?
raw = JSON.parse(json)

def dump(root, name, value)
  File.write(File.join(root, '_data', "#{name}.yml"), YAML.dump(value))
end

FileUtils.mkdir_p(File.join(root, '_data'))
FileUtils.mkdir_p(File.join(root, '_posts'))
FileUtils.mkdir_p(File.join(root, '_notes'))

profile = raw.fetch('profile').transform_keys { |key| key == 'offHours' ? 'off_hours' : key }
dump(root, 'profile', profile)
dump(root, 'stats', raw.fetch('stats').map { |row| { 'value' => row.fetch('v'), 'label' => row.fetch('k') } })
dump(root, 'education', raw.fetch('education').map { |row| row.merge('note' => row.fetch('note').sub('Thesis: ', 'Thesis — ')) })

official_roles = {
  'Electrolux Group' => ['Machine Learning Engineer', 'Sep 2025 — Now'],
  'Traveloka' => ['Sr. Machine Learning and Experimentation Platform Engineer', 'Dec 2020 — Sep 2025'],
  'Spotify' => ['Machine Learning Engineer Intern', 'Jun 2020 — Oct 2020'],
  'Electrolux' => ['Data Scientist Intern', 'Dec 2019 — Jun 2020'],
  'Scania' => ['Data Scientist Intern', 'Apr 2019 — Aug 2019'],
  'OnTel AB' => ['Full-Stack Web Developer', 'Oct 2018 — Aug 2019'],
  'Riset.ai' => ['AI Engineer', 'Apr 2018 — Apr 2019'],
  'ITB Advanced Robotics Lab' => ['Research Assistant', 'Aug 2016 — Dec 2017']
}
dump(root, 'experience', raw.fetch('experience').map do |role|
  title, years = official_roles.fetch(role.fetch('org'))
  role.merge('role' => title, 'years' => years).reject { |key, _| key == 'place' }
end)

skill_meta = [
  ['llms', '◎', 'l0'],
  ['experimentation', '⚖', 'l1'],
  ['ml-platform', '∞', 'l3'],
  ['creative', '◐', 'l2']
]
dump(root, 'skills', raw.fetch('skills').each_with_index.map do |skill, index|
  key, glyph, color = skill_meta.fetch(index)
  { 'key' => key, 'group' => skill.fetch('group'), 'glyph' => glyph, 'color' => color,
    'items' => skill.fetch('items').map { |name, where| { 'name' => name, 'where' => where } } }
end)

projects = raw.fetch('projects').map do |project|
  project
end
projects[1]['desc'] = 'Replays flagged questions, checks evidence, identifies likely root cause, then routes cases to an owner. Estimated investigation time falls from about 15 minutes to 1 minute per item.'
dump(root, 'projects', projects)
dump(root, 'publications', raw.fetch('pubs'))
dump(root, 'contact', raw.fetch('contact'))

lanes = [
  { 'key' => 'agents', 'label' => 'agents', 'long' => 'Agents & LLMs', 'color' => 'l0', 'tags' => ['agents'] },
  { 'key' => 'exp', 'label' => 'experimentation', 'long' => 'Experimentation & data', 'color' => 'l1', 'tags' => ['exp', 'data'] },
  { 'key' => 'mlops', 'label' => 'ml-platform', 'long' => 'ML platform', 'color' => 'l3', 'tags' => ['mlops'] },
  { 'key' => 'creative', 'label' => 'creative', 'long' => 'Creative practice', 'color' => 'l2', 'tags' => ['design', 'photo', 'music'] },
  { 'key' => 'meta', 'label' => 'meta', 'long' => 'About this vault', 'color' => 'fg', 'tags' => ['meta'] }
]
dump(root, 'lanes', lanes)

nodes = [
  { 'id' => 'profile', 'level' => 0, 'glyph' => '@', 'title' => 'Fadhil', 'subtitle' => profile.fetch('location'), 'kind' => 'profile', 'color' => 'fg', 'desc' => profile.fetch('bio'), 'source' => 'profile' },
  { 'id' => 'edu', 'level' => 1, 'glyph' => '∑', 'title' => 'Education', 'subtitle' => 'EE → ML', 'kind' => 'input', 'color' => 'fg', 'desc' => 'Electrical engineering and robotics in Bandung, then a master’s in machine learning at KTH.', 'source' => 'education' },
  { 'id' => 'exp', 'level' => 2, 'glyph' => '≡', 'title' => 'Experience', 'subtitle' => 'auto', 'kind' => 'loop', 'color' => 'fg', 'desc' => 'From a robotics lab in Bandung to machine learning work in Stockholm.', 'source' => 'experience' },
  { 'expand' => 'skills', 'level' => 3, 'kind' => 'tool' },
  { 'id' => 'work', 'level' => 4, 'glyph' => '▣', 'title' => 'Work', 'subtitle' => 'auto', 'kind' => 'output', 'color' => 'fg', 'desc' => 'Selected production systems and two early IEEE papers.', 'source' => 'projects+publications' },
  { 'id' => 'contact', 'level' => 5, 'glyph' => '→', 'title' => 'Say hello', 'subtitle' => 'contact', 'kind' => 'respond', 'color' => 'l2', 'desc' => 'Happy to talk about agents, evaluation or experimentation.', 'source' => 'contact' }
]
workflow = {
  'canvas' => { 'node_width' => 76, 'node_height' => 72, 'col_gap' => 202, 'row_gap' => 118, 'pad_x' => 30, 'center_y' => 250 },
  'nodes' => nodes,
  'edges' => [
    { 'from' => 'profile', 'to' => 'edu', 'label' => '2 degrees' },
    { 'from' => 'edu', 'to' => 'exp', 'label' => 'auto' },
    { 'from' => 'exp', 'to' => '@skills' },
    { 'from' => '@skills', 'to' => 'work' },
    { 'from' => 'work', 'to' => 'contact', 'label' => 'auto' }
  ]
}
dump(root, 'workflow', workflow)

post_bodies = {
  'evaluating-an-agent-honestly' => "A single score cannot tell you whether an agent is useful. Relevance, retrieval recall, groundedness and latency each catch a different failure, and each can look healthy while the user still gets a poor answer.\n\nI use evaluations as engineering evidence: compare a change with a baseline, inspect failures, then decide what to change. Offline checks help before release; online evaluation helps find regressions that the test set did not anticipate. Neither should be treated as a substitute for understanding the task.\n\nThe practical lesson is to make evaluation part of the development loop and keep the reports legible to the people making the next decision.\n",
  'an-agent-that-triages-its-own-feedback' => "Production feedback is most useful when it arrives with evidence. A triage workflow can replay a flagged question, retrieve the supporting context, classify likely content gaps versus configuration issues, and route the case to an owner.\n\nThe system should stop when evidence is missing or conflicting and ask a person to review it. The goal is to shorten investigation, not to automate certainty. The time saving is an operational estimate based on comparing the manual and automated workflows.\n",
  'golden-datasets-without-the-gold-rush' => "Evaluation examples are useful when their expected answer is anchored to a source and reviewed by a person. Simulated user personas can suggest realistic queries and metadata, but generated examples should remain proposals until someone checks the question, answer and source together.\n\nThis keeps the dataset connected to actual user intents while making its limits visible. A growing collection is not automatically a better evaluation set; coverage and review matter more than a headline count.\n",
  'thompson-sampling-explained-with-coupons' => "Thompson sampling gives each option a probability distribution representing uncertainty about its reward. On each decision, sample a plausible reward for every option and choose the strongest sample.\n\nThat simple step naturally balances trying uncertain choices with using choices that have performed well. It is useful when feedback arrives quickly, but it does not remove the need to define a sensible reward or protect against long-term effects that arrive slowly.\n",
  'one-definition-of-conversion' => "When teams define conversion differently, a dashboard comparison becomes a debate about SQL instead of a discussion about the product. A metric semantic layer gives experiments and reporting a shared definition to reuse.\n\nThe hard part is not only building a catalog. It is agreeing on ownership, documenting meaning and making the governed definition easier to use than a local copy. Reuse is what turns a schema into a working practice.\n",
  'go-worker-pools-for-experiment-assignment' => "A high-throughput assignment service needs bounded concurrency, predictable latency and a clear response to backpressure. Go worker pools make the concurrency limit explicit: work enters a queue, a fixed set of workers handles it, and overload has a policy instead of creating unbounded goroutines.\n\nLoad testing is useful only when the request shape and duration are stated. In this case, the service sustained more than 50,000 requests per second in a 30-minute distributed load test, with P95 latency below 100 ms. That is a test result, not a claim about average production traffic.\n",
  'the-exposure-triangle-but-for-learning-rates' => "Photography exposure is a useful reminder that a system of controls is coupled. Aperture, shutter speed and ISO share a brightness budget; changing one changes the pressure on the others.\n\nLearning rate, batch size and warmup are also easier to reason about as a configuration than as isolated magic numbers. The analogy is imperfect, but it encourages deliberate trade-offs and careful observation rather than tuning one control blindly.\n",
  'a-serving-sdk-data-scientists-actually-use' => "An SDK is an interface for engineers. If every model author has to learn cluster setup, authentication, tracing and deployment conventions before shipping a model, the platform is exposing its machinery instead of helping with the task.\n\nA useful serving SDK gives teams a narrow, consistent path to production while keeping the operational guarantees in the platform. The interface needs examples, sensible defaults and errors that tell users what to do next.\n",
  'fm-synthesis-and-explore-exploit' => "FM synthesis creates complex timbres by letting one oscillator modulate another. Small parameter changes can move the sound from familiar to surprising.\n\nExplore–exploit systems face a related tension: use what currently looks best, or try an option that could teach you something. Both are about controlled variation under uncertainty. In music, the result is a sound; in an experiment, it is evidence about what works for a user.\n"
}
raw.fetch('posts').each do |post|
  slug = post.fetch('title').downcase.gsub(/[^a-z0-9]+/, '-').gsub(/\A-|-$|/, '')
  # Keep the source slug explicitly aligned with the public URL.
  slug = {
    'evaluating-an-agent-honestly' => slug,
    'an-agent-that-triages-its-own-feedback' => slug,
    'golden-datasets-without-the-gold-rush' => slug,
    'thompson-sampling-explained-with-coupons' => slug,
    'one-definition-of-conversion' => slug,
    'go-worker-pools-for-experiment-assignment' => slug,
    'the-exposure-triangle-but-for-learning-rates' => slug,
    'a-serving-sdk-data-scientists-actually-use' => slug,
    'fm-synthesis-and-explore-exploit' => slug
  }.fetch(slug)
  front = { 'layout' => 'post', 'title' => post.fetch('title'), 'date' => Date.parse(post.fetch('date')), 'tags' => post.fetch('tags'), 'summary' => post.fetch('excerpt') }
  File.write(File.join(root, '_posts', "#{post.fetch('date')}-#{slug}.md"), "---\n#{YAML.dump(front).sub(/\A---\n/, '')}---\n\n#{post_bodies.fetch(slug)}")
end

tags = raw.fetch('tags')
raw.fetch('notes').each do |note|
  front = { 'layout' => 'note', 'title' => note.fetch('title'), 'tag' => note.fetch('tag'), 'links' => note.fetch('links') }
  front['permalink'] = '/notes/' if note.fetch('id') == 'index'
  front['title'] = "#{front['title']} — #{tags.fetch(front['tag'], front['tag'])}" if note.fetch('id') == 'index'
  body = note.fetch('body')
  File.write(File.join(root, '_notes', "#{note.fetch('id')}.md"), "---\n#{YAML.dump(front).sub(/\A---\n/, '')}---\n\n#{body}\n")
end

puts "Migrated #{raw['experience'].size} roles, #{raw['posts'].size} posts, and #{raw['notes'].size} notes."
