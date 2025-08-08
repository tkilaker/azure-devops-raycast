import { ActionPanel, Action, List, showToast, Toast, getPreferenceValues, Icon, Color, showHUD, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { WorkItem, Preferences, extractWorkItemToMarkdown } from "./lib/azure-devops";

export default function MyWorkItems() {
  const preferences = getPreferenceValues<Preferences>();
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyWorkItems();
  }, []);

  const fetchMyWorkItems = async () => {
    try {
      setIsLoading(true);
      const { pat, organization, project } = preferences;
      
      // Query for items assigned to current user
      const query = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType], [System.Tags], [System.IterationPath], [System.AreaPath], [Microsoft.VSTS.Common.Priority] FROM WorkItems WHERE [System.AssignedTo] = @Me AND [System.State] NOT IN ('Done', 'Closed', 'Removed') ORDER BY [Microsoft.VSTS.Common.Priority], [System.ChangedDate] DESC`;

      const url = `https://dev.azure.com/${organization}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch work items: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Fetch details for each work item
      const items: WorkItem[] = [];
      const workItemIds = data.workItems?.map((wi: any) => wi.id) || [];
      
      if (workItemIds.length > 0) {
        const batchUrl = `https://dev.azure.com/${organization}/${encodeURIComponent(project)}/_apis/wit/workitemsbatch?api-version=7.0`;
        const batchResponse = await fetch(batchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
          },
          body: JSON.stringify({
            ids: workItemIds,
            fields: [
              "System.Id",
              "System.Title",
              "System.State",
              "System.AssignedTo",
              "System.WorkItemType",
              "System.Tags",
              "System.IterationPath",
              "System.AreaPath",
              "Microsoft.VSTS.Common.Priority"
            ],
          }),
        });

        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          items.push(...batchData.value.map((item: any) => ({
            id: item.id,
            title: item.fields["System.Title"],
            state: item.fields["System.State"],
            assignedTo: item.fields["System.AssignedTo"]?.displayName || "Unassigned",
            type: item.fields["System.WorkItemType"],
            tags: item.fields["System.Tags"]?.split("; ") || [],
            iteration: item.fields["System.IterationPath"],
            area: item.fields["System.AreaPath"],
            priority: item.fields["Microsoft.VSTS.Common.Priority"],
          })));
        }
      }

      // Sort by priority
      items.sort((a, b) => (a.priority || 999) - (b.priority || 999));
      
      setWorkItems(items);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch work items",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async (workItem: WorkItem) => {
    try {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Extracting work item...",
        message: `#${workItem.id}: ${workItem.title}`,
      });

      const markdown = await extractWorkItemToMarkdown(workItem.id, preferences);
      
      // Check if markdown contains local image paths (downloaded images)
      const hasDownloadedImages = markdown.includes(preferences.downloadImages ? '/images/workitem_' : '');
      
      await Clipboard.copy(markdown);
      
      toast.style = Toast.Style.Success;
      toast.title = "Work item extracted!";
      toast.message = hasDownloadedImages ? "Markdown with images copied to clipboard" : "Markdown copied to clipboard";
      
      await showHUD(`✅ Work item #${workItem.id} copied to clipboard${hasDownloadedImages ? ' with images' : ''}`);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to extract work item",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getStateIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case "active":
      case "new":
        return { source: Icon.Circle, tintColor: Color.Blue };
      case "committed":
        return { source: Icon.CircleProgress50, tintColor: Color.Yellow };
      case "in progress":
        return { source: Icon.CircleProgress75, tintColor: Color.Orange };
      case "done":
      case "closed":
        return { source: Icon.CheckCircle, tintColor: Color.Green };
      default:
        return { source: Icon.Circle, tintColor: Color.SecondaryText };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "bug":
        return { source: Icon.Bug, tintColor: Color.Red };
      case "task":
        return { source: Icon.Checkmark, tintColor: Color.Blue };
      case "feature":
      case "user story":
        return { source: Icon.Star, tintColor: Color.Purple };
      case "epic":
        return { source: Icon.Flag, tintColor: Color.Orange };
      default:
        return { source: Icon.Document, tintColor: Color.SecondaryText };
    }
  };

  const getPriorityTag = (priority?: number) => {
    if (!priority) return undefined;
    if (priority === 1) return { value: "P1", color: Color.Red };
    if (priority === 2) return { value: "P2", color: Color.Orange };
    if (priority === 3) return { value: "P3", color: Color.Yellow };
    return { value: `P${priority}`, color: Color.Blue };
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter your work items...">
      <List.Section title="My Work Items" subtitle={`${workItems.length} active items`}>
        {workItems.map((item) => (
          <List.Item
            key={item.id}
            icon={getTypeIcon(item.type)}
            title={`#${item.id}: ${item.title}`}
            subtitle={item.area?.split("\\").pop()}
            accessories={[
              ...(item.priority && getPriorityTag(item.priority) ? [{ tag: getPriorityTag(item.priority) }] : []),
              ...item.tags.slice(0, 1).map(tag => ({ tag })),
              { icon: getStateIcon(item.state), tooltip: item.state },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="Extract to Clipboard"
                  icon={Icon.Clipboard}
                  onAction={() => handleExtract(item)}
                />
                <Action.OpenInBrowser
                  title="Open in Azure DevOps"
                  url={`https://dev.azure.com/${preferences.organization}/${encodeURIComponent(preferences.project)}/_workitems/edit/${item.id}`}
                />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={fetchMyWorkItems}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                />
                <Action.CopyToClipboard
                  title="Copy ID"
                  content={item.id.toString()}
                  shortcut={{ modifiers: ["cmd"], key: "i" }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}