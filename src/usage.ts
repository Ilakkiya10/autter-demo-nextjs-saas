import { projects } from "./data";

const usageQueues = new Map<string, Promise<unknown>>();

export async function recordUsage(projectId: string, amount: number) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error("missing project");

  const previous = usageQueues.get(projectId) ?? Promise.resolve();
  const update = previous.catch(() => undefined).then(async () => {
    await new Promise((r) => setTimeout(r, 2));
    project.usage += amount;
    return project.usage;
  });

  usageQueues.set(projectId, update);

  try {
    return await update;
  } finally {
    if (usageQueues.get(projectId) === update) {
      usageQueues.delete(projectId);
    }
  }
}
