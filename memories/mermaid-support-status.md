# Mermaid package support

- Structured editing currently supports `flowchart`, `sequenceDiagram`, `mindmap`, and `requirementDiagram`. The root stores the family in `data-mermaid-diagram-type` and flowchart/requirement direction in `data-mermaid-flowchart-direction`.
- The root `mermaid` property group exposes diagram metadata, and palette entries are filtered by the active diagram type. Changing metadata is guarded so incompatible existing widgets are not silently dropped.
- Mindmap nodes are nested design-item containers and are written by walking their children. Requirement diagrams use requirement/element nodes plus typed relationship widgets.
- Mermaid-rendered SVG positions are used when available, with internal placement only as a fallback. Flowchart frontmatter, markdown labels, subgraphs, expanded shapes, edge variants, and raw style/class directives are preserved by the parser/writer.
