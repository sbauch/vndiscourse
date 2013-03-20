class DirectoryUserSerializer < ActiveModel::Serializer
  
  attributes :name, :position, :email, :short_position, :teams, :username, :username_lower, :avatar_template
  
end