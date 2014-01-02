require_dependency 'screening_model'

# A ScreenedIpAddress record represents an IP address or subnet that is being watched,
# and possibly blocked from creating accounts.
class ScreenedIpAddress < ActiveRecord::Base

  include ScreeningModel

  default_action :block

  validates :ip_address, ip_address_format: true, presence: true

  def self.watch(ip_address, opts={})
    match_for_ip_address(ip_address) || create(opts.slice(:action_type).merge(ip_address: ip_address))
  end

  # In Rails 4.0.0, validators are run to handle invalid assignments to inet columns (as they should).
  # In Rails 4.0.1, an exception is raised before validation happens, so we need this hack for
  # inet/cidr columns:
  def ip_address=(val)
    write_attribute(:ip_address, val)

  # this gets even messier, Ruby 1.9.2 raised a different exception to Ruby 2.0.0
  # handle both exceptions
  rescue ArgumentError, IPAddr::InvalidAddressError
    self.errors.add(:ip_address, :invalid)
  end

  def self.match_for_ip_address(ip_address)
    # The <<= operator on inet columns means "is contained within or equal to".
    #
    # Read more about PostgreSQL's inet data type here:
    #
    #   http://www.postgresql.org/docs/9.1/static/datatype-net-types.html
    #   http://www.postgresql.org/docs/9.1/static/functions-net.html
    where("'#{ip_address.to_s}' <<= ip_address").first
  end

  def self.should_block?(ip_address)
    exists_for_ip_address_and_action?(ip_address, actions[:block])
  end

  def self.is_whitelisted?(ip_address)
    exists_for_ip_address_and_action?(ip_address, actions[:do_nothing])
  end

  def self.exists_for_ip_address_and_action?(ip_address, action_type)
    b = match_for_ip_address(ip_address)
    b.record_match! if b
    !!b and b.action_type == action_type
  end
end

# == Schema Information
#
# Table name: screened_ip_addresses
#
#  id            :integer          not null, primary key
#  ip_address    :inet             not null
#  action_type   :integer          not null
#  match_count   :integer          default(0), not null
#  last_match_at :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
# Indexes
#
#  index_screened_ip_addresses_on_ip_address     (ip_address) UNIQUE
#  index_screened_ip_addresses_on_last_match_at  (last_match_at)
#
