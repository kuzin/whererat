import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/public-sighting-submit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/public-sighting-submit")>();
  return {
    ...actual,
    executePublicSightingSubmit: vi.fn(),
  };
});

import { POST } from "@/app/api/v1/submissions/route";
import { executePublicSightingSubmit } from "@/lib/public-sighting-submit";

const mockExecute = vi.mocked(executePublicSightingSubmit);

function makeMultipartRequest(formData: FormData): NextRequest {
  // NextRequest needs a real Request with multipart body
  const body = formData;
  return new NextRequest("http://localhost/api/v1/submissions", {
    method: "POST",
    body,
  });
}

function makeJsonRequest(): NextRequest {
  return new NextRequest("http://localhost/api/v1/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
}

describe("POST /api/v1/submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 415 for non-multipart requests", async () => {
    const req = makeJsonRequest();
    const response = await POST(req);

    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("unsupported_media_type");
  });

  it("returns 200 with submissionId on success", async () => {
    mockExecute.mockResolvedValueOnce({
      ok: true,
      submissionId: "sub-abc-123",
      catalogMatchSlug: "ratatouille-2007",
    });

    const formData = new FormData();
    formData.append("movieTitle", "Ratatouille");
    const req = makeMultipartRequest(formData);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.submissionId).toBe("sub-abc-123");
    expect(body.catalogSlug).toBe("ratatouille-2007");
  });

  it("returns null catalogSlug when no catalog match", async () => {
    mockExecute.mockResolvedValueOnce({
      ok: true,
      submissionId: "sub-xyz-999",
    });

    const formData = new FormData();
    formData.append("movieTitle", "Unknown Film");
    const req = makeMultipartRequest(formData);
    const response = await POST(req);
    const body = await response.json();

    expect(body.catalogSlug).toBeNull();
  });

  it("returns 429 for rate-limited submissions", async () => {
    mockExecute.mockResolvedValueOnce({
      ok: false,
      code: "rate-limited",
    });

    const formData = new FormData();
    formData.append("movieTitle", "Ratatouille");
    const req = makeMultipartRequest(formData);
    const response = await POST(req);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate-limited");
  });

  it("returns 422 for missing fields", async () => {
    mockExecute.mockResolvedValueOnce({
      ok: false,
      code: "missing",
    });

    const formData = new FormData();
    const req = makeMultipartRequest(formData);
    const response = await POST(req);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("missing");
  });

  it("returns 422 for missing IMDb ID", async () => {
    mockExecute.mockResolvedValueOnce({
      ok: false,
      code: "no-imdb",
    });

    const formData = new FormData();
    formData.append("movieTitle", "Unnamed Film");
    const req = makeMultipartRequest(formData);
    const response = await POST(req);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("no-imdb");
  });

  it("returns 500 for server errors", async () => {
    mockExecute.mockResolvedValueOnce({
      ok: false,
      code: "server-error",
      message: "DB connection failed",
    });

    const formData = new FormData();
    formData.append("movieTitle", "Ratatouille");
    const req = makeMultipartRequest(formData);
    const response = await POST(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("server-error");
  });
});
