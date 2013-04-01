class CreateReservations < ActiveRecord::Migration
  def change
    create_table :reservations do |t|
      t.integer :user_id
      t.integer :topic_id
      t.string :status

      t.timestamps
    end
  end
end
