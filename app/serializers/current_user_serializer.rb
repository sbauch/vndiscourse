class CurrentUserSerializer < BasicUserSerializer

  attributes :name,
             :unread_notifications,
             :unread_private_messages,
             :admin?,
             :notification_channel_position,
             :site_flagged_posts_count,
             :moderator?,
             :staff?,
             :reply_count,
             :topic_count,
             :enable_quoting,
             :external_links_in_new_tab,
             :dynamic_favicon,
             :trust_level,
             :can_edit,
             :team_hash,
             :use_uploaded_avatar,
             :has_uploaded_avatar,
             :uploaded_avatar_template,
             :can_invite_to_forum

  def include_site_flagged_posts_count?
    object.staff?
  end

  def topic_count
    object.topics.count
  end

  def reply_count
    object.user_stat.topic_reply_count
  end

  def site_flagged_posts_count
    PostAction.flagged_posts_count
  end
  
  def team_hash
    @return_array = []
    # hash = YAML.load(object.team_hash)
    object.team_hash.each do |k,v|
      @return_array << {:id => k, :name => v}
    end
    @return_array
  end  
  
  def can_edit
    true
  end

  def can_invite_to_forum
    true
  end

  def include_can_invite_to_forum?
    scope.can_invite_to_forum?
  end

end
