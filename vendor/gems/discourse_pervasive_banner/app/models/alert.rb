require_dependency 'enum'

class Alert < ActiveRecord::Base
  belongs_to :user
  belongs_to :topic
  scope :unread, lambda { where(read: false) }
  scope :recent, lambda { order('created_at desc').limit(10) }

  def self.types
    @types ||= Enum.new(
      :mentioned, :replied, :quoted, :edited, :liked, :private_message,
      :invited_to_private_message, :invitee_accepted, :posted, :moved_post,
      :event_posted, :admin_message
    )
  end

  def self.mark_posts_read(user, topic_id, post_numbers)
    Alert.update_all "read = 't'", user_id: user.id, topic_id: topic_id, post_number: post_numbers, read: false
  end

  def self.interesting_after(min_date)
    result =  where("created_at > ?", min_date)
              .includes(:topic)
              .unread
              .limit(20)
              .order("CASE WHEN alert_type = #{Alert.types[:replied]} THEN 1
                           WHEN alert_type = #{Alert.types[:mentioned]} THEN 2
                           ELSE 3
                      END, created_at DESC").to_a

    # Remove any duplicates by type and topic
    if result.present?
      seen = {}
      to_remove = Set.new

      result.each do |r|
        seen[r.alert_type] ||= Set.new
        if seen[r.alert_type].include?(r.topic_id)
          to_remove << r.id
        else
          seen[r.alert_type] << r.topic_id
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
    I18n.t("alert_types.#{Alert.types[notification_type]}", data_hash.merge(link: link))
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
end

