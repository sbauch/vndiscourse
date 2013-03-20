class AddShortPositionToUser < ActiveRecord::Migration
  def change
    add_column :users, :short_position, :string
    add_index :users, :short_position
    add_index :users, :position
    add_index :users, :teams
  end
end
