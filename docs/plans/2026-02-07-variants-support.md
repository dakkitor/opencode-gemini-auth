# Variants Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable `thinkingConfig` support at the request root level, document the `variants` configuration pattern, and configure the local environment for testing.

**Architecture:** 
The plugin currently expects `thinkingConfig` nested within `generationConfig`. The OpenCode CLI's `variants` feature injects `thinkingConfig` at the root of the request payload. We need to normalize this by moving root-level `thinkingConfig` into `generationConfig`. We will also document this configuration pattern and point the local OpenCode installation to this development build.

**Tech Stack:** TypeScript, Bun (test runner), OpenCode Plugin API

---

### Task 1: Support `thinkingConfig` at root of `requestPayload`

**Files:**
- Modify: `src/plugin/request.ts`
- Test: `src/plugin/request.test.ts`

**Step 1: Write the failing test**

Add a test case to `src/plugin/request.test.ts` that simulates a request with `thinkingConfig` at the root level (typical of `variants` injection).

```typescript
  it("normalizes thinkingConfig from root of request payload", () => {
    const input =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
    const init: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "hi" }] }],
        thinkingConfig: { includeThoughts: true, thinkingLevel: "high" },
      }),
    };

    const result = prepareGeminiRequest(input, init, "token", "proj");
    const parsed = JSON.parse(result.init.body as string) as Record<string, unknown>;
    
    // Expectation: thinkingConfig moved to generationConfig
    const request = parsed.request as Record<string, unknown>;
    const genConfig = request.generationConfig as Record<string, unknown>;
    expect(request.thinkingConfig).toBeUndefined();
    expect(genConfig).toBeDefined();
    expect(genConfig.thinkingConfig).toEqual({
      includeThoughts: true,
      thinkingLevel: "high",
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `bun test src/plugin/request.test.ts`
Expected: FAIL - `thinkingConfig` will likely remain at root or be ignored, and `generationConfig` won't have it.

**Step 3: Implement the fix**

Modify `prepareGeminiRequest` in `src/plugin/request.ts`:
1.  Check for `requestPayload.thinkingConfig`.
2.  If present, normalize it using `normalizeThinkingConfig`.
3.  Move it to `requestPayload.generationConfig.thinkingConfig`.
4.  Remove it from the root.

**Step 4: Run test to verify it passes**

Run: `bun test src/plugin/request.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/plugin/request.ts src/plugin/request.test.ts
git commit -m "feat: support thinkingConfig at request root for variants compatibility"
```

### Task 2: Document `variants` configuration

**Files:**
- Modify: `README.md`

**Step 1: Add `variants` documentation**

Update `README.md` to include a section on `variants`. Document the structure:

```json
"variants": {
  "variant-name": {
    "thinkingConfig": {
      "thinkingLevel": "high",
      "includeThoughts": true
    }
  }
}
```

Replace or augment the existing "Model list" or "Thinking Models" section to show how `variants` can be used to define presets like "high" or "low" thinking.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document variants configuration structure"
```

### Task 3: Update package version

**Files:**
- Modify: `package.json`

**Step 1: Bump version**

Update `version` in `package.json` from `1.3.10` to `1.3.11`.

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 1.3.11"
```

### Task 4: Update local OpenCode config

**Files:**
- Modify: `~/.config/opencode/opencode.json`

**Step 1: Point plugin to local path**

Update the `plugin` array to use the local file path:

```json
"plugin": [
  "file:///home/doru/Documents/opencode-gemini-auth"
]
```

**Step 2: Ensure `variants` config is correct**

Verify `provider.google.models` uses the `variants` structure as documented. (It appears to already be there, just ensure it aligns with the documentation).

**Step 3: Verify configuration**

Run `opencode --version` or a simple command to ensure the config is valid and the plugin loads (log output might be visible if debug is on, but mainly checking for no crash).

**Step 4: Commit (optional - this is user config)**

User config is local, but if we were tracking it, we'd commit. For this task, just marking it done is enough.
