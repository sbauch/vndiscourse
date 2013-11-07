class Team < ActiveRecord::Base
  attr_accessible :name
  
  before_destroy :remove_from_user_teams
  
  
  def remove_from_user_teams
    User.all.each do |u|
      teams = u.team_hash
      team_hash = teams.delete_if{|id,name| id == self.id}
      u.team_hash = team_hash
      u.teams = u.team_hash.collect{|k,v| v }.to_sentence
      u.save
    end    
  end  
  
  
end
