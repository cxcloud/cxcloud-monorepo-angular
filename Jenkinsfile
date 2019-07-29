def currentNamespace = [
    'pr' :         env.BRANCH_NAME.toLowerCase(),
    'staging' :    'staging',
    'production' : 'www'
]
def currentNamespaceURL = ''
def secretSource = 'applications'
def defaultAWSRegion = 'eu-west-1'
def firstCommit = ''
def nameSpaceExists = 'false'
def flowMessage = ''
def gitUrl = ''
def branchName = ''
def brnachDescription = ''
def lastComitter = ''
def lastCommitMessage = ''
def comitterAvatar = ''
def protocol = 'https://'
def ingressClass = ''
def lbCert = ''
def lbScheme = ''
def cpuRequest = ''
def instanceGroup = ''
def minReplicas = 1
def maxReplicas = 40
def repositoryUri = ''

def isBaseBranch() {
    return (env.BRANCH_NAME == "master")
}

def isPR() {
    return (env.BRANCH_NAME ==~ /^PR-\d+$/)
}

def isReleaseTag() {
    return (env.TAG_NAME != null)
}

def isOnlyBranch() {
    return !(isBaseBranch() || isPR() || isReleaseTag())
}

def getDeploymentEnvironment() {
    if (isPR()) {
        return 'pr'
    } else if (isBaseBranch()) {
        return 'staging'
    } else if (isReleaseTag()) {
        return 'production'
    } else {
        return 'branch'
    }
}

def getPRState(pr) {
    withCredentials([
        [$class: 'UsernamePasswordMultiBinding', credentialsId:'cxcloud-git', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN'],
    ]) {
        def gitOwnerRepo = sh(
            script: "git remote -v | grep fetch | grep -oP \"(?<=github.com/).*(?=\\.git)\"",
            returnStdout: true
        ).trim()
        return sh(
            script: "curl -s --user '${GIT_USER}:${GIT_TOKEN}' 'https://api.github.com/repos/${gitOwnerRepo}/pulls/${pr}' | jq -r .state",
            returnStdout: true
        ).trim()
    }
}

def updateDomainName(oldSubDomain, newSubDomain, protocol) {
    echo 'replace domain name in .cxcloud.yaml'
    sh "yq w -i .cxcloud.yaml routing.domain \$(yq r .cxcloud.yaml routing.domain | sed s/${oldSubDomain}/${newSubDomain}/)"
    return sh (
        script: "echo -n '${protocol}' && yq r .cxcloud.yaml routing.domain",
        returnStdout: true
    ).trim().toLowerCase()
}

def getAllProjects(path) {
    return sh (
        script: "find ${path} -maxdepth 3 -name .cxcloud.yaml -exec dirname {} \\;",
        returnStdout: true
    ).trim()
}

def getModifiedProjects(fromCommit) {
    return sh (
        script: "detectModifiedProjects.sh .cxcloud.yaml ${fromCommit} HEAD",
        returnStdout: true
    ).trim()
}

def getShortHash() {
    return sh (
        script: "git rev-parse --short HEAD",
        returnStdout: true
    ).trim()
}

def deployProjects(projects, namespace, ecrRepository, buildNumber, AWSRegion, cpuRequest, instanceGroup, ingressClass, lbScheme, lbCert, minReplicas, maxReplicas) {
    if (projects != "") {
        sh """
            echo \"${projects}\" | xargs -n 1 -I % bash -c \
            \"cd % && \
              GIT_BRANCH='${namespace}' \
              APP_VERSION='${namespace}-${buildNumber}' \
              ECR_REPOSITORY='${ecrRepository}' \
              AWS_DEFAULT_REGION='${AWSRegion}' \
              CPU_REQUEST='${cpuRequest}' \
              INSTANCE_GROUP='${instanceGroup}' \
              INGRESS_CLASS='${ingressClass}' \
              SCHEME='${lbScheme}' \
              LB_CERT='${lbCert}' \
              MIN_REPLICAS='${minReplicas}' \
              MAX_REPLICAS='${maxReplicas}' \
              cxcloud deploy\"
        """
    } else {
        echo "Nothing to deploy"
    }
}

def getACMCertificateARN(domainName, awsRegion) {
  return sh (
        script: "aws acm list-certificates --region ${awsRegion} \
          | jq -r '.CertificateSummaryList[] | select(.DomainName == \"${domainName}\") | .CertificateArn'",
        returnStdout: true
    ).trim()
}

def getReportTaskValue(project, key) {
  return sh (
        script: """val=\$(cat ${project}/.scannerwork/report-task.txt | grep ${key})
            echo \${val#*=}
        """,
        returnStdout: true
    ).trim()
}

pipeline {
    agent {
        node {
            label 'cxcloud'
        }
    }

    stages {
        stage('Check namespace') {
            when {
                expression {
                    !isOnlyBranch()
                }
            }
            steps {
                echo 'Cheking if Kubernetes namespace exists'
                script {
                    // if (isBaseBranch()) {
                    //     currentNamespace = "staging"
                    // }
                    // if (isReleaseTag()) {
                    //     currentNamespace = "www"
                    // }
                    try {
                        sh "kubectl get namespace -namespace ${currentNamespace[getDeploymentEnvironment()]}"
                        echo 'Kubernetes namespace exists'
                        nameSpaceExists = 'true'
                    } catch (err) {
                        echo 'Kubernetes namespace doesn`t seem to exist'
                        return true
                    }
                }
            }
        }

        stage('Set variables') {
            parallel {
                stage('For pull requests') {
                    when {
                        expression {
                            isPR()
                        }
                    }
                    steps {
                        script {
                            branchName = pullRequest.headRef
                            currentNamespaceURL = updateDomainName('\\$GIT_BRANCH', currentNamespace, protocol)
                            flowMessage = "<b>" + pullRequest.title + "</b><p>" + pullRequest.body + "</p>"
                            gitUrl = pullRequest.url
                            branchDescription = pullRequest.headRef + " (" + currentNamespace + ")"
                            for (commit in pullRequest.commits) {
                                if (firstCommit == '') {
                                    firstCommit = commit.sha
                                }
                                lastComitter = commit.committer
                                lastCommitMessage = commit.message
                            }
                            comitterAvatar = "https://avatars.githubusercontent.com/${lastComitter}?size=128"
                            ingressClass = 'nginx'
                            lbCert = getACMCertificateARN('*.dev.demo.cxcloud.com', defaultAWSRegion)
                            lbScheme = 'internal'
                            cpuRequest = '250m'
                            instanceGroup = 'application'
                            repositoryUri = '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images'
                        }
                    }
                }
                stage('For branches') {
                    when {
                        expression {
                            !isPR()
                        }
                    }
                    steps {
                        script {
                            branchName = env.BRANCH_NAME
                            currentNamespaceURL = updateDomainName('\\$GIT_BRANCH.dev', currentNamespace, protocol)
                            lastCommitMessage = sh (
                                script: 'git log -1 --pretty=%B',
                                returnStdout: true
                            ).trim()
                            gitUrl = env.GIT_URL
                            lastComitter = 'Jenkins'
                            comitterAvatar = 'https://wiki.jenkins.io/download/attachments/2916393/headshot.png?version=1&modificationDate=1302753947000&api=v2'
                        }
                    }
                }
                stage('For staging') {
                    when {
                        expression {
                            isBaseBranch()
                        }
                    }
                    steps {
                        script {
                            flowMessage = "Pushed to ${currentNamespace}"
                            branchDescription = env.BRANCH_NAME
                            ingressClass = 'nginx'
                            lbCert = getACMCertificateARN('*.demo.cxcloud.com', defaultAWSRegion)
                            lbScheme = 'internal'
                            cpuRequest = '250m'
                            instanceGroup = 'application'
                            repositoryUri = '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images'
                        }
                    }
                }
                stage('For production') {
                    when {
                        expression {
                            isReleaseTag()
                        }
                    }
                    steps {
                        script {
                            flowMessage = "Deployed tagged version, ${env.BRANCH_NAME} to Production"
                            branchDescription = "Production (${env.BRANCH_NAME})"
                            ingressClass = 'alb'
                            lbCert = getACMCertificateARN('demo.cxcloud.com', defaultAWSRegion)
                            lbScheme = 'internet-facing'
                            cpuRequest = '333m'
                            instanceGroup = 'application'
                            minReplicas = 2
                            repositoryUri = '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            when {
                expression {
                    !isReleaseTag()
                }
            }
            steps {
                script {
                    def projects = ''
                    if (isPR()) {
                        projects = getModifiedProjects(firstCommit).split()
                    } else {
                        projects = getAllProjects('*').split()
                    }
                    for (project in projects) {
                        if (project == ".") {
                            continue
                        }
                        echo "Running tests for ${project}"
                        sh "cd ${project} && npm install"
                        sh "cd ${project} && npm test"
                    }
                }
            }
        }

        // stage('SonarQube analysis') {
        //     when {
        //         expression {
        //             !isReleaseTag()
        //         }
        //     }
        //     steps {
        //         script {
        //             def projects = ''
        //             def projectName = ''
        //             if (isPR()) {
        //                 projects = getModifiedProjects(firstCommit).split()
        //             } else {
        //                 projects = getAllProjects('*').split()
        //             }
        //             for (project in projects) {
        //                 if (project == ".") {
        //                     continue
        //                 }
        //                 projectName = sh (
        //                     script: "echo \$(basename ${project})",
        //                     returnStdout: true
        //                 ).trim()
        //                 withSonarQubeEnv('SonarQube') {
        //                     sh """cd ${project}
        //                         sonar-scanner \
        //                             -Dsonar.projectKey=\"${projectName}-${branchName}\" \
        //                             -Dsonar.projectName=\"${projectName} (${branchName})\"
        //                     """
        //                 }
        //             }
        //         }
        //     }
        // }

        // stage('SonarQube Quality Gate') {
        //     when {
        //         expression {
        //             isBaseBranch() || isPR()
        //         }
        //     }
        //     steps {
        //         script {
        //             def qualityGateError = false
        //             def projects = ''
        //             if (isPR()) {
        //                 projects = getModifiedProjects(firstCommit).split()
        //             } else {
        //                 projects = getAllProjects('*').split()
        //             }
        //             for (project in projects) {
        //                 if (project == ".") {
        //                     continue
        //                 }
        //                 def ceTaskUrl = getReportTaskValue(project, 'ceTaskUrl')
        //                 def dashboardUrl = getReportTaskValue(project, 'dashboardUrl')
        //                 def status = sh (
        //                     script: "curl -s ${ceTaskUrl} | jq -r .task.status",
        //                     returnStdout: true
        //                 ).trim()
        //                 if (status != "SUCCESS") {
        //                     qualityGateError = true
        //                     if (isPR()) {
        //                         pullRequest.comment(
        //                             """Pipeline failed due to SorarQube quality gate failure!
        //                                 ${dashboardUrl}
        //                             """
        //                         )
        //                     }
        //                 }
        //             }
        //             if (qualityGateError == true) {
        //                 error "Pipeline failed due to SorarQube quality gate failure"
        //             }
        //         }
        //     }
        // }

        stage('Create namespace') {
            when {
                expression {
                    !isOnlyBranch() && nameSpaceExists == 'false'
                }
            }
            steps {
                sh "kubectl create namespace ${currentNamespace}"
            }
        }

        stage('Copy namespace secrets to DEV/TEST environment') {
            when {
                expression {
                    isPR()
                }
            }
            steps {
                script {
                    sh """
                        kubectl get secret --no-headers -n ${secretSource} | grep -v 'default-' | awk {'print \$1'} | xargs -I % bash -c \
                        'kubectl get secret % --export -o yaml -n ${secretSource} | yq w - metadata.namespace \"${currentNamespace}\" | kubectl apply -f -'
                    """
                }
            }
        }

        stage ('Deploy') {
            parallel {

                stage('DEV/TEST') {
                    when {
                        expression {
                            isPR()
                        }
                    }
                    steps {
                        script {
                            def shortHash = getShortHash()
                            def projects = ''
                            if (nameSpaceExists == 'true') {
                                echo 'Only deploying modified services'
                                def projects = getModifiedProjects(firstCommit)
                            } else {
                                echo 'Deploying all projects'
                                def projects = getAllProjects('.')
                            }
                            deployProjects(
                                modifiedProjects,
                                currentNamespace,
                                repositoryUri,
                                "${BUILD_NUMBER}-${shortHash}",
                                defaultAWSRegion,
                                cpuRequest,
                                instanceGroup,
                                ingressClass,
                                lbScheme,
                                lbCert,
                                minReplicas,
                                maxReplicas
                            )
                            if (nameSpaceExists != 'true') {
                                echo 'Writing URL of Kubernetes namespace as a comment'
                                pullRequest.comment("Environment is available here: $currentNamespaceURL")
                            }
                        }
                    }
                }

                stage('Staging') {
                    when {
                        expression {
                            isBaseBranch()
                        }
                    }
                    steps {
                        script {
                            echo "Deploying master branch to staging"
                            def projects = getAllProjects('.')
                            def shortHash = getShortHash()
                            deployProjects(
                              projects,
                              currentNamespace,
                              repositoryUri,
                              "${BUILD_NUMBER}-${shortHash}",
                              defaultAWSRegion,
                              cpuRequest,
                              instanceGroup,
                              ingressClass,
                              lbScheme,
                              lbCert,
                              minReplicas,
                              maxReplicas)
                        }
                    }
                }

                stage('Production') {
                    when {
                        expression {
                            isReleaseTag()
                        }
                    }
                    steps {
                        script {
                            echo "Deploying tagged branch, ${currentNamespace} to production"
                            sh "yq d -i .cxcloud.yaml routing.domain"
                            def nrOfPaths = sh (
                                script: "yq r .cxcloud.yaml 'routing.rules[*].path' | wc -l",
                                returnStdout: true
                            ).trim().toInteger()
                            for (int i = 0; i < nrOfPaths; i++) {
                              sh "yq w -i .cxcloud.yaml 'routing.rules[${i}].path' \"\$(yq r .cxcloud.yaml 'routing.rules[${i}].path')*\""
                            }
                            
                            def projects = getAllProjects('.')
                            deployProjects(
                              projects,
                              currentNamespace,
                              repositoryUri,
                              BRANCH_NAME,
                              defaultAWSRegion,
                              cpuRequest,
                              instanceGroup,
                              ingressClass,
                              lbScheme,
                              lbCert,
                              minReplicas,
                              maxReplicas)
                        }
                    }
                }
            }
        }

        stage('Cleanup development environments') {
            when {
                expression {
                    isBaseBranch()
                }
            }
            steps {
                script {
                    echo "Get development environments"
                    def devEnvs = sh (
                        script: "kubectl get namespaces | grep -oP '(?<=pr-)[0-9]*' || true",
                        returnStdout: true
                    ).trim().split()
                    for (pr in devEnvs) {
                        def state = getPRState(pr)
                        if (state == 'closed') {
                            echo "Deleting namespace pr-${pr}"
                            sh "kubectl delete namespace pr-${pr}"
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            script {
                if (!isOnlyBranch()) {
                    withCredentials([string(credentialsId: 'notify-flowdock', variable: 'TOKEN')]) {
                        sh """flowdock -t \"\$TOKEN\" \
                            -m \"${flowMessage}\" \
                            -j \"${env.RUN_DISPLAY_URL}\" \
                            -g \"${gitUrl}\" \
                            -b \"${branchDescription}\" \
                            -s \"SUCCESS\" \
                            -c \"green\" \
                            -n \"${lastComitter}\" \
                            -a \"${comitterAvatar}\" \
                            -x \"${lastCommitMessage}\" \
                            -e \"${currentNamespaceURL}\"
                        """
                    }
                }
            }
        }
        failure {
            script {
                if (!isOnlyBranch()) {
                    withCredentials([string(credentialsId: 'notify-flowdock', variable: 'TOKEN')]) {
                        sh """flowdock -t \"\$TOKEN\" \
                            -m \"${flowMessage}\" \
                            -j \"${env.RUN_DISPLAY_URL}\" \
                            -g \"${gitUrl}\" \
                            -b \"${branchDescription}\" \
                            -s \"FAILURE\" \
                            -c \"red\" \
                            -n \"${lastComitter}\" \
                            -a \"${comitterAvatar}\" \
                            -x \"${lastCommitMessage}\" \
                            -e \"${currentNamespaceURL}\"
                        """
                    }
                    if (nameSpaceExists == 'false') {
                        sh "kubectl delete namespace ${currentNamespace}"
                    }
                }
            }
        }
    }
}
