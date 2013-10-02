require 'v8'
require 'nokogiri'
require_dependency 'excerpt_parser'

module PrettyText

  def self.whitelist
    {
      elements: %w[
        a abbr aside b bdo blockquote br caption cite code col colgroup dd div del dfn dl
        dt em hr figcaption figure h1 h2 h3 h4 h5 h6 hgroup i iframe img ins kbd li mark
        ol p pre q rp rt ruby s samp small span strike strong sub sup table tbody td
        tfoot th thead time tr u ul var wbr
      ],

      attributes: {
        :all         => ['dir', 'lang', 'title', 'class'],
        'aside'      => ['data-post', 'data-full', 'data-topic'],
        'a'          => ['href'],
        'blockquote' => ['cite'],
        'col'        => ['span', 'width'],
        'colgroup'   => ['span', 'width'],
        'del'        => ['cite', 'datetime'],
        'img'        => ['align', 'alt', 'height', 'src', 'width'],
        'ins'        => ['cite', 'datetime'],
        'ol'         => ['start', 'reversed', 'type'],
        'q'          => ['cite'],
        'span'       => ['style'],
        'table'      => ['summary', 'width', 'style', 'cellpadding', 'cellspacing'],
        'td'         => ['abbr', 'axis', 'colspan', 'rowspan', 'width', 'style'],
        'th'         => ['abbr', 'axis', 'colspan', 'rowspan', 'scope', 'width', 'style'],
        'time'       => ['datetime', 'pubdate'],
        'ul'         => ['type']
      },

      protocols: {
        'a'          => {'href' => ['ftp', 'http', 'https', 'mailto', :relative]},
        'blockquote' => {'cite' => ['http', 'https', :relative]},
        'del'        => {'cite' => ['http', 'https', :relative]},
        'img'        => {'src'  => ['http', 'https', :relative]},
        'ins'        => {'cite' => ['http', 'https', :relative]},
        'q'          => {'cite' => ['http', 'https', :relative]}
      }
    }
  end


  class Helpers

    def t(key, opts)
      str = I18n.t("js." + key)
      if opts
        # TODO: server localisation has no parity with client
        # should be fixed
        opts.each do |k,v|
          str.gsub!("{{#{k}}}", v)
        end
      end
      str
    end

    # function here are available to v8
    def avatar_template(username)
      return "" unless username

      user = User.where(username_lower: username.downcase).first
      if user.present?
        user.avatar_template
      end
    end

    def is_username_valid(username)
      return false unless username
      username = username.downcase
      return User.exec_sql('select 1 from users where username_lower = ?', username).values.length == 1
    end
    
    def is_hashtag_valid(hashtag)
      return false unless hashtag
      return true
    end
    
  end

  @mutex = Mutex.new
  @ctx_init = Mutex.new

  def self.mention_matcher
    Regexp.new("(\@[a-zA-Z0-9_])")
  end

  def self.app_root
    Rails.root
  end

  def self.create_new_context
    ctx = V8::Context.new

    ctx["helpers"] = Helpers.new

    ctx_load(ctx,
             "app/assets/javascripts/external/md5.js",
              "app/assets/javascripts/external/lodash.js",
              "app/assets/javascripts/external/Markdown.Converter.js",
              "lib/headless-ember.js",
              "app/assets/javascripts/external/rsvp.js",
              Rails.configuration.ember.handlebars_location)

    ctx.eval("var Discourse = {}; Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
    ctx.eval("var window = {}; window.devicePixelRatio = 2;") # hack to make code think stuff is retina
    ctx.eval("var I18n = {}; I18n.t = function(a,b){ return helpers.t(a,b); }");

    ctx_load(ctx,
              "app/assets/javascripts/external/markdown.js",
              "app/assets/javascripts/discourse/dialects/dialect.js",
              "app/assets/javascripts/discourse/components/utilities.js",
              "app/assets/javascripts/discourse/components/markdown.js")

    Dir["#{Rails.root}/app/assets/javascripts/discourse/dialects/**.js"].each do |dialect|
      unless dialect =~ /\/dialect\.js$/
        ctx.load(dialect)
      end
    end

    # Load server side javascripts
    if DiscoursePluginRegistry.server_side_javascripts.present?
      DiscoursePluginRegistry.server_side_javascripts.each do |ssjs|
        ctx.load(ssjs)
      end
    end

    ctx['quoteTemplate'] = File.open(app_root + 'app/assets/javascripts/discourse/templates/quote.js.shbrs') {|f| f.read}
    ctx['quoteEmailTemplate'] = File.open(app_root + 'lib/assets/quote_email.js.shbrs') {|f| f.read}
    ctx.eval("HANDLEBARS_TEMPLATES = {
      'quote': Handlebars.compile(quoteTemplate),
      'quote_email': Handlebars.compile(quoteEmailTemplate),
     };")

    ctx
  end

  def self.v8

    return @ctx if @ctx

    # ensure we only init one of these
    @ctx_init.synchronize do
      return @ctx if @ctx
      @ctx = create_new_context
    end
    @ctx
  end

  def self.markdown(text, opts=nil)
    # we use the exact same markdown converter as the client
    # TODO: use the same extensions on both client and server (in particular the template for mentions)

    baked = nil

    @mutex.synchronize do
      context = v8
      # we need to do this to work in a multi site environment, many sites, many settings
# <<<<<<< HEAD
#       v8.eval("Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
#       v8.eval("Discourse.BaseUrl = 'http://#{RailsMultisite::ConnectionManagement.current_hostname}';")
#       v8.eval("Discourse.getURL = function(url) {return '#{Discourse::base_uri}' + url};")
#       v8['opts'] = opts || {}
#       v8['raw'] = text
#       v8.eval('opts["mentionLookup"] = function(u){return helpers.is_username_valid(u);}')
#       v8.eval('opts["hashtagLookup"] = function(u){return helpers.is_hashtag_valid(u);}')
#       v8.eval('opts["lookupAvatar"] = function(p){return Discourse.Utilities.avatarImg({username: p, size: "tiny", avatarTemplate: helpers.avatar_template(p)});}')
#       baked = v8.eval('Discourse.Markdown.markdownConverter(opts).makeHtml(raw)')
# =======
      context.eval("Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
      context.eval("Discourse.BaseUrl = 'http://#{RailsMultisite::ConnectionManagement.current_hostname}';")
      context.eval("Discourse.getURL = function(url) {return '#{Discourse::base_uri}' + url};")
      context['opts'] = opts || {}
      context['raw'] = text
      context.eval('opts["mentionLookup"] = function(u){return helpers.is_username_valid(u);}')
      context.eval('opts["lookupAvatar"] = function(p){return Discourse.Utilities.avatarImg({size: "tiny", avatarTemplate: helpers.avatar_template(p)});}')
      baked = context.eval('Discourse.Markdown.markdownConverter(opts).makeHtml(raw)')
# >>>>>>> 1004edad1a271e8601fe74c4af21c2a489c3b2f9
    end
    # we need some minimal server side stuff, apply CDN and TODO filter disallowed markup
    baked = apply_cdn(baked, Rails.configuration.action_controller.asset_host)
    baked
  end

  # leaving this here, cause it invokes v8, don't want to implement twice
  def self.avatar_img(avatar_template, size)
    r = nil
    @mutex.synchronize do
      v8['avatarTemplate'] = avatar_template
      v8['size'] = size
      v8.eval("Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
      v8.eval("Discourse.CDN = '#{Rails.configuration.action_controller.asset_host}';")
      v8.eval("Discourse.BaseUrl = '#{RailsMultisite::ConnectionManagement.current_hostname}';")
      r = v8.eval("Discourse.Utilities.avatarImg({ avatarTemplate: avatarTemplate, size: size });")
    end
    r
  end

  def self.apply_cdn(html, url)
    return html unless url

    image = /\.(jpg|jpeg|gif|png|tiff|tif|bmp)$/
    relative = /^\/[^\/]/

    doc = Nokogiri::HTML.fragment(html)

    doc.css("a").each do |l|
      href = l["href"].to_s
      l["href"] = url + href if href =~ relative && href =~ image
    end

    doc.css("img").each do |l|
      src = l["src"].to_s
      l["src"] = url + src if src =~ relative
    end

    doc.to_s
  end

  def self.cook(text, opts={})
    cloned = opts.dup
    # we have a minor inconsistency
    cloned[:topicId] = opts[:topic_id]
    sanitized = Sanitize.clean(markdown(text.dup, cloned), PrettyText.whitelist)
    if SiteSetting.add_rel_nofollow_to_user_content
      sanitized = add_rel_nofollow_to_user_content(sanitized)
    end
    sanitized
  end

  def self.add_rel_nofollow_to_user_content(html)
    whitelist = []

    l = SiteSetting.exclude_rel_nofollow_domains
    if l.present?
      whitelist = l.split(",")
    end

    site_uri = nil
    doc = Nokogiri::HTML.fragment(html)
    doc.css("a").each do |l|
      href = l["href"].to_s
      begin
        uri = URI(href)
        site_uri ||= URI(Discourse.base_url)

        if  !uri.host.present? ||
            uri.host.ends_with?(site_uri.host) ||
            whitelist.any?{|u| uri.host.ends_with?(u)}
          # we are good no need for nofollow
        else
          l["rel"] = "nofollow"
        end
      rescue URI::InvalidURIError
        # add a nofollow anyway
        l["rel"] = "nofollow"
      end
    end
    doc.to_html
  end

  def self.extract_links(html)
    links = []
    doc = Nokogiri::HTML.fragment(html)
    # remove href inside quotes
    doc.css("aside.quote a").each { |l| l["href"] = "" }
    # extract all links from the post
    doc.css("a").each { |l| links << l["href"] unless l["href"].blank? }
    # extract links to quotes
    doc.css("aside.quote").each do |a|
      topic_id = a['data-topic']

      url = "/t/topic/#{topic_id}"
      if post_number = a['data-post']
        url << "/#{post_number}"
      end

      links << url
    end

    links
  end


  def self.excerpt(html, max_length, options={})
    ExcerptParser.get_excerpt(html, max_length, options)
  end

  def self.strip_links(string)
    return string if string.blank?

    # If the user is not basic, strip links from their bio
    fragment = Nokogiri::HTML.fragment(string)
    fragment.css('a').each {|a| a.replace(a.text) }
    fragment.to_html
  end

  protected

  def self.ctx_load(ctx, *files)
    files.each do |file|
      ctx.load(app_root + file)
    end
  end

end
