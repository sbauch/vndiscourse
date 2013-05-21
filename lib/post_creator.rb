# Responsible for creating posts and topics
#
require_dependency 'rate_limiter'

class PostCreator

  attr_reader :errors, :opts

  # Acceptable options:
  #
  #   raw                     - raw text of post
  #   image_sizes             - We can pass a list of the sizes of images in the post as a shortcut.
  #   invalidate_oneboxes     - Whether to force invalidation of oneboxes in this post
  #   acting_user             - The user performing the action might be different than the user
  #                             who is the post "author." For example when copying posts to a new
  #                             topic.
  #
  #   When replying to a topic:
  #     topic_id              - topic we're replying to
  #     reply_to_post_number  - post number we're replying to
  #
  #   When creating a topic:
  #     title                 - New topic title
  #     archetype             - Topic archetype
  #     category              - Category to assign to topic
  #     target_usernames      - comma delimited list of usernames for membership (private message)
  #     target_group_names    - comma delimited list of groups for membership (private message)
  #     meta_data             - Topic meta data hash
  def initialize(user, opts)
    # TODO: we should reload user in case it is tainted, should take in a user_id as opposed to user
    # If we don't do this we introduce a rather risky dependency
    @user = user
    @opts = opts
    @spam = false

    raise Discourse::InvalidParameters.new(:raw) if @opts[:raw].blank?
  end

  # True if the post was considered spam
  def spam?
    @spam
  end

  def guardian
    @guardian ||= Guardian.new(@user)
  end

  def create
    topic = nil
    post = nil
    new_topic = false

    Post.transaction do
      if @opts[:topic_id].blank?
        topic = create_topic
        new_topic = true
      else
        topic = Topic.where(id: @opts[:topic_id]).first
        guardian.ensure_can_create!(Post, topic)
      end

      post = topic.posts.new(raw: @opts[:raw],
                             user: @user,
                             reply_to_post_number: @opts[:reply_to_post_number])

      post.post_type = @opts[:post_type] if @opts[:post_type].present?
      post.no_bump = @opts[:no_bump] if @opts[:no_bump].present?
      post.extract_quoted_post_numbers
      post.acting_user = @opts[:acting_user] if @opts[:acting_user].present?

      post.image_sizes = @opts[:image_sizes] if @opts[:image_sizes].present?
      post.invalidate_oneboxes = @opts[:invalidate_oneboxes] if @opts[:invalidate_oneboxes].present?


      # If the post has host spam, roll it back.
      if post.has_host_spam?
        post.errors.add(:base, I18n.t(:spamming_host))
        @errors = post.errors
        @spam = true
        raise ActiveRecord::Rollback.new
      end

      unless post.save
        @errors = post.errors
        raise ActiveRecord::Rollback.new
      end

      # Extract links
      TopicLink.extract_from(post)
      
      #Create hashtags
      @opts[:raw].scan(/(#[A-Za-z0-9][A-Za-z0-9_]{2,20})/).flatten.each do |match|
        term = match.gsub('#', '')
        tag = Tag.find_or_create_by_term(term)
        tag.count += 1
        tag.save
      end

      # Store unique post key
      if SiteSetting.unique_posts_mins > 0
        $redis.setex(post.unique_post_key, SiteSetting.unique_posts_mins.minutes.to_i, "1")
      end

      # send a mail to notify users in case of a private message
      if topic.private_message?
        topic.allowed_users.where(["users.email_private_messages = true and users.id != ?", @user.id]).each do |u|
          Jobs.enqueue_in(SiteSetting.email_time_window_mins.minutes,
                            :user_email,
                            type: :private_message,
                            user_id: u.id,
                            post_id: post.id
                         )
        end

        clear_possible_flags(topic) if post.post_number > 1 && topic.user_id != post.user_id
      end

      # Track the topic
      TopicUser.auto_track(@user.id, topic.id, TopicUser.notification_reasons[:created_post])

      # We don't count replies to your own topics
      if @user.id != topic.user_id
        @user.update_topic_reply_count
      end

      @user.last_posted_at = post.created_at
      @user.save!

      if post.post_number > 1
        MessageBus.publish("/topic/#{post.topic_id}",{
                        id: post.id,
                        created_at: post.created_at,
                        user: BasicUserSerializer.new(post.user).as_json(root: false),
                        post_number: post.post_number
                      },
                      group_ids: secure_group_ids(topic)
        )
      end

      # Advance the draft sequence
      post.advance_draft_sequence

      # Save the quote relationships
      post.save_reply_relationships
    end

    # We need to enqueue jobs after the transaction. Otherwise they might begin before the data has
    # been comitted.
    topic_id = @opts[:topic_id] || topic.try(:id)
    Jobs.enqueue(:feature_topic_users, topic_id: topic.id) if topic_id.present?
    if post
      post.trigger_post_process
      after_topic_create(topic) if new_topic
    end

    post
  end


  # Shortcut
  def self.create(user, opts)
    PostCreator.new(user, opts).create
  end

  protected

  def secure_group_ids(topic)
    @secure_group_ids ||= if topic.category && topic.category.secure?
      topic.category.groups.select("groups.id").map{|g| g.id}
    end
  end

  def after_topic_create(topic)

    # Don't publish invisible topics
    return unless topic.visible?

    return if topic.private_message?

    topic.posters = topic.posters_summary
    topic.posts_count = 1
    topic_json = TopicListItemSerializer.new(topic).as_json

    group_ids = secure_group_ids(topic)

    MessageBus.publish("/latest", topic_json, group_ids: group_ids)

    # If it has a category, add it to the category views too
    if topic.category
      MessageBus.publish("/category/#{topic.category.slug}", topic_json, group_ids: group_ids)
    end
  end

  def create_topic
    topic_params = {title: @opts[:title], user_id: @user.id, last_post_user_id: @user.id}
    topic_params[:archetype] = @opts[:archetype] if @opts[:archetype].present?
    topic_params[:subtype] = @opts[:subtype] if @opts[:subtype].present?

    guardian.ensure_can_create!(Topic)

    category = Category.where(name: @opts[:category]).first
    topic_params[:category_id] = category.id if category.present?
    topic_params[:meta_data] = @opts[:meta_data] if @opts[:meta_data].present?

    topic = Topic.new(topic_params)

    if @opts[:auto_close_days]
      guardian.ensure_can_moderate!(topic)
      topic.auto_close_days = @opts[:auto_close_days]
    end

    if @opts[:archetype] == Archetype.private_message

      topic.subtype = TopicSubtype.user_to_user unless topic.subtype

      unless @opts[:target_usernames].present? || @opts[:target_group_names].present?
        topic.errors.add(:archetype, :cant_send_pm)
        @errors = topic.errors
        raise ActiveRecord::Rollback.new
      end

      add_users(topic,@opts[:target_usernames])
      add_groups(topic,@opts[:target_group_names])
      topic.topic_allowed_users.build(user_id: @user.id)
    end
    
    if @opts[:archetype] == Archetype.event
      topic.attendee_limit = @opts[:attendee_limit].to_i
      topic.attendee_count = 0
      topic.starts_at = @opts[:starts_at]
      topic.ends_at = @opts[:ends_at]
      topic.location = @opts[:location]
    end

    unless topic.save
      @errors = topic.errors
      raise ActiveRecord::Rollback.new
    end

    topic
  end

  def clear_possible_flags(topic)
    # at this point we know the topic is a PM and has been replied to ... check if we need to clear any flags
    #
    first_post = Post.select(:id).where(topic_id: topic.id).where('post_number = 1').first
    post_action = nil

    if first_post
      post_action = PostAction.where(
        related_post_id: first_post.id,
        deleted_at: nil,
        post_action_type_id: PostActionType.types[:notify_moderators]
      ).first
    end

    if post_action
      post_action.remove_act!(@user)
    end
  end

  def add_users(topic, usernames)
    return unless usernames
    usernames = usernames.split(',')
    User.where(username: usernames).each do |u|

      unless guardian.can_send_private_message?(u)
        topic.errors.add(:archetype, :cant_send_pm)
        @errors = topic.errors
        raise ActiveRecord::Rollback.new
      end

      topic.topic_allowed_users.build(user_id: u.id)
    end
  end

  def add_groups(topic, groups)
    return unless groups
    groups = groups.split(',')
    Group.where(name: groups).each do |g|

      unless guardian.can_send_private_message?(g)
        topic.errors.add(:archetype, :cant_send_pm)
        @errors = topic.errors
        raise ActiveRecord::Rollback.new
      end

      topic.topic_allowed_groups.build(group_id: g.id)
    end
  end
end