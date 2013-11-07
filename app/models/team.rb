class Team < ActiveRecord::Base
  attr_accessible :name
  
  before_destroy :remove_from_user_teams
  
  
  def remove_from_user_teams
    User.all.each do |u|
      u.teams_hash = u.teams_hash.delete_if{|id,name| id == self.id}
      u.teams = u.teams_hash.collect{|k,v| v }.to_sentence
      u.save
    end    
  end  
  
  
end
