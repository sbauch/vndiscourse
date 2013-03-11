#
# Helps us find topics. Returns a TopicList object containing the topics
# found.
#
require_dependency 'topic_list'

class TopicQuery

  class << self
    # use the constants in conjuction with COALESCE to determine the order with regard to pinned
    # topics that have been cleared by the user. There
    # might be a cleaner way to do this.
    def lowest_date
      "2010-01-01"
    end

    def highest_date
      "3000-01-01"
    end

    # If you've clearned the pin, use bumped_at, otherwise put it at the top
    def order_with_pinned_sql
      "CASE
        WHEN (COALESCE(topics.pinned_at, '#{lowest_date}') > COALESCE(tu.cleared_pinned_at, '#{lowest_date}'))
          THEN '#{highest_date}'
        ELSE topics.bumped_at
       END DESC"
    end

    # If you've clearned the pin, use bumped_at, otherwise put it at the top
    def order_nocategory_with_pinned_sql
      "CASE
        WHEN topics.category_id IS NULL and (COALESCE(topics.pinned_at, '#{lowest_date}') > COALESCE(tu.cleared_pinned_at, '#{lowest_date}'))
          THEN '#{highest_date}'
        ELSE topics.bumped_at
       END DESC"
    end

    # For anonymous users
    def order_nocategory_basic_bumped
      "CASE WHEN topics.category_id IS NULL and (topics.pinned_at IS NOT NULL) THEN 0 ELSE 1 END, topics.bumped_at DESC"
    end

    def order_basic_bumped
      "CASE WHEN (topics.pinned_at IS NOT NULL) THEN 0 ELSE 1 END, topics.bumped_at DESC"
    end

  end

  def initialize(user=nil, opts={})
    @user = user

    # Cast to int to avoid sql injection
    @user_id = user.id.to_i if @user.present?

    @opts = opts
  end

  # Return a list of suggested topics for a topic
  def list_suggested_for(topic)

    exclude_topic_ids = [topic.id]

    # If not logged in, return some random results, preferably in this category
    if @user.blank?
      return TopicList.new(@user, random_suggested_results_for(topic, SiteSetting.suggested_topics, exclude_topic_ids))
    end

    results = unread_results(per_page: SiteSetting.suggested_topics)
                .where('topics.id NOT IN (?)', exclude_topic_ids)
                .where(closed: false, archived: false, visible: true)
                .all

    results_left = SiteSetting.suggested_topics - results.size

    # If we don't have enough results, go to new posts
    if results_left > 0
      exclude_topic_ids << results.map {|t| t.id}
      exclude_topic_ids.flatten!

      results << new_results(per_page: results_left)
                  .where('topics.id NOT IN (?)', exclude_topic_ids)
                  .where(closed: false, archived: false, visible: true)
                  .all

      results.flatten!

      results_left = SiteSetting.suggested_topics - results.size

      # If we STILL don't have enough results, find random topics
      if results_left > 0
        exclude_topic_ids << results.map {|t| t.id}
        exclude_topic_ids.flatten!

        results << random_suggested_results_for(topic, results_left, exclude_topic_ids)
                    .where(closed: false, archived: false, visible: true)
                    .all

        results.flatten!
      end
    end

    TopicList.new(@user, results)
  end

  # The popular view of topics
  def list_popular
    TopicList.new(@user, default_list)
  end

  # The favorited topics
  def list_favorited
    return_list do |list|
      list.where('tu.starred')
    end
  end

  def list_read
    return_list(unordered: true) do |list|
      list.order('COALESCE(tu.last_visited_at, topics.bumped_at) DESC')
    end
  end

  def list_new
    TopicList.new(@user, new_results)
  end

  def list_unread
    TopicList.new(@user, unread_results)
  end

  def list_posted
    return_list {|l| l.where('tu.user_id IS NOT NULL') }
  end

  def list_uncategorized
    return_list(unordered: true) do |list|
      list = list.where(category_id: nil)

      if @user_id.present?
        list.order(TopicQuery.order_with_pinned_sql)
      else
        list.order(TopicQuery.order_nocategory_basic_bumped)
      end
    end
  end

  def list_category(category)
    return_list(unordered: true) do |list|
      list = list.where(category_id: category.id)
      if @user_id.present?
        list.order(TopicQuery.order_with_pinned_sql)
      else
        list.order(TopicQuery.order_basic_bumped)
      end
    end
  end

  def unread_count
    unread_results(limit: false).count
  end

  def new_count
    new_results(limit: false).count
  end

  def list_new_in_category(category)
    return_list {|l| l.where(category_id: category.id).by_newest.first(25)}
  end

  protected

    def return_list(list_opts={})
      TopicList.new(@user, yield(default_list(list_opts)))
    end

    # Create a list based on a bunch of detault options
    def default_list(list_opts={})

      query_opts = @opts.merge(list_opts)
      page_size = query_opts[:per_page] || SiteSetting.topics_per_page

      # Start with a list of all topics
      result = Topic

      if @user_id.present?
        result = result.joins("LEFT OUTER JOIN topic_users AS tu ON (topics.id = tu.topic_id AND tu.user_id = #{@user_id})")
      end

      unless query_opts[:unordered]
        # If we're logged in, we have to pay attention to our pinned settings
        if @user_id.present?
          result = result.order(TopicQuery.order_nocategory_with_pinned_sql)
        else
          result = result.order(TopicQuery.order_basic_bumped)
        end
      end

      result = result.listable_topics.includes(:category => :topic_only_relative_url)
      result = result.where('categories.name is null or categories.name <> ?', query_opts[:exclude_category]) if query_opts[:exclude_category]
      result = result.where('categories.name = ?', query_opts[:only_category]) if query_opts[:only_category]
      result = result.limit(page_size) unless query_opts[:limit] == false
      result = result.visible if @user.blank? or @user.regular?
      result = result.where('topics.id <> ?', query_opts[:except_topic_id]) if query_opts[:except_topic_id].present?
      result = result.offset(query_opts[:page].to_i * page_size) if query_opts[:page].present?
      result
    end

    def new_results(list_opts={})

      default_list(list_opts)
        .where("topics.created_at >= :created_at", created_at: @user.treat_as_new_topic_start_date)
        .where("tu.last_read_post_number IS NULL")
        .where("COALESCE(tu.notification_level, :tracking) >= :tracking", tracking: TopicUser.notification_levels[:tracking])
    end

    def unread_results(list_opts={})
      default_list(list_opts)
        .where("tu.last_read_post_number < topics.highest_post_number")
        .where("COALESCE(tu.notification_level, :regular) >= :tracking", regular: TopicUser.notification_levels[:regular], tracking: TopicUser.notification_levels[:tracking])
    end

    def random_suggested_results_for(topic, count, exclude_topic_ids)
      results = default_list(unordered: true, per_page: count)
                 .where('topics.id NOT IN (?)', exclude_topic_ids)
                 .where(closed: false, archived: false, visible: true)

      if topic.category_id.present?
        results = results.order("CASE WHEN topics.category_id = #{topic.category_id.to_i} THEN 0 ELSE 1 END, RANDOM()")
      else
        results = results.order("RANDOM()")
      end

      results
    end

end
