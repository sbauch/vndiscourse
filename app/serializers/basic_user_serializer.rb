class BasicUserSerializer < ApplicationSerializer
  attributes :id, :username, :avatar_template, :custom_avatar_url
end
