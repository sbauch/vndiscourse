class AlertsController < ApplicationController

  before_filter :ensure_logged_in
#TODO: user isntance methods, serializer
  def index
    alerts = current_user.alerts.recent.includes(:topic).all
    current_user.saw_alert_id(alerts.first.id) if alerts.present?
    current_user.reload
    current_user.publish_notifications_state

    render_serialized(alerts, AlertSerializer)
  end

end
