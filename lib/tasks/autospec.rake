# I like guard, don't get me wrong, but it is just not working right
# architectually it can not do what I want it to do, this is how I want
# it to behave

desc "Run all specs automatically as needed"
task "autospec" => :environment do

  if RUBY_PLATFORM.include?('linux')
    require 'rb-inotify'
  end

  require 'listen'

  puts "If file watching is not working you can force polling with: bundle exec rake autospec p l=3"
  require 'autospec/runner'

  force_polling = ARGV.any?{|a| a == "p" || a == "polling"}
  latency = ((ARGV.find{|a| a =~ /l=|latency=/}||"").split("=")[1] || 3).to_i

  if force_polling
    puts "polling has been forced (slower) checking every #{latency} #{"second".pluralize(latency)}"
  end

  Autospec::Runner.run(force_polling: force_polling, latency: latency)
end
