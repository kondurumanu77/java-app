# VPC
resource "aws_vpc" "devops_vpc" {
  cidr_block           = "192.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "DevOps-VPC"
  }
}

#################################
# PUBLIC SUBNET 1
#################################

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.devops_vpc.id
  cidr_block              = "192.0.7.0/24"
  availability_zone       = "ap-northeast-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "DevOps-Public-Subnet-1"
  }
}

#################################
# PUBLIC SUBNET 2
#################################

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.devops_vpc.id
  cidr_block              = "192.0.8.0/24"
  availability_zone       = "ap-northeast-1c"
  map_public_ip_on_launch = true

  tags = {
    Name = "DevOps-Public-Subnet-2"
  }
}

#################################
# INTERNET GATEWAY
#################################

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.devops_vpc.id

  tags = {
    Name = "DevOps-IGW"
  }
}

#################################
# ROUTE TABLE
#################################

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.devops_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "DevOps-RouteTable"
  }
}

#################################
# ROUTE TABLE ASSOCIATION 1
#################################

resource "aws_route_table_association" "rt_association_1" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

#################################
# ROUTE TABLE ASSOCIATION 2
#################################

resource "aws_route_table_association" "rt_association_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}