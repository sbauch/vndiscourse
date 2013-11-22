class ListController < ApplicationController

  before_filter :ensure_logged_in, except: [:latest, :hot, :category, :category_feed, :latest_feed, :hot_feed, :topics_by]
  before_filter :set_category, only: [:category, :category_feed]
  skip_before_filter :check_xhr

  # Create our filters
  [:latest, :hot, :favorited, :read, :posted, :unread, :new].each do |filter|
    define_method(filter) do
      list_opts = build_topic_list_options
      user = list_target_user
      list = TopicQuery.new(user, list_opts).public_send("list_#{filter}")
      list.more_topics_url = construct_url_with(filter, list_opts)
      if [:latest, :hot].include?(filter)
        @description = SiteSetting.site_description
        @rss = filter
      end

      respond(list)
    end
  end

  [:latest, :hot].each do |filter|
    define_method("#{filter}_feed") do
      discourse_expires_in 1.minute

      @title = "#{filter.capitalize} Topics"
      @link = "#{Discourse.base_url}/#{filter}"
      @description = I18n.t("rss_description.#{filter}")
      @atom_link = "#{Discourse.base_url}/#{filter}.rss"
      @topic_list = TopicQuery.new.public_send("list_#{filter}")
      render 'list', formats: [:rss]
    end
  end

  [:topics_by, :private_messages, :private_messages_sent, :private_messages_unread].each do |action|
    define_method("#{action}") do
      list_opts = build_topic_list_options
      target_user = fetch_user_from_params
      guardian.ensure_can_see_private_messages!(target_user.id) unless action == :topics_by
      list = generate_list_for(action.to_s, target_user, list_opts)
      url_prefix = "topics" unless action == :topics_by
      url  = construct_url_with(action, list_opts, url_prefix)
      list.more_topics_url = url_for(url)
      respond(list)
    end
  end

  def category
    list_opts = build_topic_list_options
    query = TopicQuery.new(current_user, list_opts)
    list = query.list_latest
    list.more_topics_url = construct_url_with(:latest, list_opts)
    respond(list)

  end

  def category_feed
    guardian.ensure_can_see!(@category)
    discourse_expires_in 1.minute

    @title = @category.name
    @link = "#{Discourse.base_url}/category/#{@category.slug}"
    @description = "#{I18n.t('topics_in_category', category: @category.name)} #{@category.description}"
    @atom_link = "#{Discourse.base_url}/category/#{@category.slug}.rss"
    @topic_list = TopicQuery.new.list_new_in_category(@category)
    render 'list', formats: [:rss]
  end

  def popular_redirect
    # We've renamed popular to latest. Use a redirect until we're sure we can
    # safely remove this.
    redirect_to latest_path, :status => 301
  end

  protected

  def respond(list, category_name = nil)
    
    if current_user
      list.current_user_admin = current_user.admin?
      list.category_private = category_name == 'Events'
    end
    
    list.draft_key = Draft::NEW_TOPIC
    list.draft_sequence = DraftSequence.current(current_user, Draft::NEW_TOPIC)

    draft = Draft.get(current_user, list.draft_key, list.draft_sequence) if current_user
    list.draft = draft

    discourse_expires_in 1.minute

    respond_to do |format|
      format.html do
        @list = list
        store_preloaded('topic_list', MultiJson.dump(TopicListSerializer.new(list, scope: guardian)))
        render 'list'
      end
      format.json do
        render_serialized(list, TopicListSerializer)
      end
    end
  end

  def next_page_params(opts=nil)
    opts = opts || {}
    route_params = { format: 'json', page: params[:page].to_i + 1 }
    route_params[:sort_order] = opts[:sort_order] if opts[:sort_order].present?
    route_params[:sort_descending] = opts[:sort_descending] if opts[:sort_descending].present?
    route_params
  end

  private

  def set_category
    slug = params.fetch(:category)
    parent_slug = params[:parent_category]

    parent_category_id = nil
    if parent_slug.present?
      parent_category_id = Category.where(slug: parent_slug).pluck(:id).first ||
                           Category.where(id: parent_slug.to_i).pluck(:id).first

      raise Discourse::NotFound.new if parent_category_id.blank?
    end

    @category = Category.where(slug: slug, parent_category_id: parent_category_id).includes(:featured_users).first ||
                Category.where(id: slug.to_i, parent_category_id: parent_category_id).includes(:featured_users).first
  end

  def build_topic_list_options
    # html format means we need to parse exclude category (aka filter) from the site options top menu
    menu_items = SiteSetting.top_menu_items
    menu_item = menu_items.select { |item| item.query_should_exclude_category?(action_name, params[:format]) }.first

    # exclude_category = 1. from params / 2. parsed from top menu / 3. nil
    return {
      page: params[:page],
      topic_ids: param_to_integer_list(:topic_ids),
      exclude_category: (params[:exclude_category] || menu_item.try(:filter)),
      category: params[:category],
      sort_order: params[:sort_order],
      sort_descending: params[:sort_descending]
    }
  end

  def list_target_user
    if params[:user_id] && guardian.is_staff?
      User.find(params[:user_id].to_i)
    else
      current_user
    end
  end

  def generate_list_for(action, target_user, opts)
    TopicQuery.new(current_user, opts).send("list_#{action}", target_user)
  end

  def construct_url_with(action, opts, url_prefix=nil)
    method = url_prefix.blank? ? "#{action}_path" : "#{url_prefix}_#{action}_path"
    public_send(method, opts.merge(next_page_params(opts)))
  end
end
