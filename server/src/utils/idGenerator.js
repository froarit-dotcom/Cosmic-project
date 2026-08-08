const generateNextId = async (prisma, modelName, idField, prefix, numDigits = 4) => {
    const lastRecord = await prisma[modelName].findFirst({
        where: { [idField]: { startsWith: prefix } },
        orderBy: { [idField]: 'desc' }
    });

    let nextNum = 1;
    if (lastRecord && lastRecord[idField]) {
        const lastNumStr = lastRecord[idField].replace(prefix, '');
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    return prefix + nextNum.toString().padStart(numDigits, '0');
};

module.exports = { generateNextId };
