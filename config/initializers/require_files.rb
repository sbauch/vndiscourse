require 'jobs'
require 'jobs/user_email'
Dir["#{Rails.root}/lib/jobs/*"].each {|file| require file }
Dir["#{Rails.root}/lib/jobs/*"].each {|file| require_dependency file }
Dir["#{Rails.root}/lib/services/*.rb"].each {|file| require file }
