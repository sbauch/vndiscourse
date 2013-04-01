class AddAttendeesToTopics < ActiveRecord::Migration
  def change
    add_column :topics, :attendee_limit, :integer
    add_column :topics, :attendee_count, :integer
  end
end
