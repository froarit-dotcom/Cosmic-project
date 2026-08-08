const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Starting CSV Import Process...");
    const filePath = path.join(__dirname, '..', 'seed-data', 'materials_import.csv');
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim() !== '');

    let stats = {
        totalProcessed: 0,
        created: 0,
        skippedDuplicates: 0,
        noSellingPrice: 0,
        uncategorized: 0
    };

    // Pre-fetch locations
    const locations = await prisma.location.findMany();

    // Company and Category caches
    let companies = await prisma.company.findMany();
    let categories = await prisma.category.findMany();

    const getOrCreateCompany = async (name) => {
        let c = companies.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (!c) {
            c = await prisma.company.create({ data: { companyId: `CMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name } });
            companies.push(c);
        }
        return c;
    };
    const getOrCreateCategory = async (name) => {
        let c = categories.find(x => x.name.toLowerCase() === name.toLowerCase());
        if (!c) {
            c = await prisma.category.create({ data: { categoryId: `CAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name } });
            categories.push(c);
        }
        return c;
    };

    console.log(`Reading file... Found ${lines.length} rows.`);

    let isHeader = true;
    for (const line of lines) {
        if (isHeader) { isHeader = false; continue; }

        let row = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (line[i] === '"') { inQuotes = !inQuotes; }
            else if (line[i] === ',' && !inQuotes) { row.push(cur.trim()); cur = ''; }
            else { cur += line[i]; }
        }
        row.push(cur.trim());

        if (row.length < 3 && !row[1]) continue;

        let localAlias = row[0] || null;
        let itemName = row[1];
        let rateRaw = row[2];

        if (!itemName) continue;

        stats.totalProcessed++;
        if (stats.totalProcessed % 50 === 0) console.log(`Processed ${stats.totalProcessed} rows...`);

        const existing = await prisma.material.findFirst({ where: { name: itemName } });
        if (existing) {
            stats.skippedDuplicates++;
            continue;
        }

        let rate = null;
        if (rateRaw && rateRaw.trim() !== '') {
            rate = parseFloat(rateRaw);
            if (isNaN(rate)) rate = null;
        }
        if (rate === null) stats.noSellingPrice++;

        let companyName = "Not Specified";
        if (itemName.toLowerCase().includes("astral")) companyName = "Astral";
        const company = await getOrCreateCompany(companyName);

        let categoryName = "Uncategorized";
        const lowerName = itemName.toLowerCase();

        if (lowerName.includes("pipe")) categoryName = "Pipes";
        else if (lowerName.includes("coupl") || lowerName.includes("tee") || lowerName.includes("elbow") || lowerName.includes("bend") || lowerName.includes("nipple")) categoryName = "Fittings";
        else if (lowerName.includes("tap") || lowerName.includes("valve")) categoryName = "Taps & Valves";
        else if (lowerName.includes("nail")) categoryName = "Hardware";
        else if (lowerName.includes("jali") || lowerName.includes("mesh")) categoryName = "Mesh & Jali";
        else if (lowerName.includes("cover")) categoryName = "Covers";
        else if (lowerName.includes("solution") || lowerName.includes("cement")) categoryName = "Adhesives & Solvents";

        if (categoryName === "Uncategorized") stats.uncategorized++;
        const category = await getOrCreateCategory(categoryName);

        const unit = lowerName.includes("kg") ? "Kg" : "Piece";
        const matId = `MAT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        const stockData = locations.map(l => ({
            locationId: l.locationId,
            quantity: 0
        }));

        await prisma.material.create({
            data: {
                materialId: matId,
                name: itemName,
                localAlias: localAlias,
                categoryId: category.categoryId,
                companyId: company.companyId,
                unit: unit,
                purchasePrice: null,
                sellingPrice: rate,
                gstPercentage: 18.0,
                sizeSpec: '',
                stockAtLocations: { create: stockData }
            }
        });

        stats.created++;
    }

    console.log(`\nLoop finished! Processed total: ${stats.totalProcessed}`);
    console.log("\n==================================");
    console.log("       IMPORT SUMMARY");
    console.log("==================================");
    console.log(`Total Rows Processed   : ${stats.totalProcessed}`);
    console.log(`Materials Created      : ${stats.created}`);
    console.log(`Skipped (Duplicates)   : ${stats.skippedDuplicates}`);
    console.log(`Missing Selling Price  : ${stats.noSellingPrice}`);
    console.log(`Fell to Uncategorized  : ${stats.uncategorized}`);
    console.log("==================================\n");

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
