# Configure an annotation overlay

An annotation overlay is a JSON file that lets you customise how predicates and
resources appear in Moire — without modifying the underlying RDF data. Use an
overlay when you connect to a private or internal knowledge graph that uses
cryptic predicate names, internal identifiers, or lacks human-readable labels.

---

## When to use an overlay

An overlay is the right tool when:

- Predicates in your graph have opaque IRIs like
  `http://internal.example.org/sys/legacyId` that mean nothing to your users.
- You want to hide technical plumbing relationships (schema links, import
  artefacts, system fields) from the browsing interface.
- Your graph has sparse or no RDFS/SKOS metadata and you want to add plain-
  English descriptions without changing the data.
- You want to reorganise how predicates are grouped and ordered in the
  Relationships Browser.

---

## Step 1 — Create the overlay file

An overlay is a plain JSON file. Start with the minimal structure:

```json
{
  "version": 1,
  "name": "My graph overlay",
  "predicates": {}
}
```

Save it as a `.json` file somewhere Moire can fetch it over HTTP — for example
on your internal file server, object storage, or a static hosting service.

> **CORS not required.** The overlay is fetched server-side by Moire's backend,
> so there is no browser CORS restriction. Any HTTP URL that the server can
> reach will work.

### Add a predicate entry

For each predicate you want to customise, add an entry keyed by the predicate's
full IRI:

```json
{
  "version": 1,
  "predicates": {
    "http://example.org/research/affiliatedWith": {
      "label": "Affiliated with",
      "inverseLabel": "Affiliations",
      "description": "Links a researcher to the institution where they hold a position.",
      "role": "relational",
      "priority": 1
    }
  }
}
```

To hide a predicate entirely from normal view:

```json
{
  "version": 1,
  "predicates": {
    "http://internal.example.org/legacyId": {
      "label": "Legacy ID",
      "role": "structural",
      "hidden": true
    }
  }
}
```

Hidden predicates remain accessible via the **Technical view** toggle in the
Relationships Browser.

For a full list of all supported overlay fields, see the
[Overlay schema reference](../advanced/overlay-schema.md).

---

## Step 2 — Register the overlay URL in the Endpoint Manager

1. Open Moire and click the endpoint settings icon in the top navigation bar.
2. Edit the endpoint you want to configure, or click **Add endpoint** if you
   are setting up a new one.
3. In the **Overlay URL** field, enter the full HTTP URL of your overlay file.
4. Click **Save** (or **Connect** for a new endpoint).

Moire fetches and validates the overlay immediately. If there is a problem
with the file, an error message describes what went wrong.

---

## Step 3 — Verify the overlay is applied

After connecting, open the Relationships Browser from any Set view. Predicates
with overlay-supplied labels and descriptions should appear with those values.

To confirm which annotations are coming from the overlay:

1. Click the **Technical view** toggle (eye icon) at the top of the
   Relationships Browser.
2. Rows sourced from the overlay are marked with an amber **overlay** badge.
3. Hidden predicates become visible with a red **hidden** badge.

---

## Updating the overlay

The overlay is fetched once during connection setup and cached alongside the
introspection data. To apply changes to your overlay file:

1. Update the JSON file at the same URL.
2. In the Endpoint Manager, click the **Reconnect** button for the endpoint.

Moire will re-fetch and re-validate the overlay.

---

## Example overlays

Three ready-to-use overlay templates are available in the `docs/examples/`
directory:

- [`hide-structural-predicates.json`](../examples/hide-structural-predicates.json)
  — Hides the most common ontology-level predicates (OWL, RDFS) from normal
  view.
- [`rename-internal-ids.json`](../examples/rename-internal-ids.json) — Renames
  common internal-system predicates to human-readable labels.
- [`add-descriptions-for-sparse-graphs.json`](../examples/add-descriptions-for-sparse-graphs.json)
  — Adds plain-English labels, descriptions, and groups for a typical research
  graph with sparse metadata.

Copy the most relevant template, adjust the predicate IRIs to match your graph,
and host it at an HTTP URL.

---

## Troubleshooting

**"Overlay: unsupported schema version …"**
Your file must contain `"version": 1`. Check that the version field is a
number, not a string.

**"Overlay: predicate … 'role' must be one of …"**
The role value you used is not in the list. See the
[roles reference](../reference/predicate-roles.md) for valid values.

**"Overlay: predicate … 'hidden' must be a boolean"**
Write `true` or `false` without quotes. `"true"` (a string) is not valid.

**The overlay URL returns a 404 or is unreachable**
Verify the URL is correct and that the server where Moire is running can
fetch it. If Moire is running locally, `localhost` URLs referring to another
service will work if the service is running on the same machine.

**My overlay was saved but changes are not visible**
Changes only take effect after reconnecting the endpoint. Use the
**Reconnect** button in the Endpoint Manager.
