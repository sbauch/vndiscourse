require_dependency 'jobs'
require_dependency 'pretty_text'
require_dependency 'rate_limiter'
require_dependency 'post_revisor'
require_dependency 'enum'

require 'archetype'
require 'digest/sha1'

class Post < ActiveRecord::Base
  include RateLimiter::OnCreateRecord

  versioned if: :raw_changed?

  rate_limit
  acts_as_paranoid

  after_recover :update_flagged_posts_count

  belongs_to :user
  belongs_to :topic, counter_cache: :posts_count
  belongs_to :reply_to_user, class_name: "User"

  has_many :post_replies
  has_many :replies, through: :post_replies
  has_many :post_actions

  validates_presence_of :raw, :user_id, :topic_id
  validates :raw, stripped_length: { in: SiteSetting.post_length }
  validate :raw_quality
  validate :max_mention_validator
  validate :max_images_validator
  validate :max_links_validator
  validate :unique_post_validator

  # We can pass a hash of image sizes when saving to prevent crawling those images
  attr_accessor :image_sizes, :quoted_post_numbers, :no_bump, :invalidate_oneboxes

  SHORT_POST_CHARS = 1200

  scope :by_newest, order('created_at desc, id desc')
  scope :with_user, includes(:user)

  def self.hidden_reasons
    @hidden_reasons ||= Enum.new(:flag_threshold_reached, :flag_threshold_reached_again)
  end

  def self.types
    @types ||= Enum.new(:regular, :moderator_action)
  end

  def raw_quality
    sentinel = TextSentinel.new(raw, min_entropy: SiteSetting.body_min_entropy)
    if sentinel.valid?
      # It's possible the sentinel has cleaned up the title a bit
      self.raw = sentinel.text
    else
      errors.add(:raw, I18n.t(:is_invalid)) unless sentinel.valid?
    end
  end


  # Stop us from posting the same thing too quickly
  def unique_post_validator
    return if SiteSetting.unique_posts_mins == 0
    return if user.admin? || user.moderator?

    # If the post is empty, default to the validates_presence_of
    return if raw.blank?

    if $redis.exists(unique_post_key)
      errors.add(:raw, I18n.t(:just_posted_that))
    end
  end

  # The key we use in redis to ensure unique posts
  def unique_post_key
    "post-#{user_id}:#{raw_hash}"
  end

  def raw_hash
    return if raw.blank?
    Digest::SHA1.hexdigest(raw.gsub(/\s+/, "").downcase)
  end

  def cooked_document
    self.cooked ||= cook(raw, topic_id: topic_id)
    @cooked_document ||= Nokogiri::HTML.fragment(cooked)
  end

  def reset_cooked
    @cooked_document = nil
    self.cooked = nil
  end

  def self.white_listed_image_classes
    @white_listed_image_classes ||= ['avatar']
  end

  def image_count
    return 0 unless raw.present?

    cooked_document.search("img").reject do |t|
      dom_class = t["class"]
      if dom_class
        (Post.white_listed_image_classes & dom_class.split(" ")).count > 0
      end
    end.count
  end

  def link_count
    return 0 unless raw.present?

    # Don't include @mentions in the link count
    total = 0
    cooked_document.search("a[href]").each do |l|
      html_class = l.attributes['class']
      if html_class.present?
        next if html_class.to_s == 'mention' && l.attributes['href'].to_s =~ /^\/users\//
      end
      total +=1
    end
    total
  end

  def max_mention_validator
    max_mentions = SiteSetting.visitor_max_mentions_per_post
    max_mentions = SiteSetting.max_mentions_per_post if user.present? && user.has_trust_level?(:basic)
    errors.add(:base, I18n.t(:too_many_mentions, count: max_mentions)) if raw_mentions.size > max_mentions
  end

  def max_images_validator
    return if user.present? && user.has_trust_level?(:basic)
    errors.add(:base, I18n.t(:too_many_images, count: SiteSetting.visitor_max_images)) if image_count > SiteSetting.visitor_max_images
  end

  def max_links_validator
    return if user.present? && user.has_trust_level?(:basic)
    errors.add(:base, I18n.t(:too_many_links, count: SiteSetting.visitor_max_links)) if link_count > SiteSetting.visitor_max_links
  end


  def raw_mentions
    return [] if raw.blank?

    # We don't count mentions in quotes
    return @raw_mentions if @raw_mentions.present?
    raw_stripped = raw.gsub(/\[quote=(.*)\]([^\[]*?)\[\/quote\]/im, '')

    # Strip pre and code tags
    doc = Nokogiri::HTML.fragment(raw_stripped)
    doc.search("pre").remove
    doc.search("code").remove

    results = doc.to_html.scan(PrettyText.mention_matcher)
    @raw_mentions = results.uniq.map { |un| un.first.downcase.gsub!(/^@/, '') }
  end

  def archetype
    topic.archetype
  end

  def self.regular_order
    order(:sort_order, :post_number)
  end

  def self.reverse_order
    order('sort_order desc, post_number desc')
  end

  def self.best_of
    where(["(post_number = 1) or (percent_rank <= ?)", SiteSetting.best_of_percent_filter.to_f / 100.0])
  end

  def update_flagged_posts_count
    PostAction.update_flagged_posts_count
  end

  def filter_quotes(parent_post = nil)
    return cooked if parent_post.blank?

    # We only filter quotes when there is exactly 1
    return cooked unless (quote_count == 1)

    parent_raw = parent_post.raw.sub(/\[quote.+\/quote\]/m, '')

    if raw[parent_raw] || (parent_raw.size < SHORT_POST_CHARS)
      return cooked.sub(/\<aside.+\<\/aside\>/m, '')
    end

    cooked
  end

  def username
    user.username
  end

  def external_id
    "#{topic_id}/#{post_number}"
  end

  def quoteless?
    (quote_count == 0) && (reply_to_post_number.present?)
  end

  def reply_notification_target
    return if reply_to_post_number.blank?
    Post.where("topic_id = :topic_id AND post_number = :post_number AND user_id <> :user_id",
                topic_id: topic_id,
                post_number: reply_to_post_number,
                user_id: user_id).first.try(:user)
  end

  def self.excerpt(cooked, maxlength = nil)
    maxlength ||= SiteSetting.post_excerpt_maxlength
    PrettyText.excerpt(cooked, maxlength)
  end

  # Strip out most of the markup
  def excerpt(maxlength = nil)
    Post.excerpt(cooked, maxlength)
  end

  # What we use to cook posts
  def cook(*args)
    cooked = PrettyText.cook(*args)

    # If we have any of the oneboxes in the cache, throw them in right away, don't
    # wait for the post processor.
    dirty = false
    doc = Oneboxer.each_onebox_link(cooked) do |url, elem|
      cached = Oneboxer.render_from_cache(url)
      if cached.present?
        elem.swap(cached)
        dirty = true
      end
    end

    cooked = doc.to_html if dirty
    cooked
  end

  # A list of versions including the initial version
  def all_versions
    result = []
    result << { number: 1, display_username: user.username, created_at: created_at }
    versions.order(:number).includes(:user).each do |v|
      if v.user.present?
        result << { number: v.number, display_username: v.user.username, created_at: v.created_at }
      end
    end
    result
  end

  def is_flagged?
    post_actions.where(post_action_type_id: PostActionType.flag_types.values, deleted_at: nil).count != 0
  end

  def unhide!
    self.hidden = false
    self.hidden_reason_id = nil
    self.topic.update_attributes(visible: true)
    save
  end

  def url
    "/t/#{Slug.for(topic.title)}/#{topic.id}/#{post_number}"
  end

  def author_readable
    user.readable_name
  end

  def revise(updated_by, new_raw, opts = {})
    PostRevisor.new(self).revise!(updated_by, new_raw, opts)
  end


  # TODO: move into PostCreator
  # Various callbacks
  before_create do
    if reply_to_post_number.present?
      self.reply_to_user_id ||= Post.select(:user_id).where(topic_id: topic_id, post_number: reply_to_post_number).first.try(:user_id)
    end

    self.post_number ||= Topic.next_post_number(topic_id, reply_to_post_number.present?)
    self.cooked ||= cook(raw, topic_id: topic_id)
    self.sort_order = post_number
    DiscourseEvent.trigger(:before_create_post, self)
    self.last_version_at ||= Time.now
  end

  # TODO: Move some of this into an asynchronous job?
  # TODO: Move into PostCreator
  after_create do
    # Update attributes on the topic - featured users and last posted.
    attrs = {last_posted_at: created_at, last_post_user_id: user_id}
    attrs[:bumped_at] = created_at unless no_bump
    topic.update_attributes(attrs)

    # Update topic user data
    TopicUser.change(user,
                     topic.id,
                     posted: true,
                     last_read_post_number: post_number,
                     seen_post_count: post_number)
  end

  # This calculates the geometric mean of the post timings and stores it along with
  # each post.
  def self.calculate_avg_time
    retry_lock_error do
      exec_sql("UPDATE posts
                SET avg_time = (x.gmean / 1000)
                FROM (SELECT post_timings.topic_id,
                             post_timings.post_number,
                             round(exp(avg(ln(msecs)))) AS gmean
                      FROM post_timings
                      INNER JOIN posts AS p2
                        ON p2.post_number = post_timings.post_number
                          AND p2.topic_id = post_timings.topic_id
                          AND p2.user_id <> post_timings.user_id
                      GROUP BY post_timings.topic_id, post_timings.post_number) AS x
                WHERE x.topic_id = posts.topic_id
                  AND x.post_number = posts.post_number")
    end
  end

  before_save do
    self.last_editor_id ||= user_id
    self.cooked = cook(raw, topic_id: topic_id) unless new_record?
  end

  def advance_draft_sequence
    return if topic.blank? # could be deleted
    DraftSequence.next!(last_editor_id, topic.draft_key)
  end

  # Determine what posts are quoted by this post
  def extract_quoted_post_numbers
    self.quoted_post_numbers = []

    # Create relationships for the quotes
    raw.scan(/\[quote=\"([^"]+)"\]/).each do |m|
      if m.present?
        args = {}
        m.first.scan(/([a-z]+)\:(\d+)/).each do |arg|
          args[arg[0].to_sym] = arg[1].to_i
        end

        if args[:topic].present?
          # If the topic attribute is present, ensure it's the same topic
          self.quoted_post_numbers << args[:post] if topic_id == args[:topic]
        else
          self.quoted_post_numbers << args[:post]
        end

      end
    end

    self.quoted_post_numbers.uniq!
    self.quote_count = quoted_post_numbers.size
  end

  def save_reply_relationships
    self.quoted_post_numbers ||= []
    self.quoted_post_numbers << reply_to_post_number if reply_to_post_number.present?

    # Create a reply relationship between quoted posts and this new post
    if self.quoted_post_numbers.present?
      self.quoted_post_numbers.map(&:to_i).uniq.each do |p|
        post = Post.where(topic_id: topic_id, post_number: p).first
        if post.present?
          post_reply = post.post_replies.new(reply_id: id)
          if post_reply.save
            Post.update_all ['reply_count = reply_count + 1'], id: post.id
          end
        end
      end
    end
  end

  # Enqueue post processing for this post
  def trigger_post_process
    args = { post_id: id }
    args[:image_sizes] = image_sizes if image_sizes.present?
    args[:invalidate_oneboxes] = true if invalidate_oneboxes.present?
    Jobs.enqueue(:process_post, args)
  end

  def self.count_per_day(since=30.days.ago)
    where('created_at > ?', since).group('date(created_at)').order('date(created_at)').count
  end
end
