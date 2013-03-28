class AddFactsToUser < ActiveRecord::Migration
  def change
    add_column :users, :fact_one, :text
    add_column :users, :fact_two, :text
    add_column :users, :fact_three, :text
  end
end
