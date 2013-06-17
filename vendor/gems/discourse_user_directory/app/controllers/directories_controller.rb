class DirectoriesController < ApplicationController
  def index
    if params[:filter].present?
      if params[:filter] == 'show-me-all'
        @users = User.order('username ASC') 
      else     
        params[:filter].split(' ').each do |filter|
          @users = User.order("COALESCE(last_seen_at, to_date('1970-01-01', 'YYYY-MM-DD')) DESC, username") unless !@users.nil?
          @users = @users.where('active IS TRUE AND (username_lower ilike :filter or name ilike :filter or teams ilike :filter or position ilike :filter or short_position ilike :filter)', filter: "%#{filter}%")   
        end
      end
    else
      @users = User.order("COALESCE(last_seen_at, to_date('1970-01-01', 'YYYY-MM-DD')) DESC, username").limit(20)
    end    
    render :json => @users.each.map{|u| DirectoryUserSerializer.new(u, :root => false)}.to_json
  end
end
