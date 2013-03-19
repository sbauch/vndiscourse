class ChangeTeamArrayToString < ActiveRecord::Migration
  def up
    change_column :users, :teams, :string
  end

  def down
  end
end
