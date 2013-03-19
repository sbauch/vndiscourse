desc "pull users from vaynernet API"
task "vm:userspull" => :environment do
  resp = HTTParty.get('https://vaynerpeople.herokuapp.com/api/users/all?token=cqOR1F80vsKOGndLWS7ekg').parsed_response
  resp.each do |u|
    User.create(:email => u['email'],
                :teams => u['teams'],
                :name => u['full_name'],
                :position => u['function'],
                :username => u['full_name'].gsub(' ',''),
                :password => '373parkavenue'                
                )
  end
end

#[{"id":168,"full_name":"Max Bass","email":"mbass@vaynermedia.com","function":"Micro-Content Producer",
# "avatar_file_name":"photo.jpeg",
# "pages":["311620902935","68680511262","26426125254","260431051694","111562862219231"],
# "teams":"Brisk, NFL, Brooklyn Nets, PepsiCo, and Barclays Center"}