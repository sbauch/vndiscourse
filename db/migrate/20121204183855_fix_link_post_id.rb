class FixLinkPostId < ActiveRecord::Migration
  def up
    to_remove = []

    TopicLink.where('internal = TRUE AND link_post_id IS NULL').each do |tl|

      begin
        parsed = URI.parse(tl.url)
        route = Rails.application.routes.recognize_path(parsed.path)
        if route[:topic_id].present?
          post = Post.where(topic_id: route[:topic_id], post_number: route[:post_number] || 1).first
          tl.update_column(:link_post_id, post.id) if post.present?
        end

      rescue ActionController::RoutingError
        to_remove << tl.id
      end

    end

    TopicLink.delete_all ["id in (?)", to_remove]
  end

  def down
  end
end
