Discourse::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # In the development environment your application's code is reloaded on
  # every request.  This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Log error messages when you accidentally call methods on nil.
  config.whiny_nils = true

  # Show full error reports and disable caching
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Print deprecation notices to the Rails logger
  config.active_support.deprecation = :log

  # Only use best-standards-support built into browsers
  config.action_dispatch.best_standards_support = :builtin

  # Do not compress assets
  config.assets.compress = false

  # Expands the lines which load the assets
  config.assets.debug = true

  config.watchable_dirs['lib'] = [:rb]

  config.sass.debug_info = false
  config.ember.variant = :development
  config.ember.handlebars_location = "#{Rails.root}/app/assets/javascripts/external/handlebars-1.0.rc.3.js"
  config.ember.ember_location = "#{Rails.root}/app/assets/javascripts/external/ember.js"
  config.handlebars.precompile = false

  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = { address: "localhost", port: 1025 }
  config.action_mailer.raise_delivery_errors = true
  
  
  # Use redis for our cache
  redis_config = YAML::load(File.open("#{Rails.root}/config/redis.yml"))[Rails.env]
  redis_store = ActiveSupport::Cache::RedisStore.new "redis://#{redis_config['host']}:#{redis_config['port']}/#{redis_config['cache_db']}"
  redis_store.options[:namespace] = -> { DiscourseRedis.namespace }
  config.cache_store = redis_store



  BetterErrors::Middleware.allow_ip! ENV['TRUSTED_IP'] if ENV['TRUSTED_IP']
end

