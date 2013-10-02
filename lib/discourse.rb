require 'cache'

module Discourse

  # Expected less matches than what we got in a find
  class TooManyMatches < Exception; end

  # When they try to do something they should be logged in for
  class NotLoggedIn < Exception; end

  # When the input is somehow bad
  class InvalidParameters < Exception; end

  # When they don't have permission to do something
  class InvalidAccess < Exception; end

  # When something they want is not found
  class NotFound < Exception; end

  # When a setting is missing
  class SiteSettingMissing < Exception; end

  # Cross site request forgery
  class CSRF < Exception; end

  def self.activate_plugins!
    @plugins = Plugin.find_all("#{Rails.root}/plugins")
    @plugins.each do |plugin|
      plugin.activate!
    end
  end

  def self.plugins
    @plugins
  end

  def self.auth_providers
    providers = []
    if plugins
      plugins.each do |p|
        next unless p.auth_providers
        p.auth_providers.each do |prov|
          providers << prov
        end
      end
    end
    providers
  end

  def self.cache
    @cache ||= Cache.new
  end

  # Get the current base URL for the current site
  def self.current_hostname
    if SiteSetting.force_hostname.present?
      SiteSetting.force_hostname
    else
      RailsMultisite::ConnectionManagement.current_hostname
    end
  end

  def self.base_uri default_value=""
    if !ActionController::Base.config.relative_url_root.blank?
      return ActionController::Base.config.relative_url_root
    else
      return default_value
    end
  end

  def self.base_url_no_prefix
    default_port = 80
    protocol = "http"

    if SiteSetting.use_ssl?
      protocol = "https"
      default_port = 443
    end

    result = "#{protocol}://#{current_hostname}"

    port = SiteSetting.port.present? && SiteSetting.port.to_i > 0 ? SiteSetting.port.to_i : default_port

    result << ":#{SiteSetting.port}" if port != default_port
    result
  end

  def self.base_url
    return base_url_no_prefix + base_uri
  end

  def self.enable_maintenance_mode
    $redis.set maintenance_mode_key, 1
    true
  end

  def self.disable_maintenance_mode
    $redis.del maintenance_mode_key
    true
  end

  def self.maintenance_mode?
    !!$redis.get( maintenance_mode_key )
  end

  def self.git_version
    return $git_version if $git_version

    # load the version stamped by the "build:stamp" task
    f = Rails.root.to_s + "/config/version"
    require f if File.exists?("#{f}.rb")

    begin
      $git_version ||= `git rev-parse HEAD`.strip
    rescue
      $git_version = "unknown"
    end
  end

  # Either returns the system_username user or the first admin.
  def self.system_user
    user = User.where(username_lower: SiteSetting.system_username).first if SiteSetting.system_username.present?
    user = User.admins.order(:id).first if user.blank?
    user
  end

  def self.store
    if SiteSetting.enable_s3_uploads?
      @s3_store_loaded ||= require 'file_store/s3_store'
      S3Store.new
    else
      @local_store_loaded ||= require 'file_store/local_store'
      LocalStore.new
    end
  end

private

  def self.maintenance_mode_key
    'maintenance_mode'
  end
end
