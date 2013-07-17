class TopicListSerializer < ApplicationSerializer

  attributes :can_create_topic,
             :more_topics_url,
             :draft,
             :draft_key,
             :draft_sequence,
             :can_view_rank_details

  has_many :topics, serializer: TopicListItemSerializer, embed: :objects

  def can_view_rank_details
    true
  end

  def include_can_view_rank_details?
    object.has_rank_details?
  end

  def can_create_topic
    if object.current_user_admin
      return true
    elsif object.category_private
      return false
    else    
      scope.can_create?(Topic, object.category_private)
    end
  end

  def include_more_topics_url?
    object.more_topics_url.present? && (object.topics.size == SiteSetting.topics_per_page)
  end

end
