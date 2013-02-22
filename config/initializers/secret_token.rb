
# Definitely change this when you deploy to production. Ours is replaced by jenkins.
# This token is used to secure sessions, we don't mind shipping with one to ease test and debug,
#  however, the stock one should never be used in production, people will be able to crack 
#  session cookies. 
#
# Generate a new secret with "rake secret".  Copy the output of that command and paste it
# in your secret_token.rb as the value of Discourse::Application.config.secret_token:
#
# Discourse::Application.config.secret_token = "SET_SECRET_HERE" 

# delete all lines below in production
if Rails.env.test? || Rails.env.development? 
  Discourse::Application.config.secret_token = "47f5390004bf6d25bb97083fb98e7cc133ab450ba814dd19638a78282b4ca291" 
else 
  raise "You must set a secret token in config/initializers/secret_token.rb"
end

