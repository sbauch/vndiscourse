class AddSeenNotificationIdToUsers < ActiveRecord::Migration
  def change
    add_column :users, :seen_alert_id, :integer, default: 0, null: false
    add_column :alerts, :topic_id, :integer, null: true
    add_column :alerts, :post_number, :integer, null: true
    add_column :alerts, :post_action_id, :integer, null: true
    add_index :alerts, :post_action_id
  end
end
