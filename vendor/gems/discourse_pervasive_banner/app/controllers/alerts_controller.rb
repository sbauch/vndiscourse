class AlertsController < ApplicationController

  # before_filter :ensure_logged_in, :except => :create
  def index
    #TODO: prioritization of alerts
    alerts = current_user.alerts.unread.includes(:topic).first
    # current_user.reload
    current_user.publish_alerts_state

    render_serialized(alerts, AlertSerializer, :root => false)
  end
  
  def create
    User.all.each do |u|
      u.alerts.create(:alert_type => params[:type],
                      :topic_id => params[:topic_id],
                      :post_number => 1,
                      :message => params[:topic_title],
                      :data => { topic_title: params[:topic_title]}.to_json)
      end                
      render :nothing => true
      #=> #<Alert id: nil, alert_type: nil, user_id: nil, data: nil, read: false, created_at: nil, updated_at: nil, topic_id: nil, post_number: nil, message: nil>

  end
  
  def update
    @alert = Alert.find(params[:id])
    @alert.update_attribute(:read, true)
    current_user.publish_notifications_state
    render :nothing => true
  end  

end
