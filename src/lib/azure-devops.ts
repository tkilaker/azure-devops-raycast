export interface Preferences {
  pat: string;
  organization: string;
  project: string;
  downloadImages: boolean;
}

export interface WorkItem {
  id: number;
  title: string;
  state: string;
  assignedTo: string;
  type: string;
  tags: string[];
  iteration: string;
  area: string;
  priority?: number;
}

interface WorkItemDetails {
  id: string;
  title: string;
  state: string;
  reason: string;
  assignedTo: string;
  areaPath: string;
  iterationPath: string;
  priority: string;
  severity: string;
  tags: string[];
  description: string;
  descriptionText: string;
  acceptanceCriteria: string;
  acceptanceCriteriaText: string;
  workItemType: string;
  createdDate: string;
  changedDate: string;
  comments: Comment[];
  relatedItems: RelatedItem[];
  attachments: Attachment[];
  images: string[];
}

interface Comment {
  author: string;
  timestamp: string;
  text: string;
}

interface RelatedItem {
  type: string;
  id: string;
  title: string;
}

interface Attachment {
  name: string;
  url: string;
}

async function fetchWorkItemDetails(workItemId: number, preferences: Preferences): Promise<WorkItemDetails> {
  const { pat, organization, project } = preferences;
  const url = `https://dev.azure.com/${organization}/${encodeURIComponent(project)}/_apis/wit/workitems/${workItemId}?api-version=7.0&$expand=All`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please check your Personal Access Token in extension preferences.");
    } else if (response.status === 404) {
      throw new Error(`Work item #${workItemId} not found or you don't have access to it.`);
    }
    throw new Error(`Failed to fetch work item: ${response.statusText}`);
  }

  const data = await response.json();
  const fields = data.fields || {};
  
  // Fetch comments
  const comments = await fetchComments(workItemId, preferences);
  
  // Process description for images
  const { text: descriptionText, images: descImages, localImages: descLocalImages } = await processHtmlContent(fields["System.Description"] || "", workItemId, preferences);
  const { text: acceptanceText, localImages: acceptLocalImages } = await processHtmlContent(fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || "", workItemId, preferences);
  
  return {
    id: data.id?.toString() || "Unknown",
    title: fields["System.Title"] || "",
    state: fields["System.State"] || "",
    reason: fields["System.Reason"] || "",
    assignedTo: fields["System.AssignedTo"]?.displayName || fields["System.AssignedTo"]?.uniqueName || "",
    areaPath: fields["System.AreaPath"] || "",
    iterationPath: fields["System.IterationPath"] || "",
    priority: fields["Microsoft.VSTS.Common.Priority"] || "",
    severity: fields["Microsoft.VSTS.Common.Severity"] || "",
    tags: fields["System.Tags"] ? fields["System.Tags"].split("; ") : [],
    description: fields["System.Description"] || "",
    descriptionText,
    acceptanceCriteria: fields["Microsoft.VSTS.Common.AcceptanceCriteria"] || "",
    acceptanceCriteriaText: acceptanceText,
    workItemType: fields["System.WorkItemType"] || "",
    createdDate: fields["System.CreatedDate"] || "",
    changedDate: fields["System.ChangedDate"] || "",
    comments,
    relatedItems: [],
    attachments: (data.relations || [])
      .filter((r: any) => r.rel === "AttachedFile")
      .map((r: any) => ({
        name: r.attributes?.name || "Unknown",
        url: r.url,
      })),
    images: [...descLocalImages, ...acceptLocalImages],
  };
}

async function fetchComments(workItemId: number, preferences: Preferences): Promise<Comment[]> {
  const { pat, organization, project } = preferences;
  const url = `https://dev.azure.com/${organization}/${encodeURIComponent(project)}/_apis/wit/workitems/${workItemId}/comments?api-version=7.0-preview`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.comments || []).map((comment: any) => ({
      author: comment.createdBy?.displayName || "Unknown",
      timestamp: comment.createdDate || "",
      text: stripHtml(comment.text || ""),
    }));
  } catch {
    return [];
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function processHtmlContent(html: string, workItemId: number, preferences: Preferences): Promise<{ text: string; images: string[]; localImages: string[] }> {
  let text = stripHtml(html);
  const images: string[] = [];
  const localImages: string[] = [];
  
  if (preferences.downloadImages) {
    // Extract image URLs
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const imageUrls: string[] = [];
    
    while ((match = imgRegex.exec(html)) !== null) {
      imageUrls.push(match[1]);
    }
    
    if (imageUrls.length > 0) {
      text += "\n\n**Embedded Images:**";
      for (const url of imageUrls) {
        // Download image
        const localPath = await downloadImage(url, workItemId, preferences);
        if (localPath) {
          localImages.push(localPath);
          const filename = localPath.split('/').pop() || 'image.png';
          text += `\n![${filename}](${localPath})`;
        } else {
          // Fallback to URL if download fails
          const filename = url.match(/fileName=([^&]+)/)?.[1] || 
                          `attachment_${url.match(/attachments\/([a-f0-9-]+)/)?.[1] || "unknown"}.png`;
          text += `\n![${filename}](${url})`;
        }
        images.push(url);
      }
    }
  }
  
  return { text, images, localImages };
}

async function downloadImage(imageUrl: string, workItemId: number, preferences: Preferences): Promise<string | null> {
  try {
    const { pat } = preferences;
    
    const response = await fetch(imageUrl, {
      headers: {
        "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    // Get image data
    const buffer = await response.arrayBuffer();
    
    // Create images directory path
    const { environment } = await import("@raycast/api");
    const imagesDir = `${environment.supportPath}/images/workitem_${workItemId}`;
    
    // Ensure directory exists
    const fs = await import("fs/promises");
    const path = await import("path");
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Generate filename
    let filename = 'image.png';
    const attachmentIdMatch = imageUrl.match(/attachments\/([a-f0-9-]+)/);
    if (attachmentIdMatch) {
      filename = `attachment_${attachmentIdMatch[1]}.png`;
    } else {
      const filenameMatch = imageUrl.match(/fileName=([^&]+)/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Make filename unique if it exists
    let finalPath = path.join(imagesDir, filename);
    let counter = 1;
    while (await fs.access(finalPath).then(() => true).catch(() => false)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      finalPath = path.join(imagesDir, `${base}_${counter}${ext}`);
      counter++;
    }
    
    // Save image
    await fs.writeFile(finalPath, Buffer.from(buffer));
    
    return finalPath;
  } catch (error) {
    console.error("Failed to download image:", error);
    return null;
  }
}

export async function extractWorkItemToMarkdown(workItemId: number, preferences: Preferences): Promise<string> {
  // Validate preferences
  if (!preferences.pat) {
    throw new Error("Personal Access Token is not configured. Please set it in extension preferences.");
  }
  
  if (!preferences.organization || !preferences.project) {
    throw new Error("Organization and Project must be configured in extension preferences.");
  }
  
  const workItem = await fetchWorkItemDetails(workItemId, preferences);
  
  return `# Work Item #${workItem.id}: ${workItem.title}

## Overview
- **ID**: ${workItem.id}
- **Type**: ${workItem.workItemType}
- **State**: ${workItem.state}
- **Reason**: ${workItem.reason || "Not specified"}
- **Assigned To**: ${workItem.assignedTo || "Unassigned"}
- **Area Path**: ${workItem.areaPath}
- **Iteration**: ${workItem.iterationPath}
- **Priority**: ${workItem.priority || "Not set"}
- **Severity**: ${workItem.severity || "Not set"}
- **Tags**: ${workItem.tags?.join(", ") || "None"}

## Dates
- **Created**: ${workItem.createdDate}
- **Last Changed**: ${workItem.changedDate}

## Description
${workItem.descriptionText || "No description provided"}

## Acceptance Criteria
${workItem.acceptanceCriteriaText || "No acceptance criteria defined"}

## Comments (${workItem.comments.length})
${workItem.comments.map(comment => `
### ${comment.author} - ${comment.timestamp}
${comment.text}
`).join("\n---\n") || "No comments"}

## Attachments (${workItem.attachments?.length || 0})
${workItem.attachments?.map(att => `- [${att.name}](${att.url})`).join("\n") || "None"}

---
Extracted: ${new Date().toISOString()}
`;
}