# Mermaid diagram support rollout

Goal: extend the Mermaid package from a flowchart-first designer into a Mermaid designer that can preview every Mermaid diagram and progressively offer structured visual editing for each diagram type.

Phases:
1. Flowchart: finish directions, labels, full shape syntax, markdown labels, edge movement, selection mapping, and Mermaid-layout import.
2. Sequence: participants, messages, activations, notes, loops/alt/opt blocks, writer/parser selection mapping.
3. Class: classes/interfaces, members, methods, relationships, annotations, namespaces.
4. State: states, transitions, composite states, notes, forks/joins.
5. ER: entities, attributes, relationship cardinalities.
6. Remaining text-first diagrams: Gantt, journey, pie, quadrant, requirement, gitgraph, mindmap, timeline.
7. Newer visual diagrams: sankey, xy chart, block, packet, kanban, architecture, radar, treemap, venn, ishikawa, wardley, treeview.

Principle: every diagram type should first render in preview through Mermaid, then gain a typed parser/model/writer only when its visual editing semantics are defined.

Current document metadata:
- Root design item attributes store the current editable family: `data-mermaid-diagram-type` and, for flowcharts, `data-mermaid-flowchart-direction`.
- The Mermaid package installs a root property group named `mermaid` so these values are editable when the root item is selected.
- The writer honors root metadata only when doing so will not drop incompatible existing widgets; actual conversion between diagram families is still a separate future task.
- The Mermaid writer opts into root-item serialization so root-only documents can still write `title`, diagram type, and flowchart direction even when there are no child design items.
- Palette entries are filtered by root `diagramType`: flowchart shows flowchart nodes only, sequence shows sequence controls. Flowchart edges are intentionally not in the palette because they are created by the connector tool.
- Mindmap is now a root `diagramType` with a filtered palette entry, root title support, indentation parser/writer, and a visual `mermaid-mindmap-node` widget. Mindmap nodes are real containers: parsed child lines become nested design items, and the writer emits indentation by walking `item.children()`. Import asks Mermaid to render the mindmap SVG first and maps `g.node.mindmap-node` positions back into the designer; the simple hierarchical placement is only a fallback when SVG layout extraction is unavailable. Direct parent nodes automatically draw curved child connection lines with depth-based stroke thickness. Icons/classes/config layout are still future mindmap property work.
- Requirement diagram is now a root `diagramType` with requirement/element palette entries, direction property, block parser/writer, Mermaid-rendered node positioning, editable `mermaid-requirement-node` widgets, and relationship widgets for `contains`, `copies`, `derives`, `satisfies`, `verifies`, `refines`, and `traces` in both forward and reverse syntax forms. Styling/class syntax is still future requirement property work.
- Flowchart frontmatter now preserves non-title content such as `config: htmlLabels: false`; flowchart labels with Markdown markers or embedded newlines are written as Mermaid markdown strings.
- Flowchart support now covers Mermaid v11 expanded `@{ shape: ... }` nodes for the documented shape aliases, subgraph containers with nested node writing, special edge connectors including circle/cross/multidirectional/invisible/min-length forms, edge ids, and raw flowchart directives for `style`, `classDef`, `class`, `click`, and `linkStyle` so styles/classes/animation definitions round-trip. Node rendering is still an editable approximation of Mermaid's SVG, not pixel-identical for every exotic shape.
- Mermaid node widgets render inline Markdown safely in the designer for bold/italic markers and multiline labels, using DOM nodes rather than raw HTML injection.
