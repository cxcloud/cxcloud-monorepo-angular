// MIT License
// Copyright (c) 2019 CXCloud

// Namespace to use for the build
def currentNamespace = [
    'pr'         : env.BRANCH_NAME.toLowerCase(),
    'staging'    : 'staging',
    'production' : 'www'
]

// AWS region to deploy to
def defaultAWSRegion = [
    'pr'         : 'eu-west-1',
    'staging'    : 'eu-west-1',
    'production' : 'eu-west-1'
]

// Subdomain value that we want to replace for routing.domain in the .cxcloud.yaml routing section
def oldSubDomainInYaml = [
    'pr'         : '\\$GIT_BRANCH',
    'staging'    : '\\$GIT_BRANCH.dev.demo',
    'production' : '\\$GIT_BRANCH.dev.demo'
]

// New subdomain value that we want to replace to for routing.domain in the .cxcloud.yaml routing section
def newSubDomainInYaml = [
    'pr'         : env.BRANCH_NAME.toLowerCase(),
    'staging'    : 'demo',
    'production' : 'www'
]

// Protocol to use for url
def protocol = [
    'pr'         : 'https://',
    'staging'    : 'https://',
    'production' : 'https://'
]

// ACM certificate to use for alb ingress controller
def certificateACM = [
    'pr'         : '*.dev.demo.cxcloud.com',
    'staging'    : '*.dev.demo.cxcloud.com',
    'production' : 'demo.cxcloud.com'
]

// Message for flowdock notifications
def flowMessage = [
    'pr'         : '',
    'staging'    : "Pushed to ${getDeploymentEnvironment()}",
    'production' : "Deployed tagged version, ${env.BRANCH_NAME} to Production"
]

// Branch description for flowdock notifications
def branchDescription = [
    'pr'         : '',
    'staging'    : env.BRANCH_NAME,
    'production' : "Production (${env.BRANCH_NAME})"
]

// Ingress class to use for the deployment
def ingressClass = [
    'pr'         : 'nginx',
    'staging'    : 'nginx-public',
    'production' : 'alb'
]

// ELB scheme, internal or internet-facing
def lbScheme = [
    'pr'         : 'internal',
    'staging'    : 'internet-facing',
    'production' : 'internet-facing'
]

// CPU request per deployed pod
def cpuRequest = [
    'pr'         : '250m',
    'staging'    : '250m',
    'production' : '333m'
]

// kops instance group to use for the deployments
def instanceGroup = [
    'pr'         : 'application',
    'staging'    : 'application',
    'production' : 'application'
]

// Minimum amount of pods per service
def minReplicas = [
    'pr'         : 1,
    'staging'    : 2,
    'production' : 2
]

// Maximum amount of pods per service
def maxReplicas = [
    'pr'         : 40,
    'staging'    : 40,
    'production' : 40
]

// ECR repository for the docker images (services deployed)
def repositoryUri = [
    'pr'         : '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images',
    'staging'    : '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images',
    'production' : '307365680736.dkr.ecr.eu-west-1.amazonaws.com/cxcloud-images'
]

// Should host based routing be used.
// If false, routing.domain will be deleted from the .cxcloud.yaml file
def useHostRouting = [
    'pr'         : true,
    'staging'    : true,
    'production' : false
]

// Has the namespace already been created for the deployment (will be populated later)
def namespaceExists     = false

// Url to service (will be populated later)
def currentNamespaceURL = ''

// Kubernetes secrets will be copied from this namespace into pull request namespaces
def secretSource        = 'applications'

// Url to git branch / pr (will be populated later)
def gitUrl              = ''

// Name of the branch (will be populated later)
def branchName          = ''

// User who wrote the last commit message (will be populated later)
def lastComitter        = ''

// Message for the last commit (will be populated later)
def lastCommitMessage   = ''

// IMG url to the users GitHub avatar (will be populated later)
def comitterAvatar      = ''

// ARN to the ACM load valancer certificate (will be populated later)
def lbCert              = ''

// A list for projects that need to be tested / analyzed or deployed (will be populated later)
def projects            = []

// Is the pipeline triggered from the base branch
def isBaseBranch() {
    return (env.BRANCH_NAME == "master")
}

// Is the pipeline triggered from a GitHub Pull Request
def isPR() {
    return (env.BRANCH_NAME ==~ /^PR-\d+$/)
}

// Is the pipeline triggered from a git tag (e.g release tag in GitHub)
def isReleaseTag() {
    return (env.TAG_NAME != null)
}

// Is pipeline triggered from a normal just a branch
def isOnlyBranch() {
    return !(isBaseBranch() || isPR() || isReleaseTag())
}

// Get deplopyment environment (needed for variables)
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

// Get the state for a pull request (open/closed etc)
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

// Update the subdomain name in .cxcloud.yaml and return the new url to the environment
def updateDomainName(oldSubDomain, newSubDomain, protocol) {
    echo 'replace domain name in .cxcloud.yaml'
    sh "yq w -i .cxcloud.yaml routing.domain \$(yq r .cxcloud.yaml routing.domain | sed s/${oldSubDomain}/${newSubDomain}/)"
    return sh (
        script: "echo -n '${protocol}' && yq r .cxcloud.yaml routing.domain",
        returnStdout: true
    ).trim().toLowerCase()
}

// Get all projects containing a .cxcloud.yaml file
def getAllProjects(path) {
    return sh (
        script: "find ${path} -maxdepth 3 -name .cxcloud.yaml -exec dirname {} \\;",
        returnStdout: true
    ).trim()
}

// Get all projects that has been modified since the ${fromCommit} hash
def getModifiedProjects(fromCommit) {
    return sh (
        script: "detectModifiedProjects.sh .cxcloud.yaml ${fromCommit} HEAD",
        returnStdout: true
    ).trim()
}

// Get short git hash
def getShortHash() {
    return sh (
        script: "git rev-parse --short HEAD",
        returnStdout: true
    ).trim()
}

// Deploy the projects into the right namespace for the kubernetes cluster
def deployProjects(projects, namespace, ecrRepository, identifier, AWSRegion, cpuRequest, instanceGroup, ingressClass, lbScheme, lbCert, minReplicas, maxReplicas) {
    if (projects.length == 0) {
        echo "Nothing to deploy"
    }
    for (project in projects) {
        echo "Deploying project ${project}"
        sh """
            cd ${project} && \
            GIT_BRANCH='${namespace}' \
            APP_VERSION='${namespace}-${identifier}' \
            ECR_REPOSITORY='${ecrRepository}' \
            AWS_DEFAULT_REGION='${AWSRegion}' \
            CPU_REQUEST='${cpuRequest}' \
            INSTANCE_GROUP='${instanceGroup}' \
            INGRESS_CLASS='${ingressClass}' \
            SCHEME='${lbScheme}' \
            LB_CERT='${lbCert}' \
            MIN_REPLICAS='${minReplicas}' \
            MAX_REPLICAS='${maxReplicas}' \
            cxcloud deploy
        """
    }
}

// Get the ARN for the ACM certificate
def getACMCertificateARN(domainName, awsRegion) {
  return sh (
        script: "aws acm list-certificates --region ${awsRegion} \
          | jq -r '.CertificateSummaryList[] | select(.DomainName == \"${domainName}\") | .CertificateArn'",
        returnStdout: true
    ).trim()
}

// Get value from the sonar scanner report
def getReportTaskValue(project, key) {
  return sh (
        script: """val=\$(cat ${project}/.scannerwork/report-task.txt | grep ${key})
            echo \${val#*=}
        """,
        returnStdout: true
    ).trim()
}

// Pipeline execution starts
pipeline {
    agent {
        node {
            label 'cxcloud'
        }
    }

    // Populate variables and modify some values in .cxcloud.yaml
    stages {
        stage('Populate variables') {
            parallel {

              // Populate values for common variables
              stage('For all') {
                    steps {
                        script {
                            namespaceExists = sh (
                                script: "kubectl get namespace -namespace ${currentNamespace[getDeploymentEnvironment()]}",
                                returnStatus: true
                            ) == 0
                            currentNamespaceURL = updateDomainName(
                                oldSubDomainInYaml[getDeploymentEnvironment()],
                                newSubDomainInYaml[getDeploymentEnvironment()],
                                protocol[getDeploymentEnvironment()]
                            )
                            lbCert = getACMCertificateARN(
                                certificateACM[getDeploymentEnvironment()],
                                defaultAWSRegion[getDeploymentEnvironment()]
                            )
                            if (ingressClass[getDeploymentEnvironment()] == "alb") {
                                def nrOfPaths = sh (
                                    script: "yq r .cxcloud.yaml 'routing.rules[*].path' | wc -l",
                                    returnStdout: true
                                ).trim().toInteger()
                                for (int i = 0; i < nrOfPaths; i++) {
                                    sh "yq w -i .cxcloud.yaml 'routing.rules[${i}].path' \"\$(yq r .cxcloud.yaml 'routing.rules[${i}].path')*\""
                                }
                            }
                            if (useHostRouting == false) {
                                sh "yq d -i .cxcloud.yaml routing.domain"
                            }
                        }
                    }
                }

                // Populate values for only pull requests
                stage('For pull requests') {
                    when {
                        expression {
                            isPR()
                        }
                    }
                    steps {
                        script {
                            def firstCommit         = ''
                            branchName              = pullRequest.headRef
                            flowMessage['pr']       = "<b>" + pullRequest.title + "</b><p>" + pullRequest.body + "</p>"
                            branchDescription['pr'] = pullRequest.headRef + " (" + currentNamespace[getDeploymentEnvironment()] + ")"
                            gitUrl                  = pullRequest.url
                            for (commit in pullRequest.commits) {
                                if (firstCommit == '') {
                                    firstCommit = commit.sha
                                }
                                lastComitter      = commit.committer
                                lastCommitMessage = commit.message
                            }
                            comitterAvatar = "https://avatars.githubusercontent.com/${lastComitter}?size=128"
                            projects       = getModifiedProjects(firstCommit).split()
                        }
                    }
                }

                // Populate values for brances that are not pull requests
                stage('For normal branches') {
                    when {
                        expression {
                            !isPR()
                        }
                    }
                    steps {
                        script {
                            branchName        = env.BRANCH_NAME
                            lastCommitMessage = sh (
                                script: 'git log -1 --pretty=%B',
                                returnStdout: true
                            ).trim()
                            gitUrl         = env.GIT_URL
                            lastComitter   = 'Jenkins'
                            comitterAvatar = 'https://wiki.jenkins.io/download/attachments/2916393/headshot.png?version=1&modificationDate=1302753947000&api=v2'
                            projects       = getAllProjects('.').split()
                        }
                    }
                }
            }
        }

        // Run unit tests
        stage('Run tests') {
            when {
                expression {
                    !isReleaseTag()
                }
            }
            steps {
                script {
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

        // Run SonarQube analysis
        stage('SonarQube analysis') {
            when {
                expression {
                    !isReleaseTag()
                }
            }
            steps {
                script {
                    def projectName = ''
                    for (project in projects) {
                        if (project == ".") {
                            continue
                        }
                        projectName = sh (
                            script: "echo \$(basename ${project})",
                            returnStdout: true
                        ).trim()
                        withSonarQubeEnv('SonarQube') {
                            sh """cd ${project}
                                sonar-scanner \
                                    -Dsonar.projectKey=\"${projectName}-${branchName}\" \
                                    -Dsonar.projectName=\"${projectName} (${branchName})\"
                            """
                        }
                    }
                }
            }
        }

        // Check SonarQube qality gate reports. Fail the pipeline in case quality gate didn't pass
        stage('SonarQube quality gate') {
            when {
                expression {
                    isBaseBranch() || isPR()
                }
            }
            steps {
                script {
                    def qualityGateError = false
                    for (project in projects) {
                        if (project == ".") {
                            continue
                        }
                        def ceTaskUrl    = getReportTaskValue(project, 'ceTaskUrl')
                        def dashboardUrl = getReportTaskValue(project, 'dashboardUrl')
                        def status       = ""
                        // Wait until quality gate report is ready
                        waitUntil {
                            status = sh (
                                script: "curl -s ${ceTaskUrl} | jq -r .task.status",
                                returnStdout: true
                            ).trim()
                            return (status != "IN_PROGRESS")
                        }
                        if (status != "SUCCESS") {
                            qualityGateError = true
                            if (isPR()) {
                                pullRequest.comment(
                                    """Pipeline failed due to SorarQube quality gate failure!
                                        ${dashboardUrl}
                                    """
                                )
                            }
                        }
                    }
                    if (qualityGateError == true) {
                        error "Pipeline failed due to SorarQube quality gate failure"
                    }
                }
            }
        }

        // Create new namespace for the deployment in case namespace doesn't exist
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

        // Copy secrets from namespace application into pull request namespace
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

        // Deploy the services.
        // The parallel stages, DEV/TEST, staging and production are only for visibility, don't add any logic there
        stage ('Deploy projects') {
            parallel {

                stage('To DEV/TEST') {
                    when {
                        expression {
                            isPR()
                        }
                    }
                    steps {
                        echo "Deploying DEV/TEST environment"
                    }
                }

                stage('To staging') {
                    when {
                        expression {
                            isBaseBranch()
                        }
                    }
                    steps {
                        echo "Deploying master branch to staging"
                    }
                }

                stage('To production') {
                    when {
                        expression {
                            isReleaseTag()
                        }
                    }
                    steps {
                        script {
                            echo "Deploying tagged branch, ${currentNamespace[getDeploymentEnvironment()]} to production"
                        }
                    }
                }
                stage('Deploy') {
                    when {
                        expression {
                            !isOnlyBranch()
                        }
                    }
                    steps {
                        script {
                            def shortHash  = getShortHash()
                            def identifier = "${env.BUILD_NUMBER}-${shortHash}"
                            if (isReleaseTag()) {
                                identifier = env.BRANCH_NAME
                            }
                            if (namespaceExists == false) {
                                projects = getAllProjects('.').split()
                            }
                            deployProjects(
                                projects,
                                currentNamespace[getDeploymentEnvironment()],
                                repositoryUri[getDeploymentEnvironment()],
                                identifier,
                                defaultAWSRegion[getDeploymentEnvironment()],
                                cpuRequest[getDeploymentEnvironment()],
                                instanceGroup[getDeploymentEnvironment()],
                                ingressClass[getDeploymentEnvironment()],
                                lbScheme[getDeploymentEnvironment()],
                                lbCert,
                                minReplicas[getDeploymentEnvironment()],
                                maxReplicas[getDeploymentEnvironment()]
                            )
                            if (namespaceExists != true && isPR()) {
                                echo 'Writing URL of Kubernetes namespace as a comment'
                                pullRequest.comment("Environment is available here: ${currentNamespaceURL}")
                            }
                        }
                    }
                }
            }
        }

        // Delete namespace with all its resources in case the pull request is closed
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

    // Notify flowdock of the success or failure of the pipeline execution
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
