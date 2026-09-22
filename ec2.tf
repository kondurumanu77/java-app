resource "aws_instance" "devops_vm" {

  ami           = "ami-0126975fb247bf2e7"
  instance_type = "c7i-flex.large"
  key_name      = "Bastion"

  subnet_id              = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.devops_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.devops_vm.name

  associate_public_ip_address = true

  tags = {
    Name = "DevOps-Agent"
  }

  depends_on = [
    aws_eks_node_group.main
  ]

  #############################################
  # WAIT FOR SSH
  #############################################
  provisioner "remote-exec" {
    inline = [
      "echo 'Waiting for instance to be ready...'",
      "sleep 60"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("${path.module}/Bastion.pem")
      host        = self.public_ip
      timeout     = "5m"
    }
  }

  #############################################
  # COPY SCRIPT
  #############################################
  provisioner "file" {
    source      = "install.sh"
    destination = "/home/ubuntu/install.sh"

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("${path.module}/Bastion.pem")
      host        = self.public_ip
    }
  }

  #############################################
  # EXECUTE SCRIPT
  #############################################
  provisioner "remote-exec" {
    inline = [
      "chmod +x /home/ubuntu/install.sh",
      "sudo /home/ubuntu/install.sh"
    ]

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = file("${path.module}/Bastion.pem")
      host        = self.public_ip
    }
  }
}