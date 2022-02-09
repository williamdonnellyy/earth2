mapboxgl.accessToken =
  "pk.eyJ1Ijoid20xMTE4MTExOCIsImEiOiJja3k5ZGR5ajcwNTl5MnhwZDQ1Nzk5Z2ZhIn0.HRjY1eXlyQlUABFgqz6plQ";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/satellite-streets-v11",
  center: [13.380314, 52.517365],
  zoom: 12,
});
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

const grid = new MaplibreGrid.Grid({
  gridWidth: 0.75,
  gridHeight: 0.75,
  minZoom: 10,
  maxZoom: 14,
  units: "kilometers",
  paint: {
    "line-opacity": 1,
  },
});
map.addControl(grid);

let selectedCells = [];
let tempSelectedCells = [];
const selectedCellsId = "selected-cells";

map.on("load", () => {
  // Select polygon source
  map.addSource(selectedCellsId, {
    type: "geojson",
    data: { type: "FeatureCollection", features: selectedCells },
  });
  map.addLayer({
    id: selectedCellsId,
    source: selectedCellsId,
    type: "fill",
    paint: {
      "fill-color": "#ffffff",
      "fill-opacity": 0.6,
      "fill-outline-color": "transparent",
    },
  });

  let activeSelecting = false;
  map.on(MaplibreGrid.GRID_CLICK_EVENT, ({ bbox }) => {
    if (activeSelecting) {
      activeSelecting = false;
      document.getElementById("has-resource").classList.add("resource-show");
      selectedCells = [...selectedCells, ...tempSelectedCells];
    } else {
      activeSelecting = true;
      selectedTiles([bbox]);
    }
  });

  map.on(MaplibreGrid.GRID_MOUSE_MOVE_EVENT, ({ bboxes }) => {
    if (bboxes.length > 0) {
      selectedTiles(bboxes);
    }
  });

  const selectedTiles = (bboxes) => {
    tempSelectedCells = [];
    bboxes.forEach((bbox) => {
      const cellIndex = selectedCells.findIndex(
        (x) => x.geometry.bbox.toString() === bbox.toString()
      );
      if (cellIndex !== -1) return;

      const coordinates = [
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]],
        ],
      ];

      const cell = {
        type: "Feature",
        geometry: { type: "Polygon", bbox, coordinates },
      };

      tempSelectedCells.push(cell);
    });

    const newSelectedCells = [...selectedCells, ...tempSelectedCells];
    const source = map.getSource(selectedCellsId);
    source.setData({
      type: "FeatureCollection",
      features: newSelectedCells,
    });

    if (newSelectedCells.length > 0) {
      document.getElementById("tile-counts").innerText =
        newSelectedCells.length;
      document.getElementById("no-selected").classList.remove("selected-show");
      document.getElementById("has-selected").classList.add("selected-show");
      document.getElementById("has-details").classList.add("detail-show");
    }
  };

  // Remove selected tiles
  document.getElementById("remove-selected").addEventListener("click", () => {
    selectedCells = [];
    const sourceSelect = map.getSource(selectedCellsId);
    sourceSelect.setData({
      type: "FeatureCollection",
      features: selectedCells,
    });

    document.getElementById("tile-counts").innerText = "0";
    document.getElementById("no-selected").classList.add("selected-show");
    document.getElementById("has-selected").classList.remove("selected-show");
    document.getElementById("has-resource").classList.remove("resource-show");
    document.getElementById("has-details").classList.remove("detail-show");
  });

  // Show details
  document.getElementById("show-details").addEventListener("click", () => {
    console.log(
      "coordinates",
      selectedCells.map((s) => ({
        c: s.geometry.coordinates[0],
        b: s.geometry.bbox,
      }))
    );
    alert("Look at inspect console");
  });

  // Collapse/expand resources
  let expandResources = true;
  document.getElementById("resources-btn").addEventListener("click", () => {
    if (expandResources) {
      document
        .getElementById("resources-list")
        .classList.remove("resources-list-show");
      document
        .getElementById("resources-arrow")
        .classList.remove("resources-expand");
    } else {
      document
        .getElementById("resources-list")
        .classList.add("resources-list-show");
      document
        .getElementById("resources-arrow")
        .classList.add("resources-expand");
    }
    expandResources = !expandResources;
  });
});
