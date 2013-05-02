class CreateTags < ActiveRecord::Migration
  def change
    create_table :tags do |t|
      t.string :term
      t.integer :count, :default => 0

      t.timestamps
    end
  end
end
