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
                :short_position => VmUserService.short_position(resp['function'])                
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
    u.update_attributes(:teams => resp['teams'], :position => resp['function'])
  end
end