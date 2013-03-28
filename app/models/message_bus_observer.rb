require_dependency 'discourse_observer'

# This class is responsible for notifying the message bus of various
# events.
class MessageBusObserver < DiscourseObserver
  observe :notification, :user_action, :topic, :alert
  
  def after_create_alert(alert)
    refresh_alert_count(alert)
  end

  def after_create_notification(notification)
    refresh_notification_count(notification)
  end

  def after_destroy_notification(notification)
    refresh_notification_count(notification)
  end

  def after_create_user_action(user_action)
    MessageBus.publish("/users/#{user_action.user.username.downcase}", user_action.id)
  end

  def after_create_topic(topic)

    # Don't publish invisible topics
    return unless topic.visible?

    return if topic.private_message?

    topic.posters = topic.posters_summary
    topic.posts_count = 1
    topic_json = TopicListItemSerializer.new(topic).as_json
    MessageBus.publish("/latest", topic_json)

    # If it has a category, add it to the category views too
    if topic.category.present?
      MessageBus.publish("/category/#{topic.category.slug}", topic_json)
    end

  end

  protected
    def refresh_alert_count(alert)
      user_id = alert.user.id
      MessageBus.publish("/alert/#{user_id}",
        {unread_alerts: alert.user.unread_alerts},
        user_ids: [user_id] # only publish the notification to this user
      )
    end
    
    def refresh_notification_count(notification)
      user_id = notification.user.id
      MessageBus.publish("/notification/#{user_id}",
        {unread_notifications: notification.user.unread_notifications,
         unread_private_messages: notification.user.unread_private_messages},
        user_ids: [user_id] # only publish the notification to this user
      )
    end
end
