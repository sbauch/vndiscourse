# The most basic attributes of a topic that we need to create a link for it.
class BasicPostSerializer < ApplicationSerializer
  attributes :id,
             :name,
             :username,
             :avatar_template,
             :created_at,
             :cooked

  def name
    object.user.try(:name)
  end

  def username
    object.user.try(:username)
  end

  def avatar_template
    object.user.try(:avatar_template)
  end

  def cooked
    if object.hidden && !scope.is_staff?
      if scope.current_user && object.user_id == scope.current_user.id
        I18n.t('flagging.you_must_edit')
      else
        I18n.t('flagging.user_must_edit')
      end
    else
      object.filter_quotes(@parent_post)
    end
  end

  def include_name?
    SiteSetting.enable_names?
  end

end
