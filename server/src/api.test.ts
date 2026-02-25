import request from "supertest";
import app from "./index";

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("GET /api/flows", () => {
  it("returns 200 with an array of flows", async () => {
    const res = await request(app).get("/api/flows");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("each flow has id, name, and items", async () => {
    const res = await request(app).get("/api/flows");
    const flow = res.body[0];
    expect(flow).toHaveProperty("id");
    expect(flow).toHaveProperty("name");
    expect(flow).toHaveProperty("items");
  });

  it("flow items have name and duration", async () => {
    const res = await request(app).get("/api/flows");
    const item = res.body[0].items[0];
    expect(item).toHaveProperty("name");
    expect(item).toHaveProperty("duration");
  });
});
