desc "pull users from vaynernet API"
task "vm:users:pull" => :environment do
  resp = HTTParty.get('https://vaynerpeople.herokuapp.com/api/users/all?token=cqOR1F80vsKOGndLWS7ekg').parsed_response
  resp.each do |u|
    User.create(:email => resp['email'],
                :teams => resp['teams'],
                :name => resp['full_name'],
                :position => resp['function'],
                :username => resp['full_name'].gsub(' ',''),
                :password => '373parkavenue',
                :short_position => VmUserService.short_position(resp['function']),
                :start_date => resp['start_date']                
                )
  end
end

#[{"id":168,"full_name":"Max Bass","email":"mbass@vaynermedia.com","function":"Micro-Content Producer",
# "avatar_file_name":"photo.jpeg",
# "pages":["311620902935","68680511262","26426125254","260431051694","111562862219231"],
# "teams":"Brisk, NFL, Brooklyn Nets, PepsiCo, and Barclays Center"}

desc 'update user info nightly'
task "vm:users:update" => :environment do
  User.all.each do |u|
    resp = HTTParty.get("https://vaynerpeople.herokuapp.com/api/users/find?email=#{u.email}&token=cqOR1F80vsKOGndLWS7ekg").parsed_response['user']
    u.update_attributes(:teams => resp['teams'], :position => resp['function'], :start_date => resp['start_date'] )
  end
end

desc 'create vaynerversary alerts'
task "vm:users:vaynerversary" => :environment do
  date = Date.new(2013, 2, 11)  #Time.now.in_time_zone('Eastern Time (US & Canada)').to_date
    if date.wday == 1
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) <= ? AND EXTRACT(DAY FROM start_date) >= ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) != ?", date.day, (date - 1.day).day, date.month, date.year)
    elsif date.wday == 5
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) <= ? AND EXTRACT(DAY FROM start_date) >= ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) != ?", (date + 1.day).day, date.day, date.month, date.year)
    else 
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) = ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) != ?", date.day, date.month, date.year)
    end
  usernames = @anniversaries.collect{|u| u.username }
  
  sam = User.find_by_email('sam@vaynermedia.com')
  
  post = PostCreator.create(sam, {:raw => 'Celebrate the Vaynerversary of ' + usernames.map{|u| '@' + u}.to_sentence + '!',
              :title => 'Happy Vaynerversary to ' + usernames.to_sentence + '!',
              :archetype => 'regular'})
  
  
  User.all.each do |u|
  puts 'before: ' + u.unread_alerts.to_s

    u.alerts.create(:alert_type => 3,
                    :topic_id => post.topic.id,
                    :post_number => 1,
                    :message => post.topic.title,
                    :data => { topic_title: post.topic.title}.to_json)
  # MessageBus.publish("/alert/#{post.topic_id}",
  #                     id: post.id,
  #                     created_at: post.created_at,
  #                     user: BasicUserSerializer.new(post.user).as_json(root: false),
  #                     post_number: post.post_number)                  
  puts 'after: ' + u.unread_alerts.to_s                  
  puts "\n\n\n"

puts 'pub'
    MessageBus.publish("/alert/#{u.id}",
        { unread_alerts: u.unread_alerts },
        user_ids: [u.id] # only publish the notification to this user
      ) 
  end
  
end













