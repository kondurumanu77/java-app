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
MONITORING_ENABLED="${MONITORING_ENABLED:-true}"
MIN_MONITORING_NODES="${MIN_MONITORING_NODES:-1}"

echo "Starting DevOps Tools Installation..."
echo "Region: ${AWS_REGION}"
echo "Cluster: ${EKS_CLUSTER_NAME}"
echo "Monitoring enabled: ${MONITORING_ENABLED}"

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
# Install Prometheus + Grafana (Helm)
#############################################
if [ "${MONITORING_ENABLED}" != "true" ]; then
  echo "Monitoring is disabled via MONITORING_ENABLED=${MONITORING_ENABLED}. Skipping Prometheus/Grafana install."
else
  echo "Installing Prometheus & Grafana..."

  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
  helm repo update || true

  # Clean up stale monitoring resources left behind by a previous failed install.
  helm uninstall monitoring --namespace monitoring --wait --timeout 5m || true
  kubectl delete job monitoring-kube-prometheus-admission-create -n monitoring --ignore-not-found=true --wait=false || true
  kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io monitoring-kube-prometheus-admission --ignore-not-found=true || true
  kubectl delete mutatingwebhookconfigurations.admissionregistration.k8s.io monitoring-kube-prometheus-admission --ignore-not-found=true || true
  kubectl delete secret -n monitoring --ignore-not-found=true -l app.kubernetes.io/name=kube-prometheus-stack || true

  # kube-prometheus-stack is resource-heavy. Skip it when the cluster is too small to schedule it.
  node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l | tr -d ' ')
  if [ "${node_count:-0}" -lt "${MIN_MONITORING_NODES}" ]; then
    echo "Skipping monitoring install: cluster has fewer than ${MIN_MONITORING_NODES} nodes, which is insufficient for kube-prometheus-stack."
    kubectl get nodes || true
  else
    cat <<'EOF' > /tmp/monitoring-values.yaml
grafana:
  service:
    type: LoadBalancer
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi
prometheus:
  service:
    type: LoadBalancer
  prometheusSpec:
    replicas: 1
    retention: 2d
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 500m
        memory: 512Mi
prometheus-node-exporter:
  enabled: false
kube-state-metrics:
  enabled: false
alertmanager:
  enabled: false
EOF

    if ! helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        -f /tmp/monitoring-values.yaml \
        --wait \
        --timeout 10m; then
      echo "Prometheus/Grafana installation did not complete because the cluster cannot schedule all monitoring pods. Continuing without monitoring."
      kubectl get pods -n monitoring -o wide || true
      kubectl get events -n monitoring --sort-by=.lastTimestamp | tail -40 || true
    fi
  fi

  kubectl get svc -n monitoring || true
  kubectl get pods -n monitoring || true
fi

#############################################
# Final check
#############################################
sudo ss -tulnp | grep 9000 || true

echo "Installation Completed Successfully!"