import type {
  ExportOptions,
  BoxItem,
  TextRun,
  FormulaBlock,
  PageModel,
  DocumentModel,
  CardOverride,
  Margins,
} from './types.js';
import {
  getPageDimensions,
  getMargins,
  wrapText,
  measureTextWidth,
  getColorPalette,
} from './geometry.js';
import type { TermDefinition } from '../model/index.js';

export interface CardSourceData {
  id: string;
  category: string;
  title: string;
  prompt?: string;
  latexAnswer: string;
  hint?: string;
  explanation?: string;
  terms?: TermDefinition[];
  order?: number;
  difficulty?: number;
  mastery?: number;
}

export interface SetSourceData {
  id: string;
  name: string;
  category?: string;
  cards: CardSourceData[];
  glossary?: Record<string, TermDefinition>;
}

// Category palette mapping for colorful badges
const CATEGORY_ACCENT_COLORS = [
  '#2563eb', // blue
  '#0d9488', // teal
  '#7c3aed', // purple
  '#c026d3', // fuchsia
  '#ea580c', // orange
  '#16a34a', // green
  '#db2777', // pink
  '#4f46e5', // indigo
];

function getCategoryColor(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % CATEGORY_ACCENT_COLORS.length;
  return CATEGORY_ACCENT_COLORS[idx];
}

interface SizedCardBox {
  id: string;
  type: 'card';
  card: CardSourceData;
  override?: CardOverride;
  desiredHeight: number;
  spanAllColumns: boolean;
  pageBreakBefore: boolean;
  keepTogether: boolean;
  categoryColor: string;
}

interface SizedCategoryBox {
  id: string;
  type: 'category-header';
  title: string;
  desiredHeight: number;
  spanAllColumns: boolean;
  pageBreakBefore: boolean;
  keepTogether: boolean;
}

type SizedItem = SizedCardBox | SizedCategoryBox;

/**
 * Calculates formula bounding height in points based on LaTeX structure.
 */
function estimateFormulaHeight(latex: string, fontSize: number): number {
  if (!latex) return 0;
  let mult = 1.6;
  if (latex.includes('\\frac') || latex.includes('\\dfrac')) mult += 0.8;
  if (latex.includes('\\sum') || latex.includes('\\int') || latex.includes('\\prod')) mult += 0.7;
  if (latex.includes('\\matrix') || latex.includes('\\begin{')) mult += 1.2;
  if (latex.includes('\\sqrt')) mult += 0.3;
  return Math.max(fontSize * mult, 18);
}

/**
 * Measures the content and computes vertical height for a card.
 */
function measureCardBox(
  card: CardSourceData,
  index: number,
  colWidth: number,
  options: ExportOptions,
  override?: CardOverride
): { height: number; runs: TextRun[]; formulas: FormulaBlock[]; warning?: string } {
  const scale = options.globalScale * (override?.fontSizeOverride ? override.fontSizeOverride / 10 : 1);
  const titleFont = options.titleFontSize * scale;
  const bodyFont = options.bodyFontSize * scale;
  const formulaFont = options.formulaFontSize * scale * options.formulaScale;
  const hintFont = options.hintFontSize * scale;
  const termsFont = options.termsFontSize * scale;
  const fontFamily = options.fontFamily;
  const lineSpacing = options.lineSpacing;
  const padding = options.containerStyle === 'plain' ? 3 : 6;
  const innerWidth = Math.max(10, colWidth - padding * 2);

  const palette = getColorPalette(
    options.colorTheme,
    options.useCategoryColors ? getCategoryColor(card.category || 'General') : undefined
  );

  const runs: TextRun[] = [];
  const formulas: FormulaBlock[] = [];
  let currentY = padding;
  let cardWarning: string | undefined;

  // 1. Header: Number, Title, Category Badge
  const titleText = override?.customTitle !== undefined ? override.customTitle : card.title;
  const numberText = options.showCardNumber ? `#${index + 1} ` : '';
  const fullTitle = `${numberText}${titleText}`.trim();

  if (options.showCardTitle && fullTitle) {
    const titleLines = wrapText(fullTitle, innerWidth, titleFont, fontFamily);
    for (const line of titleLines) {
      const lineH = titleFont * lineSpacing;
      runs.push({
        type: 'text',
        text: line,
        x: padding,
        y: currentY,
        width: measureTextWidth(line, titleFont, fontFamily),
        height: lineH,
        fontSize: titleFont,
        fontFamily,
        style: 'bold',
        color: palette.textPrimary,
      });
      currentY += lineH;
    }
  }

  if (options.showCategoryLabel && card.category) {
    const catH = hintFont * lineSpacing;
    runs.push({
      type: 'text',
      text: card.category.toUpperCase(),
      x: padding,
      y: currentY,
      width: measureTextWidth(card.category.toUpperCase(), hintFont, fontFamily),
      height: catH,
      fontSize: hintFont,
      fontFamily,
      style: 'bold',
      color: palette.accent,
    });
    currentY += catH + 2;
  }

  // 2. Prompt (Question / Term)
  const showPrompt =
    options.showPrompt &&
    options.cardLayoutMode !== 'formula-only' &&
    (override?.replacementPrompt !== undefined || !!card.prompt);

  const promptText = override?.replacementPrompt !== undefined ? override.replacementPrompt : card.prompt;

  if (showPrompt && promptText) {
    const promptLines = wrapText(promptText, innerWidth, bodyFont, fontFamily);
    for (const line of promptLines) {
      const lineH = bodyFont * lineSpacing;
      runs.push({
        type: 'text',
        text: line,
        x: padding,
        y: currentY,
        width: measureTextWidth(line, bodyFont, fontFamily),
        height: lineH,
        fontSize: bodyFont,
        fontFamily,
        style: 'regular',
        color: palette.textSecondary,
      });
      currentY += lineH;
    }
    currentY += 2;
  }

  // 3. Formula block
  const formulaText =
    override?.replacementFormula !== undefined ? override.replacementFormula : card.latexAnswer;

  if (options.showFormula && formulaText) {
    const formulaH = estimateFormulaHeight(formulaText, formulaFont);
    formulas.push({
      type: 'formula',
      latex: formulaText,
      x: padding,
      y: currentY,
      width: innerWidth,
      height: formulaH,
      fontSize: formulaFont,
      altText: formulaText,
    });
    currentY += formulaH + 2;
  }

  // 4. Progressive Hint
  const showHint =
    options.showHint && !override?.hideHint && card.hint && options.cardLayoutMode !== 'formula-only';

  if (showHint && card.hint) {
    const hintLines = wrapText(`Hint: ${card.hint}`, innerWidth, hintFont, fontFamily);
    for (const line of hintLines) {
      const lineH = hintFont * lineSpacing;
      runs.push({
        type: 'text',
        text: line,
        x: padding,
        y: currentY,
        width: measureTextWidth(line, hintFont, fontFamily),
        height: lineH,
        fontSize: hintFont,
        fontFamily,
        style: 'italic',
        color: palette.textMuted,
      });
      currentY += lineH;
    }
    currentY += 2;
  }

  // 5. Term definitions
  const showTerms =
    override?.showTerms !== undefined ? override.showTerms : options.termsMode !== 'none';

  if (showTerms && card.terms && card.terms.length > 0 && options.termsMode !== 'none') {
    let termsToRender = card.terms;
    if (options.termsFilter === 'only-with-units') {
      termsToRender = termsToRender.filter((t) => !!t.units);
    } else if (options.termsFilter === 'exclude-undefined') {
      termsToRender = termsToRender.filter((t) => !!t.definition || !!t.name);
    }

    if (termsToRender.length > 0) {
      if (options.termsMode === 'compact-inline') {
        const termsStr = termsToRender
          .map((t) => {
            const unitStr = options.showUnits && t.units ? ` [${t.units}]` : '';
            return `${t.symbol}: ${t.name || t.definition || ''}${unitStr}`;
          })
          .join(' • ');

        const termLines = wrapText(termsStr, innerWidth, termsFont, fontFamily);
        for (const line of termLines) {
          const lineH = termsFont * lineSpacing;
          runs.push({
            type: 'text',
            text: line,
            x: padding,
            y: currentY,
            width: measureTextWidth(line, termsFont, fontFamily),
            height: lineH,
            fontSize: termsFont,
            fontFamily,
            style: 'regular',
            color: palette.textMuted,
          });
          currentY += lineH;
        }
      } else if (options.termsMode === 'table') {
        for (const t of termsToRender) {
          const unitStr = options.showUnits && t.units ? ` [${t.units}]` : '';
          const rowText = `${t.symbol} — ${t.name || t.definition || ''}${unitStr}`;
          const tLines = wrapText(rowText, innerWidth, termsFont, fontFamily);
          for (const line of tLines) {
            const lineH = termsFont * lineSpacing;
            runs.push({
              type: 'text',
              text: line,
              x: padding,
              y: currentY,
              width: measureTextWidth(line, termsFont, fontFamily),
              height: lineH,
              fontSize: termsFont,
              fontFamily,
              style: 'regular',
              color: palette.textSecondary,
            });
            currentY += lineH;
          }
        }
      } else if (options.termsMode === 'footnote') {
        for (let i = 0; i < termsToRender.length; i++) {
          const t = termsToRender[i];
          const fnText = `[${i + 1}] ${t.symbol}: ${t.definition || t.name || ''}`;
          const fnLines = wrapText(fnText, innerWidth, termsFont * 0.9, fontFamily);
          for (const line of fnLines) {
            const lineH = termsFont * 0.9 * lineSpacing;
            runs.push({
              type: 'text',
              text: line,
              x: padding,
              y: currentY,
              width: measureTextWidth(line, termsFont * 0.9, fontFamily),
              height: lineH,
              fontSize: termsFont * 0.9,
              fontFamily,
              style: 'regular',
              color: palette.textMuted,
            });
            currentY += lineH;
          }
        }
      }
      currentY += 2;
    }
  }

  // 6. Custom Card Note
  if (options.showNotes && override?.note) {
    const noteLines = wrapText(`Note: ${override.note}`, innerWidth, hintFont, fontFamily);
    for (const line of noteLines) {
      const lineH = hintFont * lineSpacing;
      runs.push({
        type: 'text',
        text: line,
        x: padding,
        y: currentY,
        width: measureTextWidth(line, hintFont, fontFamily),
        height: lineH,
        fontSize: hintFont,
        fontFamily,
        style: 'italic',
        color: palette.textSecondary,
      });
      currentY += lineH;
    }
  }

  const finalHeight = Math.max(currentY + padding, 20);

  // Check warnings for minimum readable text size (< 6 pt)
  if (titleFont < 6 || bodyFont < 6 || formulaFont < 6) {
    cardWarning = 'Effective font size is below 6 pt. Text may be hard to read when printed.';
  }

  return { height: finalHeight, runs, formulas, warning: cardWarning };
}

/**
 * Sorts cards according to export options.
 */
function sortCards(cards: CardSourceData[], sortOrder: ExportOptions['sortOrder']): CardSourceData[] {
  const result = [...cards];
  switch (sortOrder) {
    case 'alphabetical':
      return result.sort((a, b) => a.title.localeCompare(b.title));
    case 'category':
      return result.sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.title.localeCompare(b.title));
    case 'difficulty':
      return result.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
    case 'mastery':
      return result.sort((a, b) => (a.mastery || 0) - (b.mastery || 0));
    case 'shuffled':
      // Deterministic pseudorandom sort for predictable testing
      return result.sort((a, b) => {
        const hashA = a.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const hashB = b.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return (hashA % 31) - (hashB % 31);
      });
    case 'original':
    default:
      return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}

/**
 * Builds table of contents and glossary appendix items if enabled.
 */
function buildAppendixAndToc(
  cards: CardSourceData[],
  options: ExportOptions,
  setGlossary?: Record<string, TermDefinition>
): { appendixItems: CardSourceData[]; tocCategories: string[] } {
  const tocCategories: string[] = [];
  const seenCats = new Set<string>();
  for (const c of cards) {
    const cat = c.category || 'General';
    if (!seenCats.has(cat)) {
      seenCats.add(cat);
      tocCategories.push(cat);
    }
  }

  if (!options.includeGlossaryAppendix) {
    return { appendixItems: [], tocCategories };
  }

  // De-duplicate terms across all selected cards + set glossary
  const termMap = new Map<string, TermDefinition>();

  if (setGlossary) {
    for (const [key, term] of Object.entries(setGlossary)) {
      termMap.set(key, term);
    }
  }

  for (const c of cards) {
    if (c.terms) {
      for (const t of c.terms) {
        if (!termMap.has(t.symbol) || (!termMap.get(t.symbol)?.definition && t.definition)) {
          termMap.set(t.symbol, t);
        }
      }
    }
  }

  const sortedTerms = Array.from(termMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));

  const appendixCards: CardSourceData[] = sortedTerms.map((t, idx) => ({
    id: `glossary-term-${idx}`,
    category: 'Appendix: Glossary',
    title: t.symbol,
    prompt: t.name || 'Symbol definition',
    latexAnswer: t.symbol,
    explanation: t.definition ? `${t.definition}${t.units ? ` (Units: ${t.units})` : ''}` : undefined,
  }));

  return { appendixItems: appendixCards, tocCategories };
}

/**
 * Pure layout algorithm that generates the document model with pages, columns, and boxes.
 */
export function layoutDocument(
  setData: SetSourceData,
  options: ExportOptions
): DocumentModel {
  const { width: pageWidth, height: pageHeight } = getPageDimensions(
    options.pageSize,
    options.orientation,
    options.customPageDimensions
  );

  const margins: Margins = getMargins(options.marginPreset, options.customMargins);

  const contentWidth = pageWidth - margins.left - margins.right;
  const contentHeight = pageHeight - margins.top - margins.bottom;

  // Filter selected cards
  let activeCards = setData.cards;
  if (options.selectedCardIds && options.selectedCardIds.length > 0) {
    const selectedSet = new Set(options.selectedCardIds);
    activeCards = activeCards.filter((c) => selectedSet.has(c.id));
  }

  // Sort cards
  activeCards = sortCards(activeCards, options.sortOrder);

  // Appendix & TOC
  const { appendixItems, tocCategories } = buildAppendixAndToc(
    activeCards,
    options,
    setData.glossary
  );

  const allItemsToLayout: CardSourceData[] = [...activeCards];
  if (options.includeGlossaryAppendix) {
    allItemsToLayout.push(...appendixItems);
  }

  // Column calculations
  const cols = Math.max(1, Math.min(6, options.columns));
  const colGap = options.columnGap;
  const rowGap = options.rowGap;
  const standardColWidth = (contentWidth - (cols - 1) * colGap) / cols;

  const docWarnings: string[] = [];

  // Group by category if requested
  const itemsWithCategories: SizedItem[] = [];
  let lastCategory = '';

  for (let i = 0; i < allItemsToLayout.length; i++) {
    const card = allItemsToLayout[i];
    const cat = card.category || 'General';

    if (options.groupByCategory && cat !== lastCategory) {
      lastCategory = cat;
      itemsWithCategories.push({
        id: `cat-header-${cat}`,
        type: 'category-header',
        title: cat,
        desiredHeight: 22 * options.globalScale,
        spanAllColumns: true,
        pageBreakBefore: false,
        keepTogether: true,
      });
    }

    const override = options.cardOverrides[card.id];
    const isSpan = override?.spanAllColumns ?? false;
    const cardColW = isSpan ? contentWidth : standardColWidth;
    const { height } = measureCardBox(card, i, cardColW, options, override);

    itemsWithCategories.push({
      id: card.id,
      type: 'card',
      card,
      override,
      desiredHeight: height,
      spanAllColumns: isSpan,
      pageBreakBefore: override?.pageBreakBefore ?? false,
      keepTogether: override?.keepTogether ?? options.keepCardsTogether,
      categoryColor: options.useCategoryColors ? getCategoryColor(cat) : '#3b82f6',
    });
  }

  // Pages container
  interface PageState {
    pageNumber: number;
    boxes: BoxItem[];
    colHeights: number[]; // height used in each column
  }

  const pages: PageState[] = [];

  function createNewPage(): PageState {
    const newPage: PageState = {
      pageNumber: pages.length + 1,
      boxes: [],
      colHeights: new Array(cols).fill(0),
    };
    pages.push(newPage);
    return newPage;
  }

  if (itemsWithCategories.length === 0) {
    // Empty document has 1 empty page
    createNewPage();
  } else {
    let currentPage = createNewPage();

    for (let itemIdx = 0; itemIdx < itemsWithCategories.length; itemIdx++) {
      const item = itemsWithCategories[itemIdx];

      if (item.pageBreakBefore && currentPage.boxes.length > 0) {
        currentPage = createNewPage();
      }

      if (item.type === 'category-header') {
        // Category headers span all columns
        const maxCurrentColH = Math.max(...currentPage.colHeights);
        if (maxCurrentColH + item.desiredHeight > contentHeight && currentPage.boxes.length > 0) {
          currentPage = createNewPage();
        }
        const yTop = Math.max(...currentPage.colHeights);
        const headerRect = {
          x: margins.left,
          y: margins.top + yTop,
          width: contentWidth,
          height: item.desiredHeight,
        };

        const headerPalette = getColorPalette(options.colorTheme, getCategoryColor(item.title));
        const textH = 11 * options.globalScale;

        currentPage.boxes.push({
          id: item.id,
          type: 'category-header',
          rect: headerRect,
          backgroundColor: options.colorTheme === 'color' ? `${headerPalette.accent}15` : undefined,
          borderColor: headerPalette.accent,
          borderWidth: 1,
          runs: [
            {
              type: 'text',
              text: item.title.toUpperCase(),
              x: 4,
              y: (item.desiredHeight - textH) / 2,
              width: contentWidth - 8,
              height: textH,
              fontSize: textH,
              fontFamily: options.fontFamily,
              style: 'bold',
              color: headerPalette.accent,
            },
          ],
          formulas: [],
        });

        const newH = yTop + item.desiredHeight + rowGap;
        for (let c = 0; c < cols; c++) {
          currentPage.colHeights[c] = newH;
        }
        continue;
      }

      // Card item
      const isSpan = item.spanAllColumns;
      const targetColWidth = isSpan ? contentWidth : standardColWidth;
      const palette = getColorPalette(options.colorTheme, item.categoryColor);

      const measured = measureCardBox(
        item.card,
        itemIdx,
        targetColWidth,
        options,
        item.override
      );

      if (measured.warning && !docWarnings.includes(measured.warning)) {
        docWarnings.push(measured.warning);
      }

      const boxHeight = measured.height;

      // Column placement strategy
      let placed = false;

      if (isSpan) {
        // Spans all columns: needs space below highest column
        const maxH = Math.max(...currentPage.colHeights);
        if (maxH + boxHeight > contentHeight && currentPage.boxes.length > 0) {
          currentPage = createNewPage();
        }
        const yTop = Math.max(...currentPage.colHeights);
        const boxRect = {
          x: margins.left,
          y: margins.top + yTop,
          width: contentWidth,
          height: boxHeight,
        };

        currentPage.boxes.push({
          id: item.id,
          cardId: item.card.id,
          type: 'card',
          rect: boxRect,
          backgroundColor: options.containerStyle === 'shaded' ? palette.bgCard : undefined,
          borderColor: options.containerStyle === 'boxed' || options.containerStyle === 'ruled' ? palette.borderCard : undefined,
          borderWidth: options.containerStyle === 'plain' ? 0 : options.ruleWeight,
          borderRadius: options.containerStyle === 'boxed' ? options.borderRadius : 0,
          runs: measured.runs,
          formulas: measured.formulas,
          warning: measured.warning,
        });

        const newH = yTop + boxHeight + rowGap;
        for (let c = 0; c < cols; c++) {
          currentPage.colHeights[c] = newH;
        }
        placed = true;
      } else {
        // Down columns or across rows
        let bestCol = 0;
        if (options.fillOrder === 'across-rows') {
          // Find column with minimum height
          let minH = Infinity;
          for (let c = 0; c < cols; c++) {
            if (currentPage.colHeights[c] < minH) {
              minH = currentPage.colHeights[c];
              bestCol = c;
            }
          }
        } else {
          // Down columns: fill column 0 first until full, then col 1, etc.
          for (let c = 0; c < cols; c++) {
            if (currentPage.colHeights[c] + boxHeight <= contentHeight) {
              bestCol = c;
              placed = true;
              break;
            }
          }
        }

        if (!placed) {
          // If fillOrder was across-rows, or down-columns found no column on this page that fits
          if (currentPage.colHeights[bestCol] + boxHeight > contentHeight) {
            if (currentPage.boxes.length > 0) {
              currentPage = createNewPage();
              bestCol = 0;
            }
          }
        }

        const colX = margins.left + bestCol * (standardColWidth + colGap);
        const colY = margins.top + currentPage.colHeights[bestCol];

        const boxRect = {
          x: colX,
          y: colY,
          width: standardColWidth,
          height: boxHeight,
        };

        currentPage.boxes.push({
          id: item.id,
          cardId: item.card.id,
          type: 'card',
          rect: boxRect,
          backgroundColor: options.containerStyle === 'shaded' ? palette.bgCard : undefined,
          borderColor: options.containerStyle === 'boxed' || options.containerStyle === 'ruled' ? palette.borderCard : undefined,
          borderWidth: options.containerStyle === 'plain' ? 0 : options.ruleWeight,
          borderRadius: options.containerStyle === 'boxed' ? options.borderRadius : 0,
          runs: measured.runs,
          formulas: measured.formulas,
          warning: measured.warning,
        });

        currentPage.colHeights[bestCol] += boxHeight + rowGap;
      }
    }
  }

  // Header & Footer generation
  const totalPages = pages.length;
  const formattedPages: PageModel[] = pages.map((p) => {
    const pageHeader = options.headerText.replace('{setName}', setData.name || 'Formula Flash');
    const headerDate = options.showDateInHeader ? new Date().toLocaleDateString() : '';

    return {
      pageNumber: p.pageNumber,
      totalPages,
      width: pageWidth,
      height: pageHeight,
      margins,
      boxes: p.boxes,
      headerFooter: {
        headerLeft: pageHeader,
        headerRight: headerDate,
        footerLeft: options.footerCustomText,
        footerRight: options.showPageNumbers ? `Page ${p.pageNumber} of ${totalPages}` : undefined,
        lineY: margins.top - 10,
      },
    };
  });

  // Bookmarks
  const bookmarks: Array<{ title: string; pageNumber: number; level: number }> = [];
  if (options.generatePdfBookmarks) {
    bookmarks.push({ title: setData.name || 'Cheat Sheet', pageNumber: 1, level: 1 });
    if (options.groupByCategory) {
      for (const cat of tocCategories) {
        // Find page where category header appears
        const targetPage = formattedPages.find((p) =>
          p.boxes.some((b) => b.type === 'category-header' && b.runs.some((r) => r.text === cat.toUpperCase()))
        );
        bookmarks.push({
          title: cat,
          pageNumber: targetPage ? targetPage.pageNumber : 1,
          level: 2,
        });
      }
    }
    if (options.includeGlossaryAppendix) {
      const targetPage = formattedPages.find((p) =>
        p.boxes.some((b) => b.type === 'category-header' && b.runs.some((r) => r.text.includes('APPENDIX')))
      );
      if (targetPage) {
        bookmarks.push({ title: 'Appendix: Glossary', pageNumber: targetPage.pageNumber, level: 1 });
      }
    }
  }

  return {
    id: `doc-${Date.now()}`,
    title: `${setData.name} - Cheat Sheet`,
    author: 'Formula Flash',
    subject: setData.category || 'Study Material',
    keywords: ['flashcards', 'formulas', 'cheat sheet', setData.name],
    options,
    pages: formattedPages,
    bookmarks,
    warnings: docWarnings,
  };
}

/**
 * Fit-to-N-Pages auto-scaling mode.
 * Performs a binary search over globalScale to find the largest scale that fits within target page count.
 */
export function layoutWithAutoFit(
  setData: SetSourceData,
  options: ExportOptions
): DocumentModel {
  if (!options.fitToPageCount || options.fitToPageCount <= 0 || setData.cards.length === 0) {
    return layoutDocument(setData, options);
  }

  const targetPages = options.fitToPageCount;
  let lowScale = 0.4;
  let highScale = 2.0;
  let bestDoc = layoutDocument(setData, { ...options, globalScale: lowScale });

  // If even lowest scale exceeds target, return it with warning
  if (bestDoc.pages.length > targetPages) {
    bestDoc.warnings.push(`Could not fit all cards onto ${targetPages} pages even at minimum font size.`);
    return bestDoc;
  }

  // Binary search for highest scale that still produces <= targetPages
  for (let iter = 0; iter < 8; iter++) {
    const midScale = (lowScale + highScale) / 2;
    const testDoc = layoutDocument(setData, { ...options, globalScale: midScale });

    if (testDoc.pages.length <= targetPages) {
      bestDoc = testDoc;
      lowScale = midScale; // try larger font
    } else {
      highScale = midScale; // scale too large, back off
    }
  }

  return bestDoc;
}
