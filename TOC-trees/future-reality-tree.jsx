{
  "version": "1.0.0",
  "prompt": "Build \"Future Reality Tree — Runnable Document\" (single-file React + Tailwind). Version: 1.0.0. Brief: - Map desired outcomes (DOs) from actions using if-then logic. Visual tree shows action chains. Find critical actions. Inputs: - dos: Array<{ id, description, benefit:1-5 }> - connections: Array<{ from:id, to:id, logic:string }> - entities: Array<{ id, name, type:\"objective\"|\"intermediate\"|\"action\", x:number|null, y:number|null }> - validation: { sufficientAction: boolean, // Does action fully enable outcome? necessaryAction: boolean, // Is action required for outcome? verified: boolean } UI: - Visual tree (D3.js) with objectives at top, actions below - **Draggable nodes** with positions saved/restored - **Double-click nodes** to edit name inline - **Zoom/pan controls** (+/-, reset buttons) and mouse wheel/drag - **Larger boxes** (120x60px) with text wrapping - Click to add/edit connections with logic statements - Benefit heatmap coloring - \"Find Critical Actions\" analyzer - Categories of Legitimate Reservation (CLR) checklist - **Pastel colors** for all boxes to ensure text readability Logic: - Critical action = node with most paths leading to DOs - Flag circular logic - Highlight sufficient vs enabling actions - Calculate \"benefit score\" = sum(benefit × paths through node) Tests: - No circular references in tree - All DOs connected to at least one action - Each connection has explicit logic - Critical actions identified (>2 paths) Audit/Export: - Mermaid diagram of tree - Critical action analysis with benefit scores - CLR validation summary Features: - **Node positions** preserved in export (x, y coordinates) - **View state** saved (zoom level, pan position) - **Auto-layout** for new nodes, custom positions for dragged nodes - **Real-time link updates** during drag - **White backgrounds** on link labels for readability - **Inline editing** of node names on double-click Download Options: - **Download**: Downloads artifact file containing version, prompt, and current data as JSON - **Download to Database**: Downloads Node.js script that posts artifact (version, prompt, data) to endpoint Upload Options: - **Upload**: Upload artifact file (JSON with version, prompt, and data) to restore complete session\n\nDatabase Endpoint: https://api.example.com/reality-trees",
  "data": {
    "dos": [
      {
        "id": "do1",
        "description": "High customer satisfaction",
        "benefit": 5
      },
      {
        "id": "do2",
        "description": "Low employee turnover",
        "benefit": 4
      },
      {
        "id": "do3",
        "description": "Growing revenue",
        "benefit": 5
      }
    ],
    "connections": [
      {
        "from": "action1",
        "to": "int1",
        "logic": "If implement training programs, then improved management skills"
      },
      {
        "from": "int1",
        "to": "do2",
        "logic": "If improved management skills, then low employee turnover"
      },
      {
        "from": "int1",
        "to": "int2",
        "logic": "If improved management skills, then high service quality"
      },
      {
        "from": "int2",
        "to": "do1",
        "logic": "If high service quality, then high customer satisfaction"
      },
      {
        "from": "do1",
        "to": "do3",
        "logic": "If high customer satisfaction, then growing revenue"
      }
    ],
    "entities": [
      {
        "id": "do1",
        "name": "High customer satisfaction",
        "type": "objective",
        "x": 400,
        "y": 50
      },
      {
        "id": "do2",
        "name": "Low employee turnover",
        "type": "objective",
        "x": 600,
        "y": 50
      },
      {
        "id": "do3",
        "name": "Growing revenue",
        "type": "objective",
        "x": 500,
        "y": 150
      },
      {
        "id": "int1",
        "name": "Improved management skills",
        "type": "intermediate",
        "x": 500,
        "y": 250
      },
      {
        "id": "int2",
        "name": "High service quality",
        "type": "intermediate",
        "x": 300,
        "y": 250
      },
      {
        "id": "action1",
        "name": "Implement training programs",
        "type": "action",
        "x": 500,
        "y": 350
      }
    ],
    "viewState": {
      "zoom": 0.6299605249474366,
      "panX": 79.68183174586724,
      "panY": 50.81875269176727
    }
  }
}