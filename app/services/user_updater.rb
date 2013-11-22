class UserUpdater
  def initialize(user)
    @user = user
    @guardian = Guardian.new(user)
  end

  def update(attributes = {})
    user.website = format_url(attributes[:website]) || user.website

    user.bio_raw = attributes[:bio_raw] || user.bio_raw
    user.name = attributes[:name] || user.name
    user.digest_after_days = attributes[:digest_after_days] || user.digest_after_days

    if attributes[:auto_track_topics_after_msecs]
      user.auto_track_topics_after_msecs = attributes[:auto_track_topics_after_msecs].to_i 
    end

    if attributes[:new_topic_duration_minutes]
      user.new_topic_duration_minutes = attributes[:new_topic_duration_minutes].to_i
    end

    if guardian.can_grant_title?(user)
      user.title = attributes[:title] || user.title
    end

    [
      :email_digests,
      :email_always,
      :email_direct,
      :email_private_messages,
      :external_links_in_new_tab,
      :enable_quoting,
      :dynamic_favicon
    ].each do |attribute|
      if attributes[attribute].present?
        user.send("#{attribute.to_s}=", attributes[attribute] == 'true')
      end
    end

    user.save
  end

  private

  attr_reader :user, :guardian

  def format_url(website)
    if website =~ /^http/
      website
    else
      "http://#{website}"
    end
  end
end
