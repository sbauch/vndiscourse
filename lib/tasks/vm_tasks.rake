desc "pull teams from vaynernet API"
task "vm:teamss:pull" => :environment do
  resp = HTTParty.get('https://vaynerpeople.herokuapp.com/api/teams?token=cqOR1F80vsKOGndLWS7ekg').parsed_response['teams']
  resp.each do |t|
    Team.find_or_create_by_name(t['name'])
  end
end


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
  User.where(:active => true).each do |u|
    begin
    resp = HTTParty.get("https://vaynerpeople.herokuapp.com/api/users/find?email=#{u.email}&token=cqOR1F80vsKOGndLWS7ekg").parsed_response['user']
    u.update_attributes(:teams => resp['teams'], :position => resp['function'], :start_date => resp['start_date'], :short_position => VmUserService.short_position(resp['function']) )
    rescue
      puts u
    end  
  end
end

  desc 'create vaynerversary alerts'
  task "vm:users:vaynerversary" => :environment do
  date = Time.now.in_time_zone('Eastern Time (US & Canada)').to_date
    if date.wday == 1
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) <= ? AND EXTRACT(DAY FROM start_date) >= ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) != ? AND active = TRUE", date.day, (date - 1.day).day, date.month, date.year)
    elsif date.wday == 5
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) <= ? AND EXTRACT(DAY FROM start_date) >= ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) != ? AND active = TRUE", (date + 1.day).day, date.day, date.month, date.year)
    elsif date.wday == (0 || 6)
      @anniveraaries = []
    else   
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) = ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) != ? AND active = TRUE", date.day, date.month, date.year)
    end
  
    unless @anniversaries.empty?
      usernames = @anniversaries.select{|u| u.active == true }.collect{|u| u.username }
    
      sam = User.find_by_email('sam@vaynermedia.com')
  
      post = PostCreator.create(sam, {:raw => 'Celebrate the Vaynerversary of ' + usernames.map{|u| '@' + u}.to_sentence + '!',
                  :title => 'Happy Vaynerversary to ' + usernames.to_sentence + '!',
                  :archetype => 'regular'})
  
  
      User.all.each do |u|
        u.alerts.create(:alert_type => 3,
                        :topic_id => post.topic.id,
                        :post_number => 1,
                        :message => post.topic.title,
                        :data => { topic_title: post.topic.title}.to_json)              
      
        u.publish_alerts_state                                              
      end
    end
  end
  
  desc 'create new employee alerts'
  task "vm:users:new_employees" => :environment do
  date = Time.now.in_time_zone('Eastern Time (US & Canada)').to_date
    if date.wday == 1
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) <= ? AND EXTRACT(DAY FROM start_date) >= ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) = ?", date.day, (date - 1.day).day, date.month, date.year)
    elsif date.wday == 5
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) <= ? AND EXTRACT(DAY FROM start_date) >= ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) = ?", (date + 1.day).day, date.day, date.month, date.year)
    elsif date.wday == (0 || 6)
      @anniveraaries = []
    else   
      @anniversaries = User.where("EXTRACT(DAY FROM start_date) = ? AND EXTRACT(MONTH FROM start_date) = ? AND EXTRACT(YEAR FROM start_date) = ?", date.day, date.month, date.year)
    end
  
    unless @anniversaries.empty?
      usernames = @anniversaries.collect{|u| u.username }
    
      sam = User.find_by_email('sam@vaynermedia.com')
  
      post = PostCreator.create(sam, {:raw => 'Welcome your new teammates ' + usernames.map{|u| '@' + u}.to_sentence + '!',
                  :title => 'Welcome to the team ' + usernames.to_sentence + '!',
                  :archetype => 'regular'})
  
  
      User.all.each do |u|
        u.alerts.create(:alert_type => 3,
                        :topic_id => post.topic.id,
                        :post_number => 1,
                        :message => post.topic.title,
                        :data => { topic_title: post.topic.title}.to_json)
      
        u.publish_alerts_state                              
                      
      end
    end  
  end













