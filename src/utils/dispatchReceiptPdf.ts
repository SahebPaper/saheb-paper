import { jsPDF } from 'jspdf';
import type { Reel, PackingSlip, Party, Vehicle } from '../data/types';
import { getCompanyConfig } from '../config/company';
import { getLinkedReelsForSlip, resolveSlipEntities } from './dispatchReceiptService';
import { downloadBlobFile } from './fileDownloader';

/**
 * Generates an executive, razor-sharp standalone vector jsPDF document for
 * Official Dispatch Receipt.
 *
 * Designed to exactly match the Official Dispatch Receipt Preview modal:
 * - Clean white canvas (no heavy outer borders)
 * - Centered bold black company header & subtitle
 * - 4-column metadata details box (Receipt No, Date, Customer/Party, Vehicle No)
 * - Solid black table headers (#0f172a)
 * - Spec group rows with blue indicator dot and count/weight pill badges
 * - Product Summary Breakdown table
 * - Signature peach/light-amber GRAND TOTAL banner (#fed7aa)
 * - Standard A4 portrait format (210 x 297 mm)
 */
export function generateDispatchReceiptPdfDoc(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[],
  groupMode: 'grouped' | 'sequential' = 'grouped'
): jsPDF {
  const company = getCompanyConfig();
  const linkedReels = getLinkedReelsForSlip(slip, customReels);
  const { partyName, vehicleNo, partyObj, vehicleObj } = resolveSlipEntities(slip, customParties, customVehicles);

  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const dispatchDate = slip.date || new Date().toISOString().substring(0, 10);
  const grandTotalWeight = linkedReels.reduce((sum, r) => sum + (r.weight || 0), 0);

  // Group summary by specification
  const specMap: Record<string, { product: string; gsm: number; size: number; ply: number; reels: Reel[]; totalWeight: number }> = {};
  linkedReels.forEach(r => {
    const key = `${r.product || 'Tissue Paper'}__${r.gsm}__${r.size}__${r.ply || 1}`;
    if (!specMap[key]) {
      specMap[key] = {
        product: r.product || 'Tissue Paper',
        gsm: r.gsm || 0,
        size: r.size || 0,
        ply: r.ply || 1,
        reels: [],
        totalWeight: 0,
      };
    }
    specMap[key].reels.push(r);
    specMap[key].totalWeight += (r.weight || 0);
  });

  const specGroupsList = Object.values(specMap);

  type PrintableReelItem = Reel & {
    displayIndex: number;
    isGroupStart: boolean;
    groupLabel: string;
    groupTotalReels: number;
    groupTotalWeight: number;
  };

  const sortedReelItems: PrintableReelItem[] = [];
  let runningSr = 0;

  if (groupMode === 'grouped') {
    specGroupsList.forEach(group => {
      group.reels.forEach((reel, idxInGroup) => {
        runningSr += 1;
        sortedReelItems.push({
          ...reel,
          displayIndex: runningSr,
          isGroupStart: idxInGroup === 0,
          groupLabel: `${group.product.toUpperCase()} • ${group.gsm} GSM • ${group.size} CM • ${group.ply} PLY`,
          groupTotalReels: group.reels.length,
          groupTotalWeight: group.totalWeight,
        });
      });
    });
  } else {
    linkedReels.forEach((reel, idx) => {
      sortedReelItems.push({
        ...reel,
        displayIndex: idx + 1,
        isGroupStart: false,
        groupLabel: '',
        groupTotalReels: 0,
        groupTotalWeight: 0,
      });
    });
  }

  // Multi-page distribution
  interface PageData {
    pageNumber: number;
    reels: PrintableReelItem[];
    summaryItems: typeof specGroupsList;
    isSummaryContinuation: boolean;
    showGrandTotal: boolean;
  }

  const pages: PageData[] = [];
  const totalReelsCount = sortedReelItems.length;
  const numGroups = specGroupsList.length;

  // --- Dynamic Un-congested Capacity Check ---
  // Ensure every row has generous, comfortable height (>= 5.8 mm) with zero squishing or crowding.
  const MIN_UNCONGESTED_ROW_HEIGHT = 5.8; // mm (crisp, breathable text with generous padding)
  const targetBottomY = 270; // mm
  const page1TableStartY = 57.5; // mm
  const tableHeaderHeight = 5.8; // mm
  const groupHeadersHeight = numGroups * 5.2; // mm
  const summaryHeight = 3.5 + 5.5 + (numGroups * 5.2) + 7.0; // mm
  const singlePageOverhead = tableHeaderHeight + groupHeadersHeight + summaryHeight;
  const availableForSinglePageReels = targetBottomY - page1TableStartY - singlePageOverhead;

  // Maximum reels that can fit on Page 1 along with Summary & Grand Total without looking conjugated
  const maxSinglePageReels = Math.max(1, Math.floor(availableForSinglePageReels / MIN_UNCONGESTED_ROW_HEIGHT));

  const fitsOnSinglePage = totalReelsCount <= maxSinglePageReels;

  if (fitsOnSinglePage) {
    pages.push({
      pageNumber: 1,
      reels: sortedReelItems,
      summaryItems: specGroupsList,
      isSummaryContinuation: false,
      showGrandTotal: true,
    });
  } else {
    // Multi-page layout:
    // Page 1 takes the maximum reels it can fit comfortably WITHOUT dead white space
    const p1Available = targetBottomY - page1TableStartY - tableHeaderHeight - (Math.min(numGroups, 2) * 5.2);
    // Leave at least 3 reels for continuation page with summary
    const maxP1Comfortable = Math.max(10, Math.floor(p1Available / 6.0));
    const p1ReelCount = Math.min(totalReelsCount - 3, Math.min(26, maxP1Comfortable));
    const p1Reels = sortedReelItems.slice(0, p1ReelCount);
    let remainingReels = sortedReelItems.slice(p1ReelCount);

    pages.push({
      pageNumber: 1,
      reels: p1Reels,
      summaryItems: [],
      isSummaryContinuation: false,
      showGrandTotal: false,
    });

    let pageIdx = 2;
    const CONT_PAGE_MAX_ITEMS = 36;
    while (remainingReels.length > 0) {
      // Continuation page (Page 2+) has much more space (no company banner/metadata box)
      const canFitRemainingWithSummary = (remainingReels.length + numGroups + 2) <= CONT_PAGE_MAX_ITEMS;
      const chunkSize = canFitRemainingWithSummary ? remainingReels.length : (CONT_PAGE_MAX_ITEMS - 6);

      const chunk = remainingReels.slice(0, chunkSize);
      remainingReels = remainingReels.slice(chunkSize);
      const isLastReelChunk = remainingReels.length === 0;

      pages.push({
        pageNumber: pageIdx++,
        reels: chunk,
        summaryItems: isLastReelChunk ? specGroupsList : [],
        isSummaryContinuation: false,
        showGrandTotal: isLastReelChunk,
      });
    }

    // Safety fallback: if summary still hasn't been shown because reels took up page
    if (!pages[pages.length - 1].showGrandTotal) {
      pages.push({
        pageNumber: pageIdx++,
        reels: [],
        summaryItems: specGroupsList,
        isSummaryContinuation: false,
        showGrandTotal: true,
      });
    }
  }

  const totalPages = pages.length;

  // Initialize jsPDF document (A4 portrait = 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Render each page
  pages.forEach((pageData, pIdx) => {
    if (pIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    let currentY = 14;

    // 1. Company Header & Subtitle (Page 1) or Continuation Banner (Page 2+)
    if (pIdx === 0) {
      // Company Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(company.name.toUpperCase(), 105, currentY, { align: 'center' });

      // Black horizontal divider line directly below company name
      currentY += 4.5;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.65);
      doc.line(10, currentY, 200, currentY);

      // Document Title: DISPATCH RECEIPT
      currentY += 7.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('DISPATCH RECEIPT', 105, currentY, { align: 'center' });

      // 2. Metadata Grid Box (4 Columns)
      currentY += 4;
      const metaBoxY = currentY;
      const metaBoxHeight = 19;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // #cbd5e1
      doc.setLineWidth(0.3);
      doc.roundedRect(10, metaBoxY, 190, metaBoxHeight, 1.5, 1.5, 'FD');

      // Vertical dividers inside metadata box
      doc.setDrawColor(226, 232, 240); // #e2e8f0
      doc.line(57.5, metaBoxY + 2, 57.5, metaBoxY + metaBoxHeight - 2);
      doc.line(105, metaBoxY + 2, 105, metaBoxY + metaBoxHeight - 2);
      doc.line(152.5, metaBoxY + 2, 152.5, metaBoxY + metaBoxHeight - 2);

      // Col 1: RECEIPT NO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // #64748b
      doc.text('RECEIPT NO', 13, metaBoxY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // #0f172a
      doc.text(normalizedSlipNo, 13, metaBoxY + 11);

      // Col 2: DISPATCH DATE
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DISPATCH DATE', 60.5, metaBoxY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(dispatchDate, 60.5, metaBoxY + 11);

      // Col 3: CUSTOMER / PARTY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CUSTOMER / PARTY', 108, metaBoxY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text((partyName || 'Customer / Walk-in').substring(0, 24), 108, metaBoxY + 10.5);

      const partySub = (partyObj as any)?.city || partyObj?.address || (slip as any).partyAddress || '';
      if (partySub) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(partySub.substring(0, 26), 108, metaBoxY + 15);
      }

      // Col 4: VEHICLE / TRUCK NO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('VEHICLE / TRUCK NO', 155.5, metaBoxY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(vehicleNo || 'Self / Hand Delivery', 155.5, metaBoxY + 10.5);

      const driverPhone = vehicleObj?.driverContact || (slip as any).driverContact || '';
      if (driverPhone) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Driver Ph: ${driverPhone}`.substring(0, 24), 155.5, metaBoxY + 15);
      }

      currentY = metaBoxY + metaBoxHeight + 5;
    } else {
      // Continuation Header on Page 2+
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`DISPATCH RECEIPT (CONTD.)`, 10, currentY);

      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${normalizedSlipNo}  •  Date: ${dispatchDate}`, 200, currentY, { align: 'right' });

      currentY += 3;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(10, currentY, 200, currentY);

      currentY += 4;
    }

    // 3. Section: DISPATCHED REELS
    if (pageData.reels.length > 0) {
      // Table Header Label & Counter
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`DISPATCHED REELS (${totalReelsCount} REELS)`, 10, currentY + 1);

      const startIdx = pageData.reels[0].displayIndex;
      const endIdx = pageData.reels[pageData.reels.length - 1].displayIndex;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Showing items ${startIdx} - ${endIdx} of ${totalReelsCount}`, 200, currentY + 1, { align: 'right' });

      currentY += 3.5;

      // Calculate optimal spacious row height dynamically based on items on this page
      const reelsOnPage = pageData.reels.length;
      const hasSummaryOnPage = pageData.summaryItems.length > 0;
      const groupHeadersOnPage = groupMode === 'grouped'
        ? pageData.reels.filter((r, idx) => r.isGroupStart || idx === 0).length
        : 0;

      // Available height from table start (currentY ~ 58) to safe bottom margin (270 mm)
      const targetBottomY = 270;
      const summaryOverhead = hasSummaryOnPage ? (21.2 + (pageData.summaryItems.length * 5.2)) : 0;
      const groupHeadersTotalHeight = groupHeadersOnPage * 5.2;
      const availableForReelRows = targetBottomY - currentY - 5.8 - summaryOverhead - groupHeadersTotalHeight;

      let computedRowHeight = reelsOnPage > 0 ? (availableForReelRows / reelsOnPage) : 6.0;
      // Clamp between generous, un-congested bounds: 5.8 mm to 7.2 mm
      const rowHeight = Math.min(7.2, Math.max(5.8, Math.round(computedRowHeight * 100) / 100));

      // Solid Black/Dark Slate Table Header Row
      const colSr = 16;
      const colReel = 24;
      const colProd = 60;
      const colGsm = 114;
      const colDecal = 138;
      const colPly = 160;
      const colWeight = 197;

      doc.setFillColor(15, 23, 42); // #0f172a
      doc.rect(10, currentY, 190, 5.8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(255, 255, 255);
      doc.text('SR', colSr, currentY + 4.0, { align: 'center' });
      doc.text('REEL NO', colReel, currentY + 4.0);
      doc.text('PRODUCT', colProd, currentY + 4.0);
      doc.text('GSM', colGsm, currentY + 4.0, { align: 'center' });
      doc.text('SIZE (CM)', colDecal, currentY + 4.0, { align: 'center' });
      doc.text('PLY', colPly, currentY + 4.0, { align: 'center' });
      doc.text('WEIGHT (KG)', colWeight, currentY + 4.0, { align: 'right' });

      currentY += 5.8;

      // Reel Rows
      pageData.reels.forEach((reel, rIdx) => {
        // Render Group Header Row if grouped
        if (groupMode === 'grouped' && (reel.isGroupStart || rIdx === 0)) {
          const isContd = !reel.isGroupStart && rIdx === 0;

          doc.setFillColor(241, 245, 249); // #f1f5f9
          doc.rect(10, currentY, 190, 5.2, 'F');

          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.25);
          doc.line(10, currentY + 5.2, 200, currentY + 5.2);

          // Blue Dot Indicator
          doc.setFillColor(37, 99, 235); // #2563eb
          doc.circle(13.5, currentY + 2.6, 1.1, 'F');

          // Group Title Text
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.8);
          doc.setTextColor(15, 23, 42);
          doc.text(`${reel.groupLabel} ${isContd ? '(Contd.)' : ''}`, 16.5, currentY + 3.6);

          // Right Badge Pill: [X Reels • Y KG]
          const badgeText = `${reel.groupTotalReels} Reels • ${reel.groupTotalWeight.toLocaleString()} KG`;
          const badgeWidth = Math.max(28, doc.getTextWidth(badgeText) + 4);
          const badgeX = 198 - badgeWidth;

          doc.setFillColor(226, 232, 240); // #e2e8f0
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(badgeX, currentY + 0.9, badgeWidth, 3.4, 0.8, 0.8, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.8);
          doc.setTextColor(51, 65, 85);
          doc.text(badgeText, badgeX + (badgeWidth / 2), currentY + 3.0, { align: 'center' });

          currentY += 5.2;
        }

        // Data Row: subtle alternating tint for effortless legibility
        const isOdd = rIdx % 2 === 1;
        doc.setFillColor(isOdd ? 248 : 255, isOdd ? 250 : 255, isOdd ? 252 : 255); // #f8fafc / #ffffff
        doc.rect(10, currentY, 190, rowHeight, 'F');

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(10, currentY + rowHeight, 200, currentY + rowHeight);

        const textBaseline = currentY + (rowHeight * 0.65);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.0);
        doc.setTextColor(15, 23, 42);

        // SR
        doc.text(String(reel.displayIndex), colSr, textBaseline, { align: 'center' });

        // REEL NO
        doc.setFont('helvetica', 'bold');
        doc.text(reel.reelNo, colReel, textBaseline);

        // PRODUCT
        doc.setFont('helvetica', 'normal');
        doc.text((reel.product || 'Tissue Paper').substring(0, 30), colProd, textBaseline);

        // GSM
        doc.text(String(reel.gsm || '---'), colGsm, textBaseline, { align: 'center' });

        // SIZE (CM)
        doc.text(String(reel.size || '---'), colDecal, textBaseline, { align: 'center' });

        // PLY
        doc.text(String(reel.ply || 1), colPly, textBaseline, { align: 'center' });

        // WEIGHT (KG)
        doc.setFont('helvetica', 'bold');
        doc.text(`${(reel.weight || 0).toLocaleString()}`, colWeight, textBaseline, { align: 'right' });

        currentY += rowHeight;
      });

      currentY += 3.5;
    }

    // 4. Section: PRODUCT SUMMARY (ITEMIZED BREAKDOWN)
    if (pageData.summaryItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 23, 42);
      doc.text(
        pageData.isSummaryContinuation
          ? 'PRODUCT SUMMARY (ITEMIZED BREAKDOWN - CONTD.)'
          : 'PRODUCT SUMMARY (ITEMIZED BREAKDOWN)',
        10,
        currentY + 1
      );

      currentY += 3.5;

      // Summary Table Header
      const sumColProd = 13;
      const sumColGsm = 91;
      const sumColDecal = 115;
      const sumColPly = 138;
      const sumColReels = 159;
      const sumColWeight = 197;

      doc.setFillColor(15, 23, 42);
      doc.rect(10, currentY, 190, 5.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('PRODUCT SPECIFICATION', sumColProd, currentY + 3.8);
      doc.text('GSM', sumColGsm, currentY + 3.8, { align: 'center' });
      doc.text('SIZE (CM)', sumColDecal, currentY + 3.8, { align: 'center' });
      doc.text('PLY', sumColPly, currentY + 3.8, { align: 'center' });
      doc.text('REELS', sumColReels, currentY + 3.8, { align: 'center' });
      doc.text('TOTAL WEIGHT', sumColWeight, currentY + 3.8, { align: 'right' });

      currentY += 5.5;

      // Summary Rows
      pageData.summaryItems.forEach((item, sIdx) => {
        const isSumOdd = sIdx % 2 === 1;
        doc.setFillColor(isSumOdd ? 248 : 255, isSumOdd ? 250 : 255, isSumOdd ? 252 : 255);
        doc.rect(10, currentY, 190, 5.2, 'F');

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(10, currentY + 5.2, 200, currentY + 5.2);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.8);
        doc.setTextColor(15, 23, 42);
        doc.text(item.product, sumColProd, currentY + 3.6);

        doc.setFont('helvetica', 'normal');
        doc.text(String(item.gsm), sumColGsm, currentY + 3.6, { align: 'center' });
        doc.text(`${item.size} CM`, sumColDecal, currentY + 3.6, { align: 'center' });
        doc.text(`${item.ply} Ply`, sumColPly, currentY + 3.6, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.text(String(item.reels.length), sumColReels, currentY + 3.6, { align: 'center' });
        doc.text(`${item.totalWeight.toLocaleString()} KG`, sumColWeight, currentY + 3.6, { align: 'right' });

        currentY += 5.2;
      });

      // 5. Signature Peach / Light-Amber GRAND TOTAL Row
      if (pageData.showGrandTotal) {
        doc.setFillColor(254, 215, 170); // #fed7aa (warm peach / light amber)
        doc.setDrawColor(251, 146, 60); // #fb923c
        doc.setLineWidth(0.35);
        doc.rect(10, currentY, 190, 7.0, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(0, 0, 0);
        doc.text('GRAND TOTAL', sumColProd, currentY + 4.8);
        doc.text(`${linkedReels.length} Reels`, sumColReels, currentY + 4.8, { align: 'center' });
        doc.text(`${grandTotalWeight.toLocaleString()} KG`, sumColWeight, currentY + 4.8, { align: 'right' });

        currentY += 7.0;
      }
    }

    // 6. Clean Bottom Footer (Pinned to bottom at Y = 286 mm)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(10, 283, 200, 283);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${company.name} • Chandisar Palanpur, Gujarat - 385510 • Ph: +91 80005 63666 • www.sahebpaper.com`,
      10,
      287
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${pageData.pageNumber} of ${totalPages}`, 200, 287, { align: 'right' });
  });

  return doc;
}

/**
 * High-level helper: Generates official dispatch receipt vector PDF and downloads/shares
 * reliably across Android APK (Downloads folder + Share Sheet) and Desktop Web.
 */
export async function downloadDispatchReceiptPdf(
  slip: PackingSlip,
  customReels?: Reel[],
  customParties?: Party[],
  customVehicles?: Vehicle[],
  groupMode: 'grouped' | 'sequential' = 'grouped'
): Promise<void> {
  const doc = generateDispatchReceiptPdfDoc(slip, customReels, customParties, customVehicles, groupMode);
  const rawSlipNo = (slip.slipNo || 'CHALLAN').trim();
  const normalizedSlipNo = rawSlipNo.startsWith('PS-') ? rawSlipNo : `PS-${rawSlipNo}`;
  const filename = `Dispatch_Receipt_${normalizedSlipNo}.pdf`;
  const blob = doc.output('blob');
  await downloadBlobFile(blob, filename);
}
