class PostMover
  attr_reader :original_topic, :destination_topic, :user, :post_ids

  def initialize(original_topic, user, post_ids)
    @original_topic = original_topic
    @user = user
    @post_ids = post_ids
  end

  def to_topic(id)
    Topic.transaction do
      move_posts_to Topic.find_by_id(id)
    end
  end

  def to_new_topic(title)
    Topic.transaction do
      move_posts_to Topic.create!(
        user: user,
        title: title,
        category: original_topic.category
      )
    end
  end

  private

  def move_posts_to(topic)
    Guardian.new(user).ensure_can_see! topic
    @destination_topic = topic

    move_posts_to_destination_topic
    destination_topic
  end

  def move_posts_to_destination_topic
    move_each_post
    notify_users_that_posts_have_moved
    update_statistics
  end

  def move_each_post
    with_max_post_number do |max_post_number|
      posts.each_with_index do |post, offset|
        post.is_first_post? ? copy(post) : move(post, offset + max_post_number)
      end
    end
  end

  def copy(post)
    PostCreator.create(
      post.user,
      raw: post.raw,
      topic_id: destination_topic.id,
      acting_user: user
    )
  end

  def move(post, post_number)
    @first_post_number_moved ||= post.post_number

    Post.update_all(
      [
        ['post_number = :post_number',
         'topic_id    = :topic_id',
         'sort_order  = :post_number'
        ].join(', '),
        post_number: post_number,
        topic_id: destination_topic.id
      ],
      id: post.id,
      topic_id: original_topic.id
    )
  end

  def update_statistics
    destination_topic.update_statistics
    original_topic.update_statistics
  end

  def notify_users_that_posts_have_moved
    enqueue_notification_job
    create_moderator_post_in_original_topic
  end

  def enqueue_notification_job
    Jobs.enqueue(
      :notify_moved_posts,
      post_ids: post_ids,
      moved_by_id: user.id
    )
  end

  def create_moderator_post_in_original_topic
    original_topic.add_moderator_post(
      user,
      I18n.t(
        "move_posts.moderator_post",
        count: post_ids.count,
        topic_link: "[#{destination_topic.title}](#{destination_topic.url})"
      ),
      post_number: @first_post_number_moved
    )
  end

  def with_max_post_number
    yield destination_topic.max_post_number + 1
  end

  def posts
    @posts ||= begin
      Post.where(id: post_ids).order(:created_at).tap do |posts|
        raise Discourse::InvalidParameters.new(:post_ids) if posts.empty?
      end
    end
  end
end
