import { showHUD, Clipboard, showToast, Toast, getPreferenceValues, LaunchProps } from "@raycast/api";
import { extractWorkItemToMarkdown, Preferences } from "./lib/azure-devops";

interface Arguments {
  workItemId?: string;
}

export default async function ExtractById(props: LaunchProps<{ arguments: Arguments }>) {
  const preferences = getPreferenceValues<Preferences>();
  
  try {
    let workItemId = props.arguments.workItemId;
    
    // If no ID provided, try to get from clipboard
    if (!workItemId) {
      const clipboardText = await Clipboard.readText();
      const idMatch = clipboardText?.match(/\b\d{4,6}\b/);
      if (idMatch) {
        workItemId = idMatch[0];
      }
    }
    
    if (!workItemId) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No work item ID provided",
        message: "Please provide a work item ID or copy one to clipboard",
      });
      return;
    }
    
    await showToast({
      style: Toast.Style.Animated,
      title: "Extracting work item...",
      message: `#${workItemId}`,
    });
    
    const markdown = await extractWorkItemToMarkdown(parseInt(workItemId), preferences);
    
    await Clipboard.copy(markdown);
    
    await showHUD(`✅ Work item #${workItemId} copied to clipboard`);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to extract work item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}