class UserSerializer < BasicUserSerializer

  attributes :name,
             :email,
             :last_posted_at,
             :last_seen_at,
             :bio_raw,
             :bio_cooked,
             :created_at,
             :website,
             :can_edit,
             :stats,
             :can_send_private_message_to_user,
             :bio_excerpt,
             :trust_level,
             :fact_one,
             :fact_two,
             :fact_three,
             :teams,
             :position,
             :events_attended,
             :moderator,
             :admin

  has_one :invited_by, embed: :object, serializer: BasicUserSerializer

  def self.private_attributes(*attrs)
    attributes *attrs
    attrs.each do |attr|
      define_method "include_#{attr}?" do
        can_edit
      end
    end
  end

  def bio_excerpt
    # If they have a bio return it
    excerpt = object.bio_excerpt
    return excerpt if excerpt.present?

    # Without a bio, determine what message to show
    if scope.user && scope.user.id == object.id
      I18n.t('user_profile.no_info_me', username_lower: object.username_lower)
    else
      I18n.t('user_profile.no_info_other', name: object.name)
    end
  end


  private_attributes :email,
                     :email_digests,
                     :email_private_messages,
                     :email_direct,
                     :digest_after_days,
                     :auto_track_topics_after_msecs,
                     :new_topic_duration_minutes,
                     :external_links_in_new_tab,
                     :enable_quoting
<<<<<<< HEAD
=======

>>>>>>> 4de0c58b834664c3220deb58202d1ccd14053fef

  def auto_track_topics_after_msecs
    object.auto_track_topics_after_msecs || SiteSetting.auto_track_topics_after
  end

  def new_topic_duration_minutes
    object.new_topic_duration_minutes || SiteSetting.new_topic_duration_minutes
  end

  def can_send_private_message_to_user
    scope.can_send_private_message?(object)
  end

  def can_edit
    scope.can_edit?(object)
  end

  def stats
    UserAction.stats(object.id, scope)
  end

end
