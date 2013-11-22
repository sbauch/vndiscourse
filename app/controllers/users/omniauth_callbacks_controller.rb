# -*- encoding : utf-8 -*-
require_dependency 'email'
require_dependency 'enum'
require_dependency 'user_name_suggester'

class Users::OmniauthCallbacksController < ApplicationController

  BUILTIN_AUTH = [
    Auth::FacebookAuthenticator.new,
    Auth::OpenIdAuthenticator.new("google", "https://www.google.com/accounts/o8/id", trusted: true),
    Auth::OpenIdAuthenticator.new("yahoo", "https://me.yahoo.com", trusted: true),
    Auth::GithubAuthenticator.new,
    Auth::TwitterAuthenticator.new,
    Auth::PersonaAuthenticator.new,
    Auth::CasAuthenticator.new
  ]

  skip_before_filter :redirect_to_login_if_required

  layout false

  def self.types
    @types ||= Enum.new(:facebook, :twitter, :google, :yahoo, :github, :persona, :cas)
  end

  # need to be able to call this
  skip_before_filter :check_xhr

  # this is the only spot where we allow CSRF, our openid / oauth redirect
  # will not have a CSRF token, however the payload is all validated so its safe
  skip_before_filter :verify_authenticity_token, only: :complete

  def complete
    auth = request.env["omniauth.auth"]
    auth[:session] = session

    authenticator = self.class.find_authenticator(params[:provider])

    @data = authenticator.after_authenticate(auth)
    @data.authenticator_name = authenticator.name

    if @data.user
      user_found(@data.user)
    elsif SiteSetting.invite_only?
      @data.requires_invite = true
    else
      session[:authentication] = @data.session_data
    end

    respond_to do |format|
      format.html
      format.json { render json: @data.to_client_hash }
    end
  end

  def failure
    flash[:error] = I18n.t("login.omniauth_error", strategy: params[:strategy].titleize)
    render layout: 'no_js'
  end


  def self.find_authenticator(name)
    BUILTIN_AUTH.each do |authenticator|
      if authenticator.name == name
        raise Discourse::InvalidAccess.new("provider is not enabled") unless SiteSetting.send("enable_#{name}_logins?")
        return authenticator
      end
    end

    Discourse.auth_providers.each do |provider|
      return provider.authenticator if provider.name == name
    end

    raise Discourse::InvalidAccess.new("provider is not found")
  end


  def create_or_sign_on_user_using_openid(auth_token)

    data = auth_token[:info]
    identity_url = auth_token[:extra][:identity_url]

    email = data[:email].downcase

    # If the auth supplies a name / username, use those. Otherwise start with email.
    name = data[:name] || data[:email]
    username = (data[:nickname] || data[:email]).gsub(/(\W|\d)/,'')
    
    
    
    resp = HTTParty.get("https://vaynerpeople.herokuapp.com/api/users/find?email=#{email.downcase}&token=cqOR1F80vsKOGndLWS7ekg").parsed_response['user']
    user_open_id = UserOpenId.find_by_url(identity_url)

    if user_open_id.blank? && user = User.find_by_email(email)
      # we trust so do an email lookup
      # TODO some openid providers may not be trust worthy, allow for that
      #  for now we are good (google, yahoo are trust worthy)
      user_open_id = UserOpenId.create(url: identity_url , user_id: user.id, email: email, active: true)
    end

    authenticated = user_open_id # if authed before
    
    if authenticated
      user = user_open_id.user

      # If we have to approve users
      if Guardian.new(user).can_access_forum?
        log_on_user(user)
        
        @data = {authenticated: true}
      else
        @data = {awaiting_approval: true}
      end

    else
      @data = {
        email: email,
        name: resp['full_name'],
        username: resp['full_name'].gsub(/(\W|\d)/,''),
        email_valid: true ,
        auth_provider: data[:provider] || params[:provider].try(:capitalize),
        teams: resp['teams'], 
        position: resp['function'],
        short_position: VmUserService.short_position(resp['function']),
        fact_one: resp['fact_one'], 
        fact_two: resp['fact_two'],
        fact_three: resp['fact_three']
      }
      session[:authentication] = {
        email: @data[:email],
        email_valid: @data[:email_valid],
        openid_url: identity_url
      }
    end
    puts @data
    @data.to_json
  end

  protected

  def user_found(user)
    # automatically activate any account if a provider marked the email valid
    if !user.active && @data.email_valid
      user.toggle(:active).save
    end

    # log on any account that is active with forum access
    if Guardian.new(user).can_access_forum? && user.active
      log_on_user(user)
      # don't carry around old auth info, perhaps move elsewhere
      session[:authentication] = nil
      @data.authenticated = true
    else
      if SiteSetting.must_approve_users? && !user.approved?
        @data.awaiting_approval = true
      else
        @data.awaiting_activation = true
      end
    end
  end

end
