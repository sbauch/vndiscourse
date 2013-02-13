class DirectoriesController < ApplicationController
  def index
    @users = User.all
    render_json_dump(@users)
  end
end
