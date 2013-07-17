require 'terminal-notifier-guard' if RUBY_PLATFORM.include?('darwin')

phantom_path = File.expand_path('~/phantomjs/bin/phantomjs')
phantom_path = nil unless File.exists?(phantom_path)

unless ENV["USING_AUTOSPEC"]

  puts "Sam strongly recommends you Run: `bundle exec rake autospec` in favor of guard for specs, set USING_AUTOSPEC in .rvmrc to disable from Guard"
  guard :spork, wait: 120 do
    watch('config/application.rb')
    watch('config/environment.rb')
    watch(%r{^config/environments/.*\.rb$})
    watch(%r{^config/initializers/.*\.rb$})
    watch('Gemfile')
    watch('Gemfile.lock')
    watch('spec/spec_helper.rb') { :rspec }
  end

  guard 'rspec', :focus_on_failed => true, :cli => "--drb" do
    watch(%r{^spec/.+_spec\.rb$})
    watch(%r{^lib/(.+)\.rb$})     { |m| "spec/components/#{m[1]}_spec.rb" }
    watch('spec/spec_helper.rb')  { "spec" }

    # Rails example
    watch(%r{^app/(.+)\.rb$})                           { |m| "spec/#{m[1]}_spec.rb" }
    watch(%r{^app/(.*)(\.erb|\.haml)$})                 { |m| "spec/#{m[1]}#{m[2]}_spec.rb" }
    watch(%r{^app/controllers/(.+)_(controller)\.rb$})  { |m| "spec/#{m[2]}s/#{m[1]}_#{m[2]}_spec.rb" }
    watch(%r{^spec/support/(.+)\.rb$})                  { "spec" }
    watch('app/controllers/application_controller.rb')  { "spec/controllers" }

    # Capybara request specs
    watch(%r{^app/views/(.+)/.*\.(erb|haml)$})          { |m| "spec/requests/#{m[1]}_spec.rb" }
  end
end


module ::Guard
  class AutoReload < ::Guard::Guard

    require File.dirname(__FILE__) + '/config/environment'

    def self.message_bus
      MessageBus::Instance.new.tap do |bus|
        bus.site_id_lookup do
          # this is going to be dev the majority of the time, if you have multisite configured in dev stuff may be different
          "default"
        end
      end
    end

    def run_on_change(paths)
      paths.map! do |p|
        hash = nil
        fullpath = Rails.root.to_s + "/" + p
        hash = Digest::MD5.hexdigest(File.read(fullpath)) if File.exists? fullpath
        p = p.sub /\.sass\.erb/, ""
        p = p.sub /\.sass/, ""
        p = p.sub /\.scss/, ""
        p = p.sub /^app\/assets\/stylesheets/, "assets"
        {name: p, hash: hash}
      end
      self.class.message_bus.publish "/file-change", paths
    end

    def run_all
    end
  end
end

Thread.new do
  Listen.to('tmp/') do |modified,added,removed|
    modified.each do |m|
      Guard::AutoReload.message_bus.publish "/file-change", ["refresh"] if m =~ /refresh_browser/
    end
  end
end

guard :autoreload do
  watch(/tmp\/refresh_browser/)
  watch(/\.css$/)
  watch(/\.sass$/)
  watch(/\.scss$/)
  watch(/\.sass\.erb$/)
  watch(/\.handlebars$/)
end
