import type { AIProvider } from "@/lib/diagnostics";

const kubernetesFix = `kubectl describe pod <pod-name> -n <namespace>
kubectl get events -n <namespace> --sort-by=.lastTimestamp

# If the container is OOMKilled, raise its memory limit:
resources:
  requests:
    memory: "256Mi"
  limits:
    memory: "512Mi"`;

export const mockProvider: AIProvider = {
  async diagnose({ input, focusArea }) {
    const detectedFocusArea = focusArea === "Auto Detect"
      ? (/kubernetes|kubectl|pod\/|imagepullbackoff|apiVersion:\s*apps\/v1|kind:\s*Deployment/i.test(input) ? "Kubernetes" : /^(FROM|services:|dockerfile)/im.test(input) ? "Docker" : focusArea)
      : focusArea;
    const isKubernetes = detectedFocusArea === "Kubernetes";
    const mentionsImage = /imagepullbackoff|err_image_pull|pull access denied/i.test(input);
    const mentionsMemory = /oomkilled|outofmemory|memory/i.test(input);
    const hasSelectorMismatch = /matchLabels[\s\S]*?app:\s*web[\s\S]*?labels[\s\S]*?app:\s*api/i.test(input);
    const looksLikeDockerfile = /^FROM\s+\S+/im.test(input);
    const looksLikeWorkflow = /actions\/checkout|runs-on:\s*ubuntu|npm\s+(ci|test)/i.test(input);
    const looksLikeTerraform = /resource\s+"aws_instance"|terraform\s+\{/i.test(input);

    if (isKubernetes && mentionsImage) {
      return {
        title: "The cluster cannot pull this image",
        summary: "Kubernetes is retrying the container because the image registry rejected the pull or the image tag does not exist.",
        confidence: 96,
        severity: "critical",
        why: [
          "ImagePullBackOff is a retry state, not the root error. The first event usually contains the registry response.",
          "Private registries require an imagePullSecret in the same namespace as the Pod.",
          "A mutable or misspelled tag can make a valid deployment point at an image that was never pushed.",
        ],
        fix: `kubectl create secret docker-registry registry-credentials \\
  --docker-server=ghcr.io \\
  --docker-username=$GITHUB_ACTOR \\
  --docker-password=$GITHUB_TOKEN \\
  -n <namespace>

# Add this to your Pod or Deployment spec:
spec:
  imagePullSecrets:
    - name: registry-credentials`,
        checks: ["Confirm the repository and tag exist in the registry.", "Verify the secret is created in the workload namespace.", "Inspect the first Failed event, not the latest back-off message."],
        references: ["Kubernetes · Pull an image from a private registry", "Kubernetes · Debugging Pods"],
      };
    }

    if (isKubernetes && hasSelectorMismatch) {
      return {
        title: "The Deployment selector does not match its Pod labels",
        summary: "The Deployment selects app=web, but its Pod template is labeled app=api. Kubernetes requires these labels to match so the controller can manage the Pods it creates.",
        confidence: 99,
        severity: "critical",
        why: [
          "spec.selector.matchLabels.app is web while spec.template.metadata.labels.app is api.",
          "A Deployment selector must match the labels on its Pod template and cannot be changed after creation.",
          "The pasted YAML also needs consistent indentation before it can be applied as a Kubernetes manifest.",
        ],
        fix: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:latest
          ports:
            - containerPort: 80`,
        checks: ["Run kubectl apply --dry-run=server before applying the change.", "Use the same app label in any Service selector.", "If the Deployment already exists, recreate it because its selector is immutable."],
        references: ["Kubernetes · Deployments", "Kubernetes · Labels and Selectors"],
      };
    }

    if (detectedFocusArea === "Docker" && looksLikeDockerfile) {
      return {
        title: "Make this Docker build reproducible before shipping",
        summary: "The Dockerfile can build, but it installs dependencies without showing a lockfile and assumes the image has a valid npm start script. Verify those repository contracts before relying on the image.",
        confidence: 86,
        severity: "warning",
        why: [
          "COPY package.json . followed by npm install does not guarantee the dependency tree is locked in the image.",
          "npm start will fail if package.json does not define a start script or the app listens on the wrong interface.",
          "A .dockerignore keeps local dependencies and secrets out of the build context.",
        ],
        fix: `FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Add a .dockerignore containing:
node_modules
.next
.env*`,
        checks: ["Commit package-lock.json and confirm npm ci succeeds locally.", "Confirm package.json contains a start script.", "Make sure the server binds to 0.0.0.0 inside the container."],
        references: ["Docker · Dockerfile reference", "npm · npm ci"],
      };
    }

    if (detectedFocusArea === "GitHub Actions" && looksLikeWorkflow) {
      return {
        title: "The CI workflow depends on a repository test script",
        summary: "npm test will run the test script from package.json. If this repository does not define one, the job will fail even though checkout and npm ci succeed.",
        confidence: 94,
        severity: "warning",
        why: [
          "The workflow invokes npm test, which requires package.json to contain a test script.",
          "npm ci also requires a committed package-lock.json or compatible lockfile.",
          "The workflow should fail clearly when the project has no test suite rather than silently skipping validation.",
        ],
        fix: `# .github/workflows/ci.yml
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test

# package.json must define, for example:
"scripts": {
  "test": "your-test-command"
}`,
        checks: ["Add a real test command or replace npm test with the repository's existing check.", "Commit the lockfile used by npm ci.", "Run the workflow on a pull request if CI should protect merges."],
        references: ["GitHub Actions · Node.js workflow", "npm · test scripts"],
      };
    }

    if (detectedFocusArea === "Terraform" && looksLikeTerraform) {
      return {
        title: "Validate the AWS instance inputs before applying",
        summary: "This resource is structurally plausible, but the AMI may not exist in the selected AWS region and the configuration does not show a provider or state plan. Validate those facts before applying.",
        confidence: 78,
        severity: "info",
        why: [
          "AMI IDs are region-specific, so ami-12345678 cannot be treated as valid without the target region.",
          "The snippet does not include an AWS provider configuration or variables for environment-specific values.",
          "terraform plan is the appropriate place to confirm the exact instance change before apply.",
        ],
        fix: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "example" {
  ami           = var.ami_id
  instance_type = "t2.micro"

  tags = {
    Name = "example"
  }
}

# Validate the chosen AMI and review the plan before applying:
terraform fmt
terraform validate
terraform plan`,
        checks: ["Set var.ami_id to an AMI that exists in var.aws_region.", "Run terraform init before validate or plan.", "Review the plan and confirm the instance size is appropriate for the workload."],
        references: ["Terraform · AWS provider", "Terraform · Plan command"],
      };
    }

    return {
      title: `${detectedFocusArea} needs one more signal`,
      summary: mentionsMemory ? "This looks like a resource exhaustion issue. Start by checking the process limit and the last successful run." : "The pasted signal is not specific enough to identify a single root cause yet.",
      confidence: mentionsMemory ? 82 : 64,
      severity: mentionsMemory ? "warning" : "info",
      why: mentionsMemory ? ["The error points to memory pressure rather than syntax.", "Resource limits can terminate a process before the application writes a useful stack trace.", "The surrounding command and runtime limit will distinguish a leak from an undersized limit."] : ["Diagnostic tools need the original error and the command or resource that produced it.", "A short surrounding config block prevents fixes that solve the symptom but break the deployment.", "The selected focus area changes which checks are safe to recommend."],
      fix: isKubernetes ? kubernetesFix : `# Paste the complete error and the command that produced it
# Keep credentials, tokens, and private hostnames redacted

${detectedFocusArea === "Docker" ? "docker inspect <container>\ndocker logs --tail 200 <container>" : `# Suggested first check for ${detectedFocusArea}\n# Run the failing command with verbose output enabled`}`,
      checks: ["Include the full error block, including the first line.", "Add the relevant resource or workflow snippet.", "Redact tokens and credentials before sharing."],
      references: [`${detectedFocusArea} · Troubleshooting guide`],
    };
  },
};