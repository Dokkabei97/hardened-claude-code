#!/usr/bin/env node
/**
 * Dangerous Command Blocker - 4-Level Security Hook for Claude Code
 *
 * Reads JSON from stdin (PreToolUse Bash hook input), matches command against
 * security patterns (L1~L4), and outputs permissionDecision JSON to stdout.
 *
 * Security Levels:
 *   L1 Catastrophic - System destruction (always deny)
 *   L2 Critical Path - Project critical files (always deny)
 *   L3 Dangerous     - Risky git/system ops (ask user)
 *   L4 Suspicious    - Suspicious patterns (ask user)
 */

'use strict';

// ─── Pattern Definitions ───────────────────────────────────────────────

const L1_CATASTROPHIC = [
  { pattern: /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*)?\/(\..*)?$/,  desc: 'rm -rf /' },
  { pattern: /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*)?\/\s/,         desc: 'rm on root path' },
  { pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*)?~\/?(\s|$)/,   desc: 'rm home directory' },
  { pattern: /\bdd\s+.*\bof=\/dev\/[sh]d/,                                      desc: 'dd to disk device' },
  { pattern: /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,                     desc: 'fork bomb' },
  { pattern: /\bmkfs\b/,                                                         desc: 'mkfs (format disk)' },
  { pattern: /\bchmod\s+(-[a-zA-Z]*\s+)*777\s+\//,                              desc: 'chmod 777 on root' },
  { pattern: /\b(shutdown|reboot|halt|poweroff)\b/,                              desc: 'system shutdown/reboot' },
  { pattern: /\b(rm|del)\s+(-[a-zA-Z]*\s+)*\/etc\b/,                            desc: 'remove /etc' },
  { pattern: />\s*\/dev\/[sh]da/,                                                desc: 'write to disk device' },
];

const L2_CRITICAL_PATH = [
  { pattern: /\b(rm|mv)\s+(-[a-zA-Z]*\s+)*.*\.git\b/,                     desc: 'modify .git directory' },
  { pattern: /\b(rm|mv)\s+(-[a-zA-Z]*\s+)*.*\.claude\b/,                  desc: 'modify .claude directory' },
  { pattern: /\b(rm|mv|cat\s*>)\s+(-[a-zA-Z]*\s+)*.*\.env\b/,             desc: 'modify .env file' },
  { pattern: /\b(rm|mv|cat\s*>)\s+(-[a-zA-Z]*\s+)*.*package\.json\b/,     desc: 'modify package.json' },
  { pattern: /\b(rm|mv|cat\s*>)\s+(-[a-zA-Z]*\s+)*.*package-lock\.json\b/,desc: 'modify package-lock.json' },
  { pattern: /\b(rm|mv|cat\s*>)\s+(-[a-zA-Z]*\s+)*.*yarn\.lock\b/,        desc: 'modify yarn.lock' },
  { pattern: /\b(rm|mv|cat\s*>)\s+(-[a-zA-Z]*\s+)*.*pnpm-lock\.yaml\b/,  desc: 'modify pnpm-lock.yaml' },
  { pattern: /\b(rm|mv|cat\s*>)\s+(-[a-zA-Z]*\s+)*.*bun\.lockb?\b/,       desc: 'modify bun lockfile' },
  { pattern: /\b(rm|mv)\s+(-[a-zA-Z]*\s+)*.*hooks\/hooks\.json\b/,        desc: 'modify hooks/hooks.json' },
  { pattern: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*\s+(-[a-zA-Z]*\s+)*)*(agents|commands|skills|scripts)\//,
                                                                            desc: 'remove plugin directories' },
];

const L3_DANGEROUS = [
  { pattern: /\bgit\s+push\s+.*(-f|--force)\b/,                            desc: 'git force push' },
  { pattern: /\bgit\s+push\s+.*--force-with-lease\b/,                      desc: 'git force push (with-lease)' },
  { pattern: /\bgit\s+reset\s+--hard\b/,                                   desc: 'git reset --hard' },
  { pattern: /\bgit\s+checkout\s+\.\s*$/,                                  desc: 'git checkout . (discard all)' },
  { pattern: /\bgit\s+checkout\s+--\s+\./,                                 desc: 'git checkout -- . (discard all)' },
  { pattern: /\bgit\s+clean\s+(-[a-zA-Z]*f|-f)/,                           desc: 'git clean -f' },
  { pattern: /\bgit\s+branch\s+(-[a-zA-Z]*D|-D)/,                          desc: 'git branch -D (force delete)' },
  { pattern: /\bgit\s+stash\s+drop\b/,                                     desc: 'git stash drop' },
  { pattern: /\bgit\s+rebase\s+--abort\b/,                                 desc: 'git rebase --abort' },
  { pattern: /\bsudo\b/,                                                    desc: 'sudo (elevated privileges)' },
  { pattern: /\bcurl\s+.*\|\s*(ba)?sh\b/,                                  desc: 'curl pipe to shell' },
  { pattern: /\bwget\s+.*\|\s*(ba)?sh\b/,                                  desc: 'wget pipe to shell' },
  { pattern: /\bnpm\s+publish\b/,                                           desc: 'npm publish' },
  { pattern: /\bchmod\s+(-[a-zA-Z]*\s+)*[0-7]*7[0-7]*\s/,                  desc: 'chmod with world-writable' },
];

const L4_SUSPICIOUS = [
  { pattern: /\brm\s+(-[a-zA-Z]*\s+)*\S*\*/,                              desc: 'rm with wildcard' },
  { pattern: /(&&|;)\s*rm\b/,                                              desc: 'chained rm command' },
  { pattern: /\bfind\s+.*-delete\b/,                                       desc: 'find -delete' },
  { pattern: /\bfind\s+.*-exec\s+rm\b/,                                    desc: 'find -exec rm' },
  { pattern: /\bxargs\s+rm\b/,                                             desc: 'xargs rm' },
  { pattern: /\bkill\s+(-[a-zA-Z]*9|-9|-KILL)\b/,                          desc: 'kill -9 (force kill)' },
  { pattern: /\bpkill\s+(-[a-zA-Z]*9|-9|-KILL)\b/,                         desc: 'pkill -9 (force kill)' },
  { pattern: /\b(chmod|chown)\s+(-[a-zA-Z]*R|-R)\b/,                       desc: 'recursive permission change' },
  { pattern: /\beval\s+.*\$\(/,                                            desc: 'eval with command substitution' },
];

// ─── Core Logic ────────────────────────────────────────────────────────

function checkCommand(command) {
  if (!command || typeof command !== 'string') return null;

  const cmd = command.trim();

  // L1 — Catastrophic (deny, no user override)
  for (const rule of L1_CATASTROPHIC) {
    if (rule.pattern.test(cmd)) {
      return {
        level: 'L1',
        category: 'CATASTROPHIC',
        decision: 'deny',
        desc: rule.desc,
      };
    }
  }

  // L2 — Critical Path (deny, no user override)
  for (const rule of L2_CRITICAL_PATH) {
    if (rule.pattern.test(cmd)) {
      return {
        level: 'L2',
        category: 'CRITICAL',
        decision: 'deny',
        desc: rule.desc,
      };
    }
  }

  // L3 — Dangerous (ask user)
  for (const rule of L3_DANGEROUS) {
    if (rule.pattern.test(cmd)) {
      return {
        level: 'L3',
        category: 'DANGEROUS',
        decision: 'ask',
        desc: rule.desc,
      };
    }
  }

  // L4 — Suspicious (ask user)
  for (const rule of L4_SUSPICIOUS) {
    if (rule.pattern.test(cmd)) {
      return {
        level: 'L4',
        category: 'SUSPICIOUS',
        decision: 'ask',
        desc: rule.desc,
      };
    }
  }

  return null; // safe — no output, allow execution
}

function buildResponse(match, command) {
  const truncated = command.length > 80 ? command.slice(0, 77) + '...' : command;

  if (match.decision === 'deny') {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `[SECURITY ${match.level}/${match.category}] BLOCKED: ${match.desc}\n` +
          `Command: ${truncated}\n` +
          'This command is not allowed. Use a safer alternative.',
      },
    };
  }

  // decision === 'ask'
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        `[SECURITY ${match.level}/${match.category}] WARNING: ${match.desc}\n` +
        `Command: ${truncated}\n` +
        'This command requires user approval to proceed.',
    },
  };
}

// ─── Main ──────────────────────────────────────────────────────────────

function main() {
  let data = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { data += chunk; });
  process.stdin.on('end', () => {
    try {
      const input = JSON.parse(data);
      const command = input.tool_input?.command || '';

      const match = checkCommand(command);
      if (match) {
        const response = buildResponse(match, command);
        process.stdout.write(JSON.stringify(response));
      }
      // If no match, output nothing → Claude Code treats as allow
    } catch (err) {
      // Parse error — do not block, just log to stderr
      process.stderr.write(`[Hook] dangerous-command-blocker: parse error: ${err.message}\n`);
    }
    process.exit(0);
  });
}

main();
