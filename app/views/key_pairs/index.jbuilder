key_pairs = []

project = Project.find(@project_id)

AWS::Regions.each do |region|
  ec2 = Aws::EC2::Client.new(
    access_key_id:     project.access_key,
    secret_access_key: project.secret_access_key,
    region:            region
  )

  response = ec2.describe_instances
  using_keys = response.reservations.map { |e| e.instances[0].key_name }

  response = ec2.describe_key_pairs
  response.key_pairs.each do |key_pair|
    using = using_keys.include?(key_pair.key_name)
    key_pairs << KeyPair.new(key_pair.key_name, key_pair.key_fingerprint, region, using)
  end
end

json.key_pairs key_pairs
