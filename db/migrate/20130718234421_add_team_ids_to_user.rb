class AddTeamIdsToUser < ActiveRecord::Migration
  def change
    add_column :users, :team_hash, :text, :default => {}
  end
end
