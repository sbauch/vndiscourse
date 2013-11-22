class PostActionUserSerializer < BasicUserSerializer
  attributes :id, :username, :avatar_template, :post_url

  def id
    object.user.id
  end

  def username
    object.user.username
  end

  def avatar_template
    object.user.avatar_template
  end

  def post_url
    object.related_post.url if object.related_post_id && object.related_post
  end

end
