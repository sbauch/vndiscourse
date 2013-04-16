# If Mini Profiler is included via gem
if Rails.configuration.respond_to?(:enable_mini_profiler) && Rails.configuration.enable_mini_profiler
  require 'rack-mini-profiler'
  # initialization is skipped so trigger it
  Rack::MiniProfilerRails.initialize!(Rails.application)
end

if defined?(Rack::MiniProfiler)

  # note, we may want to add some extra security here that disables mini profiler in a multi hosted env unless user global admin
  #   raw_connection means results are not namespaced
  #
  # namespacing gets complex, cause mini profiler is in the rack chain way before multisite
  Rack::MiniProfiler.config.storage_instance = Rack::MiniProfiler::RedisStore.new(connection:  DiscourseRedis.raw_connection)

  # For our app, let's just show mini profiler always, polling is chatty so nuke that
  Rack::MiniProfiler.config.pre_authorize_cb = lambda do |env|
    (env['HTTP_USER_AGENT'] !~ /iPad|iPhone|Nexus 7/) &&
    (env['PATH_INFO'] !~ /^\/message-bus/) &&
    (env['PATH_INFO'] !~ /topics\/timings/) &&
    (env['PATH_INFO'] !~ /assets/) &&
    (env['PATH_INFO'] !~ /jasmine/) &&
    (env['PATH_INFO'] !~ /users\/.*\/avatar/) &&
    (env['PATH_INFO'] !~ /srv\/status/) &&
    (env['PATH_INFO'] !~ /commits-widget/)
  end

  # without a user provider our results will use the ip address for namespacing
  #  with a load balancer in front this becomes really bad as some results can
  #  be stored associated with ip1 as the user and retrieved using ip2 causing 404s 
  Rack::MiniProfiler.config.user_provider = lambda do |env|
    request = Rack::Request.new(env)
    id = request.cookies["_t"] || request.ip || "unknown"
    id = id.to_s
    # some security, lets not have these tokens floating about
    Digest::MD5.hexdigest(id)
  end

  Rack::MiniProfiler.config.position = 'left'
  Rack::MiniProfiler.config.backtrace_ignores ||= []
  Rack::MiniProfiler.config.backtrace_ignores << /lib\/rack\/message_bus.rb/
  Rack::MiniProfiler.config.backtrace_ignores << /config\/initializers\/silence_logger/
  Rack::MiniProfiler.config.backtrace_ignores << /config\/initializers\/quiet_logger/

  # require "#{Rails.root}/vendor/backports/notification"

  # inst = Class.new
  # class << inst
  #   def start(name,id,payload)
  #     if Rack::MiniProfiler.current && name !~ /(process_action.action_controller)|(render_template.action_view)/
  #       @prf ||= {}
  #       @prf[id] ||= []
  #       @prf[id] << Rack::MiniProfiler.start_step("#{payload[:serializer] if name =~ /serialize.serializer/} #{name}")
  #     end
  #   end

  #   def finish(name,id,payload)
  #     if Rack::MiniProfiler.current && name !~ /(process_action.action_controller)|(render_template.action_view)/
  #       t = @prf[id].pop
  #       @prf.delete id unless t
  #       Rack::MiniProfiler.finish_step t
  #     end
  #   end
  # end
  # disabling for now cause this slows stuff down too much
  # ActiveSupport::Notifications.subscribe(/.*/, inst)

  # Rack::MiniProfiler.profile_method ActionView::PathResolver, 'find_templates'
end
