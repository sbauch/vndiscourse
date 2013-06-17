InviteRedeemer = Struct.new(:invite) do

  def redeem
    Invite.transaction do
      process_invitation if invite_was_redeemed?
    end

    invited_user
  end

  private

  def invited_user
    @invited_user ||= get_invited_user
  end

  def process_invitation
    add_to_private_topics_if_invited
    add_user_to_invited_topics
    send_welcome_message
    notify_invitee
  end

  def invite_was_redeemed?
    # Return true if a row was updated
    mark_invite_redeemed == 1
  end

  def mark_invite_redeemed
    Invite.update_all('redeemed_at = CURRENT_TIMESTAMP',
                      ['id = ? AND redeemed_at IS NULL AND created_at >= ?',
                       invite.id, SiteSetting.invite_expiry_days.days.ago])
  end

  def get_invited_user
    result = get_existing_user
    result ||= create_new_user
    result.send_welcome_message = false
    result
  end

  def get_existing_user
    User.where(email: invite.email).first
  end

  def create_new_user
    User.create_for_email(invite.email, trust_level: SiteSetting.default_invitee_trust_level)
  end

  def add_to_private_topics_if_invited
    invite.topics.private_messages.each do |t|
      t.topic_allowed_users.create(user_id: invited_user.id)
    end
  end

  def add_user_to_invited_topics
    Invite.where('invites.email = ? and invites.id != ?', invite.email, invite.id).includes(:topics).where(topics: {archetype: Archetype::private_message}).each do |i|
      i.topics.each do |t|
        t.topic_allowed_users.create(user_id: invited_user.id)
      end
    end
  end

  def send_welcome_message
    if Invite.update_all(['user_id = ?', invited_user.id], ['email = ?', invite.email]) == 1
      invited_user.send_welcome_message = true
    end
  end

  def notify_invitee
    invite.invited_by.notifications.create(notification_type: Notification.types[:invitee_accepted],
                                           data: {display_username: invited_user.username}.to_json)
  end
end