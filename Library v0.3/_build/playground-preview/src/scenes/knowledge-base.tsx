/* Md3KnowledgeBase — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { useState } from "react";
import { Md3KnowledgeBaseCard } from "@nucleux/md3-knowledge-base";

/** The Material 3 knowledge base as nucleux.in's live preview shows it: one active base and what you can do with it. */
export function SitePreview() {
  const [active, setActive] = useState(true);
  return (
    <Md3KnowledgeBaseCard
      name="Product Research"
      sourceCount={12}
      status={active ? "active" : "inactive"}
      scope={active ? "Active in this project" : undefined}
      onManage={() => {}}
      onAdd={() => {}}
      onActiveChange={setActive}
      className="w-full max-w-[30rem]"
    />
  );
}
