require_dependency 'enum'

class Notification < ActiveRecord::Base
  belongs_to :user
  belongs_to :topic

  validates_presence_of :data
  validates_presence_of :notification_type

  scope :unread, lambda { where(read: false) }
  scope :recent, lambda { order('created_at desc').limit(10) }

  after_save :refresh_notification_count
  after_destroy :refresh_notification_count

  def self.ensure_consistency!
    Notification.exec_sql("
    DELETE FROM Notifications n WHERE notification_type = :id AND
    NOT EXISTS(
      SELECT 1 FROM posts p
      JOIN topics t ON t.id = p.topic_id
      WHERE p.deleted_at is null AND t.deleted_at IS NULL
        AND p.post_number = n.post_number AND t.id = n.topic_id
    )" , id: Notification.types[:private_message])
  end

  def self.types
    @types ||= Enum.new(
      :mentioned, :replied, :quoted, :edited, :liked, :private_message,
      :invited_to_private_message, :invitee_accepted, :posted, :moved_post
    )
  end

  def self.mark_posts_read(user, topic_id, post_numbers)
    Notification.update_all "read = 't'", user_id: user.id, topic_id: topic_id, post_number: post_numbers, read: false
  end

  def self.interesting_after(min_date)
    result =  where("created_at > ?", min_date)
              .includes(:topic)
              .unread
              .limit(20)
              .order("CASE WHEN notification_type = #{Notification.types[:replied]} THEN 1
                           WHEN notification_type = #{Notification.types[:mentioned]} THEN 2
                           ELSE 3
                      END, created_at DESC").to_a

    # Remove any duplicates by type and topic
    if result.present?
      seen = {}
      to_remove = Set.new

      result.each do |r|
        seen[r.notification_type] ||= Set.new
        if seen[r.notification_type].include?(r.topic_id)
          to_remove << r.id
        else
          seen[r.notification_type] << r.topic_id
        end
      end
      result.reject! {|r| to_remove.include?(r.id) }
    end

    result
  end

  # Be wary of calling this frequently. O(n) JSON parsing can suck.
  def data_hash
    @data_hash ||= begin
      return nil if data.blank?
      JSON.parse(data).with_indifferent_access
    end
  end

  def text_description
    link = block_given? ? yield : ""
    I18n.t("notification_types.#{Notification.types[notification_type]}", data_hash.merge(link: link))
  end

  def url
    if topic.present?
      return topic.relative_url(post_number)
    end
  end

  def post
    return if topic_id.blank? || post_number.blank?

    Post.where(topic_id: topic_id, post_number: post_number).first
  end


  protected

  def refresh_notification_count
    user_id = user.id
    MessageBus.publish("/notification/#{user_id}",
      {unread_notifications: user.unread_notifications,
       unread_private_messages: user.unread_private_messages},
      user_ids: [user_id] # only publish the notification to this user
    )
  end

end

# == Schema Information
#
# Table name: notifications
#
#  id                :integer          not null, primary key
#  notification_type :integer          not null
#  user_id           :integer          not null
#  data              :string(1000)     not null
#  read              :boolean          default(FALSE), not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  topic_id          :integer
#  post_number       :integer
#  post_action_id    :integer
#
# Indexes
#
#  index_notifications_on_post_action_id          (post_action_id)
#  index_notifications_on_user_id_and_created_at  (user_id,created_at)
#

