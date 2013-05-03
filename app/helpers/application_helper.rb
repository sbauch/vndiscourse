require 'current_user'
require 'canonical_url'
require_dependency 'guardian'
require_dependency 'unread'
require_dependency 'age_words'
require_dependency 'configurable_urls'

module ApplicationHelper
  include CurrentUser
  include CanonicalURL::Helpers
  include ConfigurableUrls

  def discourse_csrf_tags
    # anon can not have a CSRF token cause these are all pages
    # that may be cached, causing a mismatch between session CSRF 
    # and CSRF on page and horrible impossible to debug login issues
    if current_user
      csrf_meta_tags
    end
  end

  def with_format(format, &block)
    old_formats = formats
    self.formats = [format]
    block.call
    self.formats = old_formats
    nil
  end

  def age_words(secs)
    AgeWords.age_words(secs)
  end

  def guardian
    @guardian ||= Guardian.new(current_user)
  end

  def mini_profiler_enabled?
    defined?(Rack::MiniProfiler) && admin?
  end

  def admin?
    current_user.try(:admin?)
  end

  def moderator?
    current_user.try(:moderator?)
  end

  def staff?
    current_user.try(:staff?)
  end

  # Creates open graph and twitter card meta data
  def crawlable_meta_data(opts=nil)

    opts ||= {}
    opts[:image] ||= "#{Discourse.base_url}#{SiteSetting.logo_small_url}"
    opts[:url] ||= "#{Discourse.base_url}#{request.fullpath}"

    # Add opengraph tags
    result =  tag(:meta, property: 'og:site_name', content: SiteSetting.title) << "\n"

    result << tag(:meta, name: 'twitter:card', content: "summary")
    [:image, :url, :title, :description, 'image:width', 'image:height'].each do |property|
      if opts[property].present?
        escape = (property != :image)
        result << tag(:meta, {property: "og:#{property}", content: opts[property]}, nil, escape) << "\n"
        result << tag(:meta, {name: "twitter:#{property}", content: opts[property]}, nil, escape) << "\n"
      end
    end

    result
  end

  def markdown_content(key, replacements=nil)
    PrettyText.cook(SiteContent.content_for(key, replacements || {})).html_safe
  end

  def faq_path
    return "#{Discourse::base_uri}/faq"
  end

  def login_path
    return "#{Discourse::base_uri}/login"
  end
end
