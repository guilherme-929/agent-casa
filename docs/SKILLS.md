# Skill Management: SandecoClaw

The **SandecoClaw** agent uses a modular "Skill" system that allows you to add new capabilities dynamically without restarting the application (**Hot-Reload**).

---

## 1. How it Works

The skill system follows a three-step pipeline:
1. **Loader**: At every request, the system reads the `.agents/skills` directory to find available skills.
2. **Router**: A fast, low-cost LLM call (the "Step Zero") analyzes the user's intent and decides which skill to activate (or none).
3. **Executor**: If a skill is selected, its detailed instructions (`SKILL.md`) are injected into the agent's context for that specific request.

---

## 2. Skill Structure

Each skill is a subdirectory inside `.agents/skills/`. A valid skill folder MUST contain a `SKILL.md` file.

```text
.agents/skills/
└── my-new-skill/
    ├── SKILL.md      <-- Required: Instructions and metadata
    ├── scripts/      <-- Optional: Helper scripts
    └── examples/     <-- Optional: Usage examples
```

---

## 3. Creating a `SKILL.md`

The `SKILL.md` file uses **YAML Frontmatter** for metadata and standard Markdown for instructions.

### Template:
```markdown
---
name: "Skill Name"
description: "Brief summary of what this skill does (used by the Router)."
---

# Instructions
Detailed instructions for the LLM on how to behave when this skill is active.

## Tools
List of tools this skill can use (if applicable).

## Examples
User: "Example request"
Assistant: "Expected response"
```

---

## 4. Hot-Reload

Since the `SkillLoader` reads the directory on every request, you can:
- Create a new skill folder.
- Edit an existing `SKILL.md`.
- Delete a skill.

Changes take effect **immediately** on the next message sent to the bot.

---

## 5. Best Practices

- **Atomic Skills**: Each skill should focus on one specific domain (e.g., `git-manager`, `recipe-helper`).
- **Clear Descriptions**: The `description` in the frontmatter is what the Router uses to pick the skill. Make it concise and descriptive.
- **Instruct Clearly**: Use "The Claude Way" (clear, XML-like tags or structured sections) for the instructions inside `SKILL.md`.
- **Avoid Overlap**: If two skills have very similar descriptions, the Router might get confused.
