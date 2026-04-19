"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEndpointStore } from "@/stores/endpoint-store";
import { useNavigationStore } from "@/stores/navigation-store";
import { setupEndpoint } from "@/app/actions/graph";
import type { EndpointConfig } from "@/lib/types";
import { Loader2, Plus, Trash2 } from "lucide-react";

export function EndpointManager() {
  const endpoints = useEndpointStore((s) => s.endpoints);
  const addEndpoint = useEndpointStore((s) => s.addEndpoint);
  const removeEndpoint = useEndpointStore((s) => s.removeEndpoint);
  const setIntrospection = useEndpointStore((s) => s.setIntrospection);
  const setEndpoint = useNavigationStore((s) => s.setEndpoint);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [sparqlUrl, setSparqlUrl] = useState("");
  const [authType, setAuthType] = useState<"none" | "basic" | "bearer">("none");
  const [credentials, setCredentials] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!label.trim() || !sparqlUrl.trim()) {
      setError("Label and SPARQL URL are required.");
      return;
    }

    // Basic URL validation
    try {
      new URL(sparqlUrl);
    } catch {
      setError("Invalid URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const config: EndpointConfig = {
        id,
        label,
        sparqlUrl,
        auth: authType !== "none" ? { type: authType, credentials } : undefined,
      };

      // Detect capabilities + introspect server-side (avoids CORS and Node.js-only APIs)
      const { capabilities, summaries, labelPredicate } = await setupEndpoint(
        sparqlUrl,
        authType !== "none" ? { type: authType, credentials } : undefined,
      );
      config.capabilities = capabilities;
      config.labelPredicate = labelPredicate;

      addEndpoint(config);
      setIntrospection(id, summaries);

      // Reset form
      setLabel("");
      setSparqlUrl("");
      setAuthType("none");
      setCredentials("");
      setShowForm(false);

      // Navigate to the new endpoint
      setEndpoint(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-primary">⬡</span> moire
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faceted parallax navigation for knowledge graphs
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Endpoint
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connect to SPARQL Endpoint</CardTitle>
            <CardDescription>
              Enter the URL of any SPARQL 1.1 endpoint. pg-ripple endpoints are auto-detected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ep-label">Label</label>
              <Input
                id="ep-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. My Triplestore"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ep-url">SPARQL Endpoint URL</label>
              <Input
                id="ep-url"
                value={sparqlUrl}
                onChange={(e) => setSparqlUrl(e.target.value)}
                placeholder="https://example.org/sparql"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" htmlFor="ep-auth">Authentication</label>
              <select
                id="ep-auth"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as "none" | "basic" | "bearer")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="none">None</option>
                <option value="basic">Basic (user:pass)</option>
                <option value="bearer">Bearer Token</option>
              </select>
            </div>
            {authType !== "none" && (
              <div className="space-y-1">
                <label className="text-xs font-medium" htmlFor="ep-cred">
                  {authType === "basic" ? "Credentials (user:password)" : "Token"}
                </label>
                <Input
                  id="ep-cred"
                  type="password"
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder={authType === "basic" ? "user:password" : "token"}
                  autoComplete="off"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} disabled={loading} size="sm">
                {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Connect
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {endpoints.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-lg font-medium text-muted-foreground">No endpoints configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add a SPARQL endpoint to start exploring knowledge graphs.
          </p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add your first endpoint
          </Button>
        </div>
      )}

      {endpoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.map((ep) => (
            <Card key={ep.id} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{ep.label}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeEndpoint(ep.id)}
                    aria-label={`Remove ${ep.label}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {ep.sparqlUrl}
                </p>
                {ep.capabilities?.isPgRipple && (
                  <span className="text-xs text-green-600 dark:text-green-400">pg-ripple detected</span>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setEndpoint(ep.id)}
                >
                  Open →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
