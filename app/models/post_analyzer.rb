class PostAnalyzer

  def initialize(raw, topic_id)
    @raw  = raw
    @topic_id = topic_id
  end

  # What we use to cook posts
  def cook(*args)
    cooked = PrettyText.cook(*args)

    # cook all oneboxes, in the past we used to defer this
    #  for some reason we decided to do this inline now
    # TODO: discuss on http://meta.discourse.org what the correct thing is to do
    #  keep in mind some oneboxes may take a long time to build
    result = Oneboxer.apply(cooked) do |url, elem|
      Oneboxer.invalidate(url) if args.last[:invalidate_oneboxes]
      begin
        Oneboxer.onebox url
      rescue => e
        Rails.logger.warn("Failed to cook onebox: #{e.message} #{e.backtrace}")
        nil
      end
    end

    cooked = result.to_html if result.changed?
    cooked
  end

  # How many images are present in the post
  def image_count
    return 0 unless @raw.present?

    cooked_document.search("img").reject do |t|
      dom_class = t["class"]
      if dom_class
        (Post.white_listed_image_classes & dom_class.split(" ")).count > 0
      end
    end.count
  end

  # How many attachments are present in the post
  def attachment_count
    return 0 unless @raw.present?

    attachments = cooked_document.css("a.attachment[href^=\"#{Discourse.store.absolute_base_url}\"]")
    attachments += cooked_document.css("a.attachment[href^=\"#{Discourse.store.relative_base_url}\"]") if Discourse.store.internal?
    attachments.count
  end

  def raw_mentions
    return [] if @raw.blank?
    return @raw_mentions if @raw_mentions.present?

    # strip quotes and code blocks
    cooked_stripped = cooked_document
    cooked_stripped.search("aside.quote").remove
    cooked_stripped.search("pre").remove
    cooked_stripped.search("code").remove

    results = cooked_stripped.to_html.scan(PrettyText.mention_matcher)
    @raw_mentions = results.uniq.map { |un| un.first.downcase.gsub!(/^@/, '') }
  end

  # Count how many hosts are linked in the post
  def linked_hosts
    return {} if raw_links.blank?
    return @linked_hosts if @linked_hosts.present?

    @linked_hosts = {}

    raw_links.each do |u|
      begin
        uri = URI.parse(u)
        host = uri.host
        @linked_hosts[host] ||= 1
      rescue URI::InvalidURIError
        # An invalid URI does not count as a raw link.
        next
      end
    end

    @linked_hosts
  end

  # Returns an array of all links in a post excluding mentions
  def raw_links
    return [] unless @raw.present?
    return @raw_links if @raw_links.present?

    # Don't include @mentions in the link count
    @raw_links = []

    cooked_document.search("a").each do |l|
      next if l.attributes['href'].nil? || link_is_a_mention?(l)
      url = l.attributes['href'].to_s
      @raw_links << url
    end

    @raw_links
  end

  # How many links are present in the post
  def link_count
    raw_links.size
  end

  private

  def cooked_document
    @cooked_document ||= Nokogiri::HTML.fragment(cook(@raw, topic_id: @topic_id))
  end

  def link_is_a_mention?(l)
    html_class = l.attributes['class']
    return false if html_class.nil?
    html_class.to_s == 'mention' && l.attributes['href'].to_s =~ /^\/users\//
  end
end
