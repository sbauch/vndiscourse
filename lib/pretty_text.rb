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
    # function here are available to v8
    def avatar_template(username)
      return "" unless username

      user = User.where(username_lower: username.downcase).first
      if user
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

  def self.mention_matcher
    Regexp.new("(\@[a-zA-Z0-9_])")
  end

  def self.app_root
    Rails.root
  end

  def self.v8
    return @ctx unless @ctx.nil?

    @ctx = V8::Context.new

    @ctx["helpers"] = Helpers.new

    ctx_load( "app/assets/javascripts/external/md5.js",
              "app/assets/javascripts/external/lodash.js",
              "app/assets/javascripts/external/Markdown.Converter.js",
              "app/assets/javascripts/external/twitter-text-1.5.0.js",
              "lib/headless-ember.js",
              "app/assets/javascripts/external/rsvp.js",
              Rails.configuration.ember.handlebars_location)

    @ctx.eval("var Discourse = {}; Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
    @ctx.eval("var window = {}; window.devicePixelRatio = 2;") # hack to make code think stuff is retina

    ctx_load( "app/assets/javascripts/discourse/components/bbcode.js",
              "app/assets/javascripts/discourse/components/utilities.js",
              "app/assets/javascripts/discourse/components/markdown.js")

    # Load server side javascripts
    if DiscoursePluginRegistry.server_side_javascripts.present?
      DiscoursePluginRegistry.server_side_javascripts.each do |ssjs|
        @ctx.load(ssjs)
      end
    end

    @ctx['quoteTemplate'] = File.open(app_root + 'app/assets/javascripts/discourse/templates/quote.js.shbrs') {|f| f.read}
    @ctx['quoteEmailTemplate'] = File.open(app_root + 'lib/assets/quote_email.js.shbrs') {|f| f.read}
    @ctx.eval("HANDLEBARS_TEMPLATES = {
      'quote': Handlebars.compile(quoteTemplate),
      'quote_email': Handlebars.compile(quoteEmailTemplate),
     };")
    @ctx
  end

  def self.markdown(text, opts=nil)
    # we use the exact same markdown converter as the client
    # TODO: use the same extensions on both client and server (in particular the template for mentions)

    baked = nil

    @mutex.synchronize do
      # we need to do this to work in a multi site environment, many sites, many settings
      v8.eval("Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
      v8.eval("Discourse.BaseUrl = 'http://#{RailsMultisite::ConnectionManagement.current_hostname}';")
      v8.eval("Discourse.getURL = function(url) {return '#{Discourse::base_uri}' + url};")
      v8['opts'] = opts || {}
      v8['raw'] = text
      v8.eval('opts["mentionLookup"] = function(u){return helpers.is_username_valid(u);}')
      v8.eval('opts["hashtagLookup"] = function(u){return helpers.is_hashtag_valid(u);}')
      v8.eval('opts["lookupAvatar"] = function(p){return Discourse.Utilities.avatarImg({username: p, size: "tiny", avatarTemplate: helpers.avatar_template(p)});}')
      baked = v8.eval('Discourse.Markdown.markdownConverter(opts).makeHtml(raw)')
    end
    # we need some minimal server side stuff, apply CDN and TODO filter disallowed markup
    baked = apply_cdn(baked, Rails.configuration.action_controller.asset_host)
    baked
  end

  # leaving this here, cause it invokes v8, don't want to implement twice
  def self.avatar_img(username, size)
    r = nil
    @mutex.synchronize do
      v8['username'] = username
      v8['size'] = size
      v8.eval("Discourse.SiteSettings = #{SiteSetting.client_settings_json};")
      v8.eval("Discourse.CDN = '#{Rails.configuration.action_controller.asset_host}';")
      v8.eval("Discourse.BaseUrl = '#{RailsMultisite::ConnectionManagement.current_hostname}';")
      r = v8.eval("Discourse.Utilities.avatarImg({ username: username, size: size });")
    end
    r
  end

  def self.apply_cdn(html, url)
    return html unless url

    image = /\.(jpg|jpeg|gif|png|tiff|tif|bmp)$/

    doc = Nokogiri::HTML.fragment(html)

    doc.css("a").each do |l|
      href = l["href"].to_s
      l["href"] = url + href if href[0] == '/' && href =~ image
    end

    doc.css("img").each do |l|
      src = l["src"].to_s
      l["src"] = url + src if src[0] == '/'
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
    doc.css("a").each { |l| links << l["href"] unless l["href"].empty? }
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

  def self.ctx_load(*files)
    files.each do |file|
      @ctx.load(app_root + file)
    end
  end

end
