import { describe, it, expect } from "vitest";
import {
  setupAgent, aiCooLite, revOpsAgent,
  aiSdrAgent, contentDirectorAgent, growthLeadAgent,
} from "../../../src/mastra/agents";

describe("Agent Definitions", () => {
  const agents = [
    { agent: setupAgent, name: "System Setup Agent" },
    { agent: aiCooLite, name: "AI COO Lite" },
    { agent: revOpsAgent, name: "RevOps" },
    { agent: aiSdrAgent, name: "AI SDR" },
    { agent: contentDirectorAgent, name: "Content Director" },
    { agent: growthLeadAgent, name: "Growth Lead" },
  ];

  for (const { agent, name } of agents) {
    it(`${name} agent is defined`, () => {
      expect(agent).toBeDefined();
      expect(agent.name).toBe(name);
    });
  }

  it("all 6 agents exist", () => {
    expect(agents).toHaveLength(6);
  });
});
