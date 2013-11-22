require_dependency 'enum_site_setting'

class S3RegionSiteSetting < EnumSiteSetting
  def self.valid_value?(val)
    valid_values.include? val
  end

  def self.values
    @values ||= valid_values.sort.map {|x| {name: x, value: x} }
  end

  private

  def self.valid_values
    [ '',
      'us-east-1',
      'us-west-1',
      'us-west-2',
      'eu-west-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-northeast-1',
      'sa-east-1' ]
  end
end
