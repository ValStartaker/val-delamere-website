function addParty() {
  const template = document.getElementById("party-template");
  const clone = template.cloneNode(true);

  clone.removeAttribute("id");
  clone.style.display = "";

  clone.querySelectorAll("input").forEach(input => {
    if (input.type === "checkbox") {
      input.checked = false;
    } else if (input.type === "color") {
      input.value = "#000000";
    } else {
      input.value = "";
    }
  });

  const allGroups = document.querySelectorAll("ul.party-group:not(#party-template)");
  const anchor = allGroups.length > 0
    ? allGroups[allGroups.length - 1]
    : template;
  anchor.after(clone);
}

function exportJSON() {
  const params = {
    min_nrows: Number(document.getElementById("min_nrows").value) || 0,
    seat_radius_factor: Number(document.getElementById("seat_radius_factor").value) || 1,
    span_angle: Number(document.getElementById("span_angle").value) || 180,
    canvas_size: Number(document.getElementById("canvas_size").value) || 200,
    margins: Number(document.getElementById("margins").value) || 5.0,
    write_number_of_seats: document.getElementById("write_number_of_seats").checked,
    font_size_factor: Number(document.getElementById("font_size_factor").value) || 0.2057,
    attrib: []
  };

  document.querySelectorAll("ul.party-group:not(#party-template)").forEach(group => {
    const inputs = group.querySelectorAll("input");
    params.attrib.push({
      data: inputs[0].value,
      color: inputs[1].value,
      border_size: Number(inputs[2].value) || 0,
      border_color: inputs[3].value,
      nseats: Number(inputs[4].value) || 0,
    });
  });

  const blob = new Blob([JSON.stringify(params, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "parliament.json";
  a.click();
}

function importJSON() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json";

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const params = JSON.parse(e.target.result);

      document.getElementById("min_nrows").value = params.min_nrows ?? 0;
      document.getElementById("seat_radius_factor").value = params.seat_radius_factor ?? 1;
      document.getElementById("span_angle").value = params.span_angle ?? 180;
      document.getElementById("canvas_size").value = params.canvas_size ?? 200;
      document.getElementById("margins").value = params.margins ?? 5.0;
      document.getElementById("write_number_of_seats").checked = params.write_number_of_seats ?? false;
      document.getElementById("font_size_factor").value = params.font_size_factor ?? 0.2057;

      // Remove all visible party groups
      document.querySelectorAll("ul.party-group:not(#party-template)").forEach(g => g.remove());

      // Add one group per party and populate
      params.attrib.forEach(party => {
        addParty();
        const groups = document.querySelectorAll("ul.party-group:not(#party-template)");
        const group = groups[groups.length - 1];

        const inputs = group.querySelectorAll("input");
        inputs[0].value = party.data;
        inputs[1].value = party.color;
        inputs[2].value = party.border_size ?? 0;
        inputs[3].value = party.border_color ?? "#000000";
        inputs[4].value = party.nseats;
      });
    };

    reader.readAsText(file);
  });

  fileInput.click();
}

function reset() {
  document.getElementById("min_nrows").value = "";
  document.getElementById("seat_radius_factor").value = "";
  document.getElementById("span_angle").value = "";
  document.getElementById("canvas_size").value = "";
  document.getElementById("margins").value = "";
  document.getElementById("write_number_of_seats").checked = false;
  document.getElementById("font_size_factor").value = "";

  document.querySelectorAll("ul.party-group:not(#party-template)").forEach(g => g.remove());
  addParty();
}

async function generate() {
  const params = {
    min_nrows: Number(document.getElementById("min_nrows").value) || 0,
    seat_radius_factor: Number(document.getElementById("seat_radius_factor").value) || 1,
    span_angle: Number(document.getElementById("span_angle").value) || 180,
    canvas_size: Number(document.getElementById("canvas_size").value) || 200,
    margins: Number(document.getElementById("margins").value) || 5.0,
    write_number_of_seats: document.getElementById("write_number_of_seats").checked,
    font_size_factor: Number(document.getElementById("font_size_factor").value) || 0.2057,
    attrib: []
  };

  document.querySelectorAll("ul.party-group:not(#party-template)").forEach(group => {
    const inputs = group.querySelectorAll("input");
    params.attrib.push({
      data: inputs[0].value,
      color: inputs[1].value,
      border_size: Number(inputs[2].value) || 0,
      border_color: inputs[3].value,
      nseats: Number(inputs[4].value) || 0,
    });
  });

  const outputDiv = document.getElementById("svg-output");
  outputDiv.innerHTML = "<p><i>Generating...</i></p>";

  try {
    const response = await fetch("https://web-production-3b898.up.railway.app/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const err = await response.text();
      outputDiv.innerHTML = `<p style="color:red">Error: ${err}</p>`;
      return;
    }

    const svgText = await response.text();
    outputDiv.innerHTML = svgText;

    // Add a download link beneath the SVG
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "parliament.svg";
    a.textContent = "Download SVG";
    a.className = "button1";
    a.style.display = "inline-block";
    a.style.marginTop = "0.5rem";
    outputDiv.appendChild(a);

  } catch (err) {
    outputDiv.innerHTML = `<p style="color:red">Request failed: ${err}</p>`;
  }
}