require File.expand_path('../boot', __FILE__)
require 'rails/all'
require 'redis-store' # HACK

# Plugin related stuff
require_relative '../lib/discourse_plugin_registry'

# Global config
require_relative '../app/models/global_setting'

if defined?(Bundler)
  # If you precompile assets before deploying to production, use this line
  Bundler.require(*Rails.groups(assets: %w(development test profile)))
  # If you want your assets lazily compiled in production, use this line
  # Bundler.require(:default, :assets, Rails.env)
end

module Discourse
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # HACK!! regression in rubygems / bundler in ruby-head
    if RUBY_VERSION == "2.1.0"
      $:.map! do |path|
        path = File.expand_path(path.sub("../../","../")) if path =~ /fast_xor/ && !File.directory?(File.expand_path(path))
        path
      end
    end

    require 'discourse'
    require 'js_locale_helper'

    # mocha hates us, active_support/testing/mochaing.rb line 2 is requiring the wrong
    #  require, patched in source, on upgrade remove this
    if Rails.env.test? || Rails.env.development?
      require "mocha/version"
      require "mocha/deprecation"
      if Mocha::VERSION == "0.13.3" && Rails::VERSION::STRING == "3.2.12"
        Mocha::Deprecation.mode = :disabled
      end
    end

    # Custom directories with classes and modules you want to be autoloadable.
    config.autoload_paths += Dir["#{config.root}/lib/services"]
    config.autoload_paths += Dir["#{config.root}/app/serializers"]
    config.autoload_paths += Dir["#{config.root}/lib/validators/"]
    config.autoload_paths += Dir["#{config.root}/app"]

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    config.assets.paths += %W(#{config.root}/config/locales)

    # explicitly precompile any images in plugins ( /assets/images ) path
    config.assets.precompile += [lambda do |filename, path|
      path =~ /assets\/images/ && !%w(.js .css).include?(File.extname(filename))
    end]

    config.assets.precompile += ['vendor.js', 'common.css', 'desktop.css', 'mobile.css', 'admin.js', 'admin.css', 'shiny/shiny.css', 'preload_store.js', 'browser-update.js', 'embed.css']

    # Precompile all defer
    Dir.glob("#{config.root}/app/assets/javascripts/defer/*.js").each do |file|
      config.assets.precompile << "defer/#{File.basename(file)}"
    end

    # Precompile all available locales
    Dir.glob("#{config.root}/app/assets/javascripts/locales/*.js.erb").each do |file|
      config.assets.precompile << "locales/#{file.match(/([a-z_A-Z]+\.js)\.erb$/)[1]}"
    end

    # Activate observers that should always be running.
    config.active_record.observers = [
        :user_email_observer,
        :user_action_observer,
        :post_alert_observer,
        :search_observer
    ]

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    config.time_zone = 'Eastern Time (US & Canada)'

    # auto-load server locale in plugins
    config.i18n.load_path += Dir["#{Rails.root}/plugins/*/config/locales/server.*.yml"]

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = 'utf-8'

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]

    # Enable the asset pipeline
    config.assets.enabled = true

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.2.4'

    # We need to be able to spin threads
    config.active_record.thread_safe!

    # see: http://stackoverflow.com/questions/11894180/how-does-one-correctly-add-custom-sql-dml-in-migrations/11894420#11894420
    config.active_record.schema_format = :sql

    # per https://www.owasp.org/index.php/Password_Storage_Cheat_Sheet
    config.pbkdf2_iterations = 64000
    config.pbkdf2_algorithm = "sha256"

    # dumping rack lock cause the message bus does not work with it (throw :async, it catches Exception)
    # see: https://github.com/sporkrb/spork/issues/66
    # rake assets:precompile also fails
    config.threadsafe! unless rails4? || $PROGRAM_NAME =~ /spork|rake/

    # rack lock is nothing but trouble, get rid of it
    # for some reason still seeing it in Rails 4
    config.middleware.delete Rack::Lock

    # route all exceptions via our router
    config.exceptions_app = self.routes

    # Our templates shouldn't start with 'discourse/templates'
    config.handlebars.templates_root = 'discourse/templates'

    require 'discourse_redis'
    # Use redis for our cache
    rails_root = File.expand_path('../..', __FILE__)
    redis_config = YAML::load(File.open("#{rails_root}/config/redis.yml"))[Rails.env]
    if Rails.env == "production"
			redis_store = ActiveSupport::Cache::RedisStore.new "redis://redistogo:#{redis_config["password"]}@#{redis_config["host"]}:#{redis_config["port"]}"
		else
			redis_store = ActiveSupport::Cache::RedisStore.new "redis://#{redis_config["host"]}:#{redis_config["port"]}/#{redis_config["cache_db"]}"
		end

    redis_store.options[:namespace] = -> { DiscourseRedis.namespace }
    config.cache_store = redis_store
    
    # config.cache_store = DiscourseRedis.new_redis_store CORE- Mine above for heroku

    # we configure rack cache on demand in an initializer
    # our setup does not use rack cache and instead defers to nginx
    config.action_dispatch.rack_cache =  nil

    # ember stuff only used for asset precompliation, production variant plays up
    config.ember.variant = :development
    config.ember.ember_location = "#{Rails.root}/vendor/assets/javascripts/production/ember.js"
    config.ember.handlebars_location = "#{Rails.root}/vendor/assets/javascripts/handlebars.js"

    # Since we are using strong_parameters, we can disable and remove attr_accessible.
    config.active_record.whitelist_attributes = false unless rails4?

    require 'auth'
    Discourse.activate_plugins! unless Rails.env.test?

    config.after_initialize do
      # So open id logs somewhere sane
      OpenID::Util.logger = Rails.logger
      if plugins = Discourse.plugins
        plugins.each{|plugin| plugin.notify_after_initialize}
      end
    end

    # This is not really required per-se, but we do not want to support
    # XML params, we see errors in our logs about malformed XML and there
    # absolutly no spot in our app were we use XML as opposed to JSON endpoints
    #
    # Rails 4 no longer includes this by default
    ActionDispatch::ParamsParser::DEFAULT_PARSERS.delete(Mime::XML) unless rails4?

    if ENV['RBTRACE'] == "1"
      require 'rbtrace'
    end

  end
end
