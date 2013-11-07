class TeamsController < ApplicationController
  
  def create
    team = Team.new(:name => params[:team][:name])
    if team.save
      format.json { render json: {}, status: :ok }
    else
      format.json { render json: {}, status: :error }
    end    
  end  
  
  def update
    team = Team.where(:name => params[:old_name])
    team.update_attribute(:name, params[:team][:name])
    if team.save
      format.json { render json: {}, status: :ok }
    else
      format.json { render json: {}, status: :error }
    end    
    
  end
  
  def destroy
    team = Team.find(:name => params[:name])
    team.destroy
    format.json { render json: {}, status: :ok }
  end
end