#!/usr/bin/env ruby
# Static checks for the editable content model; uses only Ruby's standard library.
require 'yaml'
require 'date'

ROOT = File.expand_path('..', __dir__)
DATA = File.join(ROOT, '_data')
errors = []

def fail_with(errors, message)
  errors << message
end

required_data = %w[profile stats education experience skills projects publications contact lanes workflow]
required_data.each do |name|
  path = File.join(DATA, "#{name}.yml")
  fail_with(errors, "missing _data/#{name}.yml") unless File.file?(path)
end

required_runtime_files = %w[
  _includes/notes/workspace.html
  assets/css/notes.css
  assets/js/notes.js
  assets/js/fm-graph.js
  notes-graph.json
]
required_runtime_files.each do |relative_path|
  fail_with(errors, "missing runtime file #{relative_path}") unless File.file?(File.join(ROOT, relative_path))
end

if errors.empty?
  content = {}
  required_data.each do |name|
    begin
      content[name] = YAML.load_file(File.join(DATA, "#{name}.yml"))
    rescue StandardError => e
      fail_with(errors, "invalid _data/#{name}.yml: #{e.message}")
    end
  end

  if errors.empty?
    profile = content['profile']
    %w[name role location headline bio now off_hours].each do |key|
      fail_with(errors, "profile is missing #{key}") if profile[key].to_s.empty?
    end
    %w[stats education experience skills projects publications contact lanes].each do |key|
      fail_with(errors, "#{key} must be a non-empty list") unless content[key].is_a?(Array) && !content[key].empty?
    end

    workflow = content['workflow']
    nodes = workflow && workflow['nodes']
    fail_with(errors, 'workflow.nodes must be a list') unless nodes.is_a?(Array)
    if nodes.is_a?(Array)
      expanded = nodes.flat_map do |node|
        if node['expand'] == 'skills'
          content['skills'].map { |skill| { 'id' => "tool-#{skill['key']}", 'source' => "skills:#{skill['key']}" } }
        else
          [node]
        end
      end
      ids = expanded.map { |node| node['id'] }.compact
      fail_with(errors, 'workflow node ids must be unique') unless ids.uniq == ids
      expanded.each do |node|
        fail_with(errors, "workflow node #{node['id']} needs a source") if node['source'].to_s.empty?
        if node['source'] == 'custom'
          fail_with(errors, "custom node #{node['id']} needs rows and output") unless node['rows'].is_a?(Array) && node['output'].is_a?(Hash)
        end
      end
    end

    note_files = Dir.glob(File.join(ROOT, '_notes', '*.md'))
    post_files = Dir.glob(File.join(ROOT, '_posts', '*.md'))
    fail_with(errors, 'expected the start-here note in _notes/index.md') unless note_files.include?(File.join(ROOT, '_notes', 'index.md'))
    fail_with(errors, 'expected dated posts in _posts/') if post_files.empty?

    note_ids = note_files.map { |path| File.basename(path, '.md') }
    note_files.each do |path|
      raw = File.read(path)
      match = raw.match(/\A---\s*\n(.*?)\n---\s*\n/m)
      unless match
        fail_with(errors, "#{path.sub(ROOT + '/', '')} has no front matter")
        next
      end
      begin
        front = YAML.safe_load(match[1], permitted_classes: [Date, Time], aliases: true) || {}
        fail_with(errors, "#{File.basename(path)} must not define id in front matter") if front.key?('id')
        fail_with(errors, "#{File.basename(path)} needs title and tag") if front['title'].to_s.empty? || front['tag'].to_s.empty?
        (front['links'] || []).each do |target|
          fail_with(errors, "#{File.basename(path)} links to missing note #{target}") unless note_ids.include?(target.to_s)
        end
      rescue StandardError => e
        fail_with(errors, "invalid note front matter in #{File.basename(path)}: #{e.message}")
      end
    end

    shipped = (Dir.glob(File.join(ROOT, '_data', '*')) + note_files + post_files).select { |p| File.file?(p) }.map { |p| File.read(p) }.join("\n")
    forbidden = [
      ['a country list attached to the assistant markets', /\b(?:across|in)\s+(?:the\s+)?(?:seven|7)\s+markets?\s*[:—-]\s*[A-Z]/i],
      ['unsupported coupon uplift', /\b7%\s+(?:conversion|uplift)/i],
      ['unqualified golden-dataset metrics', /golden[- ]dataset.{0,60}\b(?:\d+|\d+%|\d+\s*(?:seconds?|minutes?))\b/i]
    ]
    forbidden.each { |label, pattern| fail_with(errors, "public content includes #{label}") if shipped.match?(pattern) }
  end
end

if errors.empty?
  puts 'Content validation passed.'
  exit 0
end

warn errors.map { |error| "ERROR: #{error}" }.join("\n")
exit 1
