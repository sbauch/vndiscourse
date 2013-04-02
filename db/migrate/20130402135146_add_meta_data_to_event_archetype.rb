class AddMetaDataToEventArchetype < ActiveRecord::Migration
  def change
    add_column :topics, :starts_at, :datetime
    add_column :topics, :ends_at, :datetime
    add_column :topics, :location, :string
  end
end
