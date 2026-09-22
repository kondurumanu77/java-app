#!/bin/bash

# Stop script only for critical errors
set -e
set -x

# Log everything
sudo touch /var/log/install-script.log
sudo chmod 666 /var/log/install-script.log
exec > /var/log/install-script.log 2>&1

#############################################
# Variables
#############################################
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
EKS_CLUSTER_NAME="${EKS_CLUSTER_NAME:-ips-cluster}"

echo "Starting DevOps Tools Installation..."
echo "Region: ${AWS_REGION}"
echo "Cluster: ${EKS_CLUSTER_NAME}"

#############################################
# Wait for instance to be fully ready
#############################################
sleep 40

#############################################
# Update system
#############################################
sudo apt-get update -y
sudo apt-get upgrade -y

#############################################
# Install Docker
#############################################
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

# Wait for docker
sleep 15
sudo docker --version

#############################################
# Install AWS CLI v2
#############################################
sudo apt-get install -y unzip curl

curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo ./aws/install

export PATH=$PATH:/usr/local/bin
aws --version

#############################################
# Install basic tools
#############################################
sudo apt-get install -y wget curl gnupg software-properties-common \
apt-transport-https ca-certificates

#############################################
# Install Trivy
#############################################
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key \
| sudo gpg --dearmor -o /usr/share/keyrings/trivy.gpg

echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" \
| sudo tee /etc/apt/sources.list.d/trivy.list

sudo apt-get update -y
sudo apt-get install -y trivy

#############################################
# Install kubectl
#############################################
curl -LO "https://dl.k8s.io/release/$(curl -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

chmod +x kubectl
sudo mv kubectl /usr/local/bin/

kubectl version --client || true

#############################################
# Install Helm
#############################################
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm version || true

#############################################
# Run SonarQube container
#############################################
sudo systemctl restart docker
sleep 10

sudo docker run -d --name sonarqube -p 9000:9000 sonarqube:lts || true

#############################################
# Connect to EKS (this should NOT break script)
#############################################
echo "Connecting to EKS..."

aws eks update-kubeconfig --region "${AWS_REGION}" --name "${EKS_CLUSTER_NAME}" || true

kubectl get nodes || true

#############################################
# Final check
#############################################
sudo ss -tulnp | grep 9000 || true

echo "Installation Completed Successfully!"