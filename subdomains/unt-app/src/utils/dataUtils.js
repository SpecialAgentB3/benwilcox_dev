// Helper function to execute a query and return results
const executeQuery = async (db, query, params = []) => {
    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (e) {
        console.error("Query failed:", query, e);
        return [];
    }
};

export const fetchAllCourses = async (db) => {
    const query = "SELECT * FROM MainCourses ORDER BY main_course_id";
    return executeQuery(db, query);
};

export const fetchAllCatalogForCourse = async (db, mainCourseId) => {
    const query = "SELECT * FROM AllCatalog WHERE main_course_id = ?";
    return executeQuery(db, query, [mainCourseId]);
};

export const fetchAllOfferingsForCatalogIds = async (db, catalogIds) => {
    if (catalogIds.length === 0) return [];
    const placeholders = catalogIds.map(() => '?').join(',');
    const query = `SELECT * FROM AllOfferings WHERE main_catalog_id IN (${placeholders})`;
    return executeQuery(db, query, catalogIds);
};

export const fetchOfferingsForCourse = async (db, mainCourseId) => {
    const catalogEntries = await fetchAllCatalogForCourse(db, mainCourseId);
    const catalogIds = catalogEntries.map(c => c.main_catalog_id);
    return fetchAllOfferingsForCatalogIds(db, catalogIds);
};


export const fetchFacultyById = async (db, facultyId) => {
    const query = "SELECT * FROM Faculty WHERE main_faculty_id = ?";
    const result = await executeQuery(db, query, [facultyId]);
    return result[0];
};

export const fetchCatalogYearsForCourse = async (db, mainCourseId) => {
    const query = "SELECT DISTINCT catalog_year FROM AllCatalog WHERE main_course_id = ?";
    return executeQuery(db, query, [mainCourseId]);
};

export const fetchOfferingsCountForCatalog = async (db, mainCatalogId) => {
    const query = "SELECT COUNT(*) as count FROM AllOfferings WHERE main_catalog_id = ?";
    const result = await executeQuery(db, query, [mainCatalogId]);
    return result[0]?.count || 0;
};

export const fetchCatalogById = async (db, mainCatalogId) => {
    const query = "SELECT * FROM AllCatalog WHERE main_catalog_id = ?";
    const result = await executeQuery(db, query, [mainCatalogId]);
    return result[0];
};

export const fetchAllCatalogForSearch = async (db) => {
    const query = "SELECT DISTINCT course_code, course_name, main_course_id FROM AllCatalog";
    return executeQuery(db, query);
};