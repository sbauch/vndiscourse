TopicStatusUpdate = Struct.new(:topic, :user) do
  def update!(status, enabled)
    status = Status.new(status, enabled)

    Topic.transaction do
      change(status)
      highest_post_number = topic.highest_post_number

      create_moderator_post_for(status)
      update_read_state_for(status, highest_post_number)
    end
  end

  private

  def change(status)
    if status.pinned?
      topic.update_pinned status.enabled?
    elsif status.autoclosed?
      topic.update_column 'closed', status.enabled?
    else
      topic.update_column status.name, status.enabled?
    end

    if topic.auto_close_at && (status.reopening_topic? || status.manually_closing_topic?)
      topic.reload.set_auto_close(nil).save
    end

    # pick up the changes right away as opposed to waiting for
    # the schedule
    CategoryFeaturedTopic.feature_topics_for(topic.category)
  end

  def create_moderator_post_for(status)
    topic.add_moderator_post(user, message_for(status), options_for(status))
    topic.reload
  end

  def update_read_state_for(status, old_highest_read)
    if status.autoclosed?
      # let's pretend all the people that read up to the autoclose message
      #  actually read the topic
      PostTiming.pretend_read(topic.id, old_highest_read, topic.highest_post_number)
    end
  end

  def message_for(status)
    if status.autoclosed?
      num_minutes = topic.auto_close_started_at ? ((Time.zone.now - topic.auto_close_started_at) / 1.minute).round : topic.age_in_minutes
      if num_minutes.minutes >= 2.days
        I18n.t "#{status.locale_key}_days", count: (num_minutes.minutes / 1.day).round
      else
        num_hours = (num_minutes.minutes / 1.hour).round
        if num_hours >= 2
          I18n.t "#{status.locale_key}_hours", count: num_hours
        else
          I18n.t "#{status.locale_key}_minutes", count: num_minutes
        end
      end
    else
      I18n.t status.locale_key
    end
  end

  def options_for(status)
    { bump: status.reopening_topic? }
  end

  Status = Struct.new(:name, :enabled) do
    %w(pinned autoclosed closed).each do |status|
      define_method("#{status}?") { name == status }
    end

    def enabled?
      enabled
    end

    def disabled?
      !enabled?
    end

    def locale_key
      "topic_statuses.#{name}_#{enabled? ? 'enabled' : 'disabled'}"
    end

    def reopening_topic?
      (closed? || autoclosed?) && disabled?
    end

    def manually_closing_topic?
      closed? && enabled?
    end
  end
end
