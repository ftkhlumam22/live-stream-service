pipeline {
    agent any
    environment {
        VPS_HOST = '31.59.129.150'  // IP Address VPS Andagit reset --soft HEAD~1 
        IMAGE_NAME = 'data'
        VERSION = '0.0.6'
        CONTAINER_NAME = 'fajar_service_container' // Name of the container you will use
    }
    stages {
        stage('Connect to VPS & Clone Repo') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ssh-password', variable: 'SSH_PASSWORD')]) {
                        // SSH ke VPS dan clone repository ke server
                        sh """
                        sshpass -p \$SSH_PASSWORD ssh -o StrictHostKeyChecking=no root@${VPS_HOST} << EOF
                        if [ -d "fajar-service" ]; then
                            rm -rf fajar-service
                        fi
                        git clone ${REPO_URL}
                        """
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ssh-password', variable: 'SSH_PASSWORD')]) {
                        sh """
                        sshpass -p \$SSH_PASSWORD ssh -o StrictHostKeyChecking=no root@${VPS_HOST} << EOF
                        cd fajar-service
                        # Build image baru dengan tag
                        docker build -t ${IMAGE_NAME}:v${VERSION} .
                        """
                    }
                }
            }
        }
        stage('Force Remove Existing Container') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ssh-password', variable: 'SSH_PASSWORD')]) {
                        sh """
                        sshpass -p \$SSH_PASSWORD ssh -o StrictHostKeyChecking=no root@${VPS_HOST} << EOF
                        echo "Removing existing container if it exists..."
                        docker rm -f ${CONTAINER_NAME} || echo "No existing container to remove."
                        """
                    }
                }
            }
        }
        stage('Deploy New Docker Image') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ssh-password', variable: 'SSH_PASSWORD')]) {
                        sh """
                        sshpass -p \$SSH_PASSWORD ssh -o StrictHostKeyChecking=no root@${VPS_HOST} << EOF
                        echo "Running new container from image..."
                        docker run -d --restart always -p 3003:3000 --name ${CONTAINER_NAME} ${IMAGE_NAME}:v${VERSION}
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            // Membersihkan workspace setelah job selesai
            cleanWs()
        }
    }
}
