def currentNamespace = [
    'pr' :         env.BRANCH_NAME.toLowerCase(),
    'staging' :    'staging',
    'production' : 'www'
]
def currentNamespaceURL = ''
def secretSource = 'applications'
def defaultAWSRegion = [
    'pr' :         'eu-west-1',
    'staging' :    'eu-west-1',
    'production' : 'eu-west-1'
]
def oldSubDomainInYaml = [
    'pr' :         '\\$GIT_BRANCH',
    'staging' :    '\\$GIT_BRANCH.dev',
    'production' : '\\$GIT_BRANCH.dev'
]
def protocol = [
    'pr' :         'https://',
    'staging' :    'https://',
    'production' : 'https://'
]
def certificateACM = [
    'pr' :         '*.dev.demo.cxcloud.com',
    'staging' :    '*.demo.cxcloud.com',
    'production' : 'demo.cxcloud.com'
]
def firstCommit = ''
def namespaceExists = false
def flowMessage = [
    'pr' :         '',
    'staging' :    "Pushed to ${getDeploymentEnvironment()}",
    'production' : "Deployed tagged version, ${env.BRANCH_NAME} to Production"
]
def gitUrl = ''
def branchName = ''
def branchDescription = [
    'pr' :         '',
    'staging' :    env.BRANCH_NAME,
    'production' : "Production (${env.BRANCH_NAME})"
]
def lastComitter = ''
def lastCommitMessage = ''
def comitterAvatar = ''
def lbCert = ''
def ingressClass = [
    'pr' :         'nginx',
    'staging' :    'nginx',
    'production' : 'alb'
]
def lbScheme = [
    'pr' :         'internal',
    'staging' :    'internet-facing',
    'production' : 'internet-facing'
]
def cpuRequest = [
    'pr' :         '250m',
    'staging' :    '250m',
    'production' : '333m'
]
def instanceGroup = [
    'pr' :         'application',
    'staging' :    'application',
    'production' : 'application'
]
def minReplicas = [
    'pr' :         1,
    'staging' :    2,
    'production' : 2
]
def maxReplicas = [
    'pr' :         40,
    'staging' :    40,
    'production' : 40
]
def repositoryUri = [
    'pr' :         '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images',
    'staging' :    '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images',
    'production' : '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images'
]

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
        stage('Set variables') {
            parallel {
              stage('For all') {
                    steps {
                        script {
                            namespaceExists = sh (
                                script: "kubectl get namespace -namespace ${currentNamespace[getDeploymentEnvironment()]}",
                                returnStatus: true
                            ) == 0
                            currentNamespaceURL = updateDomainName(
                                oldSubDomainInYaml[getDeploymentEnvironment()],
                                currentNamespace[getDeploymentEnvironment()],
                                protocol[getDeploymentEnvironment()]
                            )
                            lbCert = getACMCertificateARN(
                                certificateACM[getDeploymentEnvironment()],
                                defaultAWSRegion[getDeploymentEnvironment()]
                            )
                        }
                    }
                }
                stage('For pull requests') {
                    when {
                        expression {
                            isPR()
                        }
                    }
                    steps {
                        script {
                            branchName = pullRequest.headRef
                            flowMessage['pr'] = "<b>" + pullRequest.title + "</b><p>" + pullRequest.body + "</p>"
                            gitUrl = pullRequest.url
                            branchDescription['pr'] = pullRequest.headRef + " (" + currentNamespace[getDeploymentEnvironment()] + ")"
                            for (commit in pullRequest.commits) {
                                if (firstCommit == '') {
                                    firstCommit = commit.sha
                                }
                                lastComitter = commit.committer
                                lastCommitMessage = commit.message
                            }
                            comitterAvatar = "https://avatars.githubusercontent.com/${lastComitter}?size=128"
                        }
                    }
                }
                stage('For normal branches') {
                    when {
                        expression {
                            !isPR()
                        }
                    }
                    steps {
                        script {
                            branchName = env.BRANCH_NAME
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
                    !isOnlyBranch() && namespaceExists == false
                }
            }
            steps {
                sh "kubectl create namespace ${currentNamespace[getDeploymentEnvironment()]}"
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
                        'kubectl get secret % --export -o yaml -n ${secretSource} | yq w - metadata.namespace \"${currentNamespace[getDeploymentEnvironment()]}\" | kubectl apply -f -'
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
                            if (namespaceExists == true) {
                                echo 'Only deploying modified services'
                                projects = getModifiedProjects(firstCommit)
                            } else {
                                echo 'Deploying all projects'
                                projects = getAllProjects('.')
                            }
                            deployProjects(
                                projects,
                                currentNamespace[getDeploymentEnvironment()],
                                repositoryUri[getDeploymentEnvironment()],
                                "${BUILD_NUMBER}-${shortHash}",
                                defaultAWSRegion[getDeploymentEnvironment()],
                                cpuRequest[getDeploymentEnvironment()],
                                instanceGroup[getDeploymentEnvironment()],
                                ingressClass[getDeploymentEnvironment()],
                                lbScheme[getDeploymentEnvironment()],
                                lbCert,
                                minReplicas[getDeploymentEnvironment()],
                                maxReplicas[getDeploymentEnvironment()]
                            )
                            if (namespaceExists != true) {
                                echo 'Writing URL of Kubernetes namespace as a comment'
                                pullRequest.comment("Environment is available here: ${currentNamespaceURL}")
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
                              currentNamespace[getDeploymentEnvironment()],
                              repositoryUri[getDeploymentEnvironment()],
                              "${BUILD_NUMBER}-${shortHash}",
                              defaultAWSRegion[getDeploymentEnvironment()],
                              cpuRequest[getDeploymentEnvironment()],
                              instanceGroup[getDeploymentEnvironment()],
                              ingressClass[getDeploymentEnvironment()],
                              lbScheme[getDeploymentEnvironment()],
                              lbCert,
                              minReplicas[getDeploymentEnvironment()],
                              maxReplicas[getDeploymentEnvironment()])
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
                            echo "Deploying tagged branch, ${currentNamespace[getDeploymentEnvironment()]} to production"
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
                              currentNamespace[getDeploymentEnvironment()],
                              repositoryUri[getDeploymentEnvironment()],
                              BRANCH_NAME,
                              defaultAWSRegion[getDeploymentEnvironment()],
                              cpuRequest[getDeploymentEnvironment()],
                              instanceGroup[getDeploymentEnvironment()],
                              ingressClass[getDeploymentEnvironment()],
                              lbScheme[getDeploymentEnvironment()],
                              lbCert,
                              minReplicas[getDeploymentEnvironment()],
                              maxReplicas[getDeploymentEnvironment()])
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
                            -m \"${flowMessage[getDeploymentEnvironment()]}\" \
                            -j \"${env.RUN_DISPLAY_URL}\" \
                            -g \"${gitUrl}\" \
                            -b \"${branchDescription[getDeploymentEnvironment()]}\" \
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
                            -m \"${flowMessage[getDeploymentEnvironment()]}\" \
                            -j \"${env.RUN_DISPLAY_URL}\" \
                            -g \"${gitUrl}\" \
                            -b \"${branchDescription[getDeploymentEnvironment()]}\" \
                            -s \"FAILURE\" \
                            -c \"red\" \
                            -n \"${lastComitter}\" \
                            -a \"${comitterAvatar}\" \
                            -x \"${lastCommitMessage}\" \
                            -e \"${currentNamespaceURL}\"
                        """
                    }
                    if (namespaceExists == false) {
                        sh "kubectl delete namespace ${currentNamespace[getDeploymentEnvironment()]}"
                    }
                }
            }
        }
    }
}
