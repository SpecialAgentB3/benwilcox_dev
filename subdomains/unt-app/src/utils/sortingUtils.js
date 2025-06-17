// src/utils/sortingUtils.js
export const sortOfferings = (offerings, semesterMapping) => {
    if (!offerings || offerings.length === 0 || !semesterMapping || semesterMapping.length === 0) {
        return [];
    }

    return offerings.sort((a, b) => {
        // Primary sort: by year, descending (more recent years first)
        if (a.year !== b.year) {
            return b.year - a.year;
        }

        // Secondary sort: Find semester mappings for each offering
        const mappingA = semesterMapping.find(m => m['Specific Semester'] === a.specific_semester);
        const mappingB = semesterMapping.find(m => m['Specific Semester'] === b.specific_semester);

        // If mappings are not found, put them at the end
        if (!mappingA && !mappingB) return 0;
        if (!mappingA) return 1;
        if (!mappingB) return -1;

        // Secondary sort: by specific semester order (ascending - lower numbers first)
        return mappingA['Semester Order'] - mappingB['Semester Order'];
    });
}; 