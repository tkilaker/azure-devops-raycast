/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Personal Access Token - Azure DevOps PAT with Work Items (Read) scope */
  "pat": string,
  /** Organization - Azure DevOps organization name (e.g., mycompany) */
  "organization": string,
  /** Project - Azure DevOps project name */
  "project": string,
  /** Download Images - Download embedded images from work items */
  "downloadImages": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-work-items` command */
  export type SearchWorkItems = ExtensionPreferences & {}
  /** Preferences accessible in the `extract-by-id` command */
  export type ExtractById = ExtensionPreferences & {}
  /** Preferences accessible in the `my-work-items` command */
  export type MyWorkItems = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-work-items` command */
  export type SearchWorkItems = {}
  /** Arguments passed to the `extract-by-id` command */
  export type ExtractById = {
  /** Work Item ID */
  "workItemId": string
}
  /** Arguments passed to the `my-work-items` command */
  export type MyWorkItems = {}
}

