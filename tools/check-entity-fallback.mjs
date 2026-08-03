import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT, Report } from './lib/content.mjs';

/**
 * No engine decision falls back to ANOTHER ENTITY'S DATA.
 *
 * A FALLBACK TO A LITERAL OR A NAMED CONSTANT IS FINE. A FALLBACK TO SOMEBODY
 * ELSE'S FIELD IS NOT.
 *
 *   ?? 240                     fine -- "nobody told me, here is the standard answer"
 *   ?? PLACEHOLDER_HEIGHT      fine -- the same, with a name to grep for
 *   ?? content.actor.height    THE DEFECT -- "nobody told me, I will use his answer"
 *
 * The first two are visible. The third is silent BY CONSTRUCTION, because
 * somebody else's answer is always plausible: it has the right type, the right
 * magnitude, and it comes from a record that is correct about itself.
 *
 * THE CASE THAT PRODUCED IT. `Actor`'s height fell through to
 * `state.content.actor.height`. The coach asked how tall it was, its own record
 * could not answer -- the code never looked -- and the engine answered with THE
 * PROTAGONIST'S 240 against art of 389. Nothing was wrong anywhere else: the
 * record was right, the generator was right, every check was green, and a
 * stagecoach drew with its roof at a man's head height.
 *
 * WHAT THIS CHECKS IS THE GREPPABLE SUBSET, and it is deliberately narrow.
 * `content.actor` -- singular -- is the protagonist, and in a codebase with one
 * well-populated actor record he is the most plausible thing to fill any
 * character-shaped hole. Reading him to answer a question about a mover that is
 * not him is the defect, every time.
 *
 * THE RULE IS `content.actors.get(id)`, NOT AN EXEMPTION FROM ONE. A lookup
 * KEYED BY THE IDENTITY OF THE THING BEING DECIDED ABOUT is what a correct
 * answer looks like; that key is the entire difference between a lookup and a
 * borrow, and all three findings were borrows.
 *
 * WHY THIS IS MORE COMPLICATED THAN IT LOOKS, AND IT HAS TO BE. Two shapes hid
 * the protagonist's record from an operand-only reading, and NEITHER WAS
 * WRITTEN TO EVADE ANYTHING -- both are ordinary tidy code that happens to be
 * shaped like the exception, which is how a rule like this dies. Not to
 * somebody working around it. To somebody being neat.
 *
 *   A BARE IDENTIFIER HIDES EVERYTHING. `GameState.surfaceAt` read the
 *   protagonist's first clip into a local called `fallback` and wrote
 *   `?? fallback`. The operand is an identifier and a check that stops there
 *   shrugs. So this follows one hop to a same-file `const` initialiser.
 *
 *   A TIDY LITTLE DEFAULT HIDES THE REST. That same local was
 *   `content.actor.clips[0]?.surface ?? ''` -- the borrowed field already
 *   wrapped in its own fallback, so the thing being read is no longer the
 *   operand of anything. So this looks through the left side of a nested
 *   fallback too.
 *
 * Both were live in the tree when the check was written.
 *
 * THE GENERAL RULE IS WIDER THAN THIS SCRIPT: an engine decision must trace to
 * a field on the thing it is deciding about, or to a named constant, and
 * nothing else. That is a review rule. Its first catch had no `??` in it at
 * all -- `GameScene.choreSeconds` read `content.actor` and guarded with
 * `mover.id === record.id`, which was CORRECT while he was the only record and
 * became wrong the moment Hob's landed: a defect created by a different file
 * being added, in code nobody touched. This is the part a machine can hold,
 * and it would have caught the coach.
 */
const SINGLETON = 'actor';

function chainMentionsSingleton(node, src) {
  // `content.actor.height` -- the protagonist reached through any prefix.
  // `content.actors.get(id)` is a different name and is not matched.
  let cursor = node;
  while (cursor) {
    if (ts.isPropertyAccessExpression(cursor)) {
      if (cursor.name.text === SINGLETON) {
        const owner = cursor.expression;
        if (ts.isPropertyAccessExpression(owner) && owner.name.text === 'content') return true;
        if (ts.isIdentifier(owner) && owner.text === 'content') return true;
      }
      cursor = cursor.expression;
      continue;
    }
    if (ts.isElementAccessExpression(cursor) || ts.isCallExpression(cursor)
      || ts.isNonNullExpression(cursor) || ts.isParenthesizedExpression(cursor)) {
      cursor = cursor.expression;
      continue;
    }
    // `x.y ?? ''` -- the guarded value is still the one being read. Without
    // this, wrapping the protagonist's field in its own tidy little default
    // hides it, which is exactly what GameState's `surfaceAt` does.
    if (ts.isBinaryExpression(cursor)
      && (cursor.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        || cursor.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      cursor = cursor.left;
      continue;
    }
    return false;
  }
  return false;
}

/**
 * The `const` a bare-identifier fallback was assigned from, in the same file.
 *
 * WITHOUT THIS THE CHECK IS TRIVIAL TO EVADE, and it already was: GameState's
 * `surfaceAt` reads `this.content.actor.clips[0]?.surface` into a local called
 * `fallback` and then writes `?? fallback`. The protagonist's data reaches the
 * decision through a name, and a check that only reads the operand sees an
 * identifier and shrugs. One hop is most of the value -- laundering it twice
 * is no longer something anybody does by accident.
 *
 * Scope-naive on purpose: it matches by name across the file. Two locals
 * sharing a name would flag the wrong one, and the message names both lines,
 * so a person resolves that in seconds. Failing toward a flag is the right
 * direction for a rule whose whole subject is a plausible wrong answer.
 */
function initialiserOf(name, src) {
  let found;
  const walk = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
      && node.name.text === name && node.initializer) {
      found ??= node;
    }
    ts.forEachChild(node, walk);
  };
  walk(src);
  return found;
}

export function check() {
  const report = new Report('No engine fallback answers with another entity\'s data');
  const files = globSync('engine/**/*.ts', { cwd: ROOT }).sort();

  let fallbacks = 0;
  for (const relative of files) {
    const path = resolve(ROOT, relative);
    const src = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);

    const visit = (node) => {
      if (ts.isBinaryExpression(node)
        && (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
          || node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
        fallbacks += 1;
        let right = node.right;
        while (ts.isParenthesizedExpression(right)) right = right.expression;

        let culprit = chainMentionsSingleton(right, src) ? right : null;
        let via = '';
        if (!culprit && ts.isIdentifier(right)) {
          const declared = initialiserOf(right.text, src);
          if (declared && chainMentionsSingleton(declared.initializer, src)) {
            culprit = declared.initializer;
            const at = src.getLineAndCharacterOfPosition(declared.getStart(src)).line + 1;
            via = ` (through \`${right.text}\`, assigned at line ${at})`;
          }
        }

        if (culprit) {
          const { line } = src.getLineAndCharacterOfPosition(right.getStart(src));
          report.fail(
            `${relative}:${line + 1} falls back to \`${culprit.getText(src).trim()}\`${via} `
            + `-- the PROTAGONIST'S record, answering a question about something that may `
            + `not be him. Fall back to a named constant, or to a field on the thing being `
            + `decided about (content.actors.get(id)). Somebody else's answer is always `
            + `plausible, which is why this one is silent.`,
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(src);
  }

  report.note(`${fallbacks} fallback(s) across ${files.length} engine file(s)`);
  return report;
}
