/**
 * @param {*} sampleData - The data to process
 * @param {*} columnToGroupBy - The column to group by
 * @param {*} columnsToCount - The columns to count
 * @returns - The grouped data
 *
 * Takes list of sample data. Each sample is an object with columns.
 * Groups the data by the columnToGroupBy column.
 * Counts the number of times each value appears in the columnsToCount columns.
 * Returns the grouped data.
 *
 * Example:
 *
 * processSampleData(sampleData, 'gender', ['city'])
 *
 * where sampleData is:
 * [
 *   { gender: 'male', city: 'New York' },
 *   { gender: 'female', city: 'New York' },
 *   { gender: 'male', city: 'Los Angeles' },
 *   { gender: 'female', city: 'Los Angeles' },
 *   { gender: 'male', city: 'Chicago' },
 *   { gender: 'female', city: 'Chicago' },
 * ]
 *
 * The result will be:
 * {
 *   Male: { CTY: { NYC: 1, LA: 1, Chi: 1 } },
 *   Female: { CTY: { NYC: 1, LA: 1, Chi: 1 } },
 * }
 */

export const processSampleData = (
  sampleData,
  columnToGroupBy,
  columnsToCount
) => {
  const groupedData = {};

  for (const item of sampleData) {
    const groupKey = item[columnToGroupBy].replaceAll(" ", "");
    // Get the group for the current item
    const itemGroup = groupedData[groupKey] || {};
    for (const column of columnsToCount) {
      // Count the number of times each value appears in the column
      const columnValueCounters = itemGroup[column] || {};
      columnValueCounters[item[column]] =
        (columnValueCounters[item[column]] || 0) + 1;
      itemGroup[column] = columnValueCounters;
    }
    groupedData[groupKey] = itemGroup;
  }
  return groupedData;
};

// for each item in sampleData, find the corresponding district and subDistrict in the geojson data.
// return [{ sampleDataItem, district, subDistrict }] for each item in sampleData
export const matchSampleDataToGeojson = (
  sampleData,
  districtColumn,
  subDistrictColumn,
  districtGeojson,
  subDistrictGeojson
) => {
  const matchedData = [];
  for (const item of sampleData) {
    matchedData.push({
      sampleDataItem: item,
      district: districtGeojson.features.find(
        (feature) =>
          feature.properties.NAME_1 === item[districtColumn].replaceAll(" ", "")
      ),
      subDistrict: subDistrictGeojson.features.find(
        (feature) =>
          feature.properties.NAME_2 ===
          item[subDistrictColumn].replaceAll(" ", "")
      ),
    });
  }
  const unmatchedData = matchedData.filter(
    (item) => !item.district || !item.subDistrict
  );
  if (unmatchedData.length > 0) {
    console.error(
      new Error("Some sample data items do not match the geojson data"),
      unmatchedData
    );
  }
  return matchedData;
};

window._updatePath_ = (obj, path, updateF) => {
  if (path.length === 0) {
    return obj;
  }

  const key = path[0];
  if (path.length === 1) {
    obj[key] = updateF(obj[key]);
    return obj;
  }
  const nextObj = obj[key] || {};
  obj[key] = nextObj;
  window._updatePath_(nextObj, path.slice(1), updateF);
  return obj;
};

window._matchedData_ = null;
window._loadMatchedData_ = async () => {
  const [sampleData, districtGeoJSON, subdistrictGeoJSON] = await Promise.all([
    fetch("./data/df1.csv")
      .then((response) => response.text())
      .then((text) => {
        const data = XLSX.read(text, { type: "string" });
        const sheet = data.Sheets[data.SheetNames[0]];
        const parsedData = XLSX.utils.sheet_to_json(sheet, {
          raw: true,
        });
        return parsedData;
      }),

    fetch("./geojson/gadm41_LKA_1.json").then((response) => response.json()),

    fetch("./geojson/gadm41_LKA_2.json").then((response) => response.json()),
  ]);

  window._sampleData_ = sampleData;
  window._districtGeoJSON_ = districtGeoJSON;
  window._subdistrictGeoJSON_ = subdistrictGeoJSON;
  window._matchedData_ = matchSampleDataToGeojson(
    sampleData,
    "Localidade",
    "DS",
    districtGeoJSON,
    subdistrictGeoJSON
  );
};
