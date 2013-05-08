class AdminUserSerializer < BasicUserSerializer

  attributes :email,
             :active,
             :admin,
             :moderator,
             :last_seen_age,
             :days_visited,
             :last_emailed_age,
             :created_at_age,
             :username_lower,
             :trust_level,
             :flag_level,
             :username,
             :avatar_template,
             :topics_entered,
             :posts_read_count,
             :time_read,
             :can_approve,
             :approved,
             :banned_at,
             :banned_till,
             :is_banned,
             :ip_address,
             :can_send_activation_email,
             :can_activate,
             :can_deactivate

  def is_banned
    object.is_banned?
  end

  def can_impersonate
    scope.can_impersonate?(object)
  end

  def last_emailed_age
    return nil if object.last_emailed_at.blank?
    AgeWords.age_words(Time.now - object.last_emailed_at)
  end

  def last_seen_age
    return nil if object.last_seen_at.blank?
    AgeWords.age_words(Time.now - object.last_seen_at)
  end

  def time_read
    return nil if object.time_read.blank?
    AgeWords.age_words(object.time_read)
  end

  def created_at_age
    AgeWords.age_words(Time.now - object.created_at)
  end

  def can_approve
    scope.can_approve?(object)
  end

  def include_can_approve?
    SiteSetting.must_approve_users
  end

  def include_approved?
    SiteSetting.must_approve_users
  end

  def can_send_activation_email
    scope.can_send_activation_email?(object)
  end

  def can_activate
    scope.can_activate?(object)
  end

  def can_deactivate
    scope.can_deactivate?(object)
  end

end
