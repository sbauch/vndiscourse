class AddVnFieldsToUSer < ActiveRecord::Migration
  def change
    add_column :users, :position, :string
    add_column :users, :teams, :text, :default => [] 
  end
end
