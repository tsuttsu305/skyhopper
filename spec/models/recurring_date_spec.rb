#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require_relative '../spec_helper'

RSpec.describe RecurringDate, type: :model do
  it "is valid with valid attributes" do
    expect(RecurringDate.new).to be_valid
  end
end
