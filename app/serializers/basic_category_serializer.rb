class BasicCategorySerializer < ApplicationSerializer

  attributes :id,
             :name,
             :color,
             :text_color,
             :slug,
             :topic_count,
             :description,
             :topic_url,
             :hotness,
             :secure

end
