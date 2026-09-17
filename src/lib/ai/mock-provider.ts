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
    const isKubernetes = focusArea === "Kubernetes";
    const mentionsImage = /imagepullbackoff|err_image_pull|pull access denied/i.test(input);
    const mentionsMemory = /oomkilled|outofmemory|memory/i.test(input);

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

    return {
      title: `${focusArea} needs one more signal`,
      summary: mentionsMemory ? "This looks like a resource exhaustion issue. Start by checking the process limit and the last successful run." : "The pasted signal is not specific enough to identify a single root cause yet.",
      confidence: mentionsMemory ? 82 : 64,
      severity: mentionsMemory ? "warning" : "info",
      why: mentionsMemory ? ["The error points to memory pressure rather than syntax.", "Resource limits can terminate a process before the application writes a useful stack trace.", "The surrounding command and runtime limit will distinguish a leak from an undersized limit."] : ["Diagnostic tools need the original error and the command or resource that produced it.", "A short surrounding config block prevents fixes that solve the symptom but break the deployment.", "The selected focus area changes which checks are safe to recommend."],
      fix: isKubernetes ? kubernetesFix : `# Paste the complete error and the command that produced it
# Keep credentials, tokens, and private hostnames redacted

${focusArea === "Docker" ? "docker inspect <container>\ndocker logs --tail 200 <container>" : `# Suggested first check for ${focusArea}\n# Run the failing command with verbose output enabled`}`,
      checks: ["Include the full error block, including the first line.", "Add the relevant resource or workflow snippet.", "Redact tokens and credentials before sharing."],
      references: [`${focusArea} · Troubleshooting guide`],
    };
  },
};