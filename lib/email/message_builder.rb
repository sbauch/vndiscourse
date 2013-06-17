# Builds a Mail::Mesage we can use for sending. Optionally supports using a template
# for the body and subject
module Email

  module BuildEmailHelper
    def build_email(*builder_args)
      builder = Email::MessageBuilder.new(*builder_args)
      headers(builder.header_args) if builder.header_args.present?
      mail(builder.build_args)
    end
  end

  class MessageBuilder

    def initialize(to, opts=nil)
      @to = to
      @opts = opts || {}
    end

    def subject
      subject = @opts[:subject]
      subject = I18n.t("#{@opts[:template]}.subject_template", template_args) if @opts[:template]
      subject
    end

    def body
      body = @opts[:body]
      body = I18n.t("#{@opts[:template]}.text_body_template", template_args) if @opts[:template]

      if @opts[:add_unsubscribe_link]
        body << "\n"
        body << I18n.t('unsubscribe_link', template_args)
      end

      body
    end

    def template_args
      @template_args ||= { site_name: SiteSetting.title,
                           base_url: Discourse.base_url,
                           user_preferences_url: "#{Discourse.base_url}/user_preferences" }.merge!(@opts)
    end

    def build_args
      { to: @to,
        subject: subject,
        body: body,
        charset: 'UTF-8',
        from: from_value }
    end

    def header_args
      result = {}
      if @opts[:add_unsubscribe_link]
        result['List-Unsubscribe'] = "<#{template_args[:user_preferences_url]}>" if @opts[:add_unsubscribe_link]
      end

      if allow_reply_by_email?
        result['Discourse-Reply-Key'] = reply_key
        result['Reply-To'] = reply_by_email_address
      else
        result['Reply-To'] = from_value
      end

      result
    end


    protected

    def reply_key
      @reply_key ||= SecureRandom.hex(16)
    end

    def allow_reply_by_email?
      SiteSetting.reply_by_email_enabled? &&
      reply_by_email_address.present? &&
      @opts[:allow_reply_by_email]
    end

    def from_value
      return @from_value if @from_value
      @from_value = @opts[:from] || SiteSetting.notification_email
      @from_value = alias_email(@from_value)
      @from_value
    end

    def reply_by_email_address
      return @reply_by_email_address if @reply_by_email_address
      return nil unless SiteSetting.reply_by_email_address.present?

      @reply_by_email_address = SiteSetting.reply_by_email_address.dup
      @reply_by_email_address.gsub!("%{reply_key}", reply_key)
      @reply_by_email_address = alias_email(@reply_by_email_address)

      @reply_by_email_address
    end

    def alias_email(source)
      return source if @opts[:from_alias].blank?
      "#{@opts[:from_alias]} <#{source}>"
    end

  end

end
