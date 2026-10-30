/* Md3McpConnection — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { Md3McpConnection } from "@nucleux/md3-mcp-connection";

/** Material 3 MCP as nucleux.in's live preview shows it: nothing connected yet, and the way to add a server. */
export function SitePreview() {
  // Open your "Add MCP server" flow.
  const addServer = () => {};
  return (
    <Md3McpConnection
      name="MCP servers"
      icon="MCP"
      status="disconnected"
      emptyTitle="No MCP servers connected"
      emptyDescription="Connect a server to give the agent access to external tools and resources."
      connectLabel="Add MCP server"
      onConnect={addServer}
      className="w-full max-w-[30rem]"
    />
  );
}
