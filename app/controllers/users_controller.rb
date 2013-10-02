require_dependency 'discourse_hub'
require_dependency 'user_name_suggester'
require_dependency 'user_activator'

class UsersController < ApplicationController

  skip_before_filter :authorize_mini_profiler, only: [:avatar]
  skip_before_filter :check_xhr, only: [:show, :password_reset, :update, :activate_account, :authorize_email, :user_preferences_redirect, :avatar]

  before_filter :ensure_logged_in, only: [:username, :update, :change_email, :user_preferences_redirect]

  # we need to allow account creation with bad CSRF tokens, if people are caching, the CSRF token on the
  #  page is going to be empty, this means that server will see an invalid CSRF and blow the session
  #  once that happens you can't log in with social
  skip_before_filter :verify_authenticity_token, only: [:create]
  skip_before_filter :redirect_to_login_if_required, only: [:check_username,
                                                            :create,
                                                            :get_honeypot_value,
                                                            :activate_account,
                                                            :send_activation_email,
                                                            :authorize_email,
                                                            :password_reset]

  def show
    @user = fetch_user_from_params
    user_serializer = UserSerializer.new(@user, scope: guardian, root: 'user')
    respond_to do |format|
      format.html do
        store_preloaded("user_#{@user.username}", MultiJson.dump(user_serializer))
      end

      format.json do
        render_json_dump(user_serializer)
      end
    end
  end

  def user_preferences_redirect
    redirect_to email_preferences_path(current_user.username_lower)
  end

  def update
    @user = User.where(username_lower: params[:username].downcase).first
    guardian.ensure_can_edit!(@user)
    
    if params[:team_hash]
      @ary = Array.new
      @hsh = Hash.new
      
      if params[:team_hash].is_a?(Array)
         params[:team_hash].each do |t|
          @tm = Team.find(t)
          @ary << @tm.name
          @hsh[t] = @tm.name
        end
      else  
      # raise params[:teams].inspect

        params[:team_hash].each do |k,v|
          @ary << v['name']
          @hsh[v['id']] = v['name']
        end
      end
      
      @user.team_hash = @hsh
      @user.teams = @ary.to_sentence
      if @user.teams_changed?
        HTTParty.put("https://vaynerpeople.herokuapp.com/api/users/teams?token=cqOR1F80vsKOGndLWS7ekg&email=#{@user.email}&[teams]=#{CGI.escape(@ary.join(','))}")
      end    
    end  
      
    
    @user.tap do |u|

      website = params[:website]
      if website
        website = "http://" + website unless website =~ /^http/
      end
      
      
            
      u.bio_raw = params[:bio_raw] || u.bio_raw
      u.name = params[:name] || u.name
      u.website = website || u.website
      u.digest_after_days = params[:digest_after_days] || u.digest_after_days
      u.auto_track_topics_after_msecs = params[:auto_track_topics_after_msecs].to_i if params[:auto_track_topics_after_msecs]
      u.new_topic_duration_minutes = params[:new_topic_duration_minutes].to_i if params[:new_topic_duration_minutes]
      u.fact_one = params[:fact_one]
      u.fact_two = params[:fact_two]
      u.fact_three = params[:fact_three]
      u.title = params[:title] || u.title if guardian.can_grant_title?(u)

      [:email_digests, :email_direct, :email_private_messages,
       :external_links_in_new_tab, :enable_quoting, :dynamic_favicon].each do |i|
        if params[i].present?
          u.send("#{i.to_s}=", params[i] == 'true')
        end
      end

      if u.save
        user_serializer = UserSerializer.new(u, scope: guardian, root: 'user')
        render_json_dump(user_serializer)
      else
        nil
      end
    end
    
    
    
  end

  def username
    params.require(:new_username)

    user = fetch_user_from_params
    guardian.ensure_can_edit_username!(user)

    result = user.change_username(params[:new_username])
    raise Discourse::InvalidParameters.new(:new_username) unless result

    render nothing: true
  end

  def preferences
    render nothing: true
  end

  def invited
    invited_list = InvitedList.new(fetch_user_from_params)
    render_serialized(invited_list, InvitedListSerializer)
  end

  def is_local_username
    params.require(:username)
    u = params[:username].downcase
    r = User.exec_sql('select 1 from users where username_lower = ?', u).values
    render json: {valid: r.length == 1}
  end

  def check_username
    params.require(:username)
    target_user = params[:for_user_id] ? User.find(params[:for_user_id]) : current_user

    # The special case where someone is changing the case of their own username
    return render(json: {available: true}) if target_user and params[:username].downcase == target_user.username.downcase

    validator = UsernameValidator.new(params[:username])
    if !validator.valid_format?
      render json: {errors: validator.errors}
    elsif !SiteSetting.call_discourse_hub?
      if User.username_available?(username)
        render json: {available: true}
      else
        render json: {available: false, suggestion: UserNameSuggester.suggest(params[:username])}
      end
    else

      # Contact the Discourse Hub server
      email_given = (params[:email].present? || target_user.present?)
      available_locally = User.username_available?(params[:username])
      global_match = false
      available_globally, suggestion_from_discourse_hub = begin
        if email_given
          global_match, available, suggestion = DiscourseHub.nickname_match?( params[:username], params[:email] || target_user.email )
          [available || global_match, suggestion]
        else
          DiscourseHub.nickname_available?(params[:username])
        end
      end

      if available_globally && available_locally
        render json: {available: true, global_match: (global_match ? true : false)}
      elsif available_locally && !available_globally
        if email_given
          # Nickname and email do not match what's registered on the discourse hub.
          render json: {available: false, global_match: false, suggestion: suggestion_from_discourse_hub}
        else
          # The nickname is available locally, but is registered on the discourse hub.
          # We need an email to see if the nickname belongs to this person.
          # Don't give a suggestion until we get the email and try to match it with on the discourse hub.
          render json: {available: false}
        end
      elsif available_globally && !available_locally
        # Already registered on this site with the matching nickname and email address. Why are you signing up again?
        render json: {available: false, suggestion: UserNameSuggester.suggest(params[:username])}
      else
        # Not available anywhere.
        render json: {available: false, suggestion: suggestion_from_discourse_hub}
      end

    end
  rescue RestClient::Forbidden
    render json: {errors: [I18n.t("discourse_hub.access_token_problem")]}
  end

  def create
    return fake_success_response if suspicious? params

    user = User.new_from_params(params)
    
    user.username = params[:username].gsub(/(\W|\d)/,'')
    
    resp = HTTParty.get("https://vaynerpeople.herokuapp.com/api/users/find?email=#{user.email.downcase}&token=cqOR1F80vsKOGndLWS7ekg").parsed_response['user']
        
    user.update_attributes(:teams => resp['teams'], 
                               :position => resp['function'],
                               :short_position => VmUserService.short_position(resp['function']))
    if user.fact_one.nil?                        
       user.update_attributes(:fact_one => resp['fact_one'], 
                               :fact_two => resp['fact_two'],
                               :fact_three => resp['fact_three'])
    end

    auth = session[:authentication]
    if valid_session_authentication?(auth, params[:email])
      user.active = true
    end
    # user.password_required! unless auth

    if user.valid? && SiteSetting.call_discourse_hub?
      DiscourseHub.register_nickname(user.username, user.email)
    end


    if user.save
      activator = UserActivator.new(user, session, cookies)
      message = activator.activation_message
      create_third_party_auth_records(user, auth) if auth.present?

      # Clear authentication session.
      session[:authentication] = nil

      render json: { success: true, active: user.active?, message: message }
    else
      render json: {
        success: false,
        message: I18n.t("login.errors", errors: user.errors.full_messages.join("\n")),
        errors: user.errors.to_hash,
        values: user.attributes.slice("name", "username", "email")
      }
    end
  rescue ActiveRecord::StatementInvalid
    render json: { success: false, message: I18n.t("login.something_already_taken") }
  rescue DiscourseHub::NicknameUnavailable
    render json: { success: false,
      message: I18n.t(
        "login.errors",
        errors:I18n.t(
          "login.not_available", suggestion: UserNameSuggester.suggest(params[:username])
        )
    )
    }
  rescue RestClient::Forbidden
    render json: { errors: [I18n.t("discourse_hub.access_token_problem")] }
  end

  def authenticate_user(user, params)
    auth = session[:authentication]
    if valid_session_authentication?(auth, params[:email])
      user.active = true
    end
    user.password_required! unless auth

    auth
  end

  def get_honeypot_value
    render json: {value: honeypot_value, challenge: challenge_value}
  end
  
  def custom_avatar_upload
    user = fetch_user_from_params
    file = params[:file] || params[:files].first
    upload = Upload.create_for(user.id, file)
    user.update_attribute(:custom_avatar_url, upload.url)
    render_serialized(upload, UploadSerializer, root: false)
  end

  def password_reset
    expires_now()

    @user = EmailToken.confirm(params[:token])
    if @user.blank?
      flash[:error] = I18n.t('password_reset.no_token')
    else
      if request.put? && params[:password].present?
        @user.password = params[:password]
        if @user.save

          if Guardian.new(@user).can_access_forum?
            # Log in the user
            log_on_user(@user)
            flash[:success] = I18n.t('password_reset.success')
          else
            @requires_approval = true
            flash[:success] = I18n.t('password_reset.success_unapproved')
          end
        end
      end
    end
    render layout: 'no_js'
  end

  def change_email
    params.require(:email)
    user = fetch_user_from_params
    guardian.ensure_can_edit!(user)
    lower_email = Email.downcase(params[:email]).strip

    # Raise an error if the email is already in use
    if User.where("email = ?", lower_email).exists?
      raise Discourse::InvalidParameters.new(:email)
    end

    email_token = user.email_tokens.create(email: lower_email)
    Jobs.enqueue(
      :user_email,
      to_address: lower_email,
      type: :authorize_email,
      user_id: user.id,
      email_token: email_token.token
    )

    render nothing: true
  end

  def authorize_email
    expires_now()
    if @user = EmailToken.confirm(params[:token])
      log_on_user(@user)
    else
      flash[:error] = I18n.t('change_email.error')
    end
    render layout: 'no_js'
  end

  def activate_account
    expires_now()
    if @user = EmailToken.confirm(params[:token])

      # Log in the user unless they need to be approved
      if Guardian.new(@user).can_access_forum?
        @user.enqueue_welcome_message('welcome_user') if @user.send_welcome_message
        log_on_user(@user)
      else
        @needs_approval = true
      end

    else
      flash[:error] = I18n.t('activation.already_done')
    end
    render layout: 'no_js'
  end

  def send_activation_email
    @user = fetch_user_from_params
    @email_token = @user.email_tokens.unconfirmed.active.first
    if @user
      @email_token ||= @user.email_tokens.create(email: @user.email)
      Jobs.enqueue(:user_email, type: :signup, user_id: @user.id, email_token: @email_token.token)
    end
    render nothing: true
  end

  def search_users
    term = params[:term].to_s.strip
    topic_id = params[:topic_id]
    topic_id = topic_id.to_i if topic_id

    results = UserSearch.search term, topic_id

    render json: { users: results.as_json(only: [ :username, :name, :use_uploaded_avatar, :upload_avatar_template, :uploaded_avatar_id],
                                          methods: :avatar_template) }
  end

  # [LEGACY] avatars in quotes/oneboxes might still be pointing to this route
  # fixing it requires a rebake of all the posts
  def avatar
    user = User.where(username_lower: params[:username].downcase).first
    if user.present?
      size = determine_avatar_size(params[:size])
      url = user.avatar_template.gsub("{size}", size.to_s)
      expires_in 1.day
      redirect_to url
    else
      raise ActiveRecord::RecordNotFound
    end
  end

  def determine_avatar_size(size)
    size = size.to_i
    size = 64 if size == 0
    size = 10 if size < 10
    size = 128 if size > 128
    size
  end

  def upload_avatar
    user = fetch_user_from_params
    guardian.ensure_can_edit!(user)

    file = params[:file] || params[:files].first

    # check the file size (note: this might also be done in the web server)
    filesize = File.size(file.tempfile)
    max_size_kb = SiteSetting.max_image_size_kb * 1024
    return render status: 413, text: I18n.t("upload.images.too_large", max_size_kb: max_size_kb) if filesize > max_size_kb

    upload = Upload.create_for(user.id, file, filesize)

    user.uploaded_avatar = upload
    user.use_uploaded_avatar = true
    user.save!

    Jobs.enqueue(:generate_avatars, upload_id: upload.id)

    render json: { url: upload.url }

  rescue FastImage::ImageFetchFailure
    render status: 422, text: I18n.t("upload.images.fetch_failure")
  rescue FastImage::UnknownImageType
    render status: 422, text: I18n.t("upload.images.unknown_image_type")
  rescue FastImage::SizeNotFound
    render status: 422, text: I18n.t("upload.images.size_not_found")
  end

  def toggle_avatar
    params.require(:use_uploaded_avatar)
    user = fetch_user_from_params
    guardian.ensure_can_edit!(user)

    user.use_uploaded_avatar = params[:use_uploaded_avatar]
    user.save!

    render nothing: true
  end

  private

    def honeypot_value
      Digest::SHA1::hexdigest("#{Discourse.current_hostname}:#{Discourse::Application.config.secret_token}")[0,15]
    end

    def challenge_value
      '3019774c067cc2b'
    end

    def suspicious?(params)
      honeypot_or_challenge_fails?(params) || SiteSetting.invite_only?
    end

    def fake_success_response
      render(
        json: {
          success: true,
          active: false,
          message: I18n.t("login.activate_email", email: params[:email])
        }
      )
    end

    def honeypot_or_challenge_fails?(params)
      params[:password_confirmation] != honeypot_value ||
      params[:challenge] != challenge_value.try(:reverse)
    end

    def valid_session_authentication?(auth, email)
      auth && auth[:email] == email && auth[:email_valid]
    end

    def create_third_party_auth_records(user, auth)
      if twitter_auth?(auth)
        TwitterUserInfo.create(
          user_id: user.id,
          screen_name: auth[:twitter_screen_name],
          twitter_user_id: auth[:twitter_user_id]
        )
      end

      if facebook_auth?(auth)
        FacebookUserInfo.create!(auth[:facebook].merge(user_id: user.id))
      end

      if github_auth?(auth)
        GithubUserInfo.create(
          user_id: user.id,
          screen_name: auth[:github_screen_name],
          github_user_id: auth[:github_user_id]
        )
      end

      if oauth2_auth?(auth)
        Oauth2UserInfo.create(
          uid: auth[:oauth2][:uid],
          provider: auth[:oauth2][:provider],
          name: auth[:name],
          email: auth[:email],
          user_id: user.id
        )
      end
    end

    def twitter_auth?(auth)
      auth[:twitter_user_id] && auth[:twitter_screen_name] &&
      TwitterUserInfo.find_by_twitter_user_id(auth[:twitter_user_id]).nil?
    end

    def facebook_auth?(auth)
      auth[:facebook].present? &&
      FacebookUserInfo.find_by_facebook_user_id(auth[:facebook][:facebook_user_id]).nil?
    end

    def github_auth?(auth)
      auth[:github_user_id] && auth[:github_screen_name] &&
      GithubUserInfo.find_by_github_user_id(auth[:github_user_id]).nil?
    end

    def oauth2_auth?(auth)
      auth[:oauth2].is_a?(Hash) && auth[:oauth2][:provider] && auth[:oauth2][:uid] &&
      Oauth2UserInfo.where(provider: auth[:oauth2][:provider], uid: auth[:oauth2][:uid]).empty?
    end
end
