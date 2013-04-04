class AlertSerializer < ApplicationSerializer

  attributes :alert_type,
             :read,
             :created_at,
             :post_number,
             :topic_id,
             :slug,
             :data,
             :count

  def slug
    Slug.for(object.topic.title) if object.topic.present?
  end

  def data
    object.data_hash
  end
  
  def count
    current_user.alerts.unread
  end

end
