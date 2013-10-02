class TeamsController < ApplicationController
  
  def create
    team = Team.new(:name => params[:team][:name])
    if team.save
      format.json { render json: {}, status: :ok }
    else
      format.json { render json: {}, status: :error }
    end    
  end  
  
  
end