sidekiq_redis = { url: $redis.url, namespace: 'sidekiq' }

Sidekiq.configure_server do |config|
  config.redis = sidekiq_redis
  Sidetiq::Clock.start!
end

Sidekiq.configure_client { |config| config.redis = sidekiq_redis }

Sidekiq.logger.level = Logger::WARN
