require 'spec_helper'
require_dependency 'jobs/base'

describe Jobs::InviteEmail do

  context '.execute' do

    it 'raises an error when the invite_id is missing' do
      lambda { Jobs::InviteEmail.new.execute({}) }.should raise_error(Discourse::InvalidParameters)
    end

    context 'with an invite id' do

      let (:mailer) { Mail::Message.new(to: 'eviltrout@test.domain') }
      let (:invite) { Fabricate(:invite) }

      it 'delegates to the test mailer' do
        Email::Sender.any_instance.expects(:send)
        InviteMailer.expects(:send_invite).with(invite).returns(mailer)
        Jobs::InviteEmail.new.execute(invite_id: invite.id)
      end

    end

  end


end

