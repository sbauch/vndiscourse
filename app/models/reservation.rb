class Reservation < ActiveRecord::Base
  attr_accessible :status, :topic_id, :user_id
  belongs_to :user
  belongs_to :topic
  
  scope :registered, where(:status => 'registered')
  scope :waitlisted, where(:status => 'waitlisted')
  
  scope :attended, where(:status => 'attended')
  scope :absent, where(:status => 'absent')
  
end
