class CreateAlerts < ActiveRecord::Migration
  def change
    create_table :alerts do |t|
      t.integer :alert_type, null: false
      t.references :user, null: false
      t.string :data, null: false
      t.boolean :read, default: false, null: false
      t.timestamps
    end
    add_index :alerts, [:user_id, :created_at]
  end
end
