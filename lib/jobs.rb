module Jobs

  def self.queued
    Sidekiq::Stats.new.enqueued
  end

  def self.last_job_performed_at
    Sidekiq.redis do |r|
      int = r.get('last_job_perform_at')
      int ? Time.at(int.to_i) : nil
    end
  end

  def self.num_email_retry_jobs
    Sidekiq::RetrySet.new.select { |job| job.klass =~ /Email$/ }.size
  end

  class Base
    require 'jobs/user_email'

    include Sidekiq::Worker

    def self.delayed_perform(opts={})
      self.new.perform(opts)
    end

    def self.mutex
      @mutex ||= Mutex.new
    end

    def execute(opts={})
      raise "Overwrite me!"
    end

    def perform(opts={})
      opts = opts.with_indifferent_access

      if SiteSetting.queue_jobs?
        Sidekiq.redis do |r|
          r.set('last_job_perform_at', Time.now.to_i)
        end
      end

      if opts.delete(:sync_exec)
        if opts.has_key?(:current_site_id) && opts[:current_site_id] != RailsMultisite::ConnectionManagement.current_db
          raise ArgumentError.new("You can't connect to another database when executing a job synchronously.")
        else
          return execute(opts)
        end
      end


      dbs =
        if opts[:current_site_id]
          [opts[:current_site_id]]
        else
          RailsMultisite::ConnectionManagement.all_dbs
        end

      dbs.each do |db|
        begin
          Jobs::Base.mutex.synchronize do
            RailsMultisite::ConnectionManagement.establish_connection(db: db)
            I18n.locale = SiteSetting.default_locale
            execute(opts)
          end
        ensure
          ActiveRecord::Base.connection_handler.clear_active_connections!
        end
      end
    end
  end

  def self.enqueue(job_name, opts={})

    klass_name = "Jobs::#{job_name.to_s.camelcase}"
    klass = klass_name.constantize

    # Unless we want to work on all sites
    unless opts.delete(:all_sites)
      opts[:current_site_id] ||= RailsMultisite::ConnectionManagement.current_db
    end

    # If we are able to queue a job, do it
    if SiteSetting.queue_jobs?
      if opts[:delay_for].present?
        klass.delay_for(opts.delete(:delay_for)).delayed_perform(opts)
      else
        Sidekiq::Client.enqueue(klass_name.constantize, opts)
      end
    else
      # Otherwise execute the job right away
      opts.delete(:delay_for)
      opts[:sync_exec] = true
      klass.new.perform(opts)
    end

  end

  def self.enqueue_in(secs, job_name, opts={})
    enqueue(job_name, opts.merge!(delay_for: secs))
  end


  def self.enqueue_at(datetime, job_name, opts={})
    enqueue_in( [(datetime - Time.zone.now).to_i, 0].max, job_name, opts )
  end

  # TODO: should take job_name like enqueue methods
  def self.cancel_scheduled_job(job_name, params={})
    job_class = "Jobs::#{job_name.to_s.camelcase}"
    matched = true
    Sidekiq::ScheduledSet.new.each do |scheduled_job|
      if scheduled_job.klass == 'Sidekiq::Extensions::DelayedClass'
        job_args = YAML.load(scheduled_job.args[0])
        if job_args[0] == job_class
          next unless job_args[2] and job_args[2][0]
          matched = true
          params.each do |key, value|
            unless job_args[2][0][key] == value
              matched = false
              break
            end
          end
          next unless matched
        end
        scheduled_job.delete
        break
      end
    end
    matched
  end
end
# Require all jobs
Dir["#{Rails.root}/lib/jobs/*"].each {|file| require_dependency file }
