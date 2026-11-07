import { describe, expect, it } from '@jest/globals';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import * as ts from 'typescript';

const ROOT = join(__dirname, '..', '..');
const ENTRY = 'app';
const EXTENSIONS = ['.tsx', '.ts', '/index.tsx', '/index.ts'];
const SKIPPED_FILE = /(\.test\.tsx?|\.d\.ts)$/;
const SKIPPED_DIR = new Set(['__tests__', 'locales', 'node_modules']);

const DISPLAY_PROPS = new Set([
  'title',
  'subtitle',
  'label',
  'placeholder',
  'accessibilityLabel',
  'accessibilityHint',
  'message',
  'description',
  'text',
  'hint',
  'headerTitle',
  'tabBarLabel',
  'body',
  'promptMessage',
  'cancelLabel',
  'fallbackLabel',
]);
const DISPLAY_CALLS =
  /^(Alert\.alert|Alert\.prompt|Toast\.show|setError|setErrorMessage)$/;

const ALLOWED = new Set([
  "Sécuri'Click",
  'SecuriClick',
  "Securi'Click",
  'contact@securi-click.com',
  'shavod.com',
  'École des Tilleuls',
  'UAI',
  'QR',
  '6ème',
  '5ème',
  '4ème',
  '3ème',
  'École maternelle privée',
  'École maternelle publique',
  'École primaire privée',
  'École primaire publique',
  'Léa',
  'Noé',
  'Inès',
]);

const HUMAN = /\p{L}{2,}/u;
const ACCENTED = /[À-ÖØ-öø-ÿŒœ]/;
const PHRASE = /^\p{Lu}\p{Ll}+(['’]\p{L}+)?\s+\p{L}/u;
const SENTENCE = /^\p{Lu}\p{Ll}{2,}|\s\p{L}+/u;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIPPED_DIR.has(entry.name) ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(entry.name) && !SKIPPED_FILE.test(entry.name)
      ? [path]
      : [];
  });
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

function resolveImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? join(ROOT, 'src', specifier.slice(2))
    : specifier.startsWith('.')
      ? join(dirname(from), specifier)
      : null;
  if (!base) return null;
  if (existsSync(base) && statSync(base).isFile()) return base;
  const match = EXTENSIONS.map(ext => base + ext).find(existsSync);
  return match ?? null;
}

function importsOf(file: string): string[] {
  const specifiers: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        node.expression.getText() === 'require') &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(parse(file));
  return specifiers
    .map(specifier => resolveImport(file, specifier))
    .filter((path): path is string => !!path && /\.tsx?$/.test(path));
}

function reachableFiles(): string[] {
  const seen = new Set<string>();
  const queue = sourceFiles(join(ROOT, ENTRY));
  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || seen.has(file) || SKIPPED_FILE.test(file)) continue;
    seen.add(file);
    queue.push(...importsOf(file));
  }
  return [...seen].sort();
}

function literalText(node: ts.Node | undefined): string | null {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map(span => span.literal.text),
    ].join(' ');
  }
  if (ts.isJsxExpression(node)) return literalText(node.expression);
  return null;
}

function displayedTexts(node: ts.Node | undefined): string[] {
  if (!node) return [];
  const text = literalText(node);
  if (text !== null) return [text];
  if (ts.isParenthesizedExpression(node))
    return displayedTexts(node.expression);
  if (ts.isConditionalExpression(node)) {
    return [
      ...displayedTexts(node.whenTrue),
      ...displayedTexts(node.whenFalse),
    ];
  }
  if (ts.isBinaryExpression(node)) {
    const operator = node.operatorToken.kind;
    if (
      operator === ts.SyntaxKind.QuestionQuestionToken ||
      operator === ts.SyntaxKind.BarBarToken
    ) {
      return [...displayedTexts(node.left), ...displayedTexts(node.right)];
    }
    if (operator === ts.SyntaxKind.AmpersandAmpersandToken) {
      return displayedTexts(node.right);
    }
  }
  return [];
}

function isHuman(text: string | null): text is string {
  if (!text) return false;
  const trimmed = text.trim();
  return HUMAN.test(trimmed) && !ALLOWED.has(trimmed);
}

function insideConsole(node: ts.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (
      ts.isCallExpression(current) &&
      /^console\./.test(current.expression.getText())
    ) {
      return true;
    }
  }
  return false;
}

function findHardcodedText(file: string): string[] {
  const sf = parse(file);
  const found: string[] = [];
  const report = (node: ts.Node, text: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    found.push(
      `${relative(ROOT, file)}:${line + 1} ${text.trim().slice(0, 60)}`
    );
  };

  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) &&
      /^[a-z]{2}-[A-Z]{2}$/.test(node.text) &&
      !file.endsWith('locale.ts')
    ) {
      report(node, node.text);
    } else if (ts.isJsxText(node) && isHuman(node.text)) {
      report(node, node.text);
    } else if (
      ts.isJsxExpression(node) &&
      (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
    ) {
      for (const text of displayedTexts(node.expression)) {
        if (isHuman(text)) report(node, text);
      }
    } else if (
      ts.isJsxAttribute(node) &&
      DISPLAY_PROPS.has(node.name.getText())
    ) {
      const text = literalText(node.initializer);
      if (isHuman(text)) report(node, text);
    } else if (
      ts.isCallExpression(node) &&
      DISPLAY_CALLS.test(node.expression.getText())
    ) {
      for (const arg of node.arguments) {
        const text = literalText(arg);
        if (isHuman(text)) report(arg, text);
      }
    } else if (
      ts.isNewExpression(node) &&
      node.expression.getText() === 'Error'
    ) {
      for (const arg of node.arguments ?? []) {
        const text = literalText(arg);
        if (
          isHuman(text) &&
          (ACCENTED.test(text) || PHRASE.test(text.trim()))
        ) {
          report(arg, text);
        }
      }
    } else if (
      ts.isBindingElement(node) &&
      DISPLAY_PROPS.has(node.name.getText()) &&
      node.initializer
    ) {
      const text = literalText(node.initializer);
      if (isHuman(text) && SENTENCE.test(text.trim())) report(node, text);
    } else if (
      ts.isPropertyAssignment(node) &&
      DISPLAY_PROPS.has(node.name.getText())
    ) {
      const text = literalText(node.initializer);
      if (isHuman(text) && SENTENCE.test(text.trim())) report(node, text);
    } else if (
      ts.isTemplateExpression(node) &&
      !insideConsole(node) &&
      isHuman(literalText(node)) &&
      (ACCENTED.test(literalText(node) ?? '') ||
        PHRASE.test(node.head.text.trim()))
    ) {
      report(node, literalText(node) ?? '');
    } else if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !ts.isImportDeclaration(node.parent) &&
      !ts.isLiteralTypeNode(node.parent) &&
      (ACCENTED.test(node.text) || PHRASE.test(node.text.trim())) &&
      isHuman(node.text) &&
      !insideConsole(node)
    ) {
      report(node, node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

describe('user-facing text', () => {
  it('always comes from the translation files', () => {
    const files = reachableFiles();
    expect(files.length).toBeGreaterThan(100);
    expect(files.flatMap(findHardcodedText)).toEqual([]);
  });
});
