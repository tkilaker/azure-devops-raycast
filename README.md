# Azure DevOps Work Items for Raycast

A powerful Raycast extension for managing Azure DevOps work items. Search, view, and extract work items as markdown for documentation or AI assistants.

![Azure DevOps Work Items Extension](assets/screenshot-main.png)

## Features

- 🔍 **Search Work Items** - Search by title, ID, or filter by assigned user
- 👤 **My Work Items** - Quick access to items assigned to you
- ⚡ **Extract by ID** - Instantly extract any work item by ID
- 📋 **Markdown Export** - Copy work items as formatted markdown
- 🖼️ **Image Support** - Downloads and embeds images from descriptions
- 🎨 **Visual Indicators** - Color-coded states, priorities, and work item types
- ⌨️ **Keyboard Shortcuts** - Efficient navigation and actions

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/azure-devops-raycast.git
   cd azure-devops-raycast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and link the extension:
   ```bash
   npm run build
   npx ray link
   ```

### From Raycast Store

*Coming soon - pending publication*

## Setup

1. Open Raycast preferences (`Cmd+,`)
2. Navigate to Extensions → Azure DevOps Work Items
3. Configure the following:
   - **Personal Access Token (PAT)**: Your Azure DevOps PAT with "Work Items (Read)" scope
   - **Organization**: Your Azure DevOps organization name
   - **Project**: Your project name
   - **Download Images**: Enable to download embedded images

### Creating a Personal Access Token

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Give it a name (e.g., "Raycast Extension")
4. Set expiration (recommend 90+ days)
5. Select scope: **Work Items → Read**
6. Click "Create" and copy the token

## Usage

### Search Work Items
- Open Raycast (`Cmd+Space`)
- Type "Search Work Items"
- Enter search terms or work item ID
- Press `Enter` to copy as markdown

### My Work Items
- Open Raycast
- Type "My Work Items"
- View all items assigned to you
- Press `Enter` on any item to extract

### Extract by ID
- Open Raycast
- Type "Extract Work Item"
- Enter the work item ID
- Markdown is automatically copied to clipboard

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Extract to Clipboard | `Enter` |
| Open in Browser | `Cmd+O` |
| Copy Work Item ID | `Cmd+I` |
| Copy Title | `Cmd+T` |
| Refresh List | `Cmd+R` |

## Exported Markdown Format

The extension exports comprehensive markdown including:

- Work item metadata (ID, type, state, assignee)
- Description with formatted text
- Embedded images (downloaded locally)
- Comments and discussion history
- Related work items
- Attachments
- Custom fields

Example output:
```markdown
# Work Item #1234: Implement User Authentication

## Overview
- **Type**: User Story
- **State**: Active
- **Priority**: 2
- **Assigned To**: John Doe
...
```

## Development

### Prerequisites
- Node.js 16+
- Raycast app
- Azure DevOps account with PAT

### Running in Development
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Raycast Extensions API](https://developers.raycast.com)
- Inspired by the need for better Azure DevOps integration with AI tools

## Support

For issues, questions, or suggestions, please [open an issue](https://github.com/yourusername/azure-devops-raycast/issues).

## Roadmap

- [ ] Support for multiple organizations
- [ ] Work item creation
- [ ] Bulk operations
- [ ] Custom WIQL queries
- [ ] Sprint/iteration filtering
- [ ] Rich preview in Raycast
- [ ] Export to file options

---

Made with ❤️ for the developer community