class VmUserService
  class << self
    
    def pull_details(user)
      resp = HTTParty.get("https://vaynerpeople.herokuapp.com/api/users/find?email=#{user.email}&token=cqOR1F80vsKOGndLWS7ekg").parsed_response['user']
      unless resp.nil?
        user.update_attributes(:teams => resp['teams'],
                               :position => resp['function'],
                               :short_position => short_position(resp['function']))
      end
    end
    
    def short_position(position)
      case position
        when 'Group Director'
          "GD"
        when 'Account Supervisor'
          "AS"
        when 'Account Manager'
          "AM"
        when "Account Executive"  
          "AE"
        when "Assistant Account Executive"
          "AAE"
        when "Micro-Content Producer"    
          "MCP"
        when "Micro-Content Director"
          "MCD" 
        when "Community Manager"
          "CM"
        when "Senior Strategist" || "Strategist" || "Associate Strategist" || "Internal Strategist" || "Directory of Strategy"
          "Strat"
        when "Manager of Emerging Technology"
          "VC"
        when "Development Coordinator"
          "DC"
        when "PR Specialist"
          "PR"
        when "Ad Planner" || "Media Supervisor"
          "Ad"
        when "Analyst" || "Analytics Manager"
          "Analyst"     
        when "Director of Human Resources"
          "HR"
        when "Controller"
          "Controller"
        when "General Counsel"
          "Lawyer"
        when "Co-founder"
          "Founder"
        when "Senior Vice President"
          "SVP"
        when "Vice President, Group Creative Director" || "Vice President, Production" || "Vice President, Technology"
          "VP"                       
        when "Copywriter" || "Junior Copywriter" || "Senior Copywriter"
          "Copy"
        when "Designer" || "Junior Designer" || "Senior Designer" || "User Experience Lead" || "Multimedia Designer" || "Presentation Designer"
          "Designer"
        when "Art Director" || "Senior Art Director"
          "AD"
        when "Associate Creative Director"
          "ACD"
        when "Chief Technology Officer"
          "CTO"
        when "Developer"
          "Dev"
        when "Director of Core Product"
          "Po"
        when "Project Manager"               
          "PM"
        when "Associate Project Manager"
          "APM" 
        when "Chief Financial Officer"
          "CFO"
        when "Engagement OFficer"
          "EM"
        when "Creative Director"
          "CD"       
      end    
    end
  end
end