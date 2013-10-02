worker: bundle exec sidekiq
web: bundle exec puma -p $PORT -e $RAILS_ENV -t 0:5
clockwork: bundle exec clockwork config/clock.rb