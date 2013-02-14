class DirectoriesController < ApplicationController
  def index
    @users = User.all
    render_serialized(@users, AdminUserSerializer)
  end
end
